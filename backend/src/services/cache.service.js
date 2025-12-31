// Redis Cache Service using Upstash
const { Redis } = require('@upstash/redis');
const config = require('../config');

class CacheService {
  constructor() {
    this.redis = null;
    this.enabled = false;
    this.initialize();
  }

  initialize() {
    try {
      if (config.upstash.url && config.upstash.token) {
        this.redis = new Redis({
          url: config.upstash.url,
          token: config.upstash.token,
        });
        this.enabled = true;
        console.log('✅ Redis cache connected (Upstash)');
      } else {
        console.warn('⚠️  Redis not configured - caching disabled');
      }
    } catch (error) {
      console.error('❌ Redis connection error:', error.message);
    }
  }

  // Generate cache key for video analytics
  getVideoKey(platform, videoId) {
    return `video:${platform}:${videoId}`;
  }

  // Get cached data
  async get(key) {
    if (!this.enabled) return null;
    
    try {
      const data = await this.redis.get(key);
      if (data) {
        console.log(`🎯 Cache HIT: ${key}`);
        return typeof data === 'string' ? JSON.parse(data) : data;
      }
      console.log(`❌ Cache MISS: ${key}`);
      return null;
    } catch (error) {
      console.error('Cache get error:', error.message);
      return null;
    }
  }

  // Set cache with TTL
  async set(key, data, ttl = config.cacheTtl) {
    if (!this.enabled) return false;
    
    try {
      const serialized = JSON.stringify(data);
      await this.redis.setex(key, ttl, serialized);
      console.log(`💾 Cached: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      console.error('Cache set error:', error.message);
      return false;
    }
  }

  // Delete cached data
  async delete(key) {
    if (!this.enabled) return false;
    
    try {
      await this.redis.del(key);
      console.log(`🗑️  Cache deleted: ${key}`);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error.message);
      return false;
    }
  }

  // Increment rate limit counter
  async incrementRateLimit(identifier, windowSeconds = 900) {
    if (!this.enabled) return { count: 0, remaining: Infinity };
    
    const key = `ratelimit:${identifier}`;
    
    try {
      const count = await this.redis.incr(key);
      
      // Set expiry on first request
      if (count === 1) {
        await this.redis.expire(key, windowSeconds);
      }
      
      return {
        count,
        remaining: Math.max(0, config.rateLimit.maxRequests - count),
      };
    } catch (error) {
      console.error('Rate limit error:', error.message);
      return { count: 0, remaining: Infinity };
    }
  }

  // Get analytics history from cache
  async getAnalyticsHistory(videoId, days = 7) {
    if (!this.enabled) return [];
    
    const key = `history:${videoId}`;
    
    try {
      const data = await this.redis.lrange(key, 0, days - 1);
      return data.map(item => typeof item === 'string' ? JSON.parse(item) : item);
    } catch (error) {
      console.error('Get history error:', error.message);
      return [];
    }
  }

  // Add analytics snapshot to history
  async addToHistory(videoId, snapshot) {
    if (!this.enabled) return false;
    
    const key = `history:${videoId}`;
    
    try {
      await this.redis.lpush(key, JSON.stringify(snapshot));
      await this.redis.ltrim(key, 0, 29); // Keep last 30 snapshots
      await this.redis.expire(key, 86400 * 30); // 30 days TTL
      return true;
    } catch (error) {
      console.error('Add history error:', error.message);
      return false;
    }
  }
}

module.exports = new CacheService();
