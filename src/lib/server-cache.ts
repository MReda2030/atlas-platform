// High-performance server-side caching layer
import { redisCache } from './redis-cache';

interface CacheStrategy {
  key: string;
  ttl: number;
  tags?: string[];
}

class ServerCache {
  // Memory fallback for when Redis is not available
  private memoryCache = new Map<string, { data: any; expires: number; tags: string[] }>();
  private readonly MEMORY_LIMIT = 1000; // Max items in memory cache

  async get<T>(strategy: CacheStrategy): Promise<T | null> {
    const { key, tags = [] } = strategy;

    // Try Redis first
    const redisResult = await redisCache.get<T>(key);
    if (redisResult !== null) {
      return redisResult;
    }

    // Fallback to memory cache
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && Date.now() < memoryEntry.expires) {
      return memoryEntry.data;
    }

    // Clean expired memory entries
    if (memoryEntry) {
      this.memoryCache.delete(key);
    }

    return null;
  }

  async set<T>(strategy: CacheStrategy, data: T): Promise<void> {
    const { key, ttl, tags = [] } = strategy;

    // Store in Redis
    await redisCache.set(key, data, { ttl });

    // Store in memory as backup
    const expires = Date.now() + (ttl * 1000);
    
    // Cleanup memory cache if it's getting too large
    if (this.memoryCache.size >= this.MEMORY_LIMIT) {
      this.cleanupMemoryCache();
    }

    this.memoryCache.set(key, { data, expires, tags });
  }

  async invalidate(keyPattern: string): Promise<void> {
    // Invalidate in Redis
    await redisCache.invalidatePattern(keyPattern);

    // Invalidate in memory cache
    const keysToDelete: string[] = [];
    for (const [key] of this.memoryCache) {
      if (this.matchesPattern(key, keyPattern)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.memoryCache.delete(key));
  }

  async invalidateByTags(tags: string[]): Promise<void> {
    // Memory cache tag invalidation
    const keysToDelete: string[] = [];
    for (const [key, entry] of this.memoryCache) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.memoryCache.delete(key));

    // Redis tag invalidation (simplified - would need more sophisticated tagging system)
    for (const tag of tags) {
      await redisCache.invalidatePattern(`*:${tag}:*`);
    }
  }

  // Helper methods
  private matchesPattern(key: string, pattern: string): boolean {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(key);
  }

  private cleanupMemoryCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    const entries = Array.from(this.memoryCache.entries());

    // Remove expired entries first
    for (const [key, entry] of entries) {
      if (now >= entry.expires) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.memoryCache.delete(key));

    // If still too large after cleanup, use LRU eviction (remove 10% instead of 25%)
    if (this.memoryCache.size >= this.MEMORY_LIMIT) {
      const remainingEntries = Array.from(this.memoryCache.entries());
      // Sort by access time (entries accessed recently stay)
      remainingEntries.sort((a, b) => a[1].expires - b[1].expires);
      
      const toRemove = remainingEntries.slice(0, Math.max(1, Math.floor(this.MEMORY_LIMIT * 0.1))); // Remove 10%
      toRemove.forEach(([key]) => this.memoryCache.delete(key));
    }
  }

  // Convenience methods for common cache patterns
  async cacheAPIResponse<T>(
    endpoint: string, 
    userId: string | null, 
    fetcher: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    const key = userId ? `api:${endpoint}:user:${userId}` : `api:${endpoint}:global`;
    const strategy: CacheStrategy = { 
      key, 
      ttl, 
      tags: ['api', endpoint, userId || 'global'] 
    };

    let cached = await this.get<T>(strategy);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetcher();
    await this.set(strategy, fresh);
    return fresh;
  }

  async cacheDashboardStats(userId: string, fetcher: () => Promise<any>): Promise<any> {
    return this.cacheAPIResponse('dashboard-stats', userId, fetcher, 300); // 5 minutes
  }

  async cacheRecentActivity(userId: string, fetcher: () => Promise<any>): Promise<any> {
    return this.cacheAPIResponse('recent-activity', userId, fetcher, 180); // 3 minutes
  }

  async cacheMasterData(type: string, fetcher: () => Promise<any>): Promise<any> {
    return this.cacheAPIResponse(`master-data-${type}`, null, fetcher, 1800); // 30 minutes
  }
}

export const serverCache = new ServerCache();