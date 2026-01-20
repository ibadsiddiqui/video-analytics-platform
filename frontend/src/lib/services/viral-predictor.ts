/**
 * Viral Predictor Service
 * Calculates viral potential score and growth projections
 * Phase 3.1: Predictive Analytics
 */

import { prisma } from "@/lib/prisma";
import { cacheService } from "@/lib/redis";
import BenchmarkService from "./benchmark";
import NicheDetector from "./niche-detector";

export interface ViralPotentialFactors {
  velocityScore: number; // 0-100: Early engagement growth rate
  sentimentScore: number; // 0-100: Positive sentiment momentum
  commentVelocityScore: number; // 0-100: Comment activity rate
  likeRatioScore: number; // 0-100: Like ratio quality
}

export interface ViralPotentialResult {
  score: number; // 0-100
  factors: ViralPotentialFactors;
  explanation: string;
  prediction: "viral" | "high_potential" | "moderate" | "low";
}

export class ViralPredictorService {
  /**
   * Calculate viral potential score based on early metrics and benchmarks
   * Uses statistical analysis to predict viral likelihood
   */
  static async calculateViralPotential(
    videoId: string,
    niche?: string,
  ): Promise<ViralPotentialResult | null> {
    try {
      // Check cache first
      const cacheKey = `viral:${videoId}`;
      const cached = await cacheService.get<ViralPotentialResult>(cacheKey);
      if (cached) {
        return cached;
      }

      // Fetch video
      const video = await prisma.video.findUnique({
        where: { id: videoId },
        include: {
          analytics: {
            orderBy: { recordedAt: "desc" },
            take: 48, // Last 2 days of hourly snapshots
          },
          comments: true,
        },
      });

      if (!video) {
        return null;
      }

      // Detect niche if not provided
      const videoNiche = niche
        ? (niche as any)
        : NicheDetector.detect(video.title || "", video.description || "");

      // Fetch benchmark for comparison
      const benchmark = await BenchmarkService.getBenchmark(
        video.platform,
        videoNiche,
      );

      // Calculate individual scores
      const velocityScore = this.calculateVelocityScore(
        video.analytics,
        benchmark,
        video.publishedAt,
      );
      const sentimentScore = this.calculateSentimentScore(
        video.analytics,
        benchmark,
      );
      const commentVelocityScore = this.calculateCommentVelocityScore(
        video.analytics,
        benchmark,
        video.publishedAt,
      );
      const likeRatioScore = this.calculateLikeRatioScore(video);

      // Weighted final score (0-100)
      // Velocity has highest weight as early engagement is key to virality
      const score = Math.round(
        velocityScore * 0.4 +
          sentimentScore * 0.2 +
          commentVelocityScore * 0.2 +
          likeRatioScore * 0.2,
      );

      // Categorize prediction
      const prediction =
        score >= 80
          ? "viral"
          : score >= 60
            ? "high_potential"
            : score >= 40
              ? "moderate"
              : "low";

      // Generate explanation
      const explanation = this.generateExplanation(score, {
        velocityScore,
        sentimentScore,
        commentVelocityScore,
        likeRatioScore,
      });

      const result: ViralPotentialResult = {
        score,
        factors: {
          velocityScore,
          sentimentScore,
          commentVelocityScore,
          likeRatioScore,
        },
        explanation,
        prediction,
      };

      // Cache for 1 hour
      await cacheService.set(cacheKey, result, 3600);

      return result;
    } catch (error) {
      console.error("Error calculating viral potential:", error);
      return null;
    }
  }

  /**
   * Calculate velocity score based on early engagement growth
   * Compares views/hour in early period vs niche benchmark
   */
  private static calculateVelocityScore(
    analytics: any[],
    benchmark: any,
    publishedAt?: Date,
  ): number {
    if (!analytics || analytics.length < 2 || !publishedAt) {
      return 50; // Neutral score if insufficient data
    }

    // Get oldest and newest snapshots
    const oldest = analytics[analytics.length - 1];
    const newest = analytics[0];

    const viewGrowth =
      Number(newest.viewCount || 0) - Number(oldest.viewCount || 0);
    const timeElapsedHours =
      (new Date(newest.recordedAt).getTime() -
        new Date(oldest.recordedAt).getTime()) /
      (1000 * 60 * 60);

    if (timeElapsedHours === 0) {
      return 50;
    }

    const viewsPerHour = viewGrowth / timeElapsedHours;

    // Compare to benchmark
    const benchmarkAvgViews = benchmark ? Number(benchmark.avgViewCount) : 1000;
    const benchmarkViewsPerDay = benchmarkAvgViews / 7; // Rough estimate
    const benchmarkViewsPerHour = benchmarkViewsPerDay / 24;

    // Calculate percentile vs benchmark
    const velocityRatio = viewsPerHour / Math.max(benchmarkViewsPerHour, 1);

    // Convert ratio to 0-100 score
    // ratio < 0.5 = 20, 0.5-1 = 40, 1-2 = 60, 2-5 = 80, > 5 = 100
    if (velocityRatio > 5) return 100;
    if (velocityRatio > 2) return 80;
    if (velocityRatio > 1) return 60;
    if (velocityRatio > 0.5) return 40;
    return 20;
  }

