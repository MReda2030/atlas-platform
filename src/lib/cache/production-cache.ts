// Production-ready caching configuration for Atlas Platform
import { redisCache } from '../redis-cache';
import { serverCache } from '../server-cache';

interface ProductionCacheConfig {
  enabled: boolean;
  defaultTTL: number;
  masterDataTTL: number;
  dashboardTTL: number;
  apiResponseTTL: number;
}

class ProductionCacheManager {
  private config: ProductionCacheConfig;
  private isInitialized = false;
  
  constructor() {
    this.config = {
      enabled: process.env.ENABLE_REDIS === 'true',
      defaultTTL: parseInt(process.env.DEFAULT_CACHE_TTL || '300', 10), // 5 minutes
      masterDataTTL: parseInt(process.env.MASTER_DATA_CACHE_TTL || '1800', 10), // 30 minutes
      dashboardTTL: parseInt(process.env.DASHBOARD_CACHE_TTL || '180', 10), // 3 minutes
      apiResponseTTL: parseInt(process.env.API_RESPONSE_CACHE_TTL || '300', 10) // 5 minutes
    };
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    
    if (this.config.enabled) {
      try {
        // Initialize Redis connection
        await redisCache.connect();
        
        // Test Redis connectivity
        const isHealthy = await redisCache.isHealthy();
        if (!isHealthy) {
          console.warn('Redis health check failed, falling back to memory cache');
          return false;
        }
        
        console.log('✅ Production Redis cache initialized successfully');
        this.isInitialized = true;
        return true;
      } catch (error) {
        console.error('❌ Failed to initialize Redis cache:', error);
        console.log('⚠️ Falling back to memory-only caching');
        return false;
      }
    } else {
      console.log('ℹ️ Redis caching disabled, using memory cache only');
      return true;
    }
  }

  // High-level caching methods optimized for production

  async cacheDashboardData<T>(userId: string, key: string, fetcher: () => Promise<T>): Promise<T> {
    const cacheKey = `dashboard:${userId}:${key}`;
    return serverCache.cacheAPIResponse(cacheKey, userId, fetcher, this.config.dashboardTTL);
  }

  async cacheMasterData<T>(dataType: string, fetcher: () => Promise<T>): Promise<T> {
    const cacheKey = `master_data:${dataType}`;
    return serverCache.cacheAPIResponse(cacheKey, null, fetcher, this.config.masterDataTTL);
  }

  async cacheAnalyticsData<T>(
    userId: string, 
    analyticsType: string, 
    filters: any, 
    fetcher: () => Promise<T>
  ): Promise<T> {
    const filtersHash = this.hashFilters(filters);
    const cacheKey = `analytics:${analyticsType}:${userId}:${filtersHash}`;
    return serverCache.cacheAPIResponse(cacheKey, userId, fetcher, this.config.apiResponseTTL);
  }

  async cacheReportData<T>(
    reportType: 'media' | 'sales',
    userId: string,
    parameters: any,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const paramsHash = this.hashFilters(parameters);
    const cacheKey = `reports:${reportType}:${userId}:${paramsHash}`;
    return serverCache.cacheAPIResponse(cacheKey, userId, fetcher, this.config.apiResponseTTL);
  }

  // Cache invalidation methods
  async invalidateUserCache(userId: string): Promise<void> {
    await serverCache.invalidate(`*:${userId}:*`);
    console.log(`Invalidated cache for user: ${userId}`);
  }

  async invalidateDashboardCache(userId?: string): Promise<void> {
    const pattern = userId ? `dashboard:${userId}:*` : 'dashboard:*';
    await serverCache.invalidate(pattern);
    console.log(`Invalidated dashboard cache${userId ? ` for user: ${userId}` : ''}`);
  }

  async invalidateMasterDataCache(): Promise<void> {
    await serverCache.invalidate('master_data:*');
    console.log('Invalidated master data cache');
  }

  async invalidateAnalyticsCache(userId?: string): Promise<void> {
    const pattern = userId ? `analytics:*:${userId}:*` : 'analytics:*';
    await serverCache.invalidate(pattern);
    console.log(`Invalidated analytics cache${userId ? ` for user: ${userId}` : ''}`);
  }

  // Cache warming for critical data
  async warmCache(): Promise<void> {
    if (!this.config.enabled) return;

    console.log('🔥 Warming production cache...');
    
    try {
      // Warm master data cache
      const masterDataTypes = ['branches', 'agents', 'target-countries', 'destination-countries', 'platforms'];
      
      for (const dataType of masterDataTypes) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/master-data/${dataType}`);
          console.log(`✅ Warmed cache for: ${dataType}`);
        } catch (error) {
          console.warn(`⚠️ Failed to warm cache for ${dataType}:`, error);
        }
      }

      console.log('🔥 Cache warming completed');
    } catch (error) {
      console.error('❌ Cache warming failed:', error);
    }
  }

  // Performance monitoring
  async getCacheStats(): Promise<{
    redis: boolean;
    memoryCache: number;
    config: ProductionCacheConfig;
  }> {
    const isRedisHealthy = this.config.enabled ? await redisCache.isHealthy() : false;
    
    return {
      redis: isRedisHealthy,
      memoryCache: serverCache['memoryCache']?.size || 0,
      config: this.config
    };
  }

  // Utility methods
  private hashFilters(filters: any): string {
    return Buffer.from(JSON.stringify(filters)).toString('base64').slice(0, 16);
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    if (this.config.enabled) {
      await redisCache.disconnect();
      console.log('✅ Production cache disconnected gracefully');
    }
  }
}

// Singleton instance
export const productionCache = new ProductionCacheManager();

// Auto-initialize if Redis is enabled
if (process.env.ENABLE_REDIS === 'true') {
  productionCache.initialize().catch(console.error);
}

export default productionCache;