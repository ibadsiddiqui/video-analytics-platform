import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { UserTier } from '@prisma/client';
import { TIER_FEATURES } from '@/lib/constants/tiers';
import { NextResponse } from 'next/server';

export interface TierCheckResult {
  hasAccess: boolean;
  userTier?: UserTier;
  error?: NextResponse;
}

/**
 * Server-side tier access check for API routes
 */
export async function checkTierAccess(
  feature: keyof typeof TIER_FEATURES
): Promise<TierCheckResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        hasAccess: false,
        error: NextResponse.json(
          { error: 'Authentication required', feature },
          { status: 401 }
        ),
      };
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { tier: true },
    });

    if (!user) {
      return {
        hasAccess: false,
        error: NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        ),
      };
    }

    const hasAccess = TIER_FEATURES[feature].includes(user.tier);

    if (!hasAccess) {
      const minimumTier = TIER_FEATURES[feature][0];
      return {
        hasAccess: false,
        userTier: user.tier,
        error: NextResponse.json(
          {
            error: 'Upgrade required',
            message: `This feature requires ${minimumTier} tier or higher`,
            currentTier: user.tier,
            requiredTier: minimumTier,
            upgradeUrl: '/pro-features',
          },
          { status: 403 }
        ),
      };
    }

    return {
      hasAccess: true,
      userTier: user.tier,
    };
  } catch (error) {
    console.error('Tier access check error:', error);
    return {
      hasAccess: false,
      error: NextResponse.json(
        { error: 'Failed to check tier access' },
        { status: 500 }
      ),
    };
  }
}
