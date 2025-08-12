import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ROIMetrics {
  totalSpend: number;
  totalRevenue: number;
  totalDeals: number;
  roi: number;
  costPerConversion: number;
  conversionRate: number;
  profitMargin: number;
}

interface AgentPerformance {
  agentId: string;
  agentNumber: string;
  branchName: string;
  totalSpend: number;
  totalDeals: number;
  totalMessages: number;
  roi: number;
  costPerConversion: number;
  conversionRate: number;
  averageQuality: number;
  topCountry: string;
  topPlatform: string;
  efficiency: number;
}

interface CountryAnalysis {
  countryCode: string;
  countryName: string;
  totalSpend: number;
  totalDeals: number;
  totalMessages: number;
  roi: number;
  costPerConversion: number;
  conversionRate: number;
  topDestinations: Array<{
    destination: string;
    deals: number;
    percentage: number;
  }>;
  platformPerformance: Array<{
    platform: string;
    spend: number;
    deals: number;
    roi: number;
  }>;
}

interface PlatformAnalysis {
  platformId: string;
  platformName: string;
  totalSpend: number;
  totalDeals: number;
  costPerConversion: number;
  countriesServed: number;
  topCountry: string;
  efficiency: number;
}

interface DateRangeFilters {
  startDate: Date;
  endDate: Date;
  branchId?: string;
  agentId?: string;
  countryId?: string;
  platformId?: string;
}

export class AnalyticsService {
  // Assumed average deal value - in production, this would be configurable or calculated from actual revenue data
  private static readonly AVERAGE_DEAL_VALUE = 2500; // USD

