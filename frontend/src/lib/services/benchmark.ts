/**
 * Benchmark Calculation Service
 * Calculates niche benchmarks and compares videos against them
 * Phase 2.1: Competitive Intelligence
 */

import { prisma } from '@/lib/prisma';
import { Platform, VideoNiche } from '@prisma/client';
import NicheDetector from './niche-detector';

export interface BenchmarkData {
  platform: Platform;
  niche: VideoNiche;
  avgViewCount: bigint;
  avgLikeCount: bigint;
  avgCommentCount: bigint;
  avgEngagementRate: number;
  percentiles: {
    views: Record<string, number>;
    engagement: Record<string, number>;
  };
  sampleSize: number;
}

export interface VideoComparison {
  videoId: string;
  videoPlatform: Platform;
  videoNiche: VideoNiche;
  videoMetrics: {
    views: bigint;
    likes: bigint;
    comments: bigint;
    engagementRate: number;
  };
  benchmark: BenchmarkData;
  comparison: {
    viewsPercentile: number;      // 0-100, where 50 = median
    engagementPercentile: number;
    viewsVsAverage: number;        // percentage above/below average
    engagementVsAverage: number;   // percentage above/below average
    rank: 'top_10' | 'top_25' | 'top_50' | 'average' | 'below_average';
  };
}

export class BenchmarkService {
  /**
   * Calculate benchmarks for a specific niche
   * Aggregates all videos in that niche and calculates statistics
   */
  static async calculateNicheBenchmark(
    platform: Platform,
    niche: VideoNiche
  ): Promise<BenchmarkData | null> {
    try {
      // Fetch all videos that are in this niche
      // (For now, we estimate based on existing videos)
      // In production, this would aggregate from a larger dataset

      const videos = await prisma.video.findMany({
        where: {
          platform,
        },
        include: {
          analytics: {
            orderBy: { recordedAt: 'desc' },
            take: 1, // Latest analytics
          },
        },
      });

      // Filter videos to estimated niche (using title as proxy)
      const nicheVideos = videos.filter(v => {
        const detected = NicheDetector.detect(v.title || '', v.description || '');
        return detected === niche;
      });

      if (nicheVideos.length === 0) {
        return null;
      }

      // Calculate aggregate metrics
      const viewCounts = nicheVideos.map(v => Number(v.viewCount));
      const likeCounts = nicheVideos.map(v => Number(v.likeCount));
      const commentCounts = nicheVideos.map(v => Number(v.commentCount));
      const engagementRates = nicheVideos
        .map(v => v.engagementRate)
        .filter(er => er !== null) as number[];

      // Calculate averages
      const avgViewCount = BigInt(
        Math.round(viewCounts.reduce((a, b) => a + b, 0) / viewCounts.length)
      );
      const avgLikeCount = BigInt(
        Math.round(likeCounts.reduce((a, b) => a + b, 0) / likeCounts.length)
      );
      const avgCommentCount = BigInt(
        Math.round(commentCounts.reduce((a, b) => a + b, 0) / commentCounts.length)
      );
      const avgEngagementRate =
        engagementRates.length > 0
          ? engagementRates.reduce((a, b) => a + b, 0) / engagementRates.length
          : 0;

      // Calculate percentiles
      const viewPercentiles = this.calculatePercentiles(viewCounts);
      const engagementPercentiles = this.calculatePercentiles(engagementRates);

      // Upsert benchmark
      const benchmark = await prisma.benchmark.upsert({
        where: {
          platform_niche: {
            platform,
            niche,
          },
        },
        update: {
          avgViewCount,
          avgLikeCount,
          avgCommentCount,
          avgEngagementRate,
          viewPercentiles: viewPercentiles,
          engagementPercentiles: engagementPercentiles,
          sampleSize: nicheVideos.length,
        },
        create: {
          platform,
          niche,
          avgViewCount,
          avgLikeCount,
          avgCommentCount,
          avgEngagementRate,
          viewPercentiles: viewPercentiles,
          engagementPercentiles: engagementPercentiles,
          sampleSize: nicheVideos.length,
        },
      });

      return {
        platform,
        niche,
        avgViewCount,
        avgLikeCount,
        avgCommentCount,
        avgEngagementRate,
        percentiles: {
          views: viewPercentiles,
          engagement: engagementPercentiles,
        },
        sampleSize: nicheVideos.length,
      };
    } catch (error) {
      console.error('Error calculating benchmark:', error);
      return null;
    }
  }

