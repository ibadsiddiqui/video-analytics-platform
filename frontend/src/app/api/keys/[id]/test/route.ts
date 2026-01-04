/**
 * POST /api/keys/:id/test
 * Test API key validity
 * Rate limited to 5 tests per hour per user
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { encryptionService } from '@/lib/encryption';
import { google } from 'googleapis';
import axios from 'axios';

// In-memory rate limiting (consider using Redis for production)
const testRateLimits = new Map<string, { count: number; resetAt: number }>();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check rate limit (5 tests per hour)
    const now = Date.now();
    const rateLimitKey = `${userId}:test`;
    const rateLimit = testRateLimits.get(rateLimitKey);

    if (rateLimit) {
      if (now < rateLimit.resetAt) {
        if (rateLimit.count >= 5) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Maximum 5 API key tests per hour' },
            { status: 429 }
          );
        }
        rateLimit.count++;
      } else {
        testRateLimits.set(rateLimitKey, {
          count: 1,
          resetAt: now + 3600000, // 1 hour
        });
      }
    } else {
      testRateLimits.set(rateLimitKey, {
        count: 1,
        resetAt: now + 3600000,
      });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { id } = params;

    const apiKey = await prisma.userApiKey.findUnique({
      where: { id },
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    if (apiKey.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: API key does not belong to user' },
        { status: 403 }
      );
    }

    const decryptedKey = encryptionService.decrypt({
      encryptedKey: apiKey.encryptedKey,
      iv: apiKey.iv,
      authTag: apiKey.authTag,
      salt: apiKey.salt,
    });

    try {
      if (apiKey.platform === 'YOUTUBE') {
        const result = await testYouTubeKey(decryptedKey);
        return NextResponse.json(result);
      } else if (apiKey.platform === 'INSTAGRAM') {
        const result = await testInstagramKey(decryptedKey);
        return NextResponse.json(result);
      } else {
        return NextResponse.json(
          { valid: false, error: 'Unsupported platform' },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json({
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  } catch (error) {
    console.error('Test API key error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function testYouTubeKey(apiKey: string) {
  try {
    const youtube = google.youtube({
      version: 'v3',
      auth: apiKey,
    });

    const response = await youtube.videos.list({
      part: ['id'],
      id: ['dQw4w9WgXcQ'],
      maxResults: 1,
    });

    if (response.status === 200) {
      return {
        valid: true,
        message: 'YouTube API key is valid',
      };
    }

    return {
      valid: false,
      error: 'Invalid response from YouTube API',
    };
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      const errorMessage = error.response.data?.error?.message || 'Unknown error';

      if (status === 400 || status === 403) {
        return {
          valid: false,
          error: `YouTube API error: ${errorMessage}`,
        };
      }
    }

    return {
      valid: false,
      error: error.message || 'Failed to test YouTube API key',
    };
  }
}

async function testInstagramKey(apiKey: string) {
  try {
    const response = await axios.get('https://instagram-scraper-api2.p.rapidapi.com/v1/info', {
      params: { username_or_id_or_url: 'instagram' },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com',
      },
    });

    if (response.status === 200) {
      return {
        valid: true,
        message: 'Instagram API key is valid',
      };
    }

    return {
      valid: false,
      error: 'Invalid response from Instagram API',
    };
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;

      if (status === 401 || status === 403) {
        return {
          valid: false,
          error: 'Instagram API key is invalid or unauthorized',
        };
      }
    }

    return {
      valid: false,
      error: error.message || 'Failed to test Instagram API key',
    };
  }
}
