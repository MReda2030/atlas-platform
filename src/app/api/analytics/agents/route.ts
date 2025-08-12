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
    const sortBy = searchParams.get('sortBy') || 'roi'; // roi, deals, efficiency, spend
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '50');

    const filters = {
      startDate: startParam ? new Date(startParam) : startDate,
      endDate: endParam ? new Date(endParam) : endDate,
      ...(branchId && { branchId }),
      ...(agentId && { agentId }),
    };

    // Get agent performance
    let agentPerformance = await AnalyticsService.getAgentPerformance(filters);

    // Sort results
    agentPerformance.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a] as number;
      const bValue = b[sortBy as keyof typeof b] as number;
      
      if (sortOrder === 'desc') {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });

    // Apply limit
    const limitedResults = agentPerformance.slice(0, limit);

    // Calculate summary statistics
    const totalAgents = agentPerformance.length;
    const avgROI = agentPerformance.reduce((sum, agent) => sum + agent.roi, 0) / totalAgents;
    const avgConversionRate = agentPerformance.reduce((sum, agent) => sum + agent.conversionRate, 0) / totalAgents;
    const topPerformer = agentPerformance[0];
    const totalSpend = agentPerformance.reduce((sum, agent) => sum + agent.totalSpend, 0);
    const totalDeals = agentPerformance.reduce((sum, agent) => sum + agent.totalDeals, 0);

    // Branch breakdown
    const branchPerformance = agentPerformance.reduce((acc, agent) => {
      if (!acc[agent.branchName]) {
        acc[agent.branchName] = {
          branchName: agent.branchName,
          agentCount: 0,
          totalSpend: 0,
          totalDeals: 0,
          avgROI: 0,
        };
      }
      
      acc[agent.branchName].agentCount += 1;
      acc[agent.branchName].totalSpend += agent.totalSpend;
      acc[agent.branchName].totalDeals += agent.totalDeals;
      acc[agent.branchName].avgROI += agent.roi;
      
      return acc;
    }, {} as Record<string, any>);

    // Calculate average ROI per branch
    Object.values(branchPerformance).forEach((branch: any) => {
      branch.avgROI = branch.avgROI / branch.agentCount;
    });

    return NextResponse.json({
      success: true,
      data: {
        agents: limitedResults,
        summary: {
          totalAgents,
          avgROI: Math.round(avgROI * 100) / 100,
          avgConversionRate: Math.round(avgConversionRate * 100) / 100,
          totalSpend,
          totalDeals,
          topPerformer: topPerformer ? {
            agentId: topPerformer.agentId,
            roi: topPerformer.roi,
            deals: topPerformer.totalDeals,
          } : null,
        },
        branchBreakdown: Object.values(branchPerformance),
        filters: {
          startDate: filters.startDate.toISOString(),
          endDate: filters.endDate.toISOString(),
          branchId,
          agentId,
          sortBy,
          sortOrder,
          limit,
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Agent analytics error:', error);
    
    return NextResponse.json(
      { 
        message: 'Failed to get agent analytics'
      },
      { status: 500 }
    );
  }
})
export const POST = requirePermissions(Permission.VIEW_ANALYTICS)(async (request: any) => {
  try {
    const body = await request.json();
    
    const {
      agentIds,
      startDate,
      endDate,
      branchId,
      compareMode = 'performance' // 'performance', 'trends', 'efficiency'
    } = body;

    if (!agentIds || !Array.isArray(agentIds) || agentIds.length === 0) {
      return NextResponse.json(
        { message: 'Agent IDs array is required' },
        { status: 400 }
      );
    }

    const filters = {
      startDate: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: endDate ? new Date(endDate) : new Date(),
      ...(branchId && { branchId }),
    };

    // Get performance data for each agent
    const agentComparisons = await Promise.all(
      agentIds.map(async (agentId: string) => {
        const agentFilters = { ...filters, agentId };
        const [performance] = await AnalyticsService.getAgentPerformance(agentFilters);
        
        let trendData = null;
        if (compareMode === 'trends') {
          trendData = await AnalyticsService.getTimeSeriesData(agentFilters);
        }

        return {
          agentId,
          performance: performance || null,
          trends: trendData,
        };
      })
    );

    // Calculate comparison metrics
    const comparison = {
      bestROI: agentComparisons.reduce((best, current) => 
        (!best.performance || (current.performance && current.performance.roi > best.performance.roi)) ? current : best
      ),
      bestConversionRate: agentComparisons.reduce((best, current) => 
        (!best.performance || (current.performance && current.performance.conversionRate > best.performance.conversionRate)) ? current : best
      ),
      mostEfficient: agentComparisons.reduce((best, current) => 
        (!best.performance || (current.performance && current.performance.efficiency > best.performance.efficiency)) ? current : best
      ),
      lowestCPC: agentComparisons.reduce((best, current) => 
        (!best.performance || (current.performance && current.performance.costPerConversion < best.performance.costPerConversion)) ? current : best
      ),
    };

    return NextResponse.json({
      success: true,
      data: {
        agents: agentComparisons,
        comparison,
        compareMode,
        filters: {
          startDate: filters.startDate.toISOString(),
          endDate: filters.endDate.toISOString(),
          branchId,
          agentIds,
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Agent comparison error:', error);
    
    return NextResponse.json(
      { 
        message: 'Failed to compare agents'
      },
      { status: 500 }
    );
  }
})