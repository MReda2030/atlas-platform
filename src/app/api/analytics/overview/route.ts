import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/auth-middleware';
import { Permission } from '@/lib/auth/roles-permissions';
import { prisma } from '@/lib/database';

export const GET = requirePermissions(Permission.VIEW_ANALYTICS)(async (request: any) => {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse date range (default to last 30 days)
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const startParam = searchParams.get('startDate');
    const endParam = searchParams.get('endDate');
    const branchId = searchParams.get('branchId');
    const agentId = searchParams.get('agentId');
    const countryId = searchParams.get('countryId');
    const platformId = searchParams.get('platformId');

    const filters = {
      startDate: startParam ? new Date(startParam) : startDate,
      endDate: endParam ? new Date(endParam) : endDate,
      ...(branchId && { branchId }),
      ...(agentId && { agentId }),
      ...(countryId && { countryId }),
      ...(platformId && { platformId }),
    };

    // Simplified analytics - get basic metrics directly from database
    const user = request.user!;
    const isMediaBuyer = user.role === 'MEDIA_BUYER';

    // Build where clauses based on user permissions
    const mediaReportWhere = isMediaBuyer ? { mediaBuyerId: user.id } : {};
    const salesReportWhere = isMediaBuyer ? { mediaBuyerId: user.id } : {};

    // Get overall metrics
    const totalSpendResult = await prisma.campaignDetail.aggregate({
      _sum: { amount: true },
      _count: true,
      where: {
        createdAt: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
        agentData: {
          countryData: {
            report: mediaReportWhere,
          }
        }
      }
    });

    const totalDealsResult = await prisma.salesCountryData.aggregate({
      _sum: { dealsClosed: true },
      where: {
        createdAt: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
        report: salesReportWhere,
      }
    });

    const totalSpend = Number(totalSpendResult._sum.amount || 0);
    const totalDeals = totalDealsResult._sum.dealsClosed || 0;
    const totalCampaigns = totalSpendResult._count;
    const averageDealValue = 1000; // Assumed average
    const totalRevenue = totalDeals * averageDealValue;
    const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
    const costPerConversion = totalDeals > 0 ? totalSpend / totalDeals : 0;
    const conversionRate = totalCampaigns > 0 ? (totalDeals / totalCampaigns) * 100 : 0;

    const overallROI = {
      totalSpend,
      totalRevenue,
      totalDeals,
      roi,
      costPerConversion,
      conversionRate,
      profitMargin: roi > 0 ? (totalRevenue - totalSpend) / totalRevenue * 100 : 0,
    };

    // Get top agents (simplified)
    const topAgents = [];

    // Get top countries (simplified) 
    const topCountries = [];

    // Get top platforms (simplified)
    const topPlatforms = [];

    // Simple time series data
    const timeSeriesData = {
      dates: [],
      spendData: [],
      dealsData: [],
      roiData: [],
    };

    return NextResponse.json({
      success: true,
      data: {
        overview: overallROI,
        topPerformers: {
          agents: topAgents,
          countries: topCountries,
          platforms: topPlatforms,
        },
        trends: timeSeriesData,
        filters: {
          startDate: filters.startDate.toISOString(),
          endDate: filters.endDate.toISOString(),
          branchId,
          agentId,
          countryId,
          platformId,
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Analytics overview error:', error);
    
    return NextResponse.json(
      { 
        message: 'Failed to generate analytics overview'
      },
      { status: 500 }
    );
  }
})