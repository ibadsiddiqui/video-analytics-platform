/**
 * Request Tracking Utility
 * Tracks and enforces daily request limits for authenticated users
 */

import { prisma } from "@/lib/prisma";
import { TIER_CONFIG } from "@/lib/constants/tiers";
import { UserTier } from "@prisma/client";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
  currentCount: number;
}

/**
 * Get the start of the current day (midnight) in UTC
 */
function getStartOfDay(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

/**
 * Get the start of the next day (midnight) in UTC
 */
function getEndOfDay(): Date {
  const startOfDay = getStartOfDay();
  return new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
}

/**
 * Check if a date is from today
 */
function isToday(date: Date | null): boolean {
  if (!date) return false;
  const startOfDay = getStartOfDay();
  const endOfDay = getEndOfDay();
  return date >= startOfDay && date < endOfDay;
}

/**
 * Get the daily limit for a user tier
 */
export function getDailyLimit(tier: UserTier): number {
  return TIER_CONFIG[tier]?.dailyLimit ?? TIER_CONFIG.FREE.dailyLimit;
}

/**
 * Check if a user can make a request and optionally track it
 * @param clerkId - The Clerk user ID
 * @param track - Whether to increment the counter (default: true)
 * @returns RateLimitResult with the rate limit status
 */
export async function checkAndTrackRequest(
  clerkId: string,
  track: boolean = true,
): Promise<RateLimitResult> {
  // Find the user
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      tier: true,
      dailyRequests: true,
      lastRequestDate: true,
    },
  });

  if (!user) {
    // User not found - treat as FREE tier with no requests made
    return {
      allowed: true,
      remaining: TIER_CONFIG.FREE.dailyLimit,
      limit: TIER_CONFIG.FREE.dailyLimit,
      resetAt: getEndOfDay(),
      currentCount: 0,
    };
  }

  const dailyLimit = getDailyLimit(user.tier);
  const resetAt = getEndOfDay();

  // Check if last request was today
  const isRequestFromToday = isToday(user.lastRequestDate);

  // If last request was not today, reset count to 0
  const currentCount = isRequestFromToday ? user.dailyRequests : 0;

  // Check if the user has remaining requests
  const allowed = currentCount < dailyLimit;
  const remaining = Math.max(
    0,
    dailyLimit - currentCount - (track && allowed ? 1 : 0),
  );

  // If tracking is enabled and the request is allowed, increment the counter
  if (track && allowed) {
    const newCount = currentCount + 1;

    await prisma.user.update({
      where: { clerkId },
      data: {
        dailyRequests: newCount,
        lastRequestDate: new Date(),
      },
    });

    return {
      allowed: true,
      remaining: Math.max(0, dailyLimit - newCount),
      limit: dailyLimit,
      resetAt,
      currentCount: newCount,
    };
  }

  return {
    allowed,
    remaining: allowed ? Math.max(0, dailyLimit - currentCount) : 0,
    limit: dailyLimit,
    resetAt,
    currentCount,
  };
}

/**
 * Get rate limit status for a user without tracking
 * @param clerkId - The Clerk user ID
 * @returns RateLimitResult with the current rate limit status
 */
export async function getRateLimitStatus(
  clerkId: string,
): Promise<RateLimitResult> {
  return checkAndTrackRequest(clerkId, false);
}

/**
 * Create rate limit headers for the response
 * @param result - The rate limit result
 * @returns Headers object with rate limit information
 */
export function createRateLimitHeaders(
  result: RateLimitResult,
): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetAt.toISOString(),
  };
}
