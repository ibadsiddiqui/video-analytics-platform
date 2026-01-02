/**
 * Unit Tests for AnonymousRateLimitMiddleware
 * Tests IP-based, fingerprint-based, and hybrid tracking
 * Verifies rate limit enforcement and daily reset logic
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '@presentation/middleware/AuthMiddleware';

// Mock Redis cache service
const mockRedisCacheService = {
  isEnabled: jest.fn(),
  incrementAnonymousRequests: jest.fn(),
  getAnonymousRequestCount: jest.fn(),
};

// Mock typedi Container before imports
jest.mock('typedi', () => ({
  Container: {
    get: jest.fn(() => mockRedisCacheService),
  },
  Service: () => (target: any) => target,
}));

// Import after mocking
import { anonymousRateLimit } from '@presentation/middleware/AnonymousRateLimitMiddleware';

describe('AnonymousRateLimitMiddleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  let setHeaderMock: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup response mocks
    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn();
    setHeaderMock = jest.fn();

    mockResponse = {
      status: statusMock,
      json: jsonMock,
      setHeader: setHeaderMock,
    };

    nextFunction = jest.fn();

    // Default: Redis enabled
    mockRedisCacheService.isEnabled.mockReturnValue(true);
  });

  describe('Authenticated User Bypass', () => {
    it('should skip rate limiting for authenticated users', async () => {
      mockRequest = {
        auth: {
          userId: 'user_123',
          sessionId: 'session_123',
        },
        ip: '192.168.1.1',
        headers: {},
      };

      await anonymousRateLimit(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockRedisCacheService.incrementAnonymousRequests).not.toHaveBeenCalled();
      expect(setHeaderMock).not.toHaveBeenCalled();
    });
  });

  describe('Redis Disabled Handling', () => {
    it('should allow request and log warning when Redis is disabled', async () => {
      mockRedisCacheService.isEnabled.mockReturnValue(false);

      mockRequest = {
        ip: '192.168.1.1',
        headers: {},
      };

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      await anonymousRateLimit(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️  Redis not available - anonymous rate limiting disabled'
      );
      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockRedisCacheService.incrementAnonymousRequests).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('IP-based Tracking', () => {
    it('should track requests by IP address when no fingerprint provided', async () => {
      mockRequest = {
        ip: '192.168.1.1',
        headers: {},
      };

      mockRedisCacheService.incrementAnonymousRequests.mockResolvedValue({
        count: 1,
        remaining: 4,
      });

      await anonymousRateLimit(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRedisCacheService.incrementAnonymousRequests).toHaveBeenCalledWith(
        expect.any(String), // identifier (hashed IP)
        expect.any(String), // date string (YYYY-MM-DD)
        5 // limit
      );
      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should handle X-Forwarded-For header for proxy scenarios', async () => {
      mockRequest = {
        ip: '127.0.0.1',
        headers: {
          'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
        },
      };

      mockRedisCacheService.incrementAnonymousRequests.mockResolvedValue({
        count: 2,
        remaining: 3,
      });

      await anonymousRateLimit(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      // Should use first IP from X-Forwarded-For
      expect(mockRedisCacheService.incrementAnonymousRequests).toHaveBeenCalled();
      expect(nextFunction).toHaveBeenCalledTimes(1);
    });

    it('should handle X-Real-IP header (nginx)', async () => {
      mockRequest = {
        ip: '127.0.0.1',
        headers: {
          'x-real-ip': '203.0.113.195',
        },
      };

      mockRedisCacheService.incrementAnonymousRequests.mockResolvedValue({
        count: 1,
        remaining: 4,
      });

      await anonymousRateLimit(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRedisCacheService.incrementAnonymousRequests).toHaveBeenCalled();
      expect(nextFunction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Fingerprint-based Tracking', () => {
    it('should track requests by browser fingerprint when provided', async () => {
      mockRequest = {
        ip: '192.168.1.1',
        headers: {
          'x-fingerprint': 'abc123def456',
        },
      };

      mockRedisCacheService.incrementAnonymousRequests.mockResolvedValue({
        count: 1,
        remaining: 4,
      });

      await anonymousRateLimit(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRedisCacheService.incrementAnonymousRequests).toHaveBeenCalled();
      expect(nextFunction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Hybrid Tracking', () => {
    it('should use combination of IP and fingerprint for better accuracy', async () => {
      const requestWithFingerprint = {
        ip: '192.168.1.1',
        headers: {
          'x-fingerprint': 'unique-fingerprint-123',
        },
      };

      const requestWithoutFingerprint = {
        ip: '192.168.1.1',
        headers: {},
      };

      mockRedisCacheService.incrementAnonymousRequests.mockResolvedValue({
        count: 1,
        remaining: 4,
      });

      // Request with fingerprint
      await anonymousRateLimit(
        requestWithFingerprint as unknown as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      const firstCallArgs = mockRedisCacheService.incrementAnonymousRequests.mock.calls[0];
      const identifierWithFingerprint = firstCallArgs[0];

      jest.clearAllMocks();
      mockRedisCacheService.incrementAnonymousRequests.mockResolvedValue({
        count: 1,
        remaining: 4,
      });

      // Request without fingerprint (same IP)
      await anonymousRateLimit(
        requestWithoutFingerprint as unknown as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      const secondCallArgs = mockRedisCacheService.incrementAnonymousRequests.mock.calls[0];
      const identifierWithoutFingerprint = secondCallArgs[0];

      // Identifiers should be different (hybrid vs IP-only)
      expect(identifierWithFingerprint).not.toBe(identifierWithoutFingerprint);
    });
  });

  describe('Rate Limit Enforcement', () => {
    it('should allow requests within limit', async () => {
      mockRequest = {
        ip: '192.168.1.1',
        headers: {},
      };

      mockRedisCacheService.incrementAnonymousRequests.mockResolvedValue({
        count: 3,
        remaining: 2,
      });

      await anonymousRateLimit(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Limit', '5');
      expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Remaining', '2');
      expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));
      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should allow exactly 5 requests', async () => {
      mockRequest = {
        ip: '192.168.1.1',
        headers: {},
      };

      mockRedisCacheService.incrementAnonymousRequests.mockResolvedValue({
        count: 5,
        remaining: 0,
      });

      await anonymousRateLimit(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Limit', '5');
      expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Remaining', '0');
      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should block 6th request (limit exceeded)', async () => {
      mockRequest = {
        ip: '192.168.1.1',
        headers: {},
      };

      mockRedisCacheService.incrementAnonymousRequests.mockResolvedValue({
        count: 6,
        remaining: 0,
      });

      await anonymousRateLimit(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(429);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Rate limit exceeded',
        message: 'Anonymous users are limited to 5 requests per day. Please sign up for a free account to get more requests.',
        limit: 5,
        remaining: 0,
        resetAt: expect.any(String),
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should block requests beyond the limit', async () => {
      mockRequest = {
        ip: '192.168.1.1',
        headers: {},
      };

      mockRedisCacheService.incrementAnonymousRequests.mockResolvedValue({
        count: 10,
        remaining: 0,
      });

      await anonymousRateLimit(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(429);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('Response Headers', () => {
    it('should set rate limit headers on successful request', async () => {
      mockRequest = {
        ip: '192.168.1.1',
        headers: {},
      };

      mockRedisCacheService.incrementAnonymousRequests.mockResolvedValue({
        count: 2,
        remaining: 3,
      });

      await anonymousRateLimit(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Limit', '5');
      expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Remaining', '3');
      expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Reset', expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/));
    });

    it('should set rate limit headers even when limit exceeded', async () => {
      mockRequest = {
        ip: '192.168.1.1',
        headers: {},
      };

      mockRedisCacheService.incrementAnonymousRequests.mockResolvedValue({
        count: 6,
        remaining: 0,
      });

      await anonymousRateLimit(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Limit', '5');
      expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Remaining', '0');
      expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));
    });
  });

  describe('Daily Reset Logic', () => {
    it('should use current date in Redis key for daily reset', async () => {
      mockRequest = {
        ip: '192.168.1.1',
        headers: {},
      };

      mockRedisCacheService.incrementAnonymousRequests.mockResolvedValue({
        count: 1,
        remaining: 4,
      });

      await anonymousRateLimit(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      const callArgs = mockRedisCacheService.incrementAnonymousRequests.mock.calls[0];
      const dateString = callArgs[1];

      // Verify date string format (YYYY-MM-DD)
      expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should provide midnight timestamp in resetAt field', async () => {
      mockRequest = {
        ip: '192.168.1.1',
        headers: {},
      };

      mockRedisCacheService.incrementAnonymousRequests.mockResolvedValue({
        count: 6,
        remaining: 0,
      });

      await anonymousRateLimit(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      const responseData = jsonMock.mock.calls[0][0];
      const resetAt = new Date(responseData.resetAt);

      // Verify resetAt is a valid date
      expect(resetAt).toBeInstanceOf(Date);
      expect(resetAt.getTime()).toBeGreaterThan(Date.now());

      // Verify it's midnight (hours should be 0 for next day)
      expect(resetAt.getHours()).toBe(0);
      expect(resetAt.getMinutes()).toBe(0);
      expect(resetAt.getSeconds()).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should fail open and allow request on Redis error', async () => {
      mockRequest = {
        ip: '192.168.1.1',
        headers: {},
      };

      mockRedisCacheService.incrementAnonymousRequests.mockRejectedValue(
        new Error('Redis connection failed')
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await anonymousRateLimit(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Anonymous rate limit error:',
        expect.any(Error)
      );
      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(statusMock).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle missing IP address gracefully', async () => {
      mockRequest = {
        ip: undefined,
        headers: {},
      };

      mockRedisCacheService.incrementAnonymousRequests.mockResolvedValue({
        count: 1,
        remaining: 4,
      });

      await anonymousRateLimit(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      // Should use 'unknown' as fallback
      expect(mockRedisCacheService.incrementAnonymousRequests).toHaveBeenCalled();
      expect(nextFunction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Console Logging', () => {
    it('should log rate limit info on successful request', async () => {
      mockRequest = {
        ip: '192.168.1.1',
        headers: {},
      };

      mockRedisCacheService.incrementAnonymousRequests.mockResolvedValue({
        count: 3,
        remaining: 2,
      });

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await anonymousRateLimit(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('🔒 Anonymous user')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('3/5 requests used')
      );

      consoleLogSpy.mockRestore();
    });
  });
});
