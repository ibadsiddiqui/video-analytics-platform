/**
 * ApiKeyResolverService - Resolves API key IDs to actual keys
 *
 * This service:
 * - Accepts a key ID from the frontend
 * - Validates user ownership of the key
 * - Decrypts and returns the actual API key
 * - Falls back to system key if no user key provided
 * - Only accessible server-side (uses Prisma)
 */

import { prisma } from "./prisma";
import { encryptionService } from "./encryption";
import { configService } from "./config";

export interface ResolvedKey {
  key: string;
  source: "user" | "system";
  keyId?: string;
}

export class ApiKeyResolverService {
  /**
   * Resolve a YouTube API key
   *
   * @param keyId - Optional user key ID
   * @param userId - Current user's ID (from Clerk auth)
   * @returns Resolved API key with source information
   */
  async resolveYoutubeKey(
    keyId: string | null | undefined,
    userId: string | null | undefined,
  ): Promise<ResolvedKey> {
    // If no key ID provided, use system key
    if (!keyId) {
      const systemKey = configService.getYoutubeApiKey();
      if (!systemKey) {
        throw new Error(
          "No YouTube API key available. Please provide your own API key or contact support.",
        );
      }
      return { key: systemKey, source: "system" };
    }

    // If key ID provided, user must be authenticated
    if (!userId) {
      throw new Error(
        "Authentication required to use custom API keys. Please sign in.",
      );
    }

    // Fetch user's key from database
    const userKey = await this.getUserKey(keyId, userId, "YOUTUBE");

    if (!userKey) {
      // Key not found or doesn't belong to user, fallback to system key
      console.warn(
        `Key ID ${keyId} not found for user ${userId}. Falling back to system key.`,
      );
      const systemKey = configService.getYoutubeApiKey();
      if (!systemKey) {
        throw new Error(
          "YouTube API key not found. Please add a valid API key or contact support.",
        );
      }
      return { key: systemKey, source: "system" };
    }

    // Decrypt the user's key
    try {
      const decryptedKey = encryptionService.decrypt({
        encryptedKey: userKey.encryptedKey,
        iv: userKey.iv,
        authTag: userKey.authTag,
        salt: userKey.salt,
      });

      // Update last used timestamp
      await prisma.userApiKey.update({
        where: { id: keyId },
        data: { lastUsedAt: new Date() },
      });

      return { key: decryptedKey, source: "user", keyId };
    } catch (error) {
      console.error(`Failed to decrypt key ${keyId}:`, error);
      throw new Error(
        "Failed to decrypt API key. The key may be corrupted. Please try another key or contact support.",
      );
    }
  }

  /**
   * Resolve an Instagram/RapidAPI key
   *
   * @param keyId - Optional user key ID
   * @param userId - Current user's ID (from Clerk auth)
   * @returns Resolved API key with source information
   */
  async resolveInstagramKey(
    keyId: string | null | undefined,
    userId: string | null | undefined,
  ): Promise<ResolvedKey> {
    // If no key ID provided, use system key
    if (!keyId) {
      const systemKey = configService.getInstagramApiKey();
      if (!systemKey) {
        throw new Error(
          "No Instagram/RapidAPI key available. Please provide your own API key or contact support.",
        );
      }
      return { key: systemKey, source: "system" };
    }

    // If key ID provided, user must be authenticated
    if (!userId) {
      throw new Error(
        "Authentication required to use custom API keys. Please sign in.",
      );
    }

    // Fetch user's key from database
    const userKey = await this.getUserKey(keyId, userId, "INSTAGRAM");

    if (!userKey) {
      // Key not found or doesn't belong to user, fallback to system key
      console.warn(
        `Key ID ${keyId} not found for user ${userId}. Falling back to system key.`,
      );
      const systemKey = configService.getInstagramApiKey();
      if (!systemKey) {
        throw new Error(
          "Instagram API key not found. Please add a valid API key or contact support.",
        );
      }
      return { key: systemKey, source: "system" };
    }

    // Decrypt the user's key
    try {
      const decryptedKey = encryptionService.decrypt({
        encryptedKey: userKey.encryptedKey,
        iv: userKey.iv,
        authTag: userKey.authTag,
        salt: userKey.salt,
      });

      // Update last used timestamp
      await prisma.userApiKey.update({
        where: { id: keyId },
        data: { lastUsedAt: new Date() },
      });

      return { key: decryptedKey, source: "user", keyId };
    } catch (error) {
      console.error(`Failed to decrypt key ${keyId}:`, error);
      throw new Error(
        "Failed to decrypt API key. The key may be corrupted. Please try another key or contact support.",
      );
    }
  }

  /**
   * Helper method to fetch user API key with validation
   *
   * @param keyId - API key ID
   * @param userId - User's ID
   * @param platform - Platform (YOUTUBE or INSTAGRAM)
   * @returns User API key or null if not found/invalid
   */
  private async getUserKey(keyId: string, userId: string, platform: string) {
    try {
      const userKey = await prisma.userApiKey.findFirst({
        where: {
          id: keyId,
          userId: userId,
          platform: platform,
          isActive: true,
        },
      });

      return userKey;
    } catch (error) {
      console.error(`Error fetching user key ${keyId}:`, error);
      return null;
    }
  }

  /**
   * Resolve API key based on platform
   *
   * @param platform - Platform name (youtube, instagram, etc.)
   * @param keyId - Optional user key ID
   * @param userId - Current user's ID
   * @returns Resolved API key
   */
  async resolveKey(
    platform: string,
    keyId: string | null | undefined,
    userId: string | null | undefined,
  ): Promise<ResolvedKey> {
    const normalizedPlatform = platform.toLowerCase();

    switch (normalizedPlatform) {
      case "youtube":
        return this.resolveYoutubeKey(keyId, userId);
      case "instagram":
        return this.resolveInstagramKey(keyId, userId);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }
}

export const apiKeyResolverService = new ApiKeyResolverService();
