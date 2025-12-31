/**
 * Analyze Video Use Case
 * Orchestrates video analytics workflow across platforms
 */

import { Service } from 'typedi';
import { RedisCacheService } from '@infrastructure/cache/RedisCacheService';
import { IVideoService } from '@domain/interfaces/IVideoService';
import { YouTubeService } from '@infrastructure/external-apis/YouTubeService';
import { InstagramService } from '@infrastructure/external-apis/InstagramService';
import { SentimentService } from '@infrastructure/sentiment/SentimentService';
import { VideoMetrics } from '@domain/value-objects/VideoMetrics';
import { SentimentAnalysis } from '@domain/value-objects/SentimentAnalysis';

export interface AnalyzeVideoOptions {
  skipCache?: boolean;
  includeSentiment?: boolean;
  includeKeywords?: boolean;
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

@Service()
export class AnalyzeVideoUseCase {
  private platformServices: Map<string, IVideoService>;

  constructor(
    private readonly cacheService: RedisCacheService,
    private readonly youtubeService: YouTubeService,
    private readonly instagramService: InstagramService,
    private readonly sentimentService: SentimentService
  ) {
    this.platformServices = new Map();
    this.platformServices.set('youtube', this.youtubeService);
    this.platformServices.set('instagram', this.instagramService);
  }

  /**
   * Detect platform from URL
   */
  detectPlatform(url: string): string | null {
    const normalized = url.toLowerCase();

    if (normalized.includes('youtube.com') || normalized.includes('youtu.be')) {
      return 'youtube';
    }
    if (normalized.includes('instagram.com')) {
      return 'instagram';
    }
    if (normalized.includes('tiktok.com')) {
      return 'tiktok';
    }
    if (normalized.includes('vimeo.com')) {
      return 'vimeo';
    }

    return null;
  }

  /**
   * Main execution method
   */
  async execute(url: string, options: AnalyzeVideoOptions = {}): Promise<AnalyticsResult> {
    const { skipCache = false, includeSentiment = true, includeKeywords = true } = options;

    // Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error('Valid URL is required');
    }

    // Detect platform
    const platform = this.detectPlatform(url);
    if (!platform) {
      throw new Error('Unsupported platform. Currently supporting: YouTube, Instagram');
    }

    // Check cache first
    const cacheKey = this.cacheService.getVideoKey(platform, url);
    if (!skipCache && this.cacheService.isEnabled()) {
      const cached = await this.cacheService.get<AnalyticsResult>(cacheKey);
      if (cached) {
        return { ...cached, meta: { ...cached.meta, fromCache: true } };
      }
    }

    // Fetch from platform API
    const service = this.platformServices.get(platform);
    if (!service) {
      throw new Error(`Service not available for platform: ${platform}`);
    }

    const videoData = await service.getVideoAnalytics(url);

    // Perform sentiment analysis on comments
    let sentimentAnalysis: SentimentAnalysis | null = null;
    let analyzedComments: any[] = [];
    if (includeSentiment && videoData.comments && videoData.comments.length > 0) {
      const result = this.sentimentService.analyzeComments(videoData.comments);
      sentimentAnalysis = this.sentimentService.createSentimentAnalysis(result.analyzed);
      analyzedComments = result.analyzed;
    }

    // Extract keywords and hashtags
    let keywords: Array<{ keyword: string; score: number }> = [];
    let hashtags: Array<{ hashtag: string; count: number }> = [];
    if (includeKeywords && videoData.comments) {
      const commentTexts = videoData.comments.map((c) => c.content);
      keywords = this.sentimentService.extractKeywords(commentTexts);
      hashtags = this.sentimentService.extractHashtags([
        videoData.description || '',
        ...commentTexts,
      ]);
    }

    // Generate engagement by day
    const engagementByDay = this.sentimentService.generateEngagementByDay(
      videoData.viewCount,
      videoData.likeCount,
      videoData.commentCount,
      videoData.publishedAt
    );

    // Generate demographics
    const demographics = this.sentimentService.generateAudienceDemographics();

    // Create video metrics value object
    const metrics = VideoMetrics.fromRawData(
      videoData.viewCount,
      videoData.likeCount,
      videoData.commentCount,
      videoData.shareCount || 0
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
        subscribersFormatted: this.formatNumber(videoData.channelSubscribers || 0),
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
    if (this.cacheService.isEnabled()) {
      await this.cacheService.set(cacheKey, analytics);

      // Add to history
      await this.cacheService.addToHistory(videoData.platformVideoId, {
        timestamp: new Date().toISOString(),
        views: videoData.viewCount,
        likes: videoData.likeCount,
        comments: videoData.commentCount,
      });
    }

    return analytics;
  }

  /**
   * Format large numbers (1000 -> 1K, 1000000 -> 1M)
   */
  private formatNumber(num: number): string {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toLocaleString();
  }

  /**
   * Format duration in seconds to human readable
   */
  private formatDuration(seconds: number): string {
    if (!seconds) return '0:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    }

    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Find peak engagement day
   */
  private findPeakDay(
    engagementByDay: Array<{ day: string; engagement: number; views: number }>
  ): { day: string; engagement: number; views: number } | null {
    if (!engagementByDay || engagementByDay.length === 0) return null;

    return engagementByDay.reduce((peak, current) =>
      current.engagement > peak.engagement ? current : peak
    );
  }
}
