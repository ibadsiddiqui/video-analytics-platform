/**
 * Get Video History Use Case
 * Retrieves historical analytics data for tracking growth
 */

import { cacheService } from '@/lib/redis';

export interface HistorySnapshot {
  timestamp: string;
  views: number;
  likes: number;
  comments: number;
}

export interface HistoryResult {
  videoId: string;
  snapshots: HistorySnapshot[];
  summary: {
    totalSnapshots: number;
    oldestSnapshot?: string;
    newestSnapshot?: string;
    viewsGrowth?: number;
    likesGrowth?: number;
    commentsGrowth?: number;
  };
}

export class GetVideoHistoryUseCase {
  constructor(private readonly cache = cacheService) {}

  /**
   * Execute - get video history
   */
  async execute(videoId: string, days: number = 7): Promise<HistoryResult> {
    if (!videoId) {
      throw new Error('Video ID is required');
    }

    if (!this.cache.isEnabled()) {
      return {
        videoId,
        snapshots: [],
        summary: {
          totalSnapshots: 0,
        },
      };
    }

    const snapshots = await this.cache.getAnalyticsHistory(videoId, days);

    const summary = this.calculateSummary(snapshots);

    return {
      videoId,
      snapshots,
      summary,
    };
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(snapshots: HistorySnapshot[]): HistoryResult['summary'] {
    if (snapshots.length === 0) {
      return { totalSnapshots: 0 };
    }

    const oldest = snapshots[snapshots.length - 1];
    const newest = snapshots[0];

    if (!oldest || !newest) {
      return { totalSnapshots: snapshots.length };
    }

    const viewsGrowth = newest.views - oldest.views;
    const likesGrowth = newest.likes - oldest.likes;
    const commentsGrowth = newest.comments - oldest.comments;

    return {
      totalSnapshots: snapshots.length,
      oldestSnapshot: oldest.timestamp,
      newestSnapshot: newest.timestamp,
      viewsGrowth,
      likesGrowth,
      commentsGrowth,
    };
  }
}

export const getVideoHistoryUseCase = new GetVideoHistoryUseCase();
