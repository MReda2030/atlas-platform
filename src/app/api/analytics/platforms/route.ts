import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/auth-middleware';
import { Permission } from '@/lib/auth/roles-permissions';
import { AnalyticsService } from '@/lib/services/analytics-service';

export const GET = requirePermissions(Permission.VIEW_ANALYTICS)(async (request: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const startParam = searchParams.get('startDate');
    const endParam = searchParams.get('endDate');
    const branchId = searchParams.get('branchId');
    const agentId = searchParams.get('agentId');
    const countryId = searchParams.get('countryId');

    const filters = {
      startDate: startParam ? new Date(startParam) : startDate,
      endDate: endParam ? new Date(endParam) : endDate,
      ...(branchId && { branchId }),
      ...(agentId && { agentId }),
      ...(countryId && { countryId }),
    };

    // Get platform analysis
    const platformAnalysis = await AnalyticsService.getPlatformAnalysis(filters);

    // Calculate summary metrics
    const totalPlatforms = platformAnalysis.length;
    const totalSpend = platformAnalysis.reduce((sum, platform) => sum + platform.totalSpend, 0);
    const totalDeals = platformAnalysis.reduce((sum, platform) => sum + platform.totalDeals, 0);
    const avgCostPerConversion = platformAnalysis.reduce((sum, platform) => sum + platform.costPerConversion, 0) / totalPlatforms;
    const avgEfficiency = platformAnalysis.reduce((sum, platform) => sum + platform.efficiency, 0) / totalPlatforms;

    // Find best and worst performing platforms
    const mostEfficientPlatform = platformAnalysis.reduce((best, current) => 
      current.efficiency > best.efficiency ? current : best
    , platformAnalysis[0]);

    const leastEfficientPlatform = platformAnalysis.reduce((worst, current) => 
      current.efficiency < worst.efficiency ? current : worst
    , platformAnalysis[0]);

    const highestSpendPlatform = platformAnalysis.reduce((highest, current) => 
      current.totalSpend > highest.totalSpend ? current : highest
    , platformAnalysis[0]);

    const lowestCPCPlatform = platformAnalysis.reduce((lowest, current) => 
      current.costPerConversion < lowest.costPerConversion ? current : lowest
    , platformAnalysis[0]);

    // Platform recommendations based on performance
    const recommendations = [];

    if (mostEfficientPlatform && leastEfficientPlatform) {
      const efficiencyGap = mostEfficientPlatform.efficiency - leastEfficientPlatform.efficiency;
      if (efficiencyGap > 30) {
        recommendations.push({
          type: 'optimization',
          priority: 'high',
          title: 'Platform Budget Reallocation',
          description: `Consider shifting budget from ${leastEfficientPlatform.platformName} (${Math.round(leastEfficientPlatform.efficiency)}% efficiency) to ${mostEfficientPlatform.platformName} (${Math.round(mostEfficientPlatform.efficiency)}% efficiency)`,
          potential_impact: 'Could improve overall ROI by 15-25%',
        });
      }
    }

    if (lowestCPCPlatform && avgCostPerConversion > 0) {
      const savings = avgCostPerConversion - lowestCPCPlatform.costPerConversion;
      if (savings > 100) {
        recommendations.push({
          type: 'cost_optimization',
          priority: 'medium',
          title: 'Cost Per Conversion Opportunity',
          description: `${lowestCPCPlatform.platformName} shows lowest CPC at $${Math.round(lowestCPCPlatform.costPerConversion)}. Scale this platform for cost savings.`,
          potential_impact: `Potential savings of $${Math.round(savings)} per conversion`,
        });
      }
    }

    // Geographic performance by platform
    const platformCountryMatrix: Record<string, Record<string, { spend: number; performance: string }>> = {};
    
    // This would be calculated from actual country-platform data
    // For now, we'll create a simplified version based on the available data
    platformAnalysis.forEach(platform => {
      platformCountryMatrix[platform.platformName] = {
        [platform.topCountry]: {
          spend: platform.totalSpend * 0.4, // Assumption: 40% spent in top country
          performance: platform.efficiency > 70 ? 'excellent' : platform.efficiency > 50 ? 'good' : 'needs_improvement'
        }
      };
    });

    // Budget allocation suggestions
    const totalBudget = totalSpend;
    const budgetAllocationSuggestions = platformAnalysis.map(platform => {
      const currentAllocation = (platform.totalSpend / totalBudget) * 100;
      let suggestedAllocation = currentAllocation;

      // Adjust based on efficiency
      if (platform.efficiency > 70) {
        suggestedAllocation = Math.min(50, currentAllocation * 1.2); // Increase efficient platforms by 20%
      } else if (platform.efficiency < 40) {
        suggestedAllocation = Math.max(10, currentAllocation * 0.8); // Decrease inefficient platforms by 20%
      }

      return {
        platform: platform.platformName,
        currentAllocation: Math.round(currentAllocation * 100) / 100,
        suggestedAllocation: Math.round(suggestedAllocation * 100) / 100,
        change: Math.round((suggestedAllocation - currentAllocation) * 100) / 100,
        reasoning: platform.efficiency > 70 ? 'High efficiency - increase budget' : 
                  platform.efficiency < 40 ? 'Low efficiency - reduce budget' : 
                  'Maintain current allocation',
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        platforms: platformAnalysis,
        summary: {
          totalPlatforms,
          totalSpend,
          totalDeals,
          avgCostPerConversion: Math.round(avgCostPerConversion * 100) / 100,
          avgEfficiency: Math.round(avgEfficiency * 100) / 100,
          mostEfficient: mostEfficientPlatform ? {
            platform: mostEfficientPlatform.platformName,
            efficiency: mostEfficientPlatform.efficiency,
          } : null,
          leastEfficient: leastEfficientPlatform ? {
            platform: leastEfficientPlatform.platformName,
            efficiency: leastEfficientPlatform.efficiency,
          } : null,
          highestSpend: highestSpendPlatform ? {
            platform: highestSpendPlatform.platformName,
            spend: highestSpendPlatform.totalSpend,
          } : null,
          lowestCPC: lowestCPCPlatform ? {
            platform: lowestCPCPlatform.platformName,
            costPerConversion: lowestCPCPlatform.costPerConversion,
          } : null,
        },
        insights: {
          recommendations,
          budgetAllocation: budgetAllocationSuggestions,
          platformCountryMatrix,
          keyFindings: [
            totalPlatforms > 3 ? "Diversified platform strategy" : "Consider testing additional platforms",
            mostEfficientPlatform ? `${mostEfficientPlatform.platformName} is your top performer` : "Performance analysis pending",
            avgEfficiency > 60 ? "Strong overall platform efficiency" : "Platform optimization needed",
          ],
        },
        filters: {
          startDate: filters.startDate.toISOString(),
          endDate: filters.endDate.toISOString(),
          branchId,
          agentId,
          countryId,
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Platform analytics error:', error);
    
    return NextResponse.json(
      { 
        message: 'Failed to get platform analytics'
      },
      { status: 500 }
    );
  }
})