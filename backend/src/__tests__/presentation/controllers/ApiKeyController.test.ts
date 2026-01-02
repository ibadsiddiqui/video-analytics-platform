/**
 * ApiKeyController Unit Tests
 */

import { ApiKeyController } from '@presentation/controllers/ApiKeyController';
import { EncryptionService } from '@infrastructure/encryption/EncryptionService';
import { CreateApiKeyRequest, UpdateApiKeyRequest } from '@application/dtos';
import { AuthRequest } from '@presentation/middleware/AuthMiddleware';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
    },
    userApiKey: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  })),
}));

// Mock googleapis
jest.mock('googleapis', () => ({
  google: {
    youtube: jest.fn(),
  },
}));

// Mock axios
jest.mock('axios');

describe('ApiKeyController', () => {
  let controller: ApiKeyController;
  let mockEncryptionService: jest.Mocked<EncryptionService>;
  let mockPrisma: any;

  const mockUser = {
    id: 'user-123',
    clerkId: 'clerk-user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    imageUrl: null,
    tier: 'FREE',
    dailyRequests: 0,
    lastRequestDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockApiKey = {
    id: 'key-123',
    userId: 'user-123',
    platform: 'YOUTUBE',
    encryptedKey: 'encrypted-data',
    iv: 'iv-data',
    authTag: 'auth-tag-data',
    salt: 'salt-data',
    label: 'My YouTube Key',
    isActive: true,
    lastUsedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock encryption service
    mockEncryptionService = {
      encrypt: jest.fn().mockReturnValue({
        encryptedKey: 'encrypted-data',
        iv: 'iv-data',
        authTag: 'auth-tag-data',
        salt: 'salt-data',
      }),
      decrypt: jest.fn().mockReturnValue('AIzaSyDTestKey123456789'),
      maskKey: jest.fn().mockReturnValue('AIza...6789'),
      isValidEncryptedData: jest.fn().mockReturnValue(true),
      testEncryption: jest.fn().mockReturnValue(true),
    } as any;

    // Get the mocked Prisma instance
    mockPrisma = new PrismaClient();

    // Create controller
    controller = new ApiKeyController(mockEncryptionService);
  });

  describe('createApiKey', () => {
    it('should create a new API key successfully', async () => {
      const request: CreateApiKeyRequest = {
        platform: 'YOUTUBE',
        apiKey: 'AIzaSyDTestKey123456789',
        label: 'My YouTube Key',
      };

      const mockReq = {
        auth: { userId: 'clerk-user-123' },
      } as AuthRequest;

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userApiKey.create.mockResolvedValue(mockApiKey);

      const result = await controller.createApiKey(request, mockReq);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { clerkId: 'clerk-user-123' },
      });
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(request.apiKey);
      expect(mockPrisma.userApiKey.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          platform: 'YOUTUBE',
          encryptedKey: 'encrypted-data',
          iv: 'iv-data',
          authTag: 'auth-tag-data',
          salt: 'salt-data',
          label: 'My YouTube Key',
          isActive: true,
        },
      });
      expect(result.id).toBe('key-123');
      expect(result.platform).toBe('YOUTUBE');
      expect(result.maskedKey).toBe('AIza...6789');
    });

    it('should throw error if user ID is missing', async () => {
      const request: CreateApiKeyRequest = {
        platform: 'YOUTUBE',
        apiKey: 'AIzaSyDTestKey123456789',
      };

      const mockReq = {
        auth: undefined,
      } as AuthRequest;

      await expect(controller.createApiKey(request, mockReq)).rejects.toThrow(
        'User ID not found in request'
      );
    });

    it('should throw error if user not found', async () => {
      const request: CreateApiKeyRequest = {
        platform: 'YOUTUBE',
        apiKey: 'AIzaSyDTestKey123456789',
      };

      const mockReq = {
        auth: { userId: 'clerk-user-123' },
      } as AuthRequest;

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(controller.createApiKey(request, mockReq)).rejects.toThrow('User not found');
    });

    it('should throw error for invalid platform', async () => {
      const request: CreateApiKeyRequest = {
        platform: 'INVALID' as any,
        apiKey: 'test-key',
      };

      const mockReq = {
        auth: { userId: 'clerk-user-123' },
      } as AuthRequest;

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(controller.createApiKey(request, mockReq)).rejects.toThrow(
        'Invalid platform. Must be YOUTUBE or INSTAGRAM'
      );
    });
  });

  describe('listApiKeys', () => {
    it('should return all API keys for the user', async () => {
      const mockReq = {
        auth: { userId: 'clerk-user-123' },
      } as AuthRequest;

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userApiKey.findMany.mockResolvedValue([mockApiKey]);

      const result = await controller.listApiKeys(mockReq);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { clerkId: 'clerk-user-123' },
      });
      expect(mockPrisma.userApiKey.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('key-123');
      expect(result[0]?.maskedKey).toBe('AIza...6789');
    });

    it('should return empty array if user not found', async () => {
      const mockReq = {
        auth: { userId: 'clerk-user-123' },
      } as AuthRequest;

      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await controller.listApiKeys(mockReq);

      expect(result).toEqual([]);
    });
  });

  describe('updateApiKey', () => {
    it('should update API key label successfully', async () => {
      const request: UpdateApiKeyRequest = {
        label: 'Updated Label',
      };

      const mockReq = {
        auth: { userId: 'clerk-user-123' },
      } as AuthRequest;

      const updatedKey = { ...mockApiKey, label: 'Updated Label' };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userApiKey.findUnique.mockResolvedValue(mockApiKey);
      mockPrisma.userApiKey.update.mockResolvedValue(updatedKey);

      const result = await controller.updateApiKey('key-123', request, mockReq);

      expect(mockPrisma.userApiKey.update).toHaveBeenCalledWith({
        where: { id: 'key-123' },
        data: expect.objectContaining({
          label: 'Updated Label',
        }),
      });
      expect(result.label).toBe('Updated Label');
    });

    it('should update isActive status successfully', async () => {
      const request: UpdateApiKeyRequest = {
        isActive: false,
      };

      const mockReq = {
        auth: { userId: 'clerk-user-123' },
      } as AuthRequest;

      const updatedKey = { ...mockApiKey, isActive: false };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userApiKey.findUnique.mockResolvedValue(mockApiKey);
      mockPrisma.userApiKey.update.mockResolvedValue(updatedKey);

      const result = await controller.updateApiKey('key-123', request, mockReq);

      expect(result.isActive).toBe(false);
    });

    it('should throw error if API key not found', async () => {
      const request: UpdateApiKeyRequest = {
        label: 'Updated Label',
      };

      const mockReq = {
        auth: { userId: 'clerk-user-123' },
      } as AuthRequest;

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userApiKey.findUnique.mockResolvedValue(null);

      await expect(controller.updateApiKey('key-123', request, mockReq)).rejects.toThrow(
        'API key not found'
      );
    });

    it('should throw error if user does not own the key', async () => {
      const request: UpdateApiKeyRequest = {
        label: 'Updated Label',
      };

      const mockReq = {
        auth: { userId: 'clerk-user-123' },
      } as AuthRequest;

      const otherUserKey = { ...mockApiKey, userId: 'other-user-id' };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userApiKey.findUnique.mockResolvedValue(otherUserKey);

      await expect(controller.updateApiKey('key-123', request, mockReq)).rejects.toThrow(
        'Unauthorized: API key does not belong to user'
      );
    });
  });

  describe('deleteApiKey', () => {
    it('should delete API key successfully', async () => {
      const mockReq = {
        auth: { userId: 'clerk-user-123' },
      } as AuthRequest;

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userApiKey.findUnique.mockResolvedValue(mockApiKey);
      mockPrisma.userApiKey.delete.mockResolvedValue(mockApiKey);

      await controller.deleteApiKey('key-123', mockReq);

      expect(mockPrisma.userApiKey.delete).toHaveBeenCalledWith({
        where: { id: 'key-123' },
      });
    });

    it('should throw error if API key not found', async () => {
      const mockReq = {
        auth: { userId: 'clerk-user-123' },
      } as AuthRequest;

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userApiKey.findUnique.mockResolvedValue(null);

      await expect(controller.deleteApiKey('key-123', mockReq)).rejects.toThrow(
        'API key not found'
      );
    });

    it('should throw error if user does not own the key', async () => {
      const mockReq = {
        auth: { userId: 'clerk-user-123' },
      } as AuthRequest;

      const otherUserKey = { ...mockApiKey, userId: 'other-user-id' };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userApiKey.findUnique.mockResolvedValue(otherUserKey);

      await expect(controller.deleteApiKey('key-123', mockReq)).rejects.toThrow(
        'Unauthorized: API key does not belong to user'
      );
    });
  });

  describe('testApiKey', () => {
    it('should enforce rate limiting (5 tests per hour)', async () => {
      const mockReq = {
        auth: { userId: 'clerk-user-123' },
      } as AuthRequest;

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userApiKey.findUnique.mockResolvedValue(mockApiKey);

      // Make 5 successful calls
      for (let i = 0; i < 5; i++) {
        await controller.testApiKey('key-123', mockReq);
      }

      // 6th call should fail with rate limit error
      await expect(controller.testApiKey('key-123', mockReq)).rejects.toThrow(
        'Rate limit exceeded. Maximum 5 API key tests per hour'
      );
    });

    it('should throw error if user does not own the key', async () => {
      const mockReq = {
        auth: { userId: 'clerk-user-123' },
      } as AuthRequest;

      const otherUserKey = { ...mockApiKey, userId: 'other-user-id' };

      // Need to mock testYouTubeKey/testInstagramKey to avoid actual API calls
      const mockYoutubeResponse = { valid: true, message: 'Valid' };
      jest.spyOn(controller as any, 'testYouTubeKey').mockResolvedValue(mockYoutubeResponse);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userApiKey.findUnique.mockResolvedValue(otherUserKey);

      await expect(controller.testApiKey('key-123', mockReq)).rejects.toThrow(
        'Unauthorized: API key does not belong to user'
      );
    });
  });

  describe('authentication and authorization', () => {
    it('should require authentication for all endpoints', async () => {
      const mockReq = {
        auth: undefined,
      } as AuthRequest;

      const request: CreateApiKeyRequest = {
        platform: 'YOUTUBE',
        apiKey: 'test-key',
      };

      await expect(controller.createApiKey(request, mockReq)).rejects.toThrow(
        'User ID not found in request'
      );
      await expect(controller.listApiKeys(mockReq)).rejects.toThrow(
        'User ID not found in request'
      );
      await expect(controller.updateApiKey('key-123', {}, mockReq)).rejects.toThrow(
        'User ID not found in request'
      );
      await expect(controller.deleteApiKey('key-123', mockReq)).rejects.toThrow(
        'User ID not found in request'
      );
      await expect(controller.testApiKey('key-123', mockReq)).rejects.toThrow(
        'User ID not found in request'
      );
    });

    it('should validate key ownership for update operations', async () => {
      const mockReq = {
        auth: { userId: 'clerk-user-123' },
      } as AuthRequest;

      // Create a user with a different internal ID
      const differentUser = { ...mockUser, id: 'different-internal-id' };
      const otherUserKey = { ...mockApiKey, userId: 'different-user-id' };

      mockPrisma.user.findUnique.mockResolvedValue(differentUser);
      mockPrisma.userApiKey.findUnique.mockResolvedValue(otherUserKey);

      await expect(
        controller.updateApiKey('key-123', { label: 'New Label' }, mockReq)
      ).rejects.toThrow('Unauthorized: API key does not belong to user');
    });
  });

  describe('data masking', () => {
    it('should never return decrypted keys in responses', async () => {
      const mockReq = {
        auth: { userId: 'clerk-user-123' },
      } as AuthRequest;

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userApiKey.findMany.mockResolvedValue([mockApiKey]);

      const result = await controller.listApiKeys(mockReq);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.maskedKey).toBe('AIza...6789');
      expect(mockEncryptionService.maskKey).toHaveBeenCalled();
      expect(mockEncryptionService.decrypt).toHaveBeenCalled();
    });

    it('should mask keys in create response', async () => {
      const request: CreateApiKeyRequest = {
        platform: 'YOUTUBE',
        apiKey: 'AIzaSyDTestKey123456789',
      };

      const mockReq = {
        auth: { userId: 'clerk-user-123' },
      } as AuthRequest;

      // Mock both findUnique calls - reset and set up again
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userApiKey.create.mockResolvedValue(mockApiKey);

      const result = await controller.createApiKey(request, mockReq);

      expect(result.maskedKey).toBe('AIza...6789');
      expect(mockEncryptionService.maskKey).toHaveBeenCalledWith(request.apiKey);
    });
  });
});
