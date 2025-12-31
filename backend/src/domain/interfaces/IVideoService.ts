/**
 * Video Service Interface
 * Defines contract for platform-specific video analytics services
 */

export interface VideoAnalyticsData {
  platform: string;
  platformVideoId: string;
  url: string;

  // Video info
  title: string;
  description?: string;
  thumbnailUrl?: string;
  publishedAt?: string;
  duration?: number;
  tags?: string[];
  categoryId?: string;

  // Channel info
  channelName: string;
  channelId: string;
  channelThumbnail?: string;
  channelSubscribers?: number;

  // Statistics
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount?: number;
  engagementRate: number;

  // Comments for analysis
  comments: VideoComment[];

  // Metadata
  fetchedAt: string;
}

export interface VideoComment {
  id: string;
  authorName: string;
  content: string;
  likeCount: number;
  publishedAt?: string;
}

/**
 * Platform-specific video service interface
 */
export interface IVideoService {
  /**
   * Extract video ID from platform URL
   * @param url - Video URL
   * @returns Video ID or null if invalid
   */
  extractVideoId(url: string): string | null;

  /**
   * Fetch video analytics from platform API
   * @param url - Video URL
   * @param apiKey - Optional API key to use instead of default
   * @returns Video analytics data
   */
  getVideoAnalytics(url: string, apiKey?: string): Promise<VideoAnalyticsData>;

  /**
   * Check if service is enabled/configured
   */
  isEnabled(): boolean;
}
