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
    
    // For admins, show all-time data if current month has no data
    // For media buyers, still restrict to current month
    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'

    // For admins, get all data. For media buyers, filter by their data
    // Filter by report date in current month (August 2025)
    const reportDateFilter = {
      gte: currentMonth,
      lte: currentMonthEnd
    };

    // Create filters based on user role - filter by report date
    const userFilter = filters.restrictToOwn ? {
      agentData: {
        countryData: {
          report: {
            mediaBuyerId: user.id,
            date: reportDateFilter
          }
        }
      }
    } : {
      agentData: {
        countryData: {
          report: {
            date: reportDateFilter
          }
        }
      }
    };

    // Create sales filter based on user role - filter by report date
    const salesUserFilter = filters.restrictToOwn ? {
      report: {
        mediaBuyerId: user.id,
        date: reportDateFilter
      }
    } : {
      report: {
        date: reportDateFilter
      }
    };

    // Get current month data directly from related tables (already filtered by report date)
    let [currentSpendResult, currentDealsResult, currentCampaignCount] = await Promise.all([
      // Get campaign details data
      prisma.campaignDetail.aggregate({
        _sum: { amount: true },
        where: userFilter
      }).catch(() => ({ _sum: { amount: null } })),
      
      // Get sales country data  
      prisma.salesCountryData.aggregate({
        _sum: { dealsClosed: true },
        where: salesUserFilter
      }).catch(() => ({ _sum: { dealsClosed: null } })),
      
      // Count campaigns
      prisma.campaignDetail.count({
        where: userFilter
      }).catch(() => 0)
    ]);

    // If no detailed data, fall back to summary fields in reports
    if (!Number(currentSpendResult._sum.amount)) {
      const mediaReportFilter = filters.restrictToOwn ? {
        mediaBuyerId: user.id,
        date: {
          gte: currentMonth,
          lte: currentMonthEnd
        }
      } : {
        date: {
          gte: currentMonth,
          lte: currentMonthEnd
        }
      };

      const fallbackSpend = await prisma.mediaReport.aggregate({
        _sum: { total_spend: true },
        where: mediaReportFilter
      }).catch(() => ({ _sum: { total_spend: null } }));
      
      if (fallbackSpend._sum.total_spend) {
        currentSpendResult = { _sum: { amount: fallbackSpend._sum.total_spend } };
      }
    }

    if (!Number(currentDealsResult._sum.dealsClosed)) {
      const salesReportFilter = filters.restrictToOwn ? {
        mediaBuyerId: user.id,
        date: {
          gte: currentMonth,
          lte: currentMonthEnd
        }
      } : {
        date: {
          gte: currentMonth,
          lte: currentMonthEnd
        }
      };

      const fallbackDeals = await prisma.salesReport.aggregate({
        _sum: { total_deals: true },
        where: salesReportFilter
      }).catch(() => ({ _sum: { total_deals: null } }));
      
      if (fallbackDeals._sum.total_deals) {
        currentDealsResult = { _sum: { dealsClosed: fallbackDeals._sum.total_deals } };
      }
    }

    console.log('Dashboard Debug - Current spend:', currentSpendResult._sum.amount);
    console.log('Dashboard Debug - Current deals:', currentDealsResult._sum.dealsClosed);
    console.log('Dashboard Debug - Campaign count:', currentCampaignCount);
    console.log('Dashboard Debug - User role:', user.role);
    console.log('Dashboard Debug - Is admin:', isAdmin);
    console.log('Dashboard Debug - Restrict to own:', filters.restrictToOwn);

    // Check if current month has any data
    const hasCurrentData = (Number(currentSpendResult._sum.amount) || 0) > 0 || 
                          (currentDealsResult._sum.dealsClosed || 0) > 0 || 
                          currentCampaignCount > 0;

    console.log('Dashboard Debug - Has current data:', hasCurrentData);

    // If admin has no current month data, get all-time data
    if (isAdmin && !hasCurrentData) {
      console.log('Admin with no current month data - fetching all-time data');
      
      // Remove date filters for all-time data
      const allTimeUserFilter = filters.restrictToOwn ? {
        agentData: {
          countryData: {
            report: {
              mediaBuyerId: user.id
            }
          }
        }
      } : {};

      const allTimeSalesUserFilter = filters.restrictToOwn ? {
        report: {
          mediaBuyerId: user.id
        }
      } : {};
      
      // Get all-time detailed data
      [currentSpendResult, currentDealsResult, currentCampaignCount] = await Promise.all([
        prisma.campaignDetail.aggregate({
          _sum: { amount: true },
          where: allTimeUserFilter
        }).catch(() => ({ _sum: { amount: null } })),
        
        prisma.salesCountryData.aggregate({
          _sum: { dealsClosed: true },
          where: allTimeSalesUserFilter
        }).catch(() => ({ _sum: { dealsClosed: null } })),
        
        prisma.campaignDetail.count({
          where: allTimeUserFilter
        }).catch(() => 0)
      ]);

      console.log('Dashboard Debug - All-time spend:', currentSpendResult._sum.amount);
      console.log('Dashboard Debug - All-time deals:', currentDealsResult._sum.dealsClosed);
    }

    // Get previous period data (always previous month for comparison)
    const [previousSpendResult, previousDealsResult, previousCampaignCount] = await Promise.all([
      prisma.campaignDetail.aggregate({
        _sum: { amount: true },
        where: {
          ...userFilter,
          createdAt: {
            gte: previousMonth,
            lt: currentMonth
          }
        }
      }).catch(() => ({ _sum: { amount: 0 } })),
      
      prisma.salesCountryData.aggregate({
        _sum: { dealsClosed: true },
        where: {
          ...salesUserFilter,
          createdAt: {
            gte: previousMonth,
            lt: currentMonth
          }
        }
      }).catch(() => ({ _sum: { dealsClosed: 0 } })),
      
      prisma.campaignDetail.count({
        where: {
          ...userFilter,
          createdAt: {
            gte: previousMonth,
            lt: currentMonth
          }
        }
      }).catch(() => 0)
    ]);

    // Assign results for processing
    const totalSpendResult = currentSpendResult;
    const totalDealsResult = currentDealsResult;
    const totalCampaigns = currentCampaignCount;
    const previousCampaigns = previousCampaignCount;

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
      // Use same date logic as above - all-time for admins with no current data
      const whereCondition: any = {};
      
      if (!isAdmin || hasCurrentData) {
        // Use current month filtering for non-admins or admins with current data
        whereCondition.date = {
          gte: currentMonth,
          lte: currentMonthEnd
        };
      }
      // For admins with no current data, no date filter = all-time
      
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
      const countryWhereCondition: any = { ...salesUserFilter };
      
      if (!isAdmin || hasCurrentData) {
        // Use current month filtering for non-admins or admins with current data
        countryWhereCondition.createdAt = {
          gte: currentMonth,
          lte: currentMonthEnd
        };
      }
      // For admins with no current data, no date filter = all-time
      
      const topCountryData = await prisma.salesCountryData.findFirst({
        where: countryWhereCondition,
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
      const platformWhereCondition: any = { ...userFilter };
      
      if (!isAdmin || hasCurrentData) {
        // Use current month filtering for non-admins or admins with current data
        platformWhereCondition.createdAt = {
          gte: currentMonth,
          lte: currentMonthEnd
        };
      }
      // For admins with no current data, no date filter = all-time
      
      const topPlatformData = await prisma.campaignDetail.findFirst({
        where: platformWhereCondition,
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