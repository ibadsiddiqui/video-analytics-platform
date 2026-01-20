/**
 * Superfan Identification API Route
 * Phase 5.2: Audience Analytics
 *
 * GET /api/audience/superfans
 * Identify the most engaged community members
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { AudienceAnalyzer } from "@/lib/services/audience-analyzer";
import { hasFeatureAccess } from "@/lib/constants/tiers";
import { UserTier } from "@prisma/client";

// GET - Get superfan analysis
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user and check tier access
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check tier access for audience analytics (PRO+ feature)
    if (!hasFeatureAccess(user.tier as UserTier, "AUDIENCE_ANALYTICS")) {
      return NextResponse.json(
        {
          error: "Feature not available",
          message: "Superfan analysis requires PRO tier or higher",
          requiredTier: "PRO",
        },
        { status: 403 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const channelId = searchParams.get("channelId");
    const platform = searchParams.get("platform") || "YOUTUBE";
    const minComments = parseInt(searchParams.get("minComments") || "3", 10);

    if (!channelId) {
      return NextResponse.json(
        { error: "channelId is required" },
        { status: 400 },
      );
    }

    // Identify superfans
    const result = await AudienceAnalyzer.identifySuperfans(
      channelId,
      platform,
      Math.max(2, Math.min(minComments, 10)), // Cap between 2-10
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Superfan analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze superfans" },
      { status: 500 },
    );
  }
}