  /**
   * Calculate sentiment score based on positive sentiment percentage
   * Compares video's sentiment vs niche benchmark
   */
  private static calculateSentimentScore(
    analytics: any[],
    benchmark: any,
  ): number {
    if (!analytics || analytics.length === 0) {
      return 50; // Neutral score if no data
    }

    // Get latest sentiment from newest snapshot
    const latest = analytics[0];
    const positivePercent = latest.positivePercent || 0;

    // Compare to benchmark (assume benchmark has sentiment data)
    const benchmarkPositivePercent =
      benchmark?.sentiment?.positivePercent || 50;

    // Video above 70% positive sentiment = viral indicator
    if (positivePercent > 70) return 90;
    if (positivePercent > 60) return 70;
    if (positivePercent > 50) return 55;
    if (positivePercent > 40) return 35;
    return 15;
  }

  /**
   * Calculate comment velocity score
   * Measures engagement momentum through comments
   */
  private static calculateCommentVelocityScore(
    analytics: any[],
    benchmark: any,
    publishedAt?: Date,
  ): number {
    if (!analytics || analytics.length < 2) {
      return 50;
    }

    const oldest = analytics[analytics.length - 1];
    const newest = analytics[0];

    const commentGrowth =
      Number(newest.commentCount || 0) - Number(oldest.commentCount || 0);
    const timeElapsedHours =
      (new Date(newest.recordedAt).getTime() -
        new Date(oldest.recordedAt).getTime()) /
      (1000 * 60 * 60);

    if (timeElapsedHours === 0) {
      return 50;
    }

    const commentsPerHour = commentGrowth / timeElapsedHours;
    const benchmarkComments = benchmark
      ? Number(benchmark.avgCommentCount)
      : 100;
    const benchmarkCommentsPerDay = benchmarkComments / 7;
    const benchmarkCommentsPerHour = benchmarkCommentsPerDay / 24;

    const commentRatio =
      commentsPerHour / Math.max(benchmarkCommentsPerHour, 0.01);

    // Convert ratio to 0-100 score
    if (commentRatio > 3) return 95;
    if (commentRatio > 1.5) return 75;
    if (commentRatio > 0.5) return 55;
    if (commentRatio > 0.1) return 35;
    return 15;
  }

  /**
   * Calculate like ratio score
   * Measures quality of engagement through likes
   */
  private static calculateLikeRatioScore(video: any): number {
    const likes = Number(video.likeCount || 0);
    const views = Number(video.viewCount || 1);
    const comments = Number(video.commentCount || 0);

    // Calculate like ratio as percentage of views
    const likeRatio = (likes / views) * 100;

    // Like ratio typically ranges from 1-5% for viral videos
    // Higher ratio = more engaged audience
    if (likeRatio > 5) return 90;
    if (likeRatio > 3) return 75;
    if (likeRatio > 2) return 60;
    if (likeRatio > 1) return 45;
    if (likeRatio > 0.5) return 30;
    return 15;
  }

  /**
   * Generate human-readable explanation of the viral score
   */
  private static generateExplanation(
    score: number,
    factors: ViralPotentialFactors,
  ): string {
    const strongFactor = Object.entries(factors).sort(
      ([, a], [, b]) => b - a,
    )[0];
    const weakFactor = Object.entries(factors).sort(([, a], [, b]) => a - b)[0];

    const strongName = this.factorName(strongFactor[0]);
    const weakName = this.factorName(weakFactor[0]);
    const strongValue = strongFactor[1];
    const weakValue = weakFactor[1];

    if (score >= 80) {
      return `This video has excellent viral potential! Strong ${strongName.toLowerCase()} (${Math.round(strongValue)}/100) suggests high likelihood of going viral. ${weakName.toLowerCase()} (${Math.round(weakValue)}/100) is the only area to watch.`;
    } else if (score >= 60) {
      return `This video shows high viral potential. Excellent ${strongName.toLowerCase()} (${Math.round(strongValue)}/100) is driving engagement. Improve ${weakName.toLowerCase()} (${Math.round(weakValue)}/100) to boost viral chances further.`;
    } else if (score >= 40) {
      return `This video has moderate viral potential. While ${strongName.toLowerCase()} is performing well (${Math.round(strongValue)}/100), strengthening ${weakName.toLowerCase()} could unlock more growth.`;
    } else {
      return `This video has limited viral potential currently. ${weakName.toLowerCase()} (${Math.round(weakValue)}/100) is constraining growth. Focus on engagement quality to improve viral likelihood.`;
    }
  }

  /**
   * Get human-readable factor name
   */
  private static factorName(factor: string): string {
    const names: Record<string, string> = {
      velocityScore: "Engagement Velocity",
      sentimentScore: "Sentiment Momentum",
      commentVelocityScore: "Comment Activity",
      likeRatioScore: "Like Quality",
    };
    return names[factor] || factor;
  }
}

export default ViralPredictorService;
