import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth-middleware';

export const GET = requireAuth(async (request) => {
  try {
    const user = request.user!;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        branchId: user.branchId,
        agentNumber: user.agentNumber,
        permissions: user.permissions,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
      },
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    
    return NextResponse.json(
      { message: 'Failed to get user profile' },
      { status: 500 }
    );
  }
});