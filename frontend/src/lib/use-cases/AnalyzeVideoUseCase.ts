/**
 * Analyze Video Use Case
 * Orchestrates video analytics workflow across platforms
 */

import { cacheService } from "@/lib/redis";
import { sentimentService } from "@/lib/sentiment";
import { VideoMetrics } from "@/lib/value-objects/VideoMetrics";
import { youtubeService } from "@/lib/youtube";
import { instagramService } from "@/lib/instagram";

export interface AnalyzeVideoOptions {
  skipCache?: boolean;
  includeSentiment?: boolean;
  includeKeywords?: boolean;
  youtubeApiKey?: string;
  rapidApiKey?: string;
  userId?: string;
}

export interface AnalyticsResult {
  video: {
    platform: string;
    id: string;
    url: string;
    title: string;
    description?: string;
    thumbnail?: string;
    publishedAt?: string;
    duration?: number;
    durationFormatted: string;
  };
  channel: {
    name: string;
    id: string;
    thumbnail?: string;
    subscribers?: number;
    subscribersFormatted: string;
  };
  metrics: {
    views: number;
    viewsFormatted: string;
    likes: number;
    likesFormatted: string;
    comments: number;
    commentsFormatted: string;
    shares: number;
    sharesFormatted: string;
    engagementRate: number;
    engagementRateFormatted: string;
  };
  engagement: {
    byDay: Array<{ day: string; engagement: number; views: number }>;
    peakDay: { day: string; engagement: number; views: number } | null;
  };
  sentiment: {
    overall: { score: number; sentiment: string };
    distribution: { positive: number; neutral: number; negative: number };
    totalAnalyzed: number;
  } | null;
  keywords: Array<{ keyword: string; score: number }>;
  hashtags: Array<{ hashtag: string; count: number }>;
  demographics: {
    ageDistribution: Array<{ range: string; percentage: number }>;
    genderSplit: { male: number; female: number };
  };
  topComments: any[];
  meta: {
    fetchedAt: string;
    fromCache: boolean;
    platform: string;
  };
}

// Video data interface expected from platform APIs
interface VideoAnalyticsData {
  platform: string;
  platformVideoId: string;
  url: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  publishedAt?: string;
  duration?: number;
  channelName: string;
  channelId: string;
  channelThumbnail?: string;
  channelSubscribers?: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount?: number;
  comments: Array<{
    id: string;
    authorName: string;
    content: string;
    likeCount: number;
    publishedAt?: string;
  }>;
}

export class AnalyzeVideoUseCase {
  constructor(
    private readonly cache = cacheService,
    private readonly sentiment = sentimentService,
  ) {}

  /**
   * Detect platform from URL
   */
  detectPlatform(url: string): string | null {
    const normalized = url.toLowerCase();

    if (normalized.includes("youtube.com") || normalized.includes("youtu.be")) {
      return "youtube";
    }
    if (normalized.includes("instagram.com")) {
      return "instagram";
    }
    if (normalized.includes("tiktok.com")) {
      return "tiktok";
    }
    if (normalized.includes("vimeo.com")) {
      return "vimeo";
    }

    return null;
  }

