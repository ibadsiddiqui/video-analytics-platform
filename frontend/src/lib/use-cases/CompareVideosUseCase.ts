/**
 * Compare Videos Use Case
 * Compares analytics of multiple videos
 */

import { analyzeVideoUseCase, AnalyticsResult } from './AnalyzeVideoUseCase';

export interface ComparisonMetrics {
  views: {
    highest: number;
    lowest: number;
    average: number;
    winner: string;
  };
  likes: {
    highest: number;
    lowest: number;
    average: number;
    winner: string;
  };
  comments: {
    highest: number;
    lowest: number;
    average: number;
    winner: string;
  };
  engagementRate: {
    highest: number;
    lowest: number;
    average: number;
    winner: string;
  };
}

export interface ComparisonResult {
  videos: Array<AnalyticsResult | { error: string; url: string }>;
  comparison: ComparisonMetrics | null;
  summary: {
    totalVideos: number;
    successfulFetches: number;
    failedFetches: number;
  };
}

export class CompareVideosUseCase {
  constructor(private readonly analyzeVideo = analyzeVideoUseCase) {}

  /**
   * Execute comparison of multiple videos
   */
  async execute(urls: string[]): Promise<ComparisonResult> {
    if (!urls || urls.length === 0) {
      throw new Error('At least one URL is required');
    }

    if (urls.length > 10) {
      throw new Error('Maximum 10 videos can be compared at once');
    }

    // Fetch analytics for all videos
    const results = await Promise.all(
      urls.map((url) =>
        this.analyzeVideo
          .execute(url)
          .catch((err) => ({ error: err.message, url }))
      )
    );

    // Separate successful and failed fetches
    const successfulResults = results.filter(
      (r): r is AnalyticsResult => !('error' in r)
    );
    const failedResults = results.filter((r): r is { error: string; url: string } =>
      'error' in r
    );

    // Generate comparison if we have at least 2 successful results
    const comparison =
      successfulResults.length >= 2 ? this.generateComparison(successfulResults) : null;

    return {
      videos: results,
      comparison,
      summary: {
        totalVideos: urls.length,
        successfulFetches: successfulResults.length,
        failedFetches: failedResults.length,
      },
    };
  }

  /**
   * Generate comparison metrics
   */
  private generateComparison(videos: AnalyticsResult[]): ComparisonMetrics {
    const metrics = ['views', 'likes', 'comments', 'engagementRate'] as const;
    const comparison: any = {};

    metrics.forEach((metric) => {
      const values = videos.map((v) => v.metrics[metric]);
      const highest = Math.max(...values);
      const lowest = Math.min(...values);
      const average = values.reduce((a, b) => a + b, 0) / values.length;

      const winnerIndex = values.indexOf(highest);
      const winnerVideo = videos[winnerIndex];
      const winner = winnerVideo ? winnerVideo.video.title : 'Unknown';

      comparison[metric] = {
        highest,
        lowest,
        average: parseFloat(average.toFixed(2)),
        winner,
      };
    });

    return comparison as ComparisonMetrics;
  }

  /**
   * Get best performing video
   */
  getBestPerforming(videos: AnalyticsResult[]): AnalyticsResult | null {
    if (videos.length === 0) return null;

    return videos.reduce((best, current) =>
      current.metrics.engagementRate > best.metrics.engagementRate ? current : best
    );
  }

  /**
   * Get worst performing video
   */
  getWorstPerforming(videos: AnalyticsResult[]): AnalyticsResult | null {
    if (videos.length === 0) return null;

    return videos.reduce((worst, current) =>
      current.metrics.engagementRate < worst.metrics.engagementRate ? current : worst
    );
  }
}

export const compareVideosUseCase = new CompareVideosUseCase();
