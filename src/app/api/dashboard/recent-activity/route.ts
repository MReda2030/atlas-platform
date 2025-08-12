import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { requireAuth, applyDataFilters } from '@/lib/auth/auth-middleware'
import { serverCache } from '@/lib/server-cache'

export const GET = requireAuth(async (request: any) => {
  try {
    const user = request.user!;
    const filters = applyDataFilters(request);

    // Use server-side caching for recent activity
    const data = await serverCache.cacheRecentActivity(user.id, () => getRecentActivity(user, filters));
    
    const response = NextResponse.json({ success: true, data });
    response.headers.set('Cache-Control', 'public, max-age=180, s-maxage=300'); // 3 min browser, 5 min CDN
    return response;
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch recent activity' }, { status: 500 });
  }
});

async function getRecentActivity(user: any, filters: any) {
  try {
    let allActivities: any[] = []

    // Get recent media reports (last 5) - admins see all, media buyers see only their own
    try {
      const mediaReportsWhere = filters.restrictToOwn ? { mediaBuyerId: user.id } : {};
      
      // Optimized query: only select needed fields, use raw query for aggregations
      const recentMediaReports = await prisma.mediaReport.findMany({
        where: mediaReportsWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          date: true,
          createdAt: true,
          branch: {
            select: { name: true }
          },
          mediaCountryData: {
            select: {
              targetCountry: {
                select: { name: true }
              },
              mediaAgentData: {
                select: {
                  salesAgent: {
                    select: { agentNumber: true }
                  },
                  campaignDetails: {
                    select: {
                      amount: true
                    }
                  }
                }
              }
            }
          }
        }
      })

      // Format media reports for display
      const mediaActivities = recentMediaReports.map(report => {
        const totalAmount = report.mediaCountryData.reduce((sum, countryData) => {
          return sum + countryData.mediaAgentData.reduce((agentSum, agentData) => {
            return agentSum + agentData.campaignDetails.reduce((campaignSum, campaign) => {
              return campaignSum + Number(campaign.amount)
            }, 0)
          }, 0)
        }, 0)

        const countries = report.mediaCountryData.map(cd => cd.targetCountry?.name || 'Unknown').join(', ')
        const agents = [...new Set(report.mediaCountryData.flatMap(cd => 
          cd.mediaAgentData.map(ad => ad.salesAgent ? `Agent ${ad.salesAgent.agentNumber}` : 'Unknown Agent')
        ))].join(', ')

        return {
          id: `media_${report.id}`,
          type: 'media_report' as const,
          title: 'Media Report',
          description: `${agents || 'No agents'} • ${countries || 'No countries'} • $${totalAmount.toLocaleString()}`,
          date: report.date.toISOString().split('T')[0],
          createdAt: report.createdAt || new Date(),
          amount: totalAmount,
          branch: report.branch?.name || 'Unknown'
        }
      })

      allActivities.push(...mediaActivities)
    } catch (error) {
      console.log('Could not fetch media reports:', error)
    }

    // Get recent sales reports (last 5) - admins see all, media buyers see only their own
    try {
      const salesReportsWhere = filters.restrictToOwn ? { mediaBuyerId: user.id } : {};
      
      // Optimized sales reports query - select only needed fields
      const recentSalesReports = await prisma.salesReport.findMany({
        where: salesReportsWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          date: true,
          createdAt: true,
          branch: {
            select: { name: true }
          },
          salesAgent: {
            select: { agentNumber: true }
          },
          salesCountryData: {
            select: {
              dealsClosed: true,
              targetCountry: {
                select: { name: true }
              },
              dealDestinations: {
                select: {
                  destinationCountry: {
                    select: { name: true }
                  }
                }
              }
            }
          }
        }
      })

      // Format sales reports for display
      const salesActivities = recentSalesReports.map(report => {
        const totalDeals = report.salesCountryData.reduce((sum, countryData) => {
          return sum + (countryData.dealsClosed || 0)
        }, 0)

        const countries = report.salesCountryData.map(cd => cd.targetCountry?.name || 'Unknown').join(', ')
        const destinations = [...new Set(report.salesCountryData.flatMap(cd => 
          cd.dealDestinations.map(dd => dd.destinationCountry?.name || 'Unknown')
        ))].join(', ')

        return {
          id: `sales_${report.id}`,
          type: 'sales_report' as const,
          title: 'Sales Report',
          description: `Agent ${report.salesAgent?.agentNumber || 'Unknown'} • ${countries || 'No countries'} • ${totalDeals} deals${destinations ? ` → ${destinations}` : ''}`,
          date: report.date.toISOString().split('T')[0],
          createdAt: report.createdAt || new Date(),
          deals: totalDeals,
          branch: report.branch?.name || 'Unknown'
        }
      })

      allActivities.push(...salesActivities)
    } catch (error) {
      console.log('Could not fetch sales reports:', error)
    }

    // Combine and sort all activities by creation date
    const sortedActivities = allActivities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10) // Take top 10 most recent

    return sortedActivities
  } catch (error) {
    console.error('Error in getRecentActivity:', error)
    
    // Return empty array instead of error
    return []
  }
}