  /**
   * Compare a video against niche benchmarks
   */
  static async compareVideoToBenchmark(videoId: string): Promise<VideoComparison | null> {
    try {
      // Fetch video
      const video = await prisma.video.findUnique({
        where: { id: videoId },
      });

      if (!video) {
        return null;
      }

      // Detect niche
      const niche = NicheDetector.detect(video.title || '', video.description || '');

      // Fetch or create benchmark
      let benchmark = await prisma.benchmark.findUnique({
        where: {
          platform_niche: {
            platform: video.platform,
            niche,
          },
        },
      });

      // If benchmark doesn't exist, calculate it
      if (!benchmark) {
        const calculated = await this.calculateNicheBenchmark(video.platform, niche);
        if (!calculated) {
          return null;
        }
        benchmark = await prisma.benchmark.findUnique({
          where: {
            platform_niche: {
              platform: video.platform,
              niche,
            },
          },
        });
      }

      if (!benchmark) {
        return null;
      }

      // Calculate comparison metrics
      const videoViewCount = Number(video.viewCount);
      const avgViewCount = Number(benchmark.avgViewCount);
      const viewsPercentile = this.getPercentile(
        videoViewCount,
        benchmark.viewPercentiles as Record<string, number>
      );

      const videoEngagementRate = video.engagementRate || 0;
      const avgEngagementRate = benchmark.avgEngagementRate;
      const engagementPercentile = this.getPercentile(
        videoEngagementRate,
        benchmark.engagementPercentiles as Record<string, number>
      );

      const viewsVsAverage =
        avgViewCount > 0 ? ((videoViewCount - avgViewCount) / avgViewCount) * 100 : 0;
      const engagementVsAverage =
        avgEngagementRate > 0
          ? ((videoEngagementRate - avgEngagementRate) / avgEngagementRate) * 100
          : 0;

      // Determine rank
      let rank: 'top_10' | 'top_25' | 'top_50' | 'average' | 'below_average';
      if (viewsPercentile >= 90) {
        rank = 'top_10';
      } else if (viewsPercentile >= 75) {
        rank = 'top_25';
      } else if (viewsPercentile >= 50) {
        rank = 'top_50';
      } else if (viewsPercentile >= 25) {
        rank = 'average';
      } else {
        rank = 'below_average';
      }

      return {
        videoId,
        videoPlatform: video.platform,
        videoNiche: niche,
        videoMetrics: {
          views: video.viewCount,
          likes: video.likeCount,
          comments: video.commentCount,
          engagementRate: video.engagementRate || 0,
        },
        benchmark: {
          platform: video.platform,
          niche,
          avgViewCount: benchmark.avgViewCount,
          avgLikeCount: benchmark.avgLikeCount,
          avgCommentCount: benchmark.avgCommentCount,
          avgEngagementRate: benchmark.avgEngagementRate,
          percentiles: {
            views: (benchmark.viewPercentiles as Record<string, number>) || {},
            engagement:
              (benchmark.engagementPercentiles as Record<string, number>) || {},
          },
          sampleSize: benchmark.sampleSize,
        },
        comparison: {
          viewsPercentile,
          engagementPercentile,
          viewsVsAverage,
          engagementVsAverage,
          rank,
        },
      };
    } catch (error) {
      console.error('Error comparing video to benchmark:', error);
      return null;
    }
  }

  /**
   * Get benchmark for a niche
   */
  static async getBenchmark(
    platform: Platform,
    niche: VideoNiche
  ): Promise<BenchmarkData | null> {
    try {
      const benchmark = await prisma.benchmark.findUnique({
        where: {
          platform_niche: {
            platform,
            niche,
          },
        },
      });

      if (!benchmark) {
        return null;
      }

      return {
        platform,
        niche,
        avgViewCount: benchmark.avgViewCount,
        avgLikeCount: benchmark.avgLikeCount,
        avgCommentCount: benchmark.avgCommentCount,
        avgEngagementRate: benchmark.avgEngagementRate,
        percentiles: {
          views: (benchmark.viewPercentiles as Record<string, number>) || {},
          engagement:
            (benchmark.engagementPercentiles as Record<string, number>) || {},
        },
        sampleSize: benchmark.sampleSize,
      };
    } catch (error) {
      console.error('Error fetching benchmark:', error);
      return null;
    }
  }

  /**
   * Calculate percentiles for a dataset
   */
  private static calculatePercentiles(values: number[]): Record<string, number> {
    if (values.length === 0) {
      return { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);

    return {
      p10: this.getValueAtPercentile(sorted, 10),
      p25: this.getValueAtPercentile(sorted, 25),
      p50: this.getValueAtPercentile(sorted, 50),
      p75: this.getValueAtPercentile(sorted, 75),
      p90: this.getValueAtPercentile(sorted, 90),
    };
  }

  /**
   * Get value at specific percentile
   */
  private static getValueAtPercentile(sortedValues: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }

  /**
   * Get percentile rank for a value
   */
  private static getPercentile(
    value: number,
    percentiles: Record<string, number>
  ): number {
    // Simple percentile calculation based on stored percentile data
    if (value <= percentiles.p10) return 10;
    if (value <= percentiles.p25) return 25;
    if (value <= percentiles.p50) return 50;
    if (value <= percentiles.p75) return 75;
    if (value <= percentiles.p90) return 90;
    return 95; // Assume top 5%
  }
}

export default BenchmarkService;
