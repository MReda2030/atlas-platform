// @ts-ignore - Temporary workaround for Next.js import issue
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requirePermissions, getClientIP, getUserAgent, applyDataFilters } from '@/lib/auth/auth-middleware';
import { Permission, AuditAction } from '@/lib/auth/roles-permissions';
import { AuthService } from '@/lib/auth/auth-service';

// Optimized helper function to convert codes to UUIDs with batch queries (Performance Fix)
async function convertCodesToUUIDs(data: any) {
  // Collect all unique codes from the nested data structure
  const countryCodes = new Set<string>();
  const agentNumbers = new Set<string>();
  const destinationCodes = new Set<string>();
  const platformNames = new Set<string>();

  // Single pass through data to collect all codes
  data.countries.forEach((country: any) => {
    countryCodes.add(country.targetCountryId);
    country.agents.forEach((agent: any) => {
      agentNumbers.add(agent.salesAgentId);
      agent.campaigns.forEach((campaign: any) => {
        destinationCodes.add(campaign.destinationCountryId);
        platformNames.add(campaign.platformId.toLowerCase()); // Normalize for case-insensitive lookup
      });
    });
  });

  // Batch fetch all data in parallel - 4 queries instead of 100+
  const [branch, targetCountries, salesAgents, destinationCountries, platforms] = await Promise.all([
    prisma.branch.findUnique({
      where: { code: data.branchId },
      select: { id: true, code: true }
    }),
    prisma.targetCountry.findMany({
      where: { code: { in: Array.from(countryCodes) } },
      select: { id: true, code: true }
    }),
    prisma.salesAgent.findMany({
      where: { agentNumber: { in: Array.from(agentNumbers) } },
      select: { id: true, agentNumber: true }
    }),
    prisma.destinationCountry.findMany({
      where: { code: { in: Array.from(destinationCodes) } },
      select: { id: true, code: true }
    }),
    prisma.advertisingPlatform.findMany({
      where: { 
        name: { 
          in: Array.from(platformNames),
          mode: 'insensitive' 
        }
      },
      select: { id: true, name: true }
    })
  ]);

  // Validate branch exists
  if (!branch) {
    throw new Error(`Branch with code ${data.branchId} not found`);
  }

  // Create lookup maps for O(1) access
  const countryLookup = new Map(targetCountries.map(c => [c.code, c.id]));
  const agentLookup = new Map(salesAgents.map(a => [a.agentNumber, a.id]));
  const destinationLookup = new Map(destinationCountries.map(d => [d.code, d.id]));
  const platformLookup = new Map(platforms.map(p => [p.name.toLowerCase(), p.id]));

  // Transform data using lookups
  const convertedData = {
    ...data,
    branchId: branch.id,
    countries: data.countries.map((country: any) => {
      const targetCountryId = countryLookup.get(country.targetCountryId);
      if (!targetCountryId) {
        throw new Error(`Target country with code ${country.targetCountryId} not found`);
      }

      return {
        ...country,
        targetCountryId,
        agents: country.agents.map((agent: any) => {
          const salesAgentId = agentLookup.get(agent.salesAgentId);
          if (!salesAgentId) {
            throw new Error(`Sales agent with number ${agent.salesAgentId} not found`);
          }

          return {
            ...agent,
            salesAgentId,
            campaigns: agent.campaigns.map((campaign: any) => {
              const destinationCountryId = destinationLookup.get(campaign.destinationCountryId);
              const platformId = platformLookup.get(campaign.platformId.toLowerCase());

              if (!destinationCountryId) {
                throw new Error(`Destination country with code ${campaign.destinationCountryId} not found`);
              }
              if (!platformId) {
                throw new Error(`Platform with name ${campaign.platformId} not found`);
              }

              return {
                ...campaign,
                destinationCountryId,
                platformId
              };
            })
          };
        })
      };
    })
  };

  return convertedData;
}