  /**
   * Calculate overall ROI metrics for a date range
   */
  static async calculateOverallROI(filters: DateRangeFilters): Promise<ROIMetrics> {
    try {
      const whereClause = this.buildWhereClause(filters);

      // Get media spend data
      const mediaData = await prisma.mediaReport.findMany({
        where: {
          date: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
          ...(filters.branchId && { branchId: filters.branchId }),
        },
        include: {
          mediaCountryData: {
            where: {
              ...(filters.countryId && { targetCountryId: filters.countryId }),
            },
            include: {
              mediaAgentData: {
                where: {
                  ...(filters.agentId && { salesAgentId: filters.agentId }),
                },
                include: {
                  campaignDetails: {
                    where: {
                      ...(filters.platformId && { platformId: filters.platformId }),
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Get sales data
      const salesData = await prisma.salesReport.findMany({
        where: {
          date: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
          ...(filters.branchId && { branchId: filters.branchId }),
          ...(filters.agentId && { salesAgentId: filters.agentId }),
        },
        include: {
          salesCountryData: {
            where: {
              ...(filters.countryId && { targetCountryId: filters.countryId }),
            },
          },
        },
      });

      // Calculate totals
      let totalSpend = 0;
      let totalDeals = 0;
      let totalMessages = 0;

      // Sum media spend
      mediaData.forEach(report => {
        report.mediaCountryData.forEach(countryData => {
          countryData.mediaAgentData.forEach(agentData => {
            agentData.campaignDetails.forEach(campaign => {
              totalSpend += campaign.amount;
            });
          });
        });
      });

      // Sum sales results
      salesData.forEach(report => {
        report.salesCountryData.forEach(countryData => {
          totalDeals += countryData.dealsClosed;
          totalMessages += countryData.whatsappMessages;
        });
      });

      // Calculate metrics
      const totalRevenue = totalDeals * this.AVERAGE_DEAL_VALUE;
      const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
      const costPerConversion = totalDeals > 0 ? totalSpend / totalDeals : 0;
      const conversionRate = totalMessages > 0 ? (totalDeals / totalMessages) * 100 : 0;
      const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalSpend) / totalRevenue) * 100 : 0;

      return {
        totalSpend,
        totalRevenue,
        totalDeals,
        roi,
        costPerConversion,
        conversionRate,
        profitMargin,
      };

    } catch (error) {
      console.error('Error calculating overall ROI:', error);
      throw new Error('Failed to calculate ROI metrics');
    }
  }

  /**
   * Get agent performance rankings
   */
  static async getAgentPerformance(filters: DateRangeFilters): Promise<AgentPerformance[]> {
    try {
      // Get all sales agents with their basic info
      const agents = await prisma.salesAgent.findMany({
        where: {
          ...(filters.agentId && { agentNumber: filters.agentId }),
          isActive: true,
        },
        include: {
          branch: true,
          salesReports: {
            where: {
              date: {
                gte: filters.startDate,
                lte: filters.endDate,
              },
              ...(filters.branchId && { branchId: filters.branchId }),
            },
            include: {
              salesCountryData: true,
            },
          },
          mediaAgentData: {
            include: {
              campaignDetails: true,
            },
          },
        },
      });

      // Transform and calculate additional metrics
      const performance = agents.map((agent): AgentPerformance => {
        // Calculate totals from included data
        const totalSpend = agent.mediaAgentData.reduce((sum, mad) => {
          return sum + mad.campaignDetails.reduce((campaignSum, cd) => {
            return campaignSum + Number(cd.amount);
          }, 0);
        }, 0);

        const totalDeals = agent.salesReports.reduce((sum, sr) => {
          return sum + sr.salesCountryData.reduce((countrySum, scd) => {
            return countrySum + scd.dealsClosed;
          }, 0);
        }, 0);

        const totalMessages = agent.salesReports.reduce((sum, sr) => {
          return sum + sr.salesCountryData.reduce((msgSum, scd) => {
            return msgSum + scd.whatsappMessages;
          }, 0);
        }, 0);

        const totalRevenue = totalDeals * this.AVERAGE_DEAL_VALUE;
        
        const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
        const costPerConversion = totalDeals > 0 ? totalSpend / totalDeals : 0;
        const conversionRate = totalMessages > 0 ? (totalDeals / totalMessages) * 100 : 0;
        
        // Calculate efficiency score (combination of ROI and conversion rate)
        const efficiency = Math.min(100, Math.max(0, (roi + conversionRate) / 2));

        // Calculate average quality rating
        const qualityRatings = agent.salesReports.flatMap(sr => 
          sr.salesCountryData.map(scd => scd.qualityRating)
        );
        const qualityScores = qualityRatings.map(rating => {
          switch (rating) {
            case 'below_standard': return 1;
            case 'standard': return 2;
            case 'good': return 3;
            case 'excellent': return 4;
            case 'best_quality': return 5;
            default: return 2;
          }
        });
        const averageQuality = qualityScores.length > 0 
          ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
          : 0;

        return {
          agentId: agent.id,
          agentNumber: agent.agentNumber,
          branchName: agent.branch?.name || 'Unknown',
          totalSpend,
          totalDeals,
          totalMessages,
          roi,
          costPerConversion,
          conversionRate,
          averageQuality,
          topCountry: 'UAE', // TODO: Calculate from actual data
          topPlatform: 'Meta', // TODO: Calculate from actual data
          efficiency,
        };
      });

      return performance;

    } catch (error) {
      console.error('Error getting agent performance:', error);
      throw new Error('Failed to get agent performance data');
    }
  }

  /**
   * Analyze performance by country
   */
  static async getCountryAnalysis(filters: DateRangeFilters): Promise<CountryAnalysis[]> {
    try {
      const countries = await prisma.targetCountry.findMany({
        include: {
          mediaCountryData: {
            where: {
              mediaReport: {
                date: {
                  gte: filters.startDate,
                  lte: filters.endDate,
                },
                ...(filters.branchId && { branchId: filters.branchId }),
              },
            },
            include: {
              mediaAgentData: {
                where: {
                  ...(filters.agentId && { salesAgentId: filters.agentId }),
                },
                include: {
                  campaignDetails: {
                    where: {
                      ...(filters.platformId && { platformId: filters.platformId }),
                    },
                    include: {
                      platform: true,
                      destinationCountry: true,
                    },
                  },
                },
              },
            },
          },
          salesCountryData: {
            where: {
              salesReport: {
                date: {
                  gte: filters.startDate,
                  lte: filters.endDate,
                },
                ...(filters.branchId && { branchId: filters.branchId }),
                ...(filters.agentId && { salesAgentId: filters.agentId }),
              },
            },
            include: {
              dealDestinations: {
                include: {
                  destinationCountry: true,
                },
              },
            },
          },
        },
      });

      const countryAnalysis: CountryAnalysis[] = countries.map(country => {
        // Calculate media spend
        let totalSpend = 0;
        const platformSpend: Record<string, { spend: number; deals: number }> = {};

        country.mediaCountryData.forEach(mcd => {
          mcd.mediaAgentData.forEach(mad => {
            mad.campaignDetails.forEach(cd => {
              totalSpend += cd.amount;
              
              const platformName = cd.platform.name;
              if (!platformSpend[platformName]) {
                platformSpend[platformName] = { spend: 0, deals: 0 };
              }
              platformSpend[platformName].spend += cd.amount;
            });
          });
        });

        // Calculate sales results
        let totalDeals = 0;
        let totalMessages = 0;
        const destinations: Record<string, number> = {};

        country.salesCountryData.forEach(scd => {
          totalDeals += scd.dealsClosed;
          totalMessages += scd.whatsappMessages;

          scd.dealDestinations.forEach(dd => {
            const destName = dd.destinationCountry.name;
            destinations[destName] = (destinations[destName] || 0) + 1;
          });
        });

        // Calculate metrics
        const totalRevenue = totalDeals * this.AVERAGE_DEAL_VALUE;
        const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
        const costPerConversion = totalDeals > 0 ? totalSpend / totalDeals : 0;
        const conversionRate = totalMessages > 0 ? (totalDeals / totalMessages) * 100 : 0;

        // Top destinations
        const topDestinations = Object.entries(destinations)
          .map(([destination, deals]) => ({
            destination,
            deals,
            percentage: totalDeals > 0 ? (deals / totalDeals) * 100 : 0,
          }))
          .sort((a, b) => b.deals - a.deals)
          .slice(0, 5);

        // Platform performance
        const platformPerformance = Object.entries(platformSpend).map(([platform, data]) => ({
          platform,
          spend: data.spend,
          deals: data.deals,
          roi: data.spend > 0 ? ((data.deals * this.AVERAGE_DEAL_VALUE - data.spend) / data.spend) * 100 : 0,
        }));

        return {
          countryCode: country.code,
          countryName: country.name,
          totalSpend,
          totalDeals,
          totalMessages,
          roi,
          costPerConversion,
          conversionRate,
          topDestinations,
          platformPerformance,
        };
      }).filter(c => c.totalSpend > 0 || c.totalDeals > 0);

      return countryAnalysis;

    } catch (error) {
      console.error('Error getting country analysis:', error);
      throw new Error('Failed to get country analysis');
    }
  }

  /**
   * Analyze platform performance
   */
  static async getPlatformAnalysis(filters: DateRangeFilters): Promise<PlatformAnalysis[]> {
    try {
      const platforms = await prisma.advertisingPlatform.findMany({
        include: {
          campaignDetails: {
            where: {
              mediaAgentData: {
                mediaCountryData: {
                  mediaReport: {
                    date: {
                      gte: filters.startDate,
                      lte: filters.endDate,
                    },
                    ...(filters.branchId && { branchId: filters.branchId }),
                  },
                },
              },
              ...(filters.agentId && { 
                mediaAgentData: { salesAgentId: filters.agentId }
              }),
            },
            include: {
              mediaAgentData: {
                include: {
                  mediaCountryData: {
                    include: {
                      targetCountry: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const platformAnalysis: PlatformAnalysis[] = platforms.map(platform => {
        let totalSpend = 0;
        let totalDeals = 0;
        const countries = new Set<string>();
        const countrySpend: Record<string, number> = {};

        platform.campaignDetails.forEach(cd => {
          totalSpend += cd.amount;
          
          const countryName = cd.mediaAgentData.mediaCountryData.targetCountry.name;
          countries.add(countryName);
          countrySpend[countryName] = (countrySpend[countryName] || 0) + cd.amount;
        });

        // TODO: Get actual deals attributed to this platform
        // For now, estimate based on spend proportion
        totalDeals = Math.round(totalSpend / this.AVERAGE_DEAL_VALUE * 0.1); // Placeholder

        const costPerConversion = totalDeals > 0 ? totalSpend / totalDeals : 0;
        const topCountry = Object.entries(countrySpend)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

        // Calculate efficiency (lower cost per conversion = higher efficiency)
        const efficiency = Math.min(100, Math.max(0, 100 - (costPerConversion / 100)));

        return {
          platformId: platform.id,
          platformName: platform.name,
          totalSpend,
          totalDeals,
          costPerConversion,
          countriesServed: countries.size,
          topCountry,
          efficiency,
        };
      }).filter(p => p.totalSpend > 0);

      return platformAnalysis.sort((a, b) => b.totalSpend - a.totalSpend);

    } catch (error) {
      console.error('Error getting platform analysis:', error);
      throw new Error('Failed to get platform analysis');
    }
  }

  /**
   * Get time series data for trending
   */
  static async getTimeSeriesData(filters: DateRangeFilters): Promise<{
    dates: string[];
    spendData: number[];
    dealsData: number[];
    revenueData: number[];
    roiData: number[];
  }> {
    try {
      const dates: string[] = [];
      const spendData: number[] = [];
      const dealsData: number[] = [];
      const revenueData: number[] = [];
      const roiData: number[] = [];

      // Generate date range
      const currentDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        dates.push(dateStr);

        // Get data for this specific date
        const dayMetrics = await this.calculateOverallROI({
          ...filters,
          startDate: currentDate,
          endDate: currentDate,
        });

        spendData.push(dayMetrics.totalSpend);
        dealsData.push(dayMetrics.totalDeals);
        revenueData.push(dayMetrics.totalRevenue);
        roiData.push(dayMetrics.roi);

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return {
        dates,
        spendData,
        dealsData,
        revenueData,
        roiData,
      };

    } catch (error) {
      console.error('Error getting time series data:', error);
      throw new Error('Failed to get time series data');
    }
  }

  /**
   * Helper method to build where clause for queries
   */
  private static buildWhereClause(filters: DateRangeFilters) {
    return {
      date: {
        gte: filters.startDate,
        lte: filters.endDate,
      },
      ...(filters.branchId && { branchId: filters.branchId }),
      ...(filters.agentId && { salesAgentId: filters.agentId }),
    };
  }
}

export type { ROIMetrics, AgentPerformance, CountryAnalysis, PlatformAnalysis, DateRangeFilters };
export default AnalyticsService;