/**
 * Channel Entity
 * Represents a content creator's channel/account across platforms
 */

import { Platform } from '@shared/constants/Platform';

export interface ChannelProps {
  id: string;
  platform: Platform;
  platformChannelId: string;
  name: string;
  thumbnailUrl?: string;
  subscriberCount?: number;
  videoCount?: number;
  viewCount?: number;
  description?: string;
  createdAt?: Date;
  fetchedAt: Date;
}

export class Channel {
  private constructor(
    public readonly id: string,
    public readonly platform: Platform,
    public readonly platformChannelId: string,
    public readonly name: string,
    public readonly fetchedAt: Date,
    public readonly thumbnailUrl?: string,
    public readonly subscriberCount?: number,
    public readonly videoCount?: number,
    public readonly viewCount?: number,
    public readonly description?: string,
    public readonly createdAt?: Date
  ) {}

  /**
   * Create a new Channel entity
   */
  static create(props: ChannelProps): Channel {
    return new Channel(
      props.id,
      props.platform,
      props.platformChannelId,
      props.name,
      props.fetchedAt,
      props.thumbnailUrl,
      props.subscriberCount,
      props.videoCount,
      props.viewCount,
      props.description,
      props.createdAt
    );
  }

  /**
   * Get formatted subscriber count (1K, 1M, etc.)
   */
  getFormattedSubscribers(): string {
    if (!this.subscriberCount) return '0';
    return this.formatNumber(this.subscriberCount);
  }

  /**
   * Get formatted view count
   */
  getFormattedViews(): string {
    if (!this.viewCount) return '0';
    return this.formatNumber(this.viewCount);
  }

  /**
   * Get average views per video
   */
  getAverageViewsPerVideo(): number {
    if (!this.videoCount || !this.viewCount) return 0;
    return Math.floor(this.viewCount / this.videoCount);
  }

  /**
   * Check if channel is verified/large (>100K subscribers)
   */
  isVerified(): boolean {
    return this.subscriberCount !== undefined && this.subscriberCount >= 100000;
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
}
