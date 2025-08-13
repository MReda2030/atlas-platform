import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/auth-service';
import { prisma } from '@/lib/database';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('🔍 Login Test - Starting authentication test');
    console.log('📧 Email:', email);
    console.log('🔑 Password length:', password?.length);

    // Step 1: Check if user exists
    console.log('Step 1: Checking if user exists...');
    const user = await prisma.user.findUnique({
      where: { email: email?.toLowerCase()?.trim() },
      include: { branch: true }
    });

    if (!user) {
      console.log('❌ User not found in database');
      return NextResponse.json({
        status: 'error',
        step: 'user_lookup',
        message: 'User not found',
        details: {
          searchedEmail: email?.toLowerCase()?.trim(),
          usersInDb: await prisma.user.count(),
          allEmails: await prisma.user.findMany({ select: { email: true } })
        }
      });
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      hasPasswordHash: !!user.passwordHash
    });

    // Step 2: Check if user is active
    if (!user.isActive) {
      console.log('❌ User account is inactive');
      return NextResponse.json({
        status: 'error',
        step: 'user_active_check',
        message: 'User account is inactive',
        details: { isActive: user.isActive }
      });
    }

    // Step 3: Test password verification
    console.log('Step 3: Testing password verification...');
    console.log('Password hash preview:', user.passwordHash.substring(0, 20) + '...');
    
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    console.log('Password validation result:', isValidPassword);

    if (!isValidPassword) {
      console.log('❌ Password verification failed');
      
      // Test with known hash
      const testHash = '$2a$12$JoxeVBbG6m4eavRhWj9xDuBwNdOi50PNGkfmicE0C03ge/KHck.Lm';
      const testResult = await bcrypt.compare('password123', testHash);
      console.log('Test hash verification (should be true):', testResult);
      
      return NextResponse.json({
        status: 'error',
        step: 'password_verification',
        message: 'Invalid password',
        details: {
          providedPasswordLength: password.length,
          hashExists: !!user.passwordHash,
          hashPreview: user.passwordHash.substring(0, 20) + '...',
          testHashWorks: testResult
        }
      });
    }

    // Step 4: Test AuthService login
    console.log('Step 4: Testing full AuthService login...');
    const authResult = await AuthService.login(
      { email: email.toLowerCase().trim(), password },
      'test-ip',
      'test-user-agent'
    );

    console.log('AuthService result:', {
      success: authResult.success,
      message: authResult.message,
      hasUser: !!authResult.user,
      hasToken: !!authResult.token
    });

    if (!authResult.success) {
      return NextResponse.json({
        status: 'error',
        step: 'auth_service',
        message: authResult.message,
        details: authResult
      });
    }

    // Success!
    console.log('✅ Login test successful!');
    return NextResponse.json({
      status: 'success',
      message: 'Login test successful',
      steps: {
        userFound: true,
        userActive: true,
        passwordValid: true,
        authServiceWorking: true
      },
      user: {
        id: authResult.user?.id,
        email: authResult.user?.email,
        name: authResult.user?.name,
        role: authResult.user?.role
      },
      tokenGenerated: !!authResult.token
    });

  } catch (error) {
    console.error('❌ Login test failed with error:', error);
    
    return NextResponse.json({
      status: 'error',
      step: 'exception',
      message: 'Login test failed with exception',
      error: {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
      }
    }, { status: 500 });
  }
}