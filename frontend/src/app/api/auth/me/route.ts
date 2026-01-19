/**
 * GET /api/auth/me
 * Get the profile of the currently authenticated user
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getDailyLimit } from "@/lib/utils/request-tracker";

/**
 * Get the start of the current day (midnight) in UTC
 */
function getStartOfDay(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
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

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate remaining requests using the centralized tier limits
    const dailyLimit = getDailyLimit(user.tier);

    // Check if last request was today using UTC dates
    const isRequestFromToday = isToday(user.lastRequestDate);
    const currentCount = isRequestFromToday ? user.dailyRequests : 0;

    const remainingRequests = Math.max(0, dailyLimit - currentCount);

    return NextResponse.json({
      user,
      rateLimit: {
        limit: dailyLimit,
        remaining: remainingRequests,
        used: currentCount,
        resetAt: getEndOfDay().toISOString(),
        tier: user.tier,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
