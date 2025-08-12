// Navigation performance optimization cache
'use client';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class NavigationCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Preload critical route data
  async preloadRoute(route: string): Promise<void> {
    try {
      if (route.startsWith('/dashboard')) {
        await Promise.all([
          this.prefetchAPI('/api/dashboard/stats', 'dashboard-stats'),
          this.prefetchAPI('/api/dashboard/recent-activity', 'dashboard-activity')
        ]);
      } else if (route.startsWith('/media')) {
        await this.prefetchAPI('/api/master-data/agents', 'master-agents');
      } else if (route.startsWith('/sales')) {
        await this.prefetchAPI('/api/master-data/agents', 'master-agents');
      }
    } catch (error) {
      console.warn('Route preload failed:', error);
    }
  }

  private async prefetchAPI(url: string, cacheKey: string): Promise<void> {
    if (this.get(cacheKey)) return; // Already cached
    
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        this.set(cacheKey, data, this.DEFAULT_TTL);
      }
    } catch (error) {
      console.warn(`Failed to prefetch ${url}:`, error);
    }
  }
}

export const navigationCache = new NavigationCache();