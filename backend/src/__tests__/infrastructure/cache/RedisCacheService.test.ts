/**
 * RedisCacheService Unit Tests
 */

import { RedisCacheService } from '@infrastructure/cache/RedisCacheService';
import { IConfigService } from '@domain/interfaces/IConfigService';

describe('RedisCacheService', () => {
  let cacheService: RedisCacheService;
  let mockConfigService: jest.Mocked<IConfigService>;

  beforeEach(() => {
    // Mock ConfigService
    mockConfigService = {
      get: jest.fn(),
      getNumber: jest.fn(),
      getPort: jest.fn(),
      getNodeEnv: jest.fn(),
      isProduction: jest.fn(),
      isDevelopment: jest.fn(),
      getDatabaseConfig: jest.fn(),
      getUpstashConfig: jest.fn(),
      getYouTubeConfig: jest.fn(),
      getRapidApiConfig: jest.fn(),
      getFrontendUrl: jest.fn(),
      getRateLimitConfig: jest.fn(),
      getCacheTtl: jest.fn(),
      validateRequiredConfig: jest.fn(),
    };

    // Mock Upstash configuration
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'UPSTASH_REDIS_REST_URL') return 'http://localhost:8079';
      if (key === 'UPSTASH_REDIS_REST_TOKEN') return 'test-token';
      return undefined;
    });

    mockConfigService.getNumber.mockReturnValue(100);

    cacheService = new RedisCacheService(mockConfigService);
  });

  describe('isEnabled', () => {
    it('should return true when Redis is properly configured', () => {
      expect(cacheService.isEnabled()).toBe(true);
    });

    it('should return false when Redis is not configured', () => {
      mockConfigService.get.mockReturnValue(undefined);
      const service = new RedisCacheService(mockConfigService);
      expect(service.isEnabled()).toBe(false);
    });
  });

  describe('getVideoKey', () => {
    it('should generate correct cache key for video', () => {
      const key = cacheService.getVideoKey('youtube', 'abc123');
      expect(key).toBe('video:youtube:abc123');
    });

    it('should lowercase platform name', () => {
      const key = cacheService.getVideoKey('YOUTUBE', 'abc123');
      expect(key).toBe('video:youtube:abc123');
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      const stats = await cacheService.getStats();
      expect(stats).toHaveProperty('enabled');
      expect(stats).toHaveProperty('connected');
      expect(stats.enabled).toBe(true);
    });
  });

  describe('incrementRateLimit', () => {
    it('should return rate limit result when cache is disabled', async () => {
      mockConfigService.get.mockReturnValue(undefined);
      const service = new RedisCacheService(mockConfigService);

      const result = await service.incrementRateLimit('test-ip');
      expect(result.count).toBe(0);
      expect(result.remaining).toBe(Infinity);
    });
  });
});
