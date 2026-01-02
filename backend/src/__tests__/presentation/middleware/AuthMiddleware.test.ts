/**
 * AuthMiddleware Unit Tests
 */

import { Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';
import { PrismaClient, UserTier } from '@prisma/client';
import {
  requireAuth,
  withAuth,
  checkRateLimit,
  getUserId,
  isAuthenticated,
  AuthRequest,
} from '@presentation/middleware/AuthMiddleware';

// Mock dependencies
jest.mock('@clerk/backend', () => ({
  verifyToken: jest.fn(),
}));

jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
    UserTier: {
      FREE: 'FREE',
      CREATOR: 'CREATOR',
      PRO: 'PRO',
      AGENCY: 'AGENCY',
    },
  };
});

describe('AuthMiddleware', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockPrisma: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock request
    mockReq = {
      headers: {},
      auth: undefined,
    };

    // Setup mock response
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Setup mock next
    mockNext = jest.fn();

    // Get Prisma mock instance
    mockPrisma = new PrismaClient();
  });

  describe('requireAuth', () => {
    it('should return 401 if no authorization header is provided', async () => {
      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'No authentication token provided',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header does not start with Bearer', async () => {
      mockReq.headers = { authorization: 'InvalidToken' };

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'No authentication token provided',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if token verification fails', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };
      (verifyToken as jest.Mock).mockRejectedValue(
        new Error('Invalid token')
      );

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Authentication failed',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if payload is invalid', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };
      (verifyToken as jest.Mock).mockResolvedValue(null);

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid authentication token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if payload has no sub', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };
      (verifyToken as jest.Mock).mockResolvedValue({});

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid authentication token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should attach auth info to request and call next on successful verification', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };
      const mockPayload = {
        sub: 'user_123',
        sid: 'session_456',
      };
      (verifyToken as jest.Mock).mockResolvedValue(mockPayload);

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockReq.auth).toEqual({
        userId: 'user_123',
        sessionId: 'session_456',
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle payload without sessionId', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };
      const mockPayload = {
        sub: 'user_123',
      };
      (verifyToken as jest.Mock).mockResolvedValue(mockPayload);

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockReq.auth).toEqual({
        userId: 'user_123',
        sessionId: undefined,
      });
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('withAuth', () => {
    it('should call next without auth if no authorization header', async () => {
      await withAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockReq.auth).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should call next without auth if token verification fails', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };
      (verifyToken as jest.Mock).mockRejectedValue(
        new Error('Invalid token')
      );

      await withAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockReq.auth).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should attach auth info if token is valid', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };
      const mockPayload = {
        sub: 'user_123',
        sid: 'session_456',
      };
      (verifyToken as jest.Mock).mockResolvedValue(mockPayload);

      await withAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockReq.auth).toEqual({
        userId: 'user_123',
        sessionId: 'session_456',
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not attach auth if payload is invalid', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };
      (verifyToken as jest.Mock).mockResolvedValue(null);

      await withAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockReq.auth).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not attach auth if payload has no sub', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };
      (verifyToken as jest.Mock).mockResolvedValue({});

      await withAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockReq.auth).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('getUserId', () => {
    it('should return null if no auth in request', () => {
      const userId = getUserId(mockReq as AuthRequest);
      expect(userId).toBeNull();
    });

    it('should return null if auth has no userId', () => {
      mockReq.auth = {} as any;
      const userId = getUserId(mockReq as AuthRequest);
      expect(userId).toBeNull();
    });

    it('should return userId if present', () => {
      mockReq.auth = { userId: 'user_123' };
      const userId = getUserId(mockReq as AuthRequest);
      expect(userId).toBe('user_123');
    });
  });

  describe('isAuthenticated', () => {
    it('should return false if no auth in request', () => {
      const result = isAuthenticated(mockReq as AuthRequest);
      expect(result).toBe(false);
    });

    it('should return false if auth has no userId', () => {
      mockReq.auth = {} as any;
      const result = isAuthenticated(mockReq as AuthRequest);
      expect(result).toBe(false);
    });

    it('should return true if userId is present', () => {
      mockReq.auth = { userId: 'user_123' };
      const result = isAuthenticated(mockReq as AuthRequest);
      expect(result).toBe(true);
    });
  });

  describe('checkRateLimit', () => {
    it('should set minimal rate limit for unauthenticated users', async () => {
      await checkRateLimit(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockReq.rateLimit).toEqual({ limit: 5, remaining: 5 });
      expect(mockNext).toHaveBeenCalled();
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should set minimal rate limit if user not found in database', async () => {
      mockReq.auth = { userId: 'user_123' };
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await checkRateLimit(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { clerkId: 'user_123' },
      });
      expect(mockReq.rateLimit).toEqual({ limit: 5, remaining: 5 });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should enforce FREE tier rate limit (5 requests/day)', async () => {
      mockReq.auth = { userId: 'user_123' };
      const mockUser = {
        id: 'user_id',
        tier: UserTier.FREE,
        dailyRequests: 3,
        lastRequestDate: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await checkRateLimit(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user_id' },
        data: { dailyRequests: { increment: 1 } },
      });
      expect(mockReq.rateLimit).toEqual({ limit: 5, remaining: 1 });
      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should enforce CREATOR tier rate limit (100 requests/day)', async () => {
      mockReq.auth = { userId: 'user_123' };
      const mockUser = {
        id: 'user_id',
        tier: UserTier.CREATOR,
        dailyRequests: 50,
        lastRequestDate: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await checkRateLimit(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockReq.rateLimit).toEqual({ limit: 100, remaining: 49 });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should enforce PRO tier rate limit (500 requests/day)', async () => {
      mockReq.auth = { userId: 'user_123' };
      const mockUser = {
        id: 'user_id',
        tier: UserTier.PRO,
        dailyRequests: 250,
        lastRequestDate: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await checkRateLimit(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockReq.rateLimit).toEqual({ limit: 500, remaining: 249 });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should enforce AGENCY tier rate limit (2000 requests/day)', async () => {
      mockReq.auth = { userId: 'user_123' };
      const mockUser = {
        id: 'user_id',
        tier: UserTier.AGENCY,
        dailyRequests: 1000,
        lastRequestDate: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await checkRateLimit(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockReq.rateLimit).toEqual({ limit: 2000, remaining: 999 });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 429 if rate limit exceeded', async () => {
      mockReq.auth = { userId: 'user_123' };
      const mockUser = {
        id: 'user_id',
        tier: UserTier.FREE,
        dailyRequests: 5,
        lastRequestDate: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await checkRateLimit(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Rate limit exceeded',
        message: 'Daily request limit exceeded',
        limit: 5,
        tier: UserTier.FREE,
        upgrade: 'Upgrade to Creator for 100 requests/day',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should not suggest upgrade for non-FREE tiers', async () => {
      mockReq.auth = { userId: 'user_123' };
      const mockUser = {
        id: 'user_id',
        tier: UserTier.CREATOR,
        dailyRequests: 100,
        lastRequestDate: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await checkRateLimit(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Rate limit exceeded',
        message: 'Daily request limit exceeded',
        limit: 100,
        tier: UserTier.CREATOR,
        upgrade: null,
      });
    });

    it('should reset daily counter if new day', async () => {
      mockReq.auth = { userId: 'user_123' };
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const mockUser = {
        id: 'user_id',
        tier: UserTier.FREE,
        dailyRequests: 5,
        lastRequestDate: yesterday,
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, dailyRequests: 0 });

      await checkRateLimit(mockReq as AuthRequest, mockRes as Response, mockNext);

      // First update to reset counter
      expect(mockPrisma.user.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'user_id' },
        data: { dailyRequests: 0, lastRequestDate: expect.any(Date) },
      });

      // Second update to increment counter
      expect(mockPrisma.user.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'user_id' },
        data: { dailyRequests: { increment: 1 } },
      });

      expect(mockReq.rateLimit).toEqual({ limit: 5, remaining: 4 });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle errors gracefully and allow request', async () => {
      mockReq.auth = { userId: 'user_123' };
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      await checkRateLimit(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});
