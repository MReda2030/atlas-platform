import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requirePermissions, getClientIP, getUserAgent, applyDataFilters } from '@/lib/auth/auth-middleware';
import { Permission, AuditAction } from '@/lib/auth/roles-permissions';
import { AuthService } from '@/lib/auth/auth-service';

export const POST = requirePermissions(Permission.CREATE_SALES_REPORTS)(async (request) => {
  try {
    const user = request.user!;
    const body = await request.json();
    
    // Media buyers work across all branches and don't need branch assignment
    // Only branch managers and above need specific branch assignments
    
    // Extract form data
    const {
      date,
      branchId,
      salesAgentId,
      countryData,
      dealAllocations
    } = body;

    // Basic validation
    if (!date || !branchId || !salesAgentId || !countryData) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate country data
    const countryEntries = Object.entries(countryData);
    if (countryEntries.length === 0) {
      return NextResponse.json(
        { message: 'At least one country with sales data is required' },
        { status: 400 }
      );
    }

    // Validate each country's data
    for (const [countryCode, data] of countryEntries) {
      const countryInfo = data as any;
      if (
        countryInfo.dealsClosed < 0 ||
        countryInfo.whatsappMessages < 0 ||
        !countryInfo.qualityRating
      ) {
        return NextResponse.json(
          { message: `Invalid data for country ${countryCode}` },
          { status: 400 }
        );
      }
    }

    // Calculate total deals for validation
    const totalDeals = countryEntries.reduce(
      (sum, [, data]) => sum + (data as any).dealsClosed,
      0
    );

    // Validate deal allocations
    if (dealAllocations && totalDeals > 0) {
      const allocatedDeals = Object.keys(dealAllocations).length;
      if (allocatedDeals !== totalDeals) {
        return NextResponse.json(
          { message: 'All deals must be allocated to destinations' },
          { status: 400 }
        );
      }
    }

    // Create sales report in database transaction
    const result = await prisma.$transaction(async (tx) => {

      // Look up branch and agent - handle both UUID and code/number formats
      let branch, salesAgent;
      
      // Try to find branch by ID first, then by code
      // Check if branchId looks like a UUID first
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(branchId);
      
      if (isUUID) {
        branch = await tx.branch.findUnique({
          where: { id: branchId }
        });
      } else {
        branch = await tx.branch.findUnique({
          where: { code: branchId }
        });
      }
      
      if (!branch) {
        throw new Error(`Branch not found with ID/code: ${branchId}`);
      }

      // Try to find agent by ID first, then by agent number
      const isAgentUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(salesAgentId);
      
      if (isAgentUUID) {
        salesAgent = await tx.salesAgent.findUnique({
          where: { id: salesAgentId }
        });
      } else {
        salesAgent = await tx.salesAgent.findUnique({
          where: { agentNumber: salesAgentId }
        });
      }
      
      if (!salesAgent) {
        throw new Error(`Sales agent not found with ID/number: ${salesAgentId}`);
      }

      // Create main sales report
      const salesReport = await tx.salesReport.create({
        data: {
          date: new Date(date),
          branchId: branch.id,
          salesAgentId: salesAgent.id,
          mediaBuyerId: user.id,
          createdBy: user.id,
          updatedBy: user.id,
        },
      });

      // Create country data entries
      const countryDataPromises = countryEntries.map(async ([countryCode, data]) => {
        const countryInfo = data as any;
        
        // Look up target country by ID or code
        const isCountryUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(countryCode);
        
        let targetCountry;
        if (isCountryUUID) {
          targetCountry = await tx.targetCountry.findUnique({
            where: { id: countryCode }
          });
        } else {
          targetCountry = await tx.targetCountry.findUnique({
            where: { code: countryCode }
          });
        }
        
        if (!targetCountry) {
          throw new Error(`Target country not found with ID/code: ${countryCode}`);
        }
        
        const salesCountryData = await tx.salesCountryData.create({
          data: {
            reportId: salesReport.id,
            targetCountryId: targetCountry.id,
            dealsClosed: countryInfo.dealsClosed,
            whatsappMessages: countryInfo.whatsappMessages,
            qualityRating: countryInfo.qualityRating,
          },
        });

        // Create deal destination entries for this country
        if (countryInfo.dealsClosed > 0 && dealAllocations) {
          const dealDestinationPromises: Promise<any>[] = [];
          
          for (let dealNumber = 1; dealNumber <= countryInfo.dealsClosed; dealNumber++) {
            const dealKey = `${countryCode}-deal-${dealNumber}`;
            const destinationId = dealAllocations[dealKey];
            
            if (destinationId) {
              // Look up destination country by ID or code
              const isDestinationUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(destinationId);
              
              let destinationCountry;
              if (isDestinationUUID) {
                destinationCountry = await tx.destinationCountry.findUnique({
                  where: { id: destinationId }
                });
              } else {
                destinationCountry = await tx.destinationCountry.findUnique({
                  where: { code: destinationId }
                });
              }
              
              if (destinationCountry) {
                dealDestinationPromises.push(
                  tx.dealDestination.create({
                    data: {
                      countryDataId: salesCountryData.id,
                      destinationCountryId: destinationCountry.id,
                      dealNumber: dealNumber,
                    },
                  })
                );
              }
            }
          }

          await Promise.all(dealDestinationPromises);
        }

        return salesCountryData;
      });

      await Promise.all(countryDataPromises);

      return salesReport;
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Sales report created successfully',
      reportId: result.id,
      data: {
        id: result.id,
        date: result.date,
        branchId: result.branchId,
        salesAgentId: result.salesAgentId,
        totalCountries: countryEntries.length,
        totalDeals,
      },
    });

  } catch (error) {
    console.error('Error creating sales report:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
});

export const GET = requirePermissions(Permission.VIEW_SALES_REPORTS)(async (request) => {
  try {
    const user = request.user!;
    const { searchParams } = new URL(request.url);
    
    // Apply data filters based on user role
    const filters = applyDataFilters(request);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const branchId = searchParams.get('branchId');
    const salesAgentId = searchParams.get('salesAgentId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log('API GET /sales-reports - User:', {
      id: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId
    });
    console.log('API GET /sales-reports - Filters:', filters);

    // Build where clause based on user permissions
    const where: any = {};
    
    // Apply branch filtering
    if (filters.branchFilter) {
      where.branchId = filters.branchFilter;
    }
    
    // Apply user-specific filtering
    if (filters.restrictToOwn) {
      where.mediaBuyerId = user.id;
    }
    
    if (branchId) {
      where.branchId = branchId;
    }
    
    if (salesAgentId) {
      where.salesAgentId = salesAgentId;
    }
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Get sales reports with related data
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
    });

  } catch (error) {
    console.error('Error fetching sales reports:', error);
    
    return NextResponse.json(
      { 
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
});