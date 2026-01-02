/**
 * ApiKeyResolverService - Resolves API keys for external service calls
 *
 * Determines which API key to use:
 * 1. User's custom API key (if authenticated and has active key for platform)
 * 2. System API key from environment variables (fallback)
 *
 * Priority: User key > System key
 */

import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '@infrastructure/encryption';
import { ConfigService } from '@shared/config';

const prisma = new PrismaClient();

@Service()
export class ApiKeyResolverService {
  constructor(
    private readonly encryptionService: EncryptionService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Get API key for a platform, prioritizing user's key over system key
   *
   * @param userId - User's ID (null for anonymous users)
   * @param platform - Platform type ('YOUTUBE' | 'INSTAGRAM')
   * @returns API key string or null if not available
   */
  async getApiKey(userId: string | null, platform: 'YOUTUBE' | 'INSTAGRAM'): Promise<string | null> {
    // Try to get user's API key first if authenticated
    if (userId) {
      const userKey = await this.getUserApiKey(userId, platform);
      if (userKey) {
        return userKey;
      }
    }

    // Fallback to system API key
    return this.getSystemApiKey(platform);
  }

  /**
   * Check if user has an active API key for the platform
   *
   * @param userId - User's ID
   * @param platform - Platform type
   * @returns True if user has active key, false otherwise
   */
  async hasUserKey(userId: string, platform: string): Promise<boolean> {
    try {
      // First get user by clerkId
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
      });

      if (!user) {
        return false;
      }

      const apiKey = await prisma.userApiKey.findFirst({
        where: {
          userId: user.id,
          platform,
          isActive: true,
        },
      });

      return !!apiKey;
    } catch (error) {
      console.error('Error checking user API key:', error);
      return false;
    }
  }

  /**
   * Get and decrypt user's API key
   *
   * @param userId - User's clerk ID
   * @param platform - Platform type
   * @returns Decrypted API key or null
   */
  private async getUserApiKey(userId: string, platform: string): Promise<string | null> {
    try {
      // First get user by clerkId
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
      });

      if (!user) {
        return null;
      }

      // Get the most recent active API key for this platform
      const apiKey = await prisma.userApiKey.findFirst({
        where: {
          userId: user.id,
          platform,
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!apiKey) {
        return null;
      }

      // Decrypt the API key
      const decryptedKey = this.encryptionService.decrypt({
        encryptedKey: apiKey.encryptedKey,
        iv: apiKey.iv,
        authTag: apiKey.authTag,
        salt: apiKey.salt,
      });

      // Update lastUsedAt timestamp
      await prisma.userApiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      });

      return decryptedKey;
    } catch (error) {
      console.error(`Error getting user API key for ${platform}:`, error);
      return null;
    }
  }

  /**
   * Get system API key from environment
   *
   * @param platform - Platform type
   * @returns System API key or null
   */
  private getSystemApiKey(platform: 'YOUTUBE' | 'INSTAGRAM'): string | null {
    switch (platform) {
      case 'YOUTUBE':
        return this.configService.get('YOUTUBE_API_KEY') || null;
      case 'INSTAGRAM':
        return this.configService.get('RAPIDAPI_KEY') || null;
      default:
        return null;
    }
  }

  /**
   * Get key source information (for debugging/logging)
   *
   * @param userId - User's ID
   * @param platform - Platform type
   * @returns Object with key source info
   */
  async getKeySource(
    userId: string | null,
    platform: 'YOUTUBE' | 'INSTAGRAM'
  ): Promise<{ source: 'user' | 'system' | 'none'; hasUserKey: boolean; hasSystemKey: boolean }> {
    const hasUserKey = userId ? await this.hasUserKey(userId, platform) : false;
    const hasSystemKey = !!this.getSystemApiKey(platform);

    let source: 'user' | 'system' | 'none' = 'none';
    if (hasUserKey) {
      source = 'user';
    } else if (hasSystemKey) {
      source = 'system';
    }

    return {
      source,
      hasUserKey,
      hasSystemKey,
    };
  }
}