export const POST = requirePermissions(Permission.CREATE_MEDIA_REPORTS)(async (request) => {
  try {
    const user = request.user!;
    const body = await request.json();
    
    // Media buyers work across all branches and don't need branch assignment
    // Only branch managers and above need specific branch assignments
    
    // Apply data filters based on user role
    const filters = applyDataFilters(request);
    
    // Convert codes to UUIDs
    const convertedData = await convertCodesToUUIDs(body);
    
    // Validate branch access (only for users with specific branch assignments)
    // Media buyers can create reports for any branch since they work across all branches
    if (user.role !== 'MEDIA_BUYER' && filters.branchFilter && convertedData.branchId !== filters.branchFilter) {
      return NextResponse.json(
        { message: 'You can only create reports for your assigned branch' },
        { status: 403 }
      );
    }

    const validatedData = convertedData;
    
    // Create the media report in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the main media report
      const mediaReport = await tx.mediaReport.create({
        data: {
          date: new Date(validatedData.date),
          branchId: validatedData.branchId,
          mediaBuyerId: user.id,
        },
      });

      // 2. Process each country's data
      for (const countryData of validatedData.countries) {
        const mediaCountryData = await tx.mediaCountryData.create({
          data: {
            reportId: mediaReport.id,
            targetCountryId: countryData.targetCountryId,
          },
        });

        // 3. Process each agent's data in this country
        for (const agentData of countryData.agents) {
          const mediaAgentData = await tx.mediaAgentData.create({
            data: {
              countryDataId: mediaCountryData.id,
              salesAgentId: agentData.salesAgentId,
              campaignCount: agentData.campaignCount,
            },
          });

          // 4. Process each campaign for this agent
          for (let i = 0; i < agentData.campaigns.length; i++) {
            const campaign = agentData.campaigns[i];
            await tx.campaignDetail.create({
              data: {
                agentDataId: mediaAgentData.id,
                destinationCountryId: campaign.destinationCountryId,
                amount: campaign.amount,
                platformId: campaign.platformId,
                campaignNumber: i + 1,
              },
            });
          }
        }
      }

      return mediaReport;
    });

    // Log audit event
    await AuthService.logAudit({
      userId: user.id,
      userEmail: user.email,
      action: AuditAction.MEDIA_REPORT_CREATED,
      resource: 'media_report',
      resourceId: result.id,
      details: {
        date: validatedData.date,
        branchId: validatedData.branchId,
        countriesCount: validatedData.countries?.length || 0,
      },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
      branchId: user.branchId,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        message: 'Media report created successfully',
      },
    });
  } catch (error) {
    console.error('Error creating media report:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to create media report',
      },
      { status: 500 }
    );
  }
});

export const GET = requirePermissions(Permission.VIEW_MEDIA_REPORTS)(async (request) => {
  try {
    const user = request.user!;
    const { searchParams } = new URL(request.url);
    
    // Apply data filters based on user role
    const filters = applyDataFilters(request);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    console.log('API GET /media-reports - User:', {
      id: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId
    });
    console.log('API GET /media-reports - Filters:', filters);
    
    // Build where clause based on user permissions
    const whereClause: any = {};
    
    // Apply branch filtering
    if (filters.branchFilter) {
      whereClause.branchId = filters.branchFilter;
    }
    
    // Apply user-specific filtering
    if (filters.restrictToOwn) {
      whereClause.mediaBuyerId = user.id;
    }
    
    console.log('API GET /media-reports - Where clause:', whereClause);
    
    const reports = await prisma.mediaReport.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: [
        { createdAt: 'desc' },
        { date: 'desc' }
      ],
      include: {
        branch: true,
        mediaBuyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        mediaCountryData: {
          include: {
            targetCountry: true,
            mediaAgentData: {
              include: {
                salesAgent: true,
                campaignDetails: {
                  include: {
                    destinationCountry: true,
                    platform: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const totalReports = await prisma.mediaReport.count({ where: whereClause });
    
    console.log('API GET /media-reports - Found reports:', {
      count: reports.length,
      total: totalReports,
      reportIds: reports.map(r => ({
        id: r.id,
        mediaBuyerId: r.mediaBuyerId,
        mediaBuyerEmail: r.mediaBuyer?.email
      }))
    });
    
    return NextResponse.json({
      success: true,
      data: {
        reports,
        pagination: {
          page,
          limit,
          total: totalReports,
          pages: Math.ceil(totalReports / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching media reports:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch media reports',
      },
      { status: 500 }
    );
  }
});