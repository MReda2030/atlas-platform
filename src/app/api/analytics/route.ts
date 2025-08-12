import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requirePermissions, applyDataFilters } from '@/lib/auth/auth-middleware';
import { Permission } from '@/lib/auth/roles-permissions';

const prisma = new PrismaClient();

export const GET = requirePermissions(Permission.VIEW_ANALYTICS)(async (request) => {
  try {
    const user = request.user!;
    const { searchParams } = new URL(request.url);
    
    // Apply data filters based on user role
    const filters = applyDataFilters(request);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Build date filter
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    
    // Build where clause based on user permissions
    const whereClause: any = {};
    if (Object.keys(dateFilter).length > 0) {
      whereClause.date = dateFilter;
    }
    
    // Apply user-specific filtering
    if (filters.restrictToOwn) {
      whereClause.mediaBuyerId = user.id;
    }
    
    // Get analytics data
    const [mediaReports, salesReports] = await Promise.all([
      prisma.mediaReport.findMany({
        where: whereClause,
        include: {
          branch: true,
          mediaBuyer: {
            select: { id: true, name: true, email: true }
          },
          mediaCountryData: {
            include: {
              targetCountry: true,
              mediaAgentData: {
                include: {
                  salesAgent: true,
                  campaignDetails: {
                    include: {
                      destinationCountry: true,
                      platform: true
                    }
                  }
                }
              }
            }
          }
        }
      }),
      prisma.salesReport.findMany({
        where: whereClause,
        include: {
          branch: true,
          salesAgent: true,
          mediaBuyer: {
            select: { id: true, name: true, email: true }
          },
          salesCountryData: {
            include: {
              targetCountry: true,
              dealDestinations: {
                include: {
                  destinationCountry: true
                }
              }
            }
          }
        }
      })
    ]);

    // Calculate summary metrics
    const totalSpend = mediaReports.reduce((sum, report) => 
      sum + (report.total_spend ? Number(report.total_spend) : 0), 0
    );
    
    const totalDeals = salesReports.reduce((sum, report) => 
      sum + (report.total_deals || 0), 0
    );
    
    const totalCampaigns = mediaReports.reduce((sum, report) => {
      return sum + report.mediaCountryData.reduce((countrySum, country) => {
        return countrySum + country.mediaAgentData.reduce((agentSum, agent) => {
          return agentSum + agent.campaignDetails.length;
        }, 0);
      }, 0);
    }, 0);

    const totalWhatsapp = salesReports.reduce((sum, report) => 
      sum + (report.total_whatsapp || 0), 0
    );

    // Calculate ROI (simplified)
    const averageROI = totalSpend > 0 ? (totalDeals * 800) / totalSpend : 0; // Assuming $800 average deal value
    const costPerDeal = totalDeals > 0 ? totalSpend / totalDeals : 0;
    const conversionRate = totalWhatsapp > 0 ? (totalDeals / totalWhatsapp) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalSpend: Math.round(totalSpend * 100) / 100,
          totalDeals,
          totalCampaigns,
          totalWhatsapp,
          averageROI: Math.round(averageROI * 100) / 100,
          costPerDeal: Math.round(costPerDeal * 100) / 100,
          conversionRate: Math.round(conversionRate * 100) / 100
        },
        mediaReports: mediaReports.length,
        salesReports: salesReports.length,
        dateRange: {
          startDate,
          endDate
        },
        userAccess: {
          role: user.role,
          restrictedToOwn: filters.restrictToOwn
        }
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch analytics data'
      },
      { status: 500 }
    );
  }
});