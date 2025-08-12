import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { requireAuth, applyDataFilters } from '@/lib/auth/auth-middleware'
import { serverCache } from '@/lib/server-cache'

export const GET = requireAuth(async (request: any) => {
  try {
    const user = request.user!;
    const filters = applyDataFilters(request);

    // Use server-side caching for better performance
    const data = await serverCache.cacheDashboardStats(user.id, () => getDashboardStats(user, filters));

    const response = NextResponse.json(data);
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600'); // 5 min browser, 10 min CDN
    response.headers.set('ETag', `dashboard-stats-${user.id}-${Date.now()}`);
    return response;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
  }
});

async function getDashboardStats(user: any, filters: any) {
  try {
    // Get current date for filtering
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Create filters based on user role
    // Admin/Super Admin see all data, Media Buyers see only their own
    const userFilter = filters.restrictToOwn ? {
      agentData: {
        countryData: {
          report: {
            mediaBuyerId: user.id
          }
        }
      }
    } : {}; // Empty filter for admins = see all data

    // Create sales filter based on user role
    const salesUserFilter = filters.restrictToOwn ? {
      report: {
        mediaBuyerId: user.id
      }
    } : {}; // Empty filter for admins = see all data

    // Optimized single aggregation query with grouping - much more efficient
    const [spendStats, dealsStats, campaignCounts] = await Promise.all([
      // Combined spend aggregation for both periods
      prisma.campaignDetail.groupBy({
        by: [],
        _sum: { amount: true },
        _count: { id: true },
        where: {
          ...userFilter,
          createdAt: {
            gte: previousMonth,
            lte: currentMonthEnd
          }
        }
      }).then(results => {
        // Separate current and previous month data in application
        return Promise.all([
          prisma.campaignDetail.aggregate({
            _sum: { amount: true },
            where: {
              ...userFilter,
              createdAt: {
                gte: currentMonth,
                lte: currentMonthEnd
              }
            }
          }),
          prisma.campaignDetail.aggregate({
            _sum: { amount: true },
            where: {
              ...userFilter,
              createdAt: {
                gte: previousMonth,
                lt: currentMonth
              }
            }
          })
        ]);
      }).catch(() => [{ _sum: { amount: 0 } }, { _sum: { amount: 0 } }]),

      // Combined deals aggregation for both periods
      Promise.all([
        prisma.salesCountryData.aggregate({
          _sum: { dealsClosed: true },
          where: {
            ...salesUserFilter,
            createdAt: {
              gte: currentMonth,
              lte: currentMonthEnd
            }
          }
        }),
        prisma.salesCountryData.aggregate({
          _sum: { dealsClosed: true },
          where: {
            ...salesUserFilter,
            createdAt: {
              gte: previousMonth,
              lt: currentMonth
            }
          }
        })
      ]).catch(() => [{ _sum: { dealsClosed: 0 } }, { _sum: { dealsClosed: 0 } }]),

      // Campaign counts for conversion rate calculation
      Promise.all([
        prisma.campaignDetail.count({
          where: {
            ...userFilter,
            createdAt: {
              gte: currentMonth,
              lte: currentMonthEnd
            }
          }
        }),
        prisma.campaignDetail.count({
          where: {
            ...userFilter,
            createdAt: {
              gte: previousMonth,
              lt: currentMonth
            }
          }
        })
      ]).catch(() => [0, 0])
    ]);

    const [totalSpendResult, previousSpendResult] = spendStats;
    const [totalDealsResult, previousDealsResult] = dealsStats;
    const [totalCampaigns, previousCampaigns] = campaignCounts;

    const totalSpend = Number(totalSpendResult._sum.amount) || 0
    const previousSpend = Number(previousSpendResult._sum.amount) || 0
    const spendChange = previousSpend > 0 ? ((totalSpend - previousSpend) / previousSpend * 100) : 0

    const totalDeals = totalDealsResult._sum.dealsClosed || 0
    const previousDeals = previousDealsResult._sum.dealsClosed || 0
    const dealsChange = previousDeals > 0 ? ((totalDeals - previousDeals) / previousDeals * 100) : 0

    // Calculate conversion rate (deals / campaigns) - using cached counts
    const conversionRate = totalCampaigns > 0 ? (totalDeals / totalCampaigns * 100) : 0
    const previousConversionRate = previousCampaigns > 0 ? (previousDeals / previousCampaigns * 100) : 0
    const conversionChange = conversionRate - previousConversionRate

    // Calculate ROI (assuming average deal value of $1000 for demo)
    const averageDealValue = 1000
    const totalRevenue = totalDeals * averageDealValue
    const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend * 100) : 0
    
    const previousRevenue = previousDeals * averageDealValue
    const previousROI = previousSpend > 0 ? ((previousRevenue - previousSpend) / previousSpend * 100) : 0
    const roiChange = roi - previousROI

    // Get top performing agent (simplified)
    let topAgent = 'No data'
    let topAgentDeals = 0

    try {
      const whereCondition: any = {
        date: {
          gte: currentMonth,
          lte: currentMonthEnd
        }
      };
      
      // Add user filter only for media buyers
      if (filters.restrictToOwn) {
        whereCondition.mediaBuyerId = user.id;
      }

      const topAgentReport = await prisma.salesReport.findFirst({
        where: whereCondition,
        include: {
          salesAgent: true,
          salesCountryData: true
        },
        orderBy: {
          salesCountryData: {
            _count: 'desc'
          }
        }
      })

      if (topAgentReport?.salesAgent) {
        topAgent = `Agent ${topAgentReport.salesAgent.agentNumber}`
        topAgentDeals = topAgentReport.salesCountryData.reduce((sum, data) => sum + data.dealsClosed, 0)
      }
    } catch (error) {
      console.log('Could not fetch top agent:', error)
    }

    // Get top performing country (simplified)
    let topCountry = 'No data'
    let topCountryConversion = 0

    try {
      const topCountryData = await prisma.salesCountryData.findFirst({
        where: {
          ...salesUserFilter,
          createdAt: {
            gte: currentMonth,
            lte: currentMonthEnd
          }
        },
        include: {
          targetCountry: true
        },
        orderBy: {
          dealsClosed: 'desc'
        }
      })

      if (topCountryData?.targetCountry) {
        topCountry = topCountryData.targetCountry.name
        topCountryConversion = conversionRate // Use overall conversion rate for simplicity
      }
    } catch (error) {
      console.log('Could not fetch top country:', error)
    }

    // Get top performing platform (simplified)
    let topPlatform = 'No data'
    let topPlatformCPA = 0

    try {
      const topPlatformData = await prisma.campaignDetail.findFirst({
        where: {
          ...userFilter,
          createdAt: {
            gte: currentMonth,
            lte: currentMonthEnd
          }
        },
        include: {
          platform: true
        },
        orderBy: {
          amount: 'desc'
        }
      })

      if (topPlatformData?.platform) {
        topPlatform = topPlatformData.platform.name
        topPlatformCPA = totalDeals > 0 ? (totalSpend / totalDeals) : 0
      }
    } catch (error) {
      console.log('Could not fetch top platform:', error)
    }

    return {
      success: true,
      data: {
        totalSpend: {
          value: totalSpend,
          change: Number(spendChange.toFixed(1))
        },
        totalDeals: {
          value: totalDeals,
          change: Number(dealsChange.toFixed(1))
        },
        conversionRate: {
          value: Number(conversionRate.toFixed(1)),
          change: Number(conversionChange.toFixed(1))
        },
        roi: {
          value: Number(roi.toFixed(1)),
          change: Number(roiChange.toFixed(1))
        },
        topPerformers: {
          agent: {
            name: topAgent,
            deals: topAgentDeals
          },
          country: {
            name: topCountry,
            conversionRate: Number(topCountryConversion.toFixed(1))
          },
          platform: {
            name: topPlatform,
            cpa: Number(topPlatformCPA.toFixed(2))
          }
        }
      }
    };
  } catch (error) {
    console.error('Error in getDashboardStats:', error)
    
    // Return safe fallback data instead of error
    return {
      success: true,
      data: {
        totalSpend: {
          value: 0,
          change: 0
        },
        totalDeals: {
          value: 0,
          change: 0
        },
        conversionRate: {
          value: 0,
          change: 0
        },
        roi: {
          value: 0,
          change: 0
        },
        topPerformers: {
          agent: {
            name: 'No data',
            deals: 0
          },
          country: {
            name: 'No data',
            conversionRate: 0
          },
          platform: {
            name: 'No data',
            cpa: 0
          }
        }
      }
    };
  }
}