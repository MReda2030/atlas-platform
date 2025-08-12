import { PrismaClient } from '@prisma/client';
import { ValidationError, ValidationResult } from '@/lib/validation/form-schemas';

const prisma = new PrismaClient();

interface ConsistencyCheckResult {
  isConsistent: boolean;
  warnings: ValidationError[];
  recommendations: string[];
  metrics: {
    expectedConversions?: number;
    actualConversions: number;
    conversionRate?: number;
    costPerConversion?: number;
    agentEfficiency?: number;
  };
}

export class DataConsistencyService {
  /**
   * Check if sales results align with media spend for a specific agent/date
   */
  static async checkMediaSalesAlignment(
    agentId: string,
    date: string,
    branchId: string
  ): Promise<ConsistencyCheckResult> {
    try {
      const reportDate = new Date(date);
      
      // Get media reports for this agent/date
      const mediaReports = await prisma.mediaReport.findMany({
        where: {
          date: reportDate,
          branchId: branchId,
        },
        include: {
          mediaCountryData: {
            include: {
              mediaAgentData: {
                where: {
                  salesAgentId: agentId,
                },
                include: {
                  campaignDetails: {
                    include: {
                      platform: true,
                      destinationCountry: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Get sales reports for this agent/date
      const salesReports = await prisma.salesReport.findMany({
        where: {
          date: reportDate,
          salesAgentId: agentId,
          branchId: branchId,
        },
        include: {
          salesCountryData: {
            include: {
              targetCountry: true,
              dealDestinations: {
                include: {
                  destinationCountry: true,
                },
              },
            },
          },
        },
      });

      return this.analyzeMediaSalesConsistency(mediaReports, salesReports, agentId, date);
      
    } catch (error) {
      console.error('Error checking media-sales alignment:', error);
      
      return {
        isConsistent: false,
        warnings: [{
          field: 'consistency',
          message: 'Unable to verify data consistency due to system error',
          code: 'SYSTEM_ERROR'
        }],
        recommendations: ['Please contact system administrator'],
        metrics: { actualConversions: 0 }
      };
    }
  }

  /**
   * Analyze the consistency between media spend and sales results
   */
  private static analyzeMediaSalesConsistency(
    mediaReports: any[],
    salesReports: any[],
    agentId: string,
    date: string
  ): ConsistencyCheckResult {
    const warnings: ValidationError[] = [];
    const recommendations: string[] = [];

    // Calculate total media spend for this agent
    let totalSpend = 0;
    let campaignsByCountry: Record<string, { spend: number; campaigns: number; destinations: Set<string> }> = {};

    mediaReports.forEach(report => {
      report.mediaCountryData.forEach((countryData: any) => {
        countryData.mediaAgentData.forEach((agentData: any) => {
          const countryCode = countryData.targetCountryId;
          
          if (!campaignsByCountry[countryCode]) {
            campaignsByCountry[countryCode] = {
              spend: 0,
              campaigns: 0,
              destinations: new Set()
            };
          }

          agentData.campaignDetails.forEach((campaign: any) => {
            totalSpend += campaign.amount;
            campaignsByCountry[countryCode].spend += campaign.amount;
            campaignsByCountry[countryCode].campaigns += 1;
            campaignsByCountry[countryCode].destinations.add(campaign.destinationCountryId);
          });
        });
      });
    });

    // Calculate total sales results
    let totalDeals = 0;
    let totalMessages = 0;
    let salesByCountry: Record<string, { deals: number; messages: number; quality: string }> = {};

    salesReports.forEach(report => {
      report.salesCountryData.forEach((countryData: any) => {
        const countryCode = countryData.targetCountryId;
        totalDeals += countryData.dealsClosed;
        totalMessages += countryData.whatsappMessages;
        
        salesByCountry[countryCode] = {
          deals: countryData.dealsClosed,
          messages: countryData.whatsappMessages,
          quality: countryData.qualityRating
        };
      });
    });

    // Run consistency checks
    const isConsistent = this.runConsistencyChecks(
      campaignsByCountry,
      salesByCountry,
      totalSpend,
      totalDeals,
      totalMessages,
      warnings,
      recommendations
    );

    // Calculate metrics
    const conversionRate = totalMessages > 0 ? (totalDeals / totalMessages) * 100 : 0;
    const costPerConversion = totalDeals > 0 ? totalSpend / totalDeals : 0;

    return {
      isConsistent,
      warnings,
      recommendations,
      metrics: {
        actualConversions: totalDeals,
        conversionRate,
        costPerConversion,
        agentEfficiency: this.calculateAgentEfficiency(totalSpend, totalDeals, totalMessages)
      }
    };
  }

  /**
   * Run various consistency checks
   */
  private static runConsistencyChecks(
    campaignsByCountry: Record<string, any>,
    salesByCountry: Record<string, any>,
    totalSpend: number,
    totalDeals: number,
    totalMessages: number,
    warnings: ValidationError[],
    recommendations: string[]
  ): boolean {
    let isConsistent = true;

    // Check 1: Media spend without sales results
    Object.keys(campaignsByCountry).forEach(countryCode => {
      const mediaData = campaignsByCountry[countryCode];
      const salesData = salesByCountry[countryCode];

      if (mediaData.spend > 0 && (!salesData || salesData.deals === 0)) {
        warnings.push({
          field: `consistency.${countryCode}`,
          message: `Agent spent $${mediaData.spend} on campaigns in ${countryCode} but closed no deals`,
          code: 'NO_CONVERSIONS'
        });
        
        recommendations.push(`Review campaign effectiveness in ${countryCode} - consider adjusting targeting or creative`);
        isConsistent = false;
      }
    });

    // Check 2: Sales results without corresponding media spend
    Object.keys(salesByCountry).forEach(countryCode => {
      const salesData = salesByCountry[countryCode];
      const mediaData = campaignsByCountry[countryCode];

      if (salesData.deals > 0 && (!mediaData || mediaData.spend === 0)) {
        warnings.push({
          field: `consistency.${countryCode}`,
          message: `Agent closed ${salesData.deals} deals in ${countryCode} without recorded media spend`,
          code: 'MISSING_MEDIA_DATA'
        });
        
        recommendations.push(`Verify if media campaigns were run in ${countryCode} or if deals came from organic sources`);
      }
    });

    // Check 3: High spend, low conversion rate
    Object.keys(campaignsByCountry).forEach(countryCode => {
      const mediaData = campaignsByCountry[countryCode];
      const salesData = salesByCountry[countryCode];

      if (mediaData.spend > 1000 && salesData) {
        const conversionRate = salesData.messages > 0 ? (salesData.deals / salesData.messages) * 100 : 0;
        
        if (conversionRate < 5 && salesData.messages > 50) {
          warnings.push({
            field: `consistency.${countryCode}`,
            message: `Low conversion rate (${conversionRate.toFixed(1)}%) in ${countryCode} despite high spend ($${mediaData.spend})`,
            code: 'LOW_EFFICIENCY'
          });
          
          recommendations.push(`Consider optimizing campaigns in ${countryCode} - analyze audience, creative, or landing page`);
        }
      }
    });

    // Check 4: Unusual cost per conversion
    if (totalDeals > 0) {
      const costPerConversion = totalSpend / totalDeals;
      
      if (costPerConversion > 500) {
        warnings.push({
          field: 'consistency.overall',
          message: `High cost per conversion ($${costPerConversion.toFixed(2)}) may indicate inefficient spending`,
          code: 'HIGH_CPC'
        });
        
        recommendations.push('Review campaign performance and consider optimizing for lower cost per acquisition');
      }
      
      if (costPerConversion < 50 && totalDeals > 5) {
        warnings.push({
          field: 'consistency.overall',
          message: `Unusually low cost per conversion ($${costPerConversion.toFixed(2)}) - please verify data accuracy`,
          code: 'VERIFICATION_NEEDED'
        });
      }
    }

    // Check 5: Message volume vs spend correlation
    if (totalSpend > 0 && totalMessages === 0) {
      warnings.push({
        field: 'consistency.overall',
        message: `Media spend of $${totalSpend} recorded but no WhatsApp engagement tracked`,
        code: 'MISSING_ENGAGEMENT_DATA'
      });
      
      recommendations.push('Ensure WhatsApp engagement is being properly tracked for all campaigns');
      isConsistent = false;
    }

    return isConsistent;
  }

  /**
   * Calculate agent efficiency score
   */
  private static calculateAgentEfficiency(spend: number, deals: number, messages: number): number {
    if (spend === 0 || deals === 0) return 0;
    
    const costPerDeal = spend / deals;
    const conversionRate = messages > 0 ? deals / messages : 0;
    
    // Efficiency score: higher conversion rate and lower cost per deal = better efficiency
    // Normalized to 0-100 scale
    const costEfficiency = Math.max(0, 100 - (costPerDeal / 10)); // Assumes $1000+ per deal is poor
    const conversionEfficiency = conversionRate * 1000; // Convert to percentage-like scale
    
    return Math.min(100, (costEfficiency + conversionEfficiency) / 2);
  }

  /**
   * Get historical consistency trends for an agent
   */
  static async getAgentConsistencyTrends(
    agentId: string,
    branchId: string,
    days: number = 7
  ): Promise<{
    dates: string[];
    spendData: number[];
    dealsData: number[];
    conversionRates: number[];
    consistencyScores: number[];
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
      
      const dates: string[] = [];
      const spendData: number[] = [];
      const dealsData: number[] = [];
      const conversionRates: number[] = [];
      const consistencyScores: number[] = [];

      // Generate date range
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dates.push(dateStr);
        
        const consistency = await this.checkMediaSalesAlignment(agentId, dateStr, branchId);
        
        // Extract metrics (would need to enhance checkMediaSalesAlignment to return spend data)
        spendData.push(0); // Placeholder - would extract from consistency check
        dealsData.push(consistency.metrics.actualConversions);
        conversionRates.push(consistency.metrics.conversionRate || 0);
        consistencyScores.push(consistency.isConsistent ? 100 : 50);
      }

      return {
        dates,
        spendData,
        dealsData,
        conversionRates,
        consistencyScores
      };

    } catch (error) {
      console.error('Error getting consistency trends:', error);
      
      return {
        dates: [],
        spendData: [],
        dealsData: [],
        conversionRates: [],
        consistencyScores: []
      };
    }
  }
}

export default DataConsistencyService;