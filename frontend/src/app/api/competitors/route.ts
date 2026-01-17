/**
 * Competitors API Route
 * GET /api/competitors - List user's tracked competitors
 * POST /api/competitors - Add new competitor
 * Phase 2.1: Competitor Tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import CompetitorService from '@/lib/services/competitor';
import { Platform } from '@prisma/client';

// GET /api/competitors
// Fetch all competitors for authenticated user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch competitors
    const competitors = await CompetitorService.getCompetitors(user.id);

    return NextResponse.json({
      success: true,
      data: competitors,
    });
  } catch (error) {
    console.error('Get competitors error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch competitors' },
      { status: 500 }
    );
  }
}

// POST /api/competitors
// Add a new competitor
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      platform,
      channelId,
      channelName,
      channelUrl,
      thumbnailUrl,
    } = body as {
      platform?: Platform;
      channelId?: string;
      channelName?: string;
      channelUrl?: string;
      thumbnailUrl?: string;
    };

    // Validate inputs
    if (!platform || !channelId || !channelName || !channelUrl) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['platform', 'channelId', 'channelName', 'channelUrl'],
        },
        { status: 400 }
      );
    }

    // Validate platform
    const validPlatforms = ['YOUTUBE', 'INSTAGRAM', 'TIKTOK'];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform', validPlatforms },
        { status: 400 }
      );
    }

    // Add competitor
    const competitor = await CompetitorService.addCompetitor(
      user.id,
      platform,
      channelId,
      channelName,
      channelUrl,
      thumbnailUrl
    );

    if (!competitor) {
      return NextResponse.json(
        { error: 'Failed to add competitor' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: competitor,
        message: `Now tracking ${channelName}`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Add competitor error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to add competitor',
      },
      { status: 400 }
    );
  }
}
