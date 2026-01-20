/**
 * Audience Overlap Analysis API Route
 * Phase 5.1: Audience Analytics
 *
 * GET /api/audience/overlap
 * Analyze audience overlap between channels
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { AudienceAnalyzer } from "@/lib/services/audience-analyzer";
import { hasFeatureAccess } from "@/lib/constants/tiers";
import { UserTier } from "@prisma/client";

// GET - Get audience overlap analysis
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
          message: "Audience analytics requires PRO tier or higher",
          requiredTier: "PRO",
        },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const channelId = searchParams.get("channelId");
    const platform = searchParams.get("platform") || "YOUTUBE";
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (!channelId) {
      return NextResponse.json(
        { error: "channelId is required" },
        { status: 400 }
      );
    }

    // Analyze audience overlap
    const result = await AudienceAnalyzer.analyzeOverlap(
      channelId,
      platform,
      Math.min(limit, 50) // Cap at 50
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Audience overlap error:", error);
    return NextResponse.json(
      { error: "Failed to analyze audience overlap" },
      { status: 500 }
    );
  }
}
