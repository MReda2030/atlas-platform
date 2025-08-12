import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Lightweight database check without connecting/disconnecting
    // Use a simple query that should be fast with proper indexes
    const userCount = await prisma.user.count();
    
    const responseTime = Date.now() - startTime;
    
    const response = NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      responseTime: `${responseTime}ms`,
      services: {
        database: responseTime < 200 ? 'healthy' : responseTime < 1000 ? 'degraded' : 'slow',
        api: 'healthy'
      },
      metrics: {
        userCount,
        uptime: Math.floor(process.uptime()),
        memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
      }
    });
    
    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'public, max-age=30, s-maxage=60');
    return response;
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        error: 'Database connection failed',
        services: {
          database: 'unhealthy',
          api: 'healthy'
        }
      },
      { status: 503 }
    );
  }
}