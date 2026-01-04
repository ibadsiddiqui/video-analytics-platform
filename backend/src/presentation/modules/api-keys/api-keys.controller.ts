/**
 * ApiKeyController - CRUD endpoints for user API key management
 *
 * Allows authenticated users to:
 * - Add new API keys (YouTube, Instagram)
 * - List their API keys
 * - Update API key settings (label, isActive)
 * - Delete API keys
 * - Test API key validity
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '@infrastructure/encryption';
import {
  CreateApiKeyRequest,
  UpdateApiKeyRequest,
  ApiKeyResponse,
  TestApiKeyResponse,
} from '@application/dtos';
import { AuthGuard, AuthRequest } from '@presentation/guards/auth.guard';
import { google } from 'googleapis';
import axios from 'axios';

const prisma = new PrismaClient();

@ApiTags('API Keys')
@Controller('keys')
@UseGuards(AuthGuard)
@ApiSecurity('bearerAuth')
export class ApiKeysController {
  // Rate limit tracking for testing endpoint
  private testRateLimits = new Map<string, { count: number; resetAt: number }>();

  constructor(private readonly encryptionService: EncryptionService) {}

  /**
   * POST /api/keys - Add new API key
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create API Key',
    description: 'Add a new YouTube or Instagram API key for authenticated user',
  })
  @ApiResponse({
    status: 201,
    description: 'API key created successfully',
    type: ApiKeyResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async createApiKey(
    @Body() request: CreateApiKeyRequest,
    @Req() req: AuthRequest
  ): Promise<ApiKeyResponse> {
    const userId = req.auth?.userId;

    if (!userId) {
      throw new Error('User ID not found in request');
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Validate platform
    if (!['YOUTUBE', 'INSTAGRAM'].includes(request.platform)) {
      throw new Error('Invalid platform. Must be YOUTUBE or INSTAGRAM');
    }

    // Encrypt the API key
    const encryptedData = this.encryptionService.encrypt(request.apiKey);

    // Create the API key record
    const apiKey = await prisma.userApiKey.create({
      data: {
        userId: user.id,
        platform: request.platform,
        encryptedKey: encryptedData.encryptedKey,
        iv: encryptedData.iv,
        authTag: encryptedData.authTag,
        salt: encryptedData.salt,
        label: request.label,
        isActive: true,
      },
    });

    // Return masked key info
    const maskedKey = this.encryptionService.maskKey(request.apiKey);

    return new ApiKeyResponse({
      id: apiKey.id,
      platform: apiKey.platform,
      label: apiKey.label,
      maskedKey,
      isActive: apiKey.isActive,
      lastUsedAt: apiKey.lastUsedAt,
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt,
    });
  }

  /**
   * GET /api/keys - List user's API keys
   */
  @Get()
  @ApiOperation({
    summary: 'List API Keys',
    description: 'Get all API keys for authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'API keys retrieved successfully',
    type: [ApiKeyResponse],
  })
  async listApiKeys(@Req() req: AuthRequest): Promise<ApiKeyResponse[]> {
    const userId = req.auth?.userId;

    if (!userId) {
      throw new Error('User ID not found in request');
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return [];
    }

    // Get all API keys for the user
    const apiKeys = await prisma.userApiKey.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    // Map to response DTOs with masked keys
    return apiKeys.map((apiKey) => {
      // Decrypt and mask the key
      const decryptedKey = this.encryptionService.decrypt({
        encryptedKey: apiKey.encryptedKey,
        iv: apiKey.iv,
        authTag: apiKey.authTag,
        salt: apiKey.salt,
      });
      const maskedKey = this.encryptionService.maskKey(decryptedKey);

      return new ApiKeyResponse({
        id: apiKey.id,
        platform: apiKey.platform,
        label: apiKey.label,
        maskedKey,
        isActive: apiKey.isActive,
        lastUsedAt: apiKey.lastUsedAt,
        createdAt: apiKey.createdAt,
        updatedAt: apiKey.updatedAt,
      });
    });
  }

  /**
   * PUT /api/keys/:id - Update API key
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update API Key',
    description: 'Update label or active status of an API key',
  })
  @ApiResponse({
    status: 200,
    description: 'API key updated successfully',
    type: ApiKeyResponse,
  })
  async updateApiKey(
    @Param('id') id: string,
    @Body() request: UpdateApiKeyRequest,
    @Req() req: AuthRequest
  ): Promise<ApiKeyResponse> {
    const userId = req.auth?.userId;

    if (!userId) {
      throw new Error('User ID not found in request');
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get the API key and verify ownership
    const existingKey = await prisma.userApiKey.findUnique({
      where: { id },
    });

    if (!existingKey) {
      throw new Error('API key not found');
    }

    if (existingKey.userId !== user.id) {
      throw new Error('Unauthorized: API key does not belong to user');
    }

    // Update the API key
    const updatedKey = await prisma.userApiKey.update({
      where: { id },
      data: {
        label: request.label !== undefined ? request.label : existingKey.label,
        isActive: request.isActive !== undefined ? request.isActive : existingKey.isActive,
        updatedAt: new Date(),
      },
    });

    // Decrypt and mask the key
    const decryptedKey = this.encryptionService.decrypt({
      encryptedKey: updatedKey.encryptedKey,
      iv: updatedKey.iv,
      authTag: updatedKey.authTag,
      salt: updatedKey.salt,
    });
    const maskedKey = this.encryptionService.maskKey(decryptedKey);

    return new ApiKeyResponse({
      id: updatedKey.id,
      platform: updatedKey.platform,
      label: updatedKey.label,
      maskedKey,
      isActive: updatedKey.isActive,
      lastUsedAt: updatedKey.lastUsedAt,
      createdAt: updatedKey.createdAt,
      updatedAt: updatedKey.updatedAt,
    });
  }

  /**
   * DELETE /api/keys/:id - Delete API key
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete API Key',
    description: 'Permanently delete an API key',
  })
  @ApiResponse({
    status: 204,
    description: 'API key deleted successfully',
  })
  async deleteApiKey(@Param('id') id: string, @Req() req: AuthRequest): Promise<void> {
    const userId = req.auth?.userId;

    if (!userId) {
      throw new Error('User ID not found in request');
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get the API key and verify ownership
    const existingKey = await prisma.userApiKey.findUnique({
      where: { id },
    });

    if (!existingKey) {
      throw new Error('API key not found');
    }

    if (existingKey.userId !== user.id) {
      throw new Error('Unauthorized: API key does not belong to user');
    }

    // Delete the API key
    await prisma.userApiKey.delete({
      where: { id },
    });
  }

  /**
   * POST /api/keys/:id/test - Test API key validity
   * Rate limited to 5 tests per hour per user
   */
  @Post(':id/test')
  @ApiOperation({
    summary: 'Test API Key',
    description: 'Validate API key by making a test request to the platform. Rate limited to 5 tests per hour.',
  })
  @ApiResponse({
    status: 200,
    description: 'API key test result',
    type: TestApiKeyResponse,
  })
  async testApiKey(@Param('id') id: string, @Req() req: AuthRequest): Promise<TestApiKeyResponse> {
    const userId = req.auth?.userId;

    if (!userId) {
      throw new Error('User ID not found in request');
    }

    // Check rate limit (5 tests per hour)
    const now = Date.now();
    const rateLimitKey = `${userId}:test`;
    const rateLimit = this.testRateLimits.get(rateLimitKey);

    if (rateLimit) {
      if (now < rateLimit.resetAt) {
        if (rateLimit.count >= 5) {
          throw new Error('Rate limit exceeded. Maximum 5 API key tests per hour');
        }
        rateLimit.count++;
      } else {
        // Reset the counter
        this.testRateLimits.set(rateLimitKey, {
          count: 1,
          resetAt: now + 3600000, // 1 hour
        });
      }
    } else {
      this.testRateLimits.set(rateLimitKey, {
        count: 1,
        resetAt: now + 3600000,
      });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get the API key and verify ownership
    const apiKey = await prisma.userApiKey.findUnique({
      where: { id },
    });

    if (!apiKey) {
      throw new Error('API key not found');
    }

    if (apiKey.userId !== user.id) {
      throw new Error('Unauthorized: API key does not belong to user');
    }

    // Decrypt the API key
    const decryptedKey = this.encryptionService.decrypt({
      encryptedKey: apiKey.encryptedKey,
      iv: apiKey.iv,
      authTag: apiKey.authTag,
      salt: apiKey.salt,
    });

    // Test the API key based on platform
    try {
      if (apiKey.platform === 'YOUTUBE') {
        return await this.testYouTubeKey(decryptedKey);
      } else if (apiKey.platform === 'INSTAGRAM') {
        return await this.testInstagramKey(decryptedKey);
      } else {
        throw new Error('Unsupported platform');
      }
    } catch (error) {
      return new TestApiKeyResponse({
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Test YouTube API key by making a minimal API call (3 quota units)
   */
  private async testYouTubeKey(apiKey: string): Promise<TestApiKeyResponse> {
    try {
      const youtube = google.youtube({
        version: 'v3',
        auth: apiKey,
      });

      // Make a minimal API call to test the key
      // videos.list with small quota (3 units)
      const response = await youtube.videos.list({
        part: ['id'],
        id: ['dQw4w9WgXcQ'], // Rick Astley - Never Gonna Give You Up
        maxResults: 1,
      });

      if (response.status === 200) {
        return new TestApiKeyResponse({
          valid: true,
          message: 'YouTube API key is valid',
        });
      }

      return new TestApiKeyResponse({
        valid: false,
        error: 'Invalid response from YouTube API',
      });
    } catch (error: any) {
      // Check for specific YouTube API errors
      if (error.response) {
        const status = error.response.status;
        const errorMessage = error.response.data?.error?.message || 'Unknown error';

        if (status === 400 || status === 403) {
          return new TestApiKeyResponse({
            valid: false,
            error: `YouTube API error: ${errorMessage}`,
          });
        }
      }

      return new TestApiKeyResponse({
        valid: false,
        error: error.message || 'Failed to test YouTube API key',
      });
    }
  }

  /**
   * Test Instagram API key by making a basic API call
   */
  private async testInstagramKey(apiKey: string): Promise<TestApiKeyResponse> {
    try {
      // Make a basic RapidAPI request to test the key
      const response = await axios.get('https://instagram-scraper-api2.p.rapidapi.com/v1/info', {
        params: { username_or_id_or_url: 'instagram' },
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com',
        },
      });

      if (response.status === 200) {
        return new TestApiKeyResponse({
          valid: true,
          message: 'Instagram API key is valid',
        });
      }

      return new TestApiKeyResponse({
        valid: false,
        error: 'Invalid response from Instagram API',
      });
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;

        if (status === 401 || status === 403) {
          return new TestApiKeyResponse({
            valid: false,
            error: 'Instagram API key is invalid or unauthorized',
          });
        }
      }

      return new TestApiKeyResponse({
        valid: false,
        error: error.message || 'Failed to test Instagram API key',
      });
    }
  }
}
