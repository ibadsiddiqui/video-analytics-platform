/**
 * POST /api/analyze
 * GET /api/analyze?url=...
 * Analyze a single video from any supported platform
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzeVideoUseCase } from "@/lib/use-cases";
import { auth } from "@clerk/nextjs/server";
import { checkTierAccess } from "@/lib/utils/tier-access";
import { ViralPredictorService } from "@/lib/services/viral-predictor";
import NicheDetector from "@/lib/services/niche-detector";
import { TitleAnalyzer } from "@/lib/services/title-analyzer";
import { ThumbnailAnalyzer } from "@/lib/services/thumbnail-analyzer";
import { AudienceAnalyzer } from "@/lib/services/audience-analyzer";
import { prisma } from "@/lib/prisma";
import {
  checkAndTrackRequest,
  createRateLimitHeaders,
  RateLimitResult,
} from "@/lib/utils/request-tracker";
import { getCommentLimit } from "@/lib/constants/tiers";
import { UserTier } from "@prisma/client";
import { getRateLimitStatus } from "@/lib/utils/request-tracker";
/**
 * Apply comment limit based on user tier
 * FREE: 10 comments, CREATOR: 50 comments, PRO/AGENCY: unlimited
 */
async function applyCommentLimit(result: any, userId: string | null) {
  // Get user's tier
  let userTier: UserTier | undefined;

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { tier: true },
    });
    userTier = user?.tier;
  }

  const commentLimit = getCommentLimit(userTier);

  // Apply limit (-1 means unlimited)
  if (
    commentLimit !== -1 &&
    result.topComments &&
    result.topComments.length > commentLimit
  ) {
    result.topComments = result.topComments.slice(0, commentLimit);
    result.commentsLimited = true;
    result.commentLimit = commentLimit;
  }

  return result;
}

async function enrichWithContentStrategy(result: any) {
  try {
    // Check tier access for content strategy features (PRO+ only)
    const titleTierCheck = await checkTierAccess("TITLE_ANALYSIS");
    const thumbnailTierCheck = await checkTierAccess("THUMBNAIL_ANALYSIS");

    const contentStrategy: any = {};

    // Title Analysis
    if (titleTierCheck.hasAccess && result.video?.title) {
      try {
        contentStrategy.titleAnalysis = await TitleAnalyzer.analyze(
          result.video.title,
        );
      } catch (error) {
        console.error("Title analysis error:", error);
      }
    } else if (!titleTierCheck.hasAccess) {
      contentStrategy.titleAnalysis = {
        locked: true,
        requiredTier: "PRO",
      };
    }

    // Thumbnail Analysis
    if (thumbnailTierCheck.hasAccess && result.video?.thumbnail) {
      try {
        contentStrategy.thumbnailAnalysis = await ThumbnailAnalyzer.analyze(
          result.video.thumbnail,
          result.video.title,
        );
      } catch (error) {
        console.error("Thumbnail analysis error:", error);
      }
    } else if (!thumbnailTierCheck.hasAccess) {
      contentStrategy.thumbnailAnalysis = {
        locked: true,
        requiredTier: "PRO",
      };
    }

    result.contentStrategy = contentStrategy;
    return result;
  } catch (error) {
    console.error("Error enriching with content strategy:", error);
    return result;
  }
}

