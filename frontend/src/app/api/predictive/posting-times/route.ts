/**
 * GET /api/predictive/posting-times
 * Get optimal posting time recommendations for a user
 * Phase 3.2: Optimal Posting Times
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkTierAccess } from "@/lib/utils/tier-access";
import { PostingTimeOptimizerService } from "@/lib/services/posting-time-optimizer";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Check tier access first (PRO+ only)
    const tierCheck = await checkTierAccess("VIRAL_SCORE");
    if (!tierCheck.hasAccess) {
      return tierCheck.error!;
    }

    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get niche from query params (optional)
    const niche = request.nextUrl.searchParams.get("niche") || undefined;

    // Calculate recommendations
    const recommendations = await PostingTimeOptimizerService.recommendPostingTimes(
      user.id,
      niche
    );

    if (!recommendations) {
      return NextResponse.json(
        {
          success: true,
          data: {
            topSlots: [],
            heatmapData: [],
            insights: [
              "No posting time data available yet. Analyze more videos to get personalized recommendations.",
            ],
            totalAnalyzed: 0,
          },
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error("Posting time recommendation error:", error);
    return NextResponse.json(
      { error: "Failed to calculate posting time recommendations" },
      { status: 500 }
    );
  }
}
