/**
 * HealthController Unit Tests
 * Demonstrates testing with dependency injection
 */

import 'reflect-metadata';
import { HealthController } from '../HealthController';
import { IConfigService } from '@domain/interfaces';

describe('HealthController', () => {
  let controller: HealthController;
  let mockConfigService: IConfigService;

  beforeEach(() => {
    // Create mock configuration service
    mockConfigService = {
      getPort: () => 3001,
      getNodeEnv: () => 'test',
      isProduction: () => false,
      isDevelopment: () => false,
      getDatabaseConfig: () => ({ url: 'test-db-url' }),
      getUpstashConfig: () => ({ url: 'test-redis-url', token: 'test-token' }),
      getYouTubeConfig: () => ({ apiKey: 'test-youtube-key' }),
      getRapidApiConfig: () => ({ key: 'test-rapidapi-key' }),
      getFrontendUrl: () => 'http://localhost:3000',
      getRateLimitConfig: () => ({ windowMs: 900000, maxRequests: 100 }),
      getCacheTtl: () => 3600,
      get: (_key: string) => undefined,
      getNumber: (_key: string, defaultValue: number = 0) => defaultValue,
      validateRequiredConfig: () => {},
    };

    // Create controller with mock dependency
    controller = new HealthController(mockConfigService);
  });

  describe('check()', () => {
    it('should return healthy status', async () => {
      const result = await controller.check();

      expect(result.status).toBe('healthy');
      expect(result.version).toBe('2.0.0-typescript');
      expect(result.environment).toBe('test');
    });

    it('should include timestamp', async () => {
      const result = await controller.check();

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });

    it('should check database configuration', async () => {
      const result = await controller.check();

      expect(result.services.database).toBe('✅ Configured');
    });

    it('should check cache configuration', async () => {
      const result = await controller.check();

      expect(result.services.cache).toBe('✅ Configured');
    });

    it('should check YouTube API configuration', async () => {
      const result = await controller.check();

      expect(result.services.youtube).toBe('✅ Configured');
    });

    it('should report missing configuration', async () => {
      // Create mock with missing config
      const incompleteConfig: IConfigService = {
        ...mockConfigService,
        getDatabaseConfig: () => ({ url: '' }),
      };

      const testController = new HealthController(incompleteConfig);
      const result = await testController.check();

      expect(result.services.database).toBe('❌ Not configured');
    });
  });

  describe('Dependency Injection', () => {
    it('should inject ConfigService via constructor', () => {
      expect(controller).toBeDefined();
      expect(controller).toBeInstanceOf(HealthController);
    });

    it('should use injected config service', async () => {
      const result = await controller.check();

      expect(result.environment).toBe('test');
      // This proves the mock config was used
    });
  });
});
