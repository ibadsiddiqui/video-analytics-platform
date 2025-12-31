/**
 * Video Entity
 * Core domain entity representing a video from any platform
 */

import { Platform } from '@shared/constants/Platform';

export interface VideoProps {
  id: string;
  platform: Platform;
  platformVideoId: string;
  url: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  publishedAt?: Date;
  duration?: number;
  tags?: string[];
  categoryId?: string;
  channelId: string;
  channelName: string;
  fetchedAt: Date;
}

export class Video {
  private constructor(
    public readonly id: string,
    public readonly platform: Platform,
    public readonly platformVideoId: string,
    public readonly url: string,
    public readonly title: string,
    public readonly channelId: string,
    public readonly channelName: string,
    public readonly fetchedAt: Date,
    public readonly description?: string,
    public readonly thumbnailUrl?: string,
    public readonly publishedAt?: Date,
    public readonly duration?: number,
    public readonly tags?: string[],
    public readonly categoryId?: string
  ) {}

  /**
   * Create a new Video entity
   */
  static create(props: VideoProps): Video {
    return new Video(
      props.id,
      props.platform,
      props.platformVideoId,
      props.url,
      props.title,
      props.channelId,
      props.channelName,
      props.fetchedAt,
      props.description,
      props.thumbnailUrl,
      props.publishedAt,
      props.duration,
      props.tags,
      props.categoryId
    );
  }

  /**
   * Get formatted duration (HH:MM:SS or MM:SS)
   */
  getFormattedDuration(): string {
    if (!this.duration) return '0:00';

    const hours = Math.floor(this.duration / 3600);
    const minutes = Math.floor((this.duration % 3600) / 60);
    const seconds = this.duration % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`;
    }

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Check if video is a short-form video (< 60 seconds)
   */
  isShortForm(): boolean {
    return this.duration !== undefined && this.duration < 60;
  }

  /**
   * Check if video is long-form content (> 10 minutes)
   */
  isLongForm(): boolean {
    return this.duration !== undefined && this.duration > 600;
  }

  /**
   * Get age of video in days
   */
  getAgeInDays(): number {
    if (!this.publishedAt) return 0;
    const now = new Date();
    const diff = now.getTime() - this.publishedAt.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}
