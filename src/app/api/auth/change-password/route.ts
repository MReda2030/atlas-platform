import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getClientIP, getUserAgent } from '@/lib/auth/auth-middleware';
import { AuthService } from '@/lib/auth/auth-service';

export const POST = requireAuth(async (request) => {
  try {
    const user = request.user!;
    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { message: 'All password fields are required' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { message: 'New passwords do not match' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return NextResponse.json(
        { 
          message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
          code: 'WEAK_PASSWORD'
        },
        { status: 400 }
      );
    }

    // Get client information
    const ipAddress = getClientIP(request);
    const userAgent = getUserAgent(request);

    // Change password
    const result = await AuthService.changePassword(
      user.id,
      currentPassword,
      newPassword,
      ipAddress,
      userAgent
    );

    if (!result.success) {
      return NextResponse.json(
        { message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Change password API error:', error);
    
    return NextResponse.json(
      { message: 'Failed to change password' },
      { status: 500 }
    );
  }
});