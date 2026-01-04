/**
 * GET /api/keys - List user's API keys
 * POST /api/keys - Create new API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { encryptionService } from '@/lib/encryption';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json([], { status: 200 });
    }

    const apiKeys = await prisma.userApiKey.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    const response = apiKeys.map((apiKey) => {
      const decryptedKey = encryptionService.decrypt({
        encryptedKey: apiKey.encryptedKey,
        iv: apiKey.iv,
        authTag: apiKey.authTag,
        salt: apiKey.salt,
      });
      const maskedKey = encryptionService.maskKey(decryptedKey);

      return {
        id: apiKey.id,
        platform: apiKey.platform,
        label: apiKey.label,
        maskedKey,
        isActive: apiKey.isActive,
        lastUsedAt: apiKey.lastUsedAt,
        createdAt: apiKey.createdAt,
        updatedAt: apiKey.updatedAt,
      };
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('List API keys error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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

    const body = await request.json();
    const { platform, apiKey, label } = body;

    if (!platform || !apiKey) {
      return NextResponse.json(
        { error: 'Platform and API key are required' },
        { status: 400 }
      );
    }

    if (!['YOUTUBE', 'INSTAGRAM'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be YOUTUBE or INSTAGRAM' },
        { status: 400 }
      );
    }

    const encryptedData = encryptionService.encrypt(apiKey);

    const newApiKey = await prisma.userApiKey.create({
      data: {
        userId: user.id,
        platform,
        encryptedKey: encryptedData.encryptedKey,
        iv: encryptedData.iv,
        authTag: encryptedData.authTag,
        salt: encryptedData.salt,
        label: label || null,
        isActive: true,
      },
    });

    const maskedKey = encryptionService.maskKey(apiKey);

    return NextResponse.json({
      id: newApiKey.id,
      platform: newApiKey.platform,
      label: newApiKey.label,
      maskedKey,
      isActive: newApiKey.isActive,
      lastUsedAt: newApiKey.lastUsedAt,
      createdAt: newApiKey.createdAt,
      updatedAt: newApiKey.updatedAt,
    }, { status: 201 });
  } catch (error) {
    console.error('Create API key error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
