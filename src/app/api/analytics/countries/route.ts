import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/auth-middleware';
import { Permission } from '@/lib/auth/roles-permissions';
import { AnalyticsService } from '@/lib/services/analytics-service';

export const GET = requirePermissions(Permission.VIEW_ANALYTICS)(async (request: any) => {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const startParam = searchParams.get('startDate');
    const endParam = searchParams.get('endDate');
    const branchId = searchParams.get('branchId');
    const agentId = searchParams.get('agentId');
    const platformId = searchParams.get('platformId');

    const filters = {
      startDate: startParam ? new Date(startParam) : startDate,
      endDate: endParam ? new Date(endParam) : endDate,
      ...(branchId && { branchId }),
      ...(agentId && { agentId }),
      ...(platformId && { platformId }),
    };

    // Get country analysis
    const countryAnalysis = await AnalyticsService.getCountryAnalysis(filters);

    // Calculate summary metrics
    const totalCountries = countryAnalysis.length;
    const totalSpend = countryAnalysis.reduce((sum, country) => sum + country.totalSpend, 0);
    const totalDeals = countryAnalysis.reduce((sum, country) => sum + country.totalDeals, 0);
    const avgROI = countryAnalysis.reduce((sum, country) => sum + country.roi, 0) / totalCountries;
    const avgConversionRate = countryAnalysis.reduce((sum, country) => sum + country.conversionRate, 0) / totalCountries;

    // Find best and worst performing countries
    const bestROICountry = countryAnalysis.reduce((best, current) => 
      current.roi > best.roi ? current : best
    , countryAnalysis[0]);

    const worstROICountry = countryAnalysis.reduce((worst, current) => 
      current.roi < worst.roi ? current : worst
    , countryAnalysis[0]);

    const highestVolumeCountry = countryAnalysis.reduce((highest, current) => 
      current.totalDeals > highest.totalDeals ? current : highest
    , countryAnalysis[0]);

    // Aggregate destination preferences
    const allDestinations: Record<string, { deals: number; countries: Set<string> }> = {};
    
    countryAnalysis.forEach(country => {
      country.topDestinations.forEach(dest => {
        if (!allDestinations[dest.destination]) {
          allDestinations[dest.destination] = {
            deals: 0,
            countries: new Set(),
          };
        }
        allDestinations[dest.destination].deals += dest.deals;
        allDestinations[dest.destination].countries.add(country.countryName);
      });
    });

    const globalDestinations = Object.entries(allDestinations)
      .map(([destination, data]) => ({
        destination,
        totalDeals: data.deals,
        countriesServed: data.countries.size,
        popularity: (data.deals / totalDeals) * 100,
      }))
      .sort((a, b) => b.totalDeals - a.totalDeals)
      .slice(0, 10);

    // Platform effectiveness across countries
    const globalPlatformPerformance: Record<string, { 
      spend: number; 
      deals: number; 
      countries: Set<string>;
      avgROI: number;
      roiSum: number;
      roiCount: number;
    }> = {};

    countryAnalysis.forEach(country => {
      country.platformPerformance.forEach(platform => {
        if (!globalPlatformPerformance[platform.platform]) {
          globalPlatformPerformance[platform.platform] = {
            spend: 0,
            deals: 0,
            countries: new Set(),
            avgROI: 0,
            roiSum: 0,
            roiCount: 0,
          };
        }
        
        const gpp = globalPlatformPerformance[platform.platform];
        gpp.spend += platform.spend;
        gpp.deals += platform.deals;
        gpp.countries.add(country.countryName);
        gpp.roiSum += platform.roi;
        gpp.roiCount += 1;
      });
    });

    // Calculate average ROI for platforms
    const platformSummary = Object.entries(globalPlatformPerformance)
      .map(([platform, data]) => ({
        platform,
        totalSpend: data.spend,
        totalDeals: data.deals,
        countriesActive: data.countries.size,
        avgROI: data.roiCount > 0 ? data.roiSum / data.roiCount : 0,
        costPerConversion: data.deals > 0 ? data.spend / data.deals : 0,
      }))
      .sort((a, b) => b.avgROI - a.avgROI);

    return NextResponse.json({
      success: true,
      data: {
        countries: countryAnalysis,
        summary: {
          totalCountries,
          totalSpend,
          totalDeals,
          avgROI: Math.round(avgROI * 100) / 100,
          avgConversionRate: Math.round(avgConversionRate * 100) / 100,
          bestPerforming: bestROICountry ? {
            country: bestROICountry.countryName,
            roi: bestROICountry.roi,
          } : null,
          worstPerforming: worstROICountry ? {
            country: worstROICountry.countryName,
            roi: worstROICountry.roi,
          } : null,
          highestVolume: highestVolumeCountry ? {
            country: highestVolumeCountry.countryName,
            deals: highestVolumeCountry.totalDeals,
          } : null,
        },
        insights: {
          topDestinations: globalDestinations,
          platformPerformance: platformSummary,
          marketInsights: [
            avgROI > 50 ? "Strong overall market performance" : "Markets need optimization",
            bestROICountry && worstROICountry ? 
              `${bestROICountry.countryName} outperforms ${worstROICountry.countryName} by ${Math.round((bestROICountry.roi - worstROICountry.roi) * 100) / 100}% ROI` :
              "Market performance analysis pending",
            totalDeals > 100 ? "High-volume operation achieved" : "Scale up recommended for better insights"
          ],
        },
        filters: {
          startDate: filters.startDate.toISOString(),
          endDate: filters.endDate.toISOString(),
          branchId,
          agentId,
          platformId,
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Country analytics error:', error);
    
    return NextResponse.json(
      { 
        message: 'Failed to get country analytics'
      },
      { status: 500 }
    );
  }
})