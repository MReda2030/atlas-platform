import { createClient } from 'redis';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  namespace?: string;
}

class RedisCache {
  private client: any = null;
  private isConnected = false;
  private readonly DEFAULT_TTL = 300; // 5 minutes

  async connect() {
    if (this.isConnected) return;

    try {
      // Use environment variable or default to local Redis
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000,
          lazyConnect: true,
          keepAlive: true,
          reconnectStrategy: (retries) => {
            // Exponential backoff with max delay of 5 seconds
            const delay = Math.min(retries * 50, 5000);
            console.log(`Redis reconnecting in ${delay}ms (attempt ${retries})`);
            return delay;
          }
        },
        // Connection pooling settings
        database: 0,
        // Add connection pool settings for better performance
        commandsQueueMaxLength: 100,
        lazyConnect: true
      });

      this.client.on('error', (err: Error) => {
        console.warn('Redis Client Error:', err.message);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis connected successfully');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.warn('Redis connection failed, falling back to memory cache:', error);
      this.isConnected = false;
    }
  }

  async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
    if (!this.isConnected) return;

    try {
      const { ttl = this.DEFAULT_TTL, namespace = 'atlas' } = options;
      const fullKey = `${namespace}:${key}`;
      const serializedValue = JSON.stringify(value);
      
      await this.client.setEx(fullKey, ttl, serializedValue);
    } catch (error) {
      console.warn('Redis set failed:', error);
    }
  }

  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    if (!this.isConnected) return null;

    try {
      const { namespace = 'atlas' } = options;
      const fullKey = `${namespace}:${key}`;
      
      const value = await this.client.get(fullKey);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn('Redis get failed:', error);
      return null;
    }
  }

  async del(key: string, options: CacheOptions = {}): Promise<void> {
    if (!this.isConnected) return;

    try {
      const { namespace = 'atlas' } = options;
      const fullKey = `${namespace}:${key}`;
      
      await this.client.del(fullKey);
    } catch (error) {
      console.warn('Redis delete failed:', error);
    }
  }

  async invalidatePattern(pattern: string, options: CacheOptions = {}): Promise<void> {
    if (!this.isConnected) return;

    try {
      const { namespace = 'atlas' } = options;
      const fullPattern = `${namespace}:${pattern}`;
      
      const keys = await this.client.keys(fullPattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.warn('Redis pattern invalidation failed:', error);
    }
  }

  // Graceful disconnect
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.disconnect();
        this.isConnected = false;
      } catch (error) {
        console.warn('Redis disconnect error:', error);
      }
    }
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    if (!this.isConnected) return false;
    
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
const redisCache = new RedisCache();

// Auto-connect on module load (if Redis is enabled)
if (process.env.ENABLE_REDIS === 'true') {
  redisCache.connect().catch(console.warn);
}

export { redisCache };