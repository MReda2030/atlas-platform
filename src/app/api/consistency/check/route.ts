import { NextRequest, NextResponse } from 'next/server';
import { DataConsistencyService } from '@/lib/services/consistency-service';
import { requireAuth } from '@/lib/auth/auth-middleware';

export const GET = requireAuth(async (request: any) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const agentId = searchParams.get('agentId');
    const date = searchParams.get('date');
    const branchId = searchParams.get('branchId');

    // Validation
    if (!agentId) {
      return NextResponse.json(
        { message: 'Agent ID is required' },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { message: 'Date is required' },
        { status: 400 }
      );
    }

    if (!branchId) {
      return NextResponse.json(
        { message: 'Branch ID is required' },
        { status: 400 }
      );
    }

    // Validate date format
    const reportDate = new Date(date);
    if (isNaN(reportDate.getTime())) {
      return NextResponse.json(
        { message: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Check consistency
    const consistencyResult = await DataConsistencyService.checkMediaSalesAlignment(
      agentId,
      date,
      branchId
    );

    return NextResponse.json({
      success: true,
      data: consistencyResult,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Consistency check error:', error);
    
    return NextResponse.json(
      { 
        message: 'Failed to check data consistency'
      },
      { status: 500 }
    );
  }
})

export const POST = requireAuth(async (request: any) => {
  try {
    const body = await request.json();
    
    const {
      agentId,
      dates,
      branchId
    } = body;

    if (!agentId || !branchId) {
      return NextResponse.json(
        { message: 'Agent ID and Branch ID are required' },
        { status: 400 }
      );
    }

    const datesToCheck = dates || [new Date().toISOString().split('T')[0]];
    
    // Check consistency for multiple dates
    const results = await Promise.all(
      datesToCheck.map(async (date: string) => {
        const result = await DataConsistencyService.checkMediaSalesAlignment(
          agentId,
          date,
          branchId
        );
        
        return {
          date,
          ...result
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        agentId,
        branchId,
        results,
        summary: {
          totalDates: results.length,
          consistentDates: results.filter(r => r.isConsistent).length,
          totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0),
          averageConversionRate: results.reduce((sum, r) => sum + (r.metrics.conversionRate || 0), 0) / results.length
        }
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Batch consistency check error:', error);
    
    return NextResponse.json(
      { 
        message: 'Failed to check batch data consistency'
      },
      { status: 500 }
    );
  }
})