async function enrichWithAudienceAnalytics(result: any) {
  try {
    // Check tier access for audience analytics features (PRO+ only)
    const tierCheck = await checkTierAccess("AUDIENCE_ANALYTICS");

    if (!tierCheck.hasAccess) {
      result.audienceAnalytics = {
        overlap: { locked: true, requiredTier: "PRO" },
        superfans: { locked: true, requiredTier: "PRO" },
      };
      return result;
    }

    const audienceAnalytics: any = {};

    // Audience Overlap Analysis
    if (result.channel?.id) {
      try {
        audienceAnalytics.overlap = await AudienceAnalyzer.analyzeOverlap(
          result.channel.id,
          result.video?.platform?.toUpperCase() || "YOUTUBE",
        );
      } catch (error) {
        console.error("Audience overlap analysis error:", error);
      }
    }

    // Superfan Identification
    if (result.channel?.id) {
      try {
        audienceAnalytics.superfans = await AudienceAnalyzer.identifySuperfans(
          result.channel.id,
          result.video?.platform?.toUpperCase() || "YOUTUBE",
        );
      } catch (error) {
        console.error("Superfan identification error:", error);
      }
    }

    result.audienceAnalytics = audienceAnalytics;
    return result;
  } catch (error) {
    console.error("Error enriching with audience analytics:", error);
    return result;
  }
}

