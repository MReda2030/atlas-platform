import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requirePermissions } from '@/lib/auth/auth-middleware';
import { Permission } from '@/lib/auth/roles-permissions';

export const GET = requirePermissions(Permission.VIEW_SALES_REPORTS)(async (request: any) => {
  try {
    const user = request.user!;
    console.log('Fetching sales reports for user:', user.id);
    const url = new URL(request.url || request.nextUrl?.href || '');
    const { searchParams } = url;
    
    // This endpoint filters by current user's mediaBuyerId regardless of role
    // In production, should only be called by media buyers

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause - filter by current media buyer ID
    const where: any = {
      mediaBuyerId: user.id, // Only show reports created by this media buyer
      //branchId: user.branchId // Optional: also filter by branch
    };
    
    // Add date filtering if provided
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Get sales reports with related data - filtered by media buyer
    const [reports, totalCount] = await Promise.all([
      prisma.salesReport.findMany({
        where,
        include: {
          branch: true,
          salesAgent: true,
          mediaBuyer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
        orderBy: [
          { createdAt: 'desc' },
          { date: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.salesReport.count({ where }),
    ]);

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      // Add debug info to verify filtering
      debug: {
        filteredBy: {
          mediaBuyerId: user.id,
          branchId: user.branchId,
          userRole: user.role
        }
      }
    });

  } catch (error) {
    console.error('Error fetching media buyer sales reports:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to fetch sales reports for media buyer'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});