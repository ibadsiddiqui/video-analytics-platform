/**
 * Redis Cache Service using Upstash Redis
 */

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS || '3600');

interface AnalyticsSnapshot {
  timestamp: string;
  views: number;
  likes: number;
  comments: number;
  [key: string]: any;
}

export class RedisCacheService {
  private enabled: boolean = true;
  private readonly DEFAULT_TTL = 3600; // 1 hour in seconds

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
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      if (value) {
        console.log(`🎯 Cache HIT: ${key}`);
        // Upstash Redis automatically deserializes JSON
        if (typeof value === 'string') {
          return JSON.parse(value) as T;
        }
        return value as T;
      }
      console.log(`❌ Cache MISS: ${key}`);
      return null;
    } catch (error) {
      console.error('[Redis] Get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttl: number = CACHE_TTL): Promise<boolean> {
    try {
      const timeToLive = ttl || this.DEFAULT_TTL;
      const serialized = JSON.stringify(value);
      await redis.setex(key, timeToLive, serialized);
      console.log(`💾 Cached: ${key} (TTL: ${timeToLive}s)`);
      return true;
    } catch (error) {
      console.error('[Redis] Set error:', error);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      await redis.del(key);
      console.log(`🗑️  Cache deleted: ${key}`);
      return true;
    } catch (error) {
      console.error('[Redis] Delete error:', error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('[Redis] Exists error:', error);
      return false;
    }
  }

  /**
   * Set value with expiration timestamp
   */
  async setWithExpiry(key: string, value: any, expiryTimestamp: number): Promise<boolean> {
    try {
      await redis.set(key, JSON.stringify(value), { exat: expiryTimestamp });
      return true;
    } catch (error) {
      console.error('[Redis] SetWithExpiry error:', error);
      return false;
    }
  }

  /**
   * Increment counter
   */
  async incr(key: string): Promise<number> {
    try {
      return await redis.incr(key);
    } catch (error) {
      console.error('[Redis] Incr error:', error);
      return 0;
    }
  }

  /**
   * Get analytics history for a video
   */
  async getAnalyticsHistory(videoId: string, days: number = 7): Promise<AnalyticsSnapshot[]> {
    const key = `history:${videoId}`;

    try {
      const data = await redis.lrange(key, 0, days - 1);

      if (!data || data.length === 0) return [];

      return data.map((item) => {
        if (typeof item === 'string') {
          return JSON.parse(item) as AnalyticsSnapshot;
        }
        return item as AnalyticsSnapshot;
      });
    } catch (error) {
      console.error('Get history error:', error);
      return [];
    }
  }

  /**
   * Add analytics snapshot to history
   */
  async addToHistory(videoId: string, snapshot: AnalyticsSnapshot): Promise<boolean> {
    const key = `history:${videoId}`;

    try {
      await redis.lpush(key, JSON.stringify(snapshot));
      await redis.ltrim(key, 0, 29); // Keep last 30 snapshots
      await redis.expire(key, 86400 * 30); // 30 days TTL
      return true;
    } catch (error) {
      console.error('Add history error:', error);
      return false;
    }
  }
}

export const cacheService = new RedisCacheService();