async function enrichWithPredictiveAnalytics(
  result: any,
  userId: string | null,
) {
  try {
    // Check tier access for predictive features (PRO+ only)
    const tierCheck = await checkTierAccess("VIRAL_SCORE");
    const includePredictive = tierCheck.hasAccess;

    if (!includePredictive) {
      // User doesn't have access to predictive features
      result.predictive = {
        locked: true,
        requiredTier: "PRO",
      };
      return result;
    }

    // Get or create the video in database to generate viral potential
    let videoDb = await prisma.video.findUnique({
      where: { platformVideoId: result.video.id },
      include: {
        analytics: {
          orderBy: { recordedAt: "desc" },
          take: 48,
        },
      },
    });

    if (!videoDb) {
      // Create video record if it doesn't exist
      const niche = NicheDetector.detect(
        result.video.title || "",
        result.video.description || "",
      );
      await prisma.video.create({
        data: {
          platform: result.video.platform.toUpperCase() as any,
          platformVideoId: result.video.id,
          url: result.video.url,
          title: result.video.title,
          description: result.video.description,
          thumbnailUrl: result.video.thumbnail,
          channelName: result.channel.name,
          channelId: result.channel.id,
          publishedAt: result.video.publishedAt
            ? new Date(result.video.publishedAt)
            : null,
          duration: result.video.duration,
          viewCount: BigInt(result.metrics.views),
          likeCount: BigInt(result.metrics.likes),
          commentCount: BigInt(result.metrics.comments),
          shareCount: BigInt(result.metrics.shares || 0),
          engagementRate: result.metrics.engagementRate,
        },
      });

      // Re-fetch the video with analytics
      videoDb = await prisma.video.findUnique({
        where: { platformVideoId: result.video.id },
        include: {
          analytics: {
            orderBy: { recordedAt: "desc" },
            take: 48,
          },
        },
      });
    }

    // Calculate viral potential
    const viralPotential = await ViralPredictorService.calculateViralPotential(
      videoDb.id,
    );

    result.predictive = {
      viralPotential,
      availableFeatures: ["viral_score", "posting_time"],
    };

    return result;
  } catch (error) {
    console.error("Error enriching with predictive analytics:", error);
    // Don't fail the entire request if predictive analytics fails
    return result;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Optional authentication
    const { userId } = await auth();

    const body = await request.json();
    const {
      url,
      skipCache,
      includeSentiment,
      includeKeywords,
      youtubeKeyId,
      instagramKeyId,
    } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 },
      );
    }

    // Check if user is providing their own API keys
    // If they use their own keys, don't count against daily limit (they use their own quota)
    const isUsingOwnApiKey = Boolean(youtubeKeyId || instagramKeyId);

    // Track request and check rate limit for authenticated users (only when using system keys)
    let rateLimitResult: RateLimitResult | null = null;
    if (userId && !isUsingOwnApiKey) {
      rateLimitResult = await checkAndTrackRequest(userId);

      if (!rateLimitResult.allowed) {
        const headers = createRateLimitHeaders(rateLimitResult);
        return NextResponse.json(
          {
            success: false,
            error:
              "Daily request limit reached. Please upgrade your plan for more requests.",
          },
          { status: 429, headers },
        );
      }
    } else if (userId && isUsingOwnApiKey) {
      // Still get rate limit status for display purposes, but don't track
      rateLimitResult = await getRateLimitStatus(userId);
    }

    const result = await analyzeVideoUseCase.execute(url, {
      skipCache: skipCache || false,
      includeSentiment: includeSentiment !== false,
      includeKeywords: includeKeywords !== false,
      youtubeKeyId,
      instagramKeyId,
      userId: userId || undefined,
    });

    // Apply comment limit based on user tier
    const limitedResult = await applyCommentLimit(result, userId || null);

    // Enrich with predictive analytics
    const withPredictive = await enrichWithPredictiveAnalytics(
      limitedResult,
      userId || null,
    );

    // Enrich with content strategy (Phase 4)
    const withContentStrategy = await enrichWithContentStrategy(withPredictive);

    // Enrich with audience analytics (Phase 5)
    const enrichedResult =
      await enrichWithAudienceAnalytics(withContentStrategy);

    // Create response with rate limit headers
    const responseHeaders = rateLimitResult
      ? createRateLimitHeaders(rateLimitResult)
      : {};

    return NextResponse.json(
      {
        success: true,
        data: enrichedResult,
      },
      { headers: responseHeaders },
    );
  } catch (error) {
    console.error("Analyze video error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to analyze video",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Optional authentication
    const { userId } = await auth();

    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const skipCache = searchParams.get("skipCache") === "true";
    const includeSentiment = searchParams.get("includeSentiment") !== "false";
    const includeKeywords = searchParams.get("includeKeywords") !== "false";
    const youtubeKeyId = searchParams.get("youtubeKeyId");
    const instagramKeyId = searchParams.get("instagramKeyId");

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 },
      );
    }

    // Check if user is providing their own API keys
    // If they use their own keys, don't count against daily limit (they use their own quota)
    const isUsingOwnApiKey = Boolean(youtubeKeyId || instagramKeyId);

    // Track request and check rate limit for authenticated users (only when using system keys)
    let rateLimitResult: RateLimitResult | null = null;
    if (userId && !isUsingOwnApiKey) {
      rateLimitResult = await checkAndTrackRequest(userId);

      if (!rateLimitResult.allowed) {
        const headers = createRateLimitHeaders(rateLimitResult);
        return NextResponse.json(
          {
            success: false,
            error:
              "Daily request limit reached. Please upgrade your plan for more requests.",
          },
          { status: 429, headers },
        );
      }
    } else if (userId && isUsingOwnApiKey) {
      // Still get rate limit status for display purposes, but don't track
      rateLimitResult = await getRateLimitStatus(userId);
    }

    const result = await analyzeVideoUseCase.execute(url, {
      skipCache,
      includeSentiment,
      includeKeywords,
      youtubeKeyId: youtubeKeyId || undefined,
      instagramKeyId: instagramKeyId || undefined,
      userId: userId || undefined,
    });

    // Apply comment limit based on user tier
    const limitedResult = await applyCommentLimit(result, userId || null);

    // Enrich with predictive analytics
    const withPredictive = await enrichWithPredictiveAnalytics(
      limitedResult,
      userId || null,
    );

    // Enrich with content strategy (Phase 4)
    const withContentStrategy = await enrichWithContentStrategy(withPredictive);

    // Enrich with audience analytics (Phase 5)
    const enrichedResult =
      await enrichWithAudienceAnalytics(withContentStrategy);

    // Create response with rate limit headers
    const responseHeaders = rateLimitResult
      ? createRateLimitHeaders(rateLimitResult)
      : {};

    return NextResponse.json(
      {
        success: true,
        data: enrichedResult,
      },
      { headers: responseHeaders },
    );
  } catch (error) {
    console.error("Analyze video error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to analyze video",
      },
      { status: 500 },
    );
  }
}
