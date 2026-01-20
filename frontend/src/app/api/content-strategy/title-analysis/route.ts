/**
 * Title Analysis API Route
 * Phase 4.1: Content Strategy Tools
 *
 * POST /api/content-strategy/title-analysis
 * Analyze video titles and get performance insights
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { TitleAnalyzer } from "@/lib/services/title-analyzer";
import { hasFeatureAccess } from "@/lib/constants/tiers";
import { UserTier } from "@prisma/client";

interface AnalyzeRequest {
  title?: string; // Single title to analyze
  videoId?: string; // Analyze title from a specific video
  channelId?: string; // Analyze all titles from a channel
}

// POST - Analyze title(s)
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

    // Check tier access for title analysis (PRO+ feature)
    if (!hasFeatureAccess(user.tier as UserTier, "TITLE_ANALYSIS")) {
      return NextResponse.json(
        {
          error: "Feature not available",
          message: "Title analysis requires PRO tier or higher",
          requiredTier: "PRO",
        },
        { status: 403 },
      );
    }

    const body = (await request.json()) as AnalyzeRequest;

    // Case 1: Analyze a single title
    if (body.title) {
      const analysis = TitleAnalyzer.analyze(body.title);
      return NextResponse.json({
        success: true,
        data: {
          analysis,
          type: "single",
        },
      });
    }

    // Case 2: Analyze title from a specific video
    if (body.videoId) {
      const video = await prisma.video.findUnique({
        where: { id: body.videoId },
        select: {
          title: true,
          viewCount: true,
          likeCount: true,
          commentCount: true,
        },
      });

      if (!video || !video.title) {
        return NextResponse.json({ error: "Video not found" }, { status: 404 });
      }

      const analysis = TitleAnalyzer.analyze(video.title);
      return NextResponse.json({
        success: true,
        data: {
          analysis,
          metrics: {
            views: Number(video.viewCount),
            likes: Number(video.likeCount),
            comments: Number(video.commentCount),
          },
          type: "video",
        },
      });
    }

    // Case 3: Analyze all titles from a channel
    if (body.channelId) {
      const videos = await prisma.video.findMany({
        where: { channelId: body.channelId },
        select: {
          title: true,
          viewCount: true,
          likeCount: true,
          commentCount: true,
        },
        orderBy: { createdAt: "desc" },
        take: 50, // Analyze last 50 videos
      });

      if (videos.length === 0) {
        return NextResponse.json(
          { error: "No videos found for this channel" },
          { status: 404 },
        );
      }

      const videoData = videos
        .filter((v) => v.title)
        .map((v) => ({
          title: v.title!,
          views: Number(v.viewCount),
          likes: Number(v.likeCount),
          comments: Number(v.commentCount),
        }));

      const report = TitleAnalyzer.analyzeMultiple(videoData);

      return NextResponse.json({
        success: true,
        data: {
          report,
          videosAnalyzed: videoData.length,
          type: "channel",
        },
      });
    }

    return NextResponse.json(
      { error: "Please provide a title, videoId, or channelId" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Title analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze title" },
      { status: 500 },
    );
  }
}

// GET - Get title analysis suggestions
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const title = request.nextUrl.searchParams.get("title");

    if (!title) {
      // Return general best practices
      return NextResponse.json({
        success: true,
        data: {
          bestPractices: [
            "Keep titles between 6-12 words for optimal engagement",
            "Use numbers for listicle-style content (e.g., 'Top 10...')",
            "Include power words like 'ultimate', 'proven', or 'essential'",
            "Keep character count under 60 to avoid truncation",
            "Ask questions to spark curiosity",
            "Avoid excessive ALL CAPS - it looks spammy",
            "Front-load important keywords for SEO",
          ],
          allStyles: TitleAnalyzer.getAllStyles().map((style) => ({
            id: style,
            label: TitleAnalyzer.getStyleLabel(style),
          })),
        },
      });
    }

    // Quick analysis without tier check for preview
    const analysis = TitleAnalyzer.analyze(title);
    return NextResponse.json({
      success: true,
      data: {
        preview: {
          style: analysis.style,
          styleLabel: TitleAnalyzer.getStyleLabel(analysis.style),
          score: analysis.score,
          wordCount: analysis.characteristics.wordCount,
          charCount: analysis.characteristics.charCount,
        },
      },
    });
  } catch (error) {
    console.error("Title analysis GET error:", error);
    return NextResponse.json(
      { error: "Failed to get title suggestions" },
      { status: 500 },
    );
  }
}
