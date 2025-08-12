// Performance Metrics API for Atlas Platform Monitoring
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth/auth-middleware';
import { productionCache } from '@/lib/cache/production-cache';

interface PerformanceMetrics {
  database: {
    totalQueries: number;
    slowQueries: number;
    avgResponseTime: number;
    connectionPool: {
      active: number;
      idle: number;
      total: number;
    };
  };
  cache: {
    redis: boolean;
    memoryUsage: number;
    hitRate: number;
  };
  api: {
    totalRequests: number;
    avgResponseTime: number;
    errorRate: number;
    endpointMetrics: { [endpoint: string]: { requests: number; avgTime: number; errors: number } };
  };
  application: {
    uptime: number;
    memoryUsage: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: number;
  };
}

export const GET = requireAuth(async (request: NextRequest) => {
  try {
    const user = request.user!;
    
    // Only allow admins and in development
    if (user.role !== 'SUPER_ADMIN' && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // Get cache statistics
    const cacheStats = await productionCache.getCacheStats();

    // Get database performance metrics
    const dbMetrics = await getDatabaseMetrics();

    // Get API performance metrics (mock for now - would integrate with actual monitoring)
    const apiMetrics = await getAPIMetrics();

    // Get application metrics
    const appMetrics = getApplicationMetrics();

    const metrics: PerformanceMetrics = {
      database: dbMetrics,
      cache: {
        redis: cacheStats.redis,
        memoryUsage: cacheStats.memoryCache,
        hitRate: Math.random() * 100 // TODO: Implement real cache hit rate tracking
      },
      api: apiMetrics,
      application: appMetrics
    };

    return NextResponse.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
});

async function getDatabaseMetrics() {
  try {
    // Test query performance
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const queryTime = Date.now() - startTime;

    // Get table statistics
    const tableStats = await prisma.$queryRaw<Array<{
      schemaname: string;
      tablename: string;
      n_tup_ins: bigint;
      n_tup_upd: bigint;
      n_tup_del: bigint;
    }>>`
      SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del
      FROM pg_stat_user_tables 
      WHERE schemaname = 'public'
    `;

    const totalOperations = tableStats.reduce((sum, stat) => 
      sum + Number(stat.n_tup_ins) + Number(stat.n_tup_upd) + Number(stat.n_tup_del), 0
    );

    return {
      totalQueries: totalOperations,
      slowQueries: 0, // Would need pg_stat_statements enabled
      avgResponseTime: queryTime,
      connectionPool: {
        active: 5, // Mock data - would get from actual pool
        idle: 15,
        total: 20
      }
    };
  } catch (error) {
    console.warn('Could not fetch database metrics:', error);
    return {
      totalQueries: 0,
      slowQueries: 0,
      avgResponseTime: 0,
      connectionPool: { active: 0, idle: 0, total: 0 }
    };
  }
}

async function getAPIMetrics() {
  // In production, this would integrate with actual request logging
  // For now, return mock data that represents typical performance
  return {
    totalRequests: Math.floor(Math.random() * 10000) + 1000,
    avgResponseTime: Math.floor(Math.random() * 200) + 50, // 50-250ms
    errorRate: Math.random() * 2, // 0-2% error rate
    endpointMetrics: {
      '/api/dashboard/stats': {
        requests: Math.floor(Math.random() * 1000) + 100,
        avgTime: Math.floor(Math.random() * 100) + 50,
        errors: Math.floor(Math.random() * 10)
      },
      '/api/media-reports': {
        requests: Math.floor(Math.random() * 500) + 50,
        avgTime: Math.floor(Math.random() * 500) + 100,
        errors: Math.floor(Math.random() * 5)
      },
      '/api/sales-reports': {
        requests: Math.floor(Math.random() * 400) + 40,
        avgTime: Math.floor(Math.random() * 300) + 80,
        errors: Math.floor(Math.random() * 3)
      },
      '/api/master-data/agents': {
        requests: Math.floor(Math.random() * 200) + 20,
        avgTime: Math.floor(Math.random() * 50) + 30,
        errors: Math.floor(Math.random() * 2)
      }
    }
  };
}

function getApplicationMetrics() {
  const processUptime = process.uptime() * 1000; // Convert to milliseconds
  
  // Memory usage
  const memUsage = process.memoryUsage();
  const memoryMetrics = {
    used: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100, // MB
    total: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100, // MB
    percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
  };

  return {
    uptime: processUptime,
    memoryUsage: memoryMetrics,
    cpu: Math.random() * 100 // Mock CPU usage - would use actual system metrics
  };
}