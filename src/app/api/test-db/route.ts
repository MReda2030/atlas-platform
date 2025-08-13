import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Log environment variables (safely)
    console.log('Environment check:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 30) + '...' || 'NOT_SET');
    
    // Create a new Prisma client with explicit configuration
    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    console.log('Attempting database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query executed successfully:', result);
    
    // Test if tables exist
    const tableCheck = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'branches', 'sales_agents')
      ORDER BY table_name
    `;
    console.log('✅ Tables found:', tableCheck);
    
    // Test user count
    const userCount = await prisma.user.count();
    console.log('✅ User count:', userCount);
    
    // Test if admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@atlas.com' },
      select: { id: true, email: true, name: true, role: true, isActive: true }
    });
    console.log('✅ Admin user check:', adminUser ? 'FOUND' : 'NOT_FOUND');
    
    const responseTime = Date.now() - startTime;
    
    await prisma.$disconnect();
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection test successful',
      responseTime: `${responseTime}ms`,
      results: {
        connection: 'successful',
        basicQuery: 'successful',
        tablesFound: tableCheck,
        userCount,
        adminUserExists: !!adminUser,
        adminUserDetails: adminUser
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlPreview: process.env.DATABASE_URL?.substring(0, 30) + '...' || 'NOT_SET'
      }
    });
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json(
      {
        status: 'error',
        message: 'Database connection test failed',
        responseTime: `${responseTime}ms`,
        error: {
          name: (error as Error).name,
          message: (error as Error).message,
          stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          databaseUrlPreview: process.env.DATABASE_URL?.substring(0, 30) + '...' || 'NOT_SET'
        }
      },
      { status: 500 }
    );
  }
}