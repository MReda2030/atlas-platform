import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/auth-service';
import { getClientIP, getUserAgent } from '@/lib/auth/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie or Authorization header
    const cookieToken = request.cookies.get('auth-token')?.value;
    const authHeader = request.headers.get('authorization');
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    const token = cookieToken || headerToken;

    if (token) {
      // Get client information
      const ipAddress = getClientIP(request);
      const userAgent = getUserAgent(request);

      // Logout
      await AuthService.logout(token, ipAddress, userAgent);
    }

    // Clear cookie and return success
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    response.cookies.delete('auth-token');

    return response;

  } catch (error) {
    console.error('Logout API error:', error);
    
    // Still return success to prevent client-side issues
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    response.cookies.delete('auth-token');
    return response;
  }
}