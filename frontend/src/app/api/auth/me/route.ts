/**
 * GET /api/auth/me
 * Get the profile of the currently authenticated user
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

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

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate remaining requests
    const tierLimits: Record<string, number> = {
      FREE: 5,
      CREATOR: 100,
      PRO: 500,
      AGENCY: 2000,
    };

    const dailyLimit = tierLimits[user.tier] || 5;
    const today = new Date().toDateString();
    const lastRequest = user.lastRequestDate?.toDateString();

    const remainingRequests =
      lastRequest === today
        ? Math.max(0, dailyLimit - user.dailyRequests)
        : dailyLimit;

    return NextResponse.json({
      user,
      rateLimit: {
        limit: dailyLimit,
        remaining: remainingRequests,
        tier: user.tier,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
