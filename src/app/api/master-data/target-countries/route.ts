import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth-middleware';
import { prisma } from '@/lib/database';

// GET /api/master-data/target-countries
export const GET = requireAuth(async (request: any) => {
  try {
    const targetCountries = await prisma.targetCountry.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        created_at: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    const response = NextResponse.json({
      success: true,
      data: targetCountries
    });

    // Add caching headers for performance
    response.headers.set('Cache-Control', 'public, max-age=600, s-maxage=1200');
    response.headers.set('ETag', `target-countries-${Date.now()}`);
    
    return response;
  } catch (error) {
    console.error('Error fetching target countries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch target countries' },
      { status: 500 }
    );
  }
});