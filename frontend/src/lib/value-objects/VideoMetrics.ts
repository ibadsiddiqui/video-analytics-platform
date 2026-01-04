/**
 * VideoMetrics Value Object
 * Immutable value object representing video performance metrics
 */

export interface VideoMetricsProps {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount?: number;
  engagementRate: number;
}

export class VideoMetrics {
  private constructor(
    public readonly viewCount: number,
    public readonly likeCount: number,
    public readonly commentCount: number,
    public readonly shareCount: number,
    public readonly engagementRate: number
  ) {}

  /**
   * Create new VideoMetrics value object
   */
  static create(props: VideoMetricsProps): VideoMetrics {
    return new VideoMetrics(
      props.viewCount,
      props.likeCount,
      props.commentCount,
      props.shareCount || 0,
      props.engagementRate
    );
  }

  /**
   * Calculate engagement rate from raw metrics
   */
  static calculateEngagementRate(
    viewCount: number,
    likeCount: number,
    commentCount: number,
    shareCount: number = 0
  ): number {
    if (viewCount === 0) return 0;
    const totalEngagement = likeCount + commentCount + shareCount;
    return parseFloat(((totalEngagement / viewCount) * 100).toFixed(4));
  }

  /**
   * Create metrics with auto-calculated engagement rate
   */
  static fromRawData(
    viewCount: number,
    likeCount: number,
    commentCount: number,
    shareCount: number = 0
  ): VideoMetrics {
    const engagementRate = this.calculateEngagementRate(
      viewCount,
      likeCount,
      commentCount,
      shareCount
    );

    return new VideoMetrics(
      viewCount,
      likeCount,
      commentCount,
      shareCount,
      engagementRate
    );
  }

  /**
   * Get total engagement (likes + comments + shares)
   */
  getTotalEngagement(): number {
    return this.likeCount + this.commentCount + this.shareCount;
  }

  /**
   * Get like rate (likes / views)
   */
  getLikeRate(): number {
    if (this.viewCount === 0) return 0;
    return parseFloat(((this.likeCount / this.viewCount) * 100).toFixed(4));
  }

  /**
   * Get comment rate (comments / views)
   */
  getCommentRate(): number {
    if (this.viewCount === 0) return 0;
    return parseFloat(((this.commentCount / this.viewCount) * 100).toFixed(4));
  }

  /**
   * Get formatted engagement rate as string
   */
  getFormattedEngagementRate(): string {
    return `${this.engagementRate.toFixed(2)}%`;
  }

  /**
   * Get formatted view count
   */
  getFormattedViews(): string {
    return this.formatNumber(this.viewCount);
  }

  /**
   * Get formatted like count
   */
  getFormattedLikes(): string {
    return this.formatNumber(this.likeCount);
  }

  /**
   * Get formatted comment count
   */
  getFormattedComments(): string {
    return this.formatNumber(this.commentCount);
  }

  /**
   * Compare with another VideoMetrics to determine performance
   */
  compareWith(other: VideoMetrics): {
    viewsDiff: number;
    likesDiff: number;
    commentsDiff: number;
    engagementDiff: number;
  } {
    return {
      viewsDiff: this.viewCount - other.viewCount,
      likesDiff: this.likeCount - other.likeCount,
      commentsDiff: this.commentCount - other.commentCount,
      engagementDiff: this.engagementRate - other.engagementRate,
    };
  }

  /**
   * Check if metrics indicate viral content (>1M views and >5% engagement)
   */
  isViral(): boolean {
    return this.viewCount >= 1000000 && this.engagementRate >= 5.0;
  }

  /**
   * Check if metrics indicate high engagement (>3%)
   */
  isHighlyEngaged(): boolean {
    return this.engagementRate >= 3.0;
  }

  /**
   * Format large numbers with K, M, B suffixes
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
   * Convert to plain object
   */
  toJSON() {
    return {
      viewCount: this.viewCount,
      likeCount: this.likeCount,
      commentCount: this.commentCount,
      shareCount: this.shareCount,
      engagementRate: this.engagementRate,
      viewsFormatted: this.getFormattedViews(),
      likesFormatted: this.getFormattedLikes(),
      commentsFormatted: this.getFormattedComments(),
      engagementRateFormatted: this.getFormattedEngagementRate(),
    };
  }
}
