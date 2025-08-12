import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth-middleware';
import { prisma } from '@/lib/database';

// GET /api/master-data/media-buyers
export const GET = requireAuth(async (request: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');

    const mediaBuyers = await prisma.user.findMany({
      where: {
        role: 'MEDIA_BUYER',
        ...(branchId && { branchId }),
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        branchId: true,
        createdAt: true,
        branch: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: [
        { branchId: 'asc' },
        { name: 'asc' }
      ]
    });

    const response = NextResponse.json({
      success: true,
      data: mediaBuyers
    });

    // Add caching headers for performance
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    response.headers.set('ETag', `media-buyers-${Date.now()}`);
    
    return response;
  } catch (error) {
    console.error('Error fetching media buyers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch media buyers' },
      { status: 500 }
    );
  }
});