  /**
   * Main execution method
   *
   * Note: In frontend, this should typically call the backend API endpoint
   * instead of fetching directly from external APIs. This implementation
   * is provided for client-side usage patterns but assumes you have
   * platform services available or will call backend API routes.
   */
  async execute(
    url: string,
    options: AnalyzeVideoOptions = {},
  ): Promise<AnalyticsResult> {
    const {
      skipCache = false,
      includeSentiment = true,
      includeKeywords = true,
    } = options;

    // Validate URL
    if (!url || typeof url !== "string") {
      throw new Error("Valid URL is required");
    }

    // Detect platform
    const platform = this.detectPlatform(url);
    if (!platform) {
      throw new Error(
        "Unsupported platform. Currently supporting: YouTube, Instagram",
      );
    }

    // Check cache first
    const cacheKey = this.cache.getVideoKey(platform, url);
    if (!skipCache && this.cache.isEnabled()) {
      const cached = await this.cache.get<AnalyticsResult>(cacheKey);
      if (cached) {
        return { ...cached, meta: { ...cached.meta, fromCache: true } };
      }
    }

    // Fetch from platform API
    // NOTE: In a real frontend implementation, you would call your backend API here
    // Example: const videoData = await fetch('/api/analyze', { method: 'POST', body: JSON.stringify({ url }) })
    // For now, this will throw an error as platform services aren't available client-side
    const videoData = await this.fetchVideoData(
      url,
      platform,
      options.youtubeApiKey,
      options.rapidApiKey,
    );

    // Perform sentiment analysis on comments
    let sentimentAnalysis: ReturnType<
      typeof this.sentiment.createSentimentAnalysis
    > | null = null;
    let analyzedComments: any[] = [];
    if (
      includeSentiment &&
      videoData.comments &&
      videoData.comments.length > 0
    ) {
      const result = this.sentiment.analyzeComments(videoData.comments);
      sentimentAnalysis = this.sentiment.createSentimentAnalysis(
        result.analyzed,
      );
      analyzedComments = result.analyzed;
    }

    // Extract keywords and hashtags
    let keywords: Array<{ keyword: string; score: number }> = [];
    let hashtags: Array<{ hashtag: string; count: number }> = [];
    if (includeKeywords && videoData.comments) {
      const commentTexts = videoData.comments.map((c) => c.content);
      keywords = this.sentiment.extractKeywords(commentTexts);
      hashtags = this.sentiment.extractHashtags([
        videoData.description || "",
        ...commentTexts,
      ]);
    }

    // Generate engagement by day
    const engagementByDay = this.sentiment.generateEngagementByDay(
      videoData.viewCount,
      videoData.likeCount,
      videoData.commentCount,
      videoData.publishedAt,
    );

    // Generate demographics
    const demographics = this.sentiment.generateAudienceDemographics();

    // Create video metrics value object
    const metrics = VideoMetrics.fromRawData(
      videoData.viewCount,
      videoData.likeCount,
      videoData.commentCount,
      videoData.shareCount || 0,
    );

    // Compile full analytics response
    const analytics: AnalyticsResult = {
      video: {
        platform: videoData.platform,
        id: videoData.platformVideoId,
        url: videoData.url,
        title: videoData.title,
        description: videoData.description,
        thumbnail: videoData.thumbnailUrl,
        publishedAt: videoData.publishedAt,
        duration: videoData.duration,
        durationFormatted: this.formatDuration(videoData.duration || 0),
      },

      channel: {
        name: videoData.channelName,
        id: videoData.channelId,
        thumbnail: videoData.channelThumbnail,
        subscribers: videoData.channelSubscribers,
        subscribersFormatted: this.formatNumber(
          videoData.channelSubscribers || 0,
        ),
      },

      metrics: {
        views: videoData.viewCount,
        viewsFormatted: metrics.getFormattedViews(),
        likes: videoData.likeCount,
        likesFormatted: metrics.getFormattedLikes(),
        comments: videoData.commentCount,
        commentsFormatted: metrics.getFormattedComments(),
        shares: videoData.shareCount || 0,
        sharesFormatted: this.formatNumber(videoData.shareCount || 0),
        engagementRate: metrics.engagementRate,
        engagementRateFormatted: metrics.getFormattedEngagementRate(),
      },

      engagement: {
        byDay: engagementByDay,
        peakDay: this.findPeakDay(engagementByDay),
      },

      sentiment: sentimentAnalysis
        ? {
            overall: {
              score: sentimentAnalysis.overallScore,
              sentiment: sentimentAnalysis.overallSentiment,
            },
            distribution: sentimentAnalysis.distribution,
            totalAnalyzed: sentimentAnalysis.totalAnalyzed,
          }
        : null,

      keywords: keywords,
      hashtags: hashtags,

      demographics: demographics,

      topComments: analyzedComments.slice(0, 10),

      meta: {
        fetchedAt: new Date().toISOString(),
        fromCache: false,
        platform: platform,
      },
    };

    // Cache the results
    if (this.cache.isEnabled()) {
      await this.cache.set(cacheKey, analytics);

      // Add to history
      await this.cache.addToHistory(videoData.platformVideoId, {
        timestamp: new Date().toISOString(),
        views: videoData.viewCount,
        likes: videoData.likeCount,
        comments: videoData.commentCount,
      });
    }

    return analytics;
  }

  /**
   * Fetch video data from platform
   */
  private async fetchVideoData(
    url: string,
    platform: string,
    youtubeApiKey?: string,
    rapidApiKey?: string,
  ): Promise<VideoAnalyticsData> {
    switch (platform.toLowerCase()) {
      case "youtube":
        return await youtubeService.getVideoAnalytics(url, youtubeApiKey);
      case "instagram":
        return await instagramService.getVideoAnalytics(url, rapidApiKey);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Format large numbers (1000 -> 1K, 1000000 -> 1M)
   */
  private formatNumber(num: number): string {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return num.toLocaleString();
  }

  /**
   * Format duration in seconds to human readable
   */
  private formatDuration(seconds: number): string {
    if (!seconds) return "0:00";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }

    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  /**
   * Find peak engagement day
   */
  private findPeakDay(
    engagementByDay: Array<{ day: string; engagement: number; views: number }>,
  ): { day: string; engagement: number; views: number } | null {
    if (!engagementByDay || engagementByDay.length === 0) return null;

    return engagementByDay.reduce((peak, current) =>
      current.engagement > peak.engagement ? current : peak,
    );
  }
}

export const analyzeVideoUseCase = new AnalyzeVideoUseCase();
