/**
 * Redis Cache Service Implementation
 * Implements ICacheService using Upstash Redis
 */

import { Service } from 'typedi';
import { Redis } from '@upstash/redis';
import { ICacheService } from '@domain/interfaces/ICacheService';
import { ConfigService } from '@shared/config';

interface RateLimitResult {
  count: number;
  remaining: number;
}

interface AnalyticsSnapshot {
  timestamp: string;
  views: number;
  likes: number;
  comments: number;
  [key: string]: any;
}

@Service()
export class RedisCacheService implements ICacheService {
  private redis: Redis | null = null;
  private enabled: boolean = false;
  private readonly DEFAULT_TTL = 3600; // 1 hour in seconds

  constructor(private readonly configService: ConfigService) {
    this.initialize();
  }

  /**
   * Initialize Redis connection
   */
  private initialize(): void {
    try {
      const upstashUrl = this.configService.get('UPSTASH_REDIS_REST_URL');
      const upstashToken = this.configService.get('UPSTASH_REDIS_REST_TOKEN');

      if (upstashUrl && upstashToken) {
        this.redis = new Redis({
          url: upstashUrl,
          token: upstashToken,
        });
        this.enabled = true;
        console.log('✅ Redis cache connected (Upstash)');
      } else {
        console.warn('⚠️  Redis not configured - caching disabled');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Redis connection error:', errorMessage);
      this.enabled = false;
    }
  }

  /**
   * Check if cache service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Generate cache key for video analytics
   */
  getVideoKey(platform: string, videoId: string): string {
    return `video:${platform.toLowerCase()}:${videoId}`;
  }

  /**
   * Retrieve cached data by key
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.redis) return null;

    try {
      const data = await this.redis.get(key);

      if (data) {
        console.log(`🎯 Cache HIT: ${key}`);

        // Upstash Redis automatically deserializes JSON
        // But handle both cases
        if (typeof data === 'string') {
          return JSON.parse(data) as T;
        }
        return data as T;
      }

      console.log(`❌ Cache MISS: ${key}`);
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Cache get error:', errorMessage);
      return null;
    }
  }

  /**
   * Store data in cache with TTL
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<boolean> {
    if (!this.enabled || !this.redis) return false;

    try {
      const timeToLive = ttl || this.DEFAULT_TTL;
      const serialized = JSON.stringify(data);

      await this.redis.setex(key, timeToLive, serialized);
      console.log(`💾 Cached: ${key} (TTL: ${timeToLive}s)`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Cache set error:', errorMessage);
      return false;
    }
  }

  /**
   * Delete cached data
   */
  async delete(key: string): Promise<boolean> {
    if (!this.enabled || !this.redis) return false;

    try {
      await this.redis.del(key);
      console.log(`🗑️  Cache deleted: ${key}`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Cache delete error:', errorMessage);
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.enabled || !this.redis) return 0;

    try {
      // Note: Upstash Redis doesn't support SCAN command directly
      // This is a simplified version for common patterns
      console.log(`🗑️  Attempting to delete pattern: ${pattern}`);
      // Would need to implement pattern matching logic or use different approach
      return 0;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Cache delete pattern error:', errorMessage);
      return 0;
    }
  }

  /**
   * Increment rate limit counter
   */
  async incrementRateLimit(
    identifier: string,
    windowSeconds: number = 900
  ): Promise<RateLimitResult> {
    if (!this.enabled || !this.redis) {
      return { count: 0, remaining: Infinity };
    }

    const key = `ratelimit:${identifier}`;
    const maxRequests = this.configService.getNumber('RATE_LIMIT_MAX_REQUESTS', 100);

    try {
      const count = await this.redis.incr(key);

      // Set expiry on first request
      if (count === 1) {
        await this.redis.expire(key, windowSeconds);
      }

      return {
        count,
        remaining: Math.max(0, maxRequests - count),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Rate limit error:', errorMessage);
      return { count: 0, remaining: Infinity };
    }
  }

  /**
   * Get analytics history for a video
   */
  async getAnalyticsHistory(videoId: string, days: number = 7): Promise<AnalyticsSnapshot[]> {
    if (!this.enabled || !this.redis) return [];

    const key = `history:${videoId}`;

    try {
      const data = await this.redis.lrange(key, 0, days - 1);

      if (!data || data.length === 0) return [];

      return data.map((item) => {
        if (typeof item === 'string') {
          return JSON.parse(item) as AnalyticsSnapshot;
        }
        return item as AnalyticsSnapshot;
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Get history error:', errorMessage);
      return [];
    }
  }

  /**
   * Add analytics snapshot to history
   */
  async addToHistory(videoId: string, snapshot: AnalyticsSnapshot): Promise<boolean> {
    if (!this.enabled || !this.redis) return false;

    const key = `history:${videoId}`;

    try {
      await this.redis.lpush(key, JSON.stringify(snapshot));
      await this.redis.ltrim(key, 0, 29); // Keep last 30 snapshots
      await this.redis.expire(key, 86400 * 30); // 30 days TTL
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Add history error:', errorMessage);
      return false;
    }
  }

  /**
   * Clear all cache (use with caution!)
   */
  async clearAll(): Promise<boolean> {
    if (!this.enabled || !this.redis) return false;

    try {
      await this.redis.flushdb();
      console.log('🗑️  All cache cleared');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Clear all cache error:', errorMessage);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    enabled: boolean;
    connected: boolean;
  }> {
    return {
      enabled: this.enabled,
      connected: this.redis !== null,
    };
  }
}
