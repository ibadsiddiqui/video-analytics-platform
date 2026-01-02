/**
 * AuthController Unit Tests
 */

import { Request, Response } from 'express';
import { Webhook } from 'svix';
import { PrismaClient, UserTier } from '@prisma/client';
import { AuthController } from '@presentation/controllers/AuthController';
import { AuthRequest } from '@presentation/middleware/AuthMiddleware';

// Mock dependencies
jest.mock('svix');
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    user: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
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

describe('AuthController', () => {
  let controller: AuthController;
  let mockPrisma: any;
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original env
    originalEnv = process.env;

    // Set environment variable
    process.env.CLERK_WEBHOOK_SECRET = 'whsec_test_secret';

    // Reset mocks
    jest.clearAllMocks();

    // Create controller
    controller = new AuthController();

    // Get Prisma mock instance
    mockPrisma = new PrismaClient();

    // Setup mock response
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('handleWebhook', () => {
    const mockWebhookHeaders = {
      'svix-id': 'msg_test_id',
      'svix-timestamp': '1234567890',
      'svix-signature': 'v1,test_signature',
    };

    const mockUserData = {
      id: 'user_123',
      email_addresses: [{ email_address: 'test@example.com' }],
      first_name: 'John',
      last_name: 'Doe',
      image_url: 'https://example.com/image.jpg',
    };

    beforeEach(() => {
      mockReq = {
        headers: mockWebhookHeaders,
        body: {},
      };
    });

    it('should return 500 if CLERK_WEBHOOK_SECRET is not set', async () => {
      delete process.env.CLERK_WEBHOOK_SECRET;

      await controller.handleWebhook(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Server configuration error',
      });
    });

    it('should return 400 if svix headers are missing', async () => {
      mockReq.headers = {};

      await controller.handleWebhook(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing svix headers',
      });
    });

    it('should return 400 if webhook verification fails', async () => {
      (Webhook as jest.Mock).mockImplementation(() => ({
        verify: jest.fn().mockImplementation(() => {
          throw new Error('Invalid signature');
        }),
      }));

      await controller.handleWebhook(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid webhook signature',
      });
    });

    describe('user.created event', () => {
      beforeEach(() => {
        (Webhook as jest.Mock).mockImplementation(() => ({
          verify: jest.fn().mockReturnValue({
            type: 'user.created',
            data: mockUserData,
          }),
        }));
      });

      it('should create user in database', async () => {
        mockPrisma.user.create.mockResolvedValue({
          id: 'db_user_id',
          clerkId: mockUserData.id,
          email: mockUserData.email_addresses?.[0]?.email_address,
        });

        await controller.handleWebhook(
          mockReq as Request,
          mockRes as Response
        );

        expect(mockPrisma.user.create).toHaveBeenCalledWith({
          data: {
            clerkId: 'user_123',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            imageUrl: 'https://example.com/image.jpg',
          },
        });

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({ success: true });
      });

      it('should handle user creation with missing optional fields', async () => {
        const minimalUserData = {
          id: 'user_123',
          email_addresses: [{ email_address: 'test@example.com' }],
        };

        (Webhook as jest.Mock).mockImplementation(() => ({
          verify: jest.fn().mockReturnValue({
            type: 'user.created',
            data: minimalUserData,
          }),
        }));

        await controller.handleWebhook(mockReq as Request, mockRes as Response);

        expect(mockPrisma.user.create).toHaveBeenCalledWith({
          data: {
            clerkId: 'user_123',
            email: 'test@example.com',
            firstName: undefined,
            lastName: undefined,
            imageUrl: undefined,
          },
        });

        expect(mockRes.status).toHaveBeenCalledWith(200);
      });
    });

    describe('user.updated event', () => {
      beforeEach(() => {
        (Webhook as jest.Mock).mockImplementation(() => ({
          verify: jest.fn().mockReturnValue({
            type: 'user.updated',
            data: mockUserData,
          }),
        }));
      });

      it('should update user in database', async () => {
        mockPrisma.user.update.mockResolvedValue({
          id: 'db_user_id',
          clerkId: mockUserData.id,
        });

        await controller.handleWebhook(
          mockReq as Request,
          mockRes as Response
        );

        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { clerkId: 'user_123' },
          data: {
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            imageUrl: 'https://example.com/image.jpg',
          },
        });

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({ success: true });
      });
    });

    describe('user.deleted event', () => {
      beforeEach(() => {
        (Webhook as jest.Mock).mockImplementation(() => ({
          verify: jest.fn().mockReturnValue({
            type: 'user.deleted',
            data: { id: 'user_123' },
          }),
        }));
      });

      it('should delete user from database', async () => {
        mockPrisma.user.delete.mockResolvedValue({
          id: 'db_user_id',
          clerkId: 'user_123',
        });

        await controller.handleWebhook(
          mockReq as Request,
          mockRes as Response
        );

        expect(mockPrisma.user.delete).toHaveBeenCalledWith({
          where: { clerkId: 'user_123' },
        });

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({ success: true });
      });
    });

    it('should handle unhandled webhook events', async () => {
      (Webhook as jest.Mock).mockImplementation(() => ({
        verify: jest.fn().mockReturnValue({
          type: 'user.unknown_event',
          data: mockUserData,
        }),
      }));

      await controller.handleWebhook(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockPrisma.user.delete).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });

    it('should return 500 if database operation fails', async () => {
      (Webhook as jest.Mock).mockImplementation(() => ({
        verify: jest.fn().mockReturnValue({
          type: 'user.created',
          data: mockUserData,
        }),
      }));

      mockPrisma.user.create.mockRejectedValue(new Error('Database error'));

      await controller.handleWebhook(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      });
    });
  });

  describe('getCurrentUser', () => {
    beforeEach(() => {
      mockReq = {
        auth: { userId: 'user_123' },
      };
    });

    it('should throw error if userId is missing', async () => {
      mockReq.auth = undefined;

      await expect(
        controller.getCurrentUser(mockReq as AuthRequest)
      ).rejects.toThrow('Unauthorized');
    });

    it('should throw error if user not found in database', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        controller.getCurrentUser(mockReq as AuthRequest)
      ).rejects.toThrow('User not found');
    });

    it('should return user profile with rate limit info for FREE tier', async () => {
      const mockUser = {
        id: 'db_user_id',
        clerkId: 'user_123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        imageUrl: 'https://example.com/image.jpg',
        tier: UserTier.FREE,
        dailyRequests: 3,
        lastRequestDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await controller.getCurrentUser(mockReq as AuthRequest);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { clerkId: 'user_123' },
        select: {
          id: true,
          clerkId: true,
          email: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
          tier: true,
          dailyRequests: true,
          lastRequestDate: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      expect(result).toEqual({
        user: mockUser,
        rateLimit: {
          limit: 5,
          remaining: 2,
          tier: UserTier.FREE,
        },
      });
    });

    it('should return user profile with rate limit info for CREATOR tier', async () => {
      const mockUser = {
        id: 'db_user_id',
        clerkId: 'user_123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        imageUrl: 'https://example.com/image.jpg',
        tier: UserTier.CREATOR,
        dailyRequests: 50,
        lastRequestDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await controller.getCurrentUser(mockReq as AuthRequest);

      expect(result.rateLimit).toEqual({
        limit: 100,
        remaining: 50,
        tier: UserTier.CREATOR,
      });
    });

    it('should return user profile with rate limit info for PRO tier', async () => {
      const mockUser = {
        id: 'db_user_id',
        clerkId: 'user_123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        imageUrl: 'https://example.com/image.jpg',
        tier: UserTier.PRO,
        dailyRequests: 250,
        lastRequestDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await controller.getCurrentUser(mockReq as AuthRequest);

      expect(result.rateLimit).toEqual({
        limit: 500,
        remaining: 250,
        tier: UserTier.PRO,
      });
    });

    it('should return user profile with rate limit info for AGENCY tier', async () => {
      const mockUser = {
        id: 'db_user_id',
        clerkId: 'user_123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        imageUrl: 'https://example.com/image.jpg',
        tier: UserTier.AGENCY,
        dailyRequests: 1000,
        lastRequestDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await controller.getCurrentUser(mockReq as AuthRequest);

      expect(result.rateLimit).toEqual({
        limit: 2000,
        remaining: 1000,
        tier: UserTier.AGENCY,
      });
    });

    it('should reset remaining requests if new day', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const mockUser = {
        id: 'db_user_id',
        clerkId: 'user_123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        imageUrl: 'https://example.com/image.jpg',
        tier: UserTier.FREE,
        dailyRequests: 5,
        lastRequestDate: yesterday,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await controller.getCurrentUser(mockReq as AuthRequest);

      expect(result.rateLimit).toEqual({
        limit: 5,
        remaining: 5,
        tier: UserTier.FREE,
      });
    });

    it('should handle user with no lastRequestDate', async () => {
      const mockUser = {
        id: 'db_user_id',
        clerkId: 'user_123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        imageUrl: 'https://example.com/image.jpg',
        tier: UserTier.FREE,
        dailyRequests: 0,
        lastRequestDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await controller.getCurrentUser(mockReq as AuthRequest);

      expect(result.rateLimit).toEqual({
        limit: 5,
        remaining: 5,
        tier: UserTier.FREE,
      });
    });

    it('should use default limit if tier is unknown', async () => {
      const mockUser = {
        id: 'db_user_id',
        clerkId: 'user_123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        imageUrl: 'https://example.com/image.jpg',
        tier: 'UNKNOWN_TIER' as any,
        dailyRequests: 0,
        lastRequestDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await controller.getCurrentUser(mockReq as AuthRequest);

      expect(result.rateLimit.limit).toBe(5);
    });

    it('should rethrow errors from database', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        controller.getCurrentUser(mockReq as AuthRequest)
      ).rejects.toThrow('Database connection failed');
    });
  });
});
