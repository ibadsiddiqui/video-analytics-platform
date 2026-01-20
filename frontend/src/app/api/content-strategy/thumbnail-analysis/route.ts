/**
 * Thumbnail Analysis API Route
 * Phase 4.2: Content Strategy Tools
 *
 * POST /api/content-strategy/thumbnail-analysis
 * Analyze video thumbnails for effectiveness
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ThumbnailAnalyzer } from "@/lib/services/thumbnail-analyzer";
import { hasFeatureAccess } from "@/lib/constants/tiers";
import { UserTier } from "@prisma/client";

interface AnalyzeRequest {
  thumbnailUrl?: string; // Single thumbnail to analyze
  videoId?: string; // Analyze thumbnail from a specific video
  compareUrls?: string[]; // Compare multiple thumbnails
}

// POST - Analyze thumbnail(s)
export async function POST(request: NextRequest) {
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

    // Check tier access for thumbnail analysis (PRO+ feature)
    if (!hasFeatureAccess(user.tier as UserTier, "THUMBNAIL_ANALYSIS")) {
      return NextResponse.json(
        {
          error: "Feature not available",
          message: "Thumbnail analysis requires PRO tier or higher",
          requiredTier: "PRO",
        },
        { status: 403 },
      );
    }

    const body = (await request.json()) as AnalyzeRequest;

    // Case 1: Analyze a single thumbnail URL
    if (body.thumbnailUrl) {
      const analysis = await ThumbnailAnalyzer.analyze(body.thumbnailUrl);
      return NextResponse.json({
        success: true,
        data: {
          analysis,
          type: "single",
        },
      });
    }

    // Case 2: Analyze thumbnail from a specific video
    if (body.videoId) {
      const video = await prisma.video.findUnique({
        where: { id: body.videoId },
        select: {
          title: true,
          thumbnailUrl: true,
        },
      });

      if (!video || !video.thumbnailUrl) {
        return NextResponse.json(
          { error: "Video or thumbnail not found" },
          { status: 404 },
        );
      }

      const analysis = await ThumbnailAnalyzer.analyze(
        video.thumbnailUrl,
        video.title || undefined,
      );

      return NextResponse.json({
        success: true,
        data: {
          analysis,
          videoTitle: video.title,
          type: "video",
        },
      });
    }

    // Case 3: Compare multiple thumbnails
    if (body.compareUrls && body.compareUrls.length > 0) {
      if (body.compareUrls.length > 10) {
        return NextResponse.json(
          { error: "Maximum 10 thumbnails can be compared at once" },
          { status: 400 },
        );
      }

      const comparison = await ThumbnailAnalyzer.compareMultiple(
        body.compareUrls,
      );

      return NextResponse.json({
        success: true,
        data: {
          comparison,
          type: "comparison",
        },
      });
    }

    return NextResponse.json(
      { error: "Please provide a thumbnailUrl, videoId, or compareUrls" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Thumbnail analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze thumbnail" },
      { status: 500 },
    );
  }
}

// GET - Get thumbnail best practices
export async function GET() {
  try {
    const bestPractices = ThumbnailAnalyzer.getBestPractices();

    return NextResponse.json({
      success: true,
      data: {
        bestPractices,
        tips: [
          "Use 1280x720 resolution for optimal quality",
          "Include a human face to increase click-through rates",
          "Add 2-4 words of bold, readable text",
          "Use contrasting colors to stand out",
          "Maintain consistent branding across videos",
          "Test different thumbnail styles to find what works",
          "Ensure thumbnails accurately represent video content",
          "Avoid misleading or clickbait thumbnails",
        ],
      },
    });
  } catch (error) {
    console.error("Thumbnail best practices error:", error);
    return NextResponse.json(
      { error: "Failed to get thumbnail best practices" },
      { status: 500 },
    );
  }
}
