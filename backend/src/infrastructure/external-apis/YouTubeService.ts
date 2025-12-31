/**
 * YouTube Service Implementation
 * Implements IVideoService for YouTube platform
 */

import { Service } from 'typedi';
import { google, youtube_v3 } from 'googleapis';
import { IVideoService, VideoAnalyticsData, VideoComment } from '@domain/interfaces/IVideoService';
import { ConfigService } from '@shared/config';
import { InvalidUrlException } from '@domain/exceptions/InvalidUrlException';
import { VideoNotFoundException } from '@domain/exceptions/VideoNotFoundException';
import { ServiceNotConfiguredException } from '@domain/exceptions/ServiceNotConfiguredException';
import { Platform } from '@shared/constants/Platform';

@Service()
export class YouTubeService implements IVideoService {
  private youtube: youtube_v3.Youtube | null = null;
  private enabled: boolean = false;

  constructor(private readonly configService: ConfigService) {
    this.initialize();
  }

  /**
   * Initialize YouTube API client
   */
  private initialize(): void {
    const apiKey = this.configService.get('YOUTUBE_API_KEY');

    if (apiKey) {
      this.youtube = google.youtube({
        version: 'v3',
        auth: apiKey,
      });
      this.enabled = true;
      console.log('✅ YouTube API initialized');
    } else {
      console.warn('⚠️  YouTube API key not configured');
    }
  }

  /**
   * Check if service is enabled/configured
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Extract video ID from various YouTube URL formats
   */
  extractVideoId(url: string): string | null {
    const patterns = [
      // Standard watch URLs
      /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.+&v=)([a-zA-Z0-9_-]{11})/,
      // Short URLs
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      // Embed URLs
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      // Shorts URLs
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      // Mobile URLs
      /m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) return match[1];
    }

    return null;
  }

  /**
   * Fetch video analytics from YouTube API
   */
  async getVideoAnalytics(url: string, apiKey?: string): Promise<VideoAnalyticsData> {
    // Use provided API key or default
    let youtubeClient = this.youtube;

    if (apiKey) {
      // Create temporary client with provided API key
      youtubeClient = google.youtube({
        version: 'v3',
        auth: apiKey,
      });
    } else if (!this.enabled || !this.youtube) {
      throw new ServiceNotConfiguredException('YouTube', 'YOUTUBE_API_KEY');
    }

    const videoId = this.extractVideoId(url);
    if (!videoId) {
      throw new InvalidUrlException('Invalid YouTube URL');
    }

    try {
      // Fetch video details
      const videoResponse = await youtubeClient!.videos.list({
        part: ['snippet', 'statistics', 'contentDetails'],
        id: [videoId],
      });

      if (!videoResponse.data.items || videoResponse.data.items.length === 0) {
        throw new VideoNotFoundException(`Video not found: ${videoId}`);
      }

      const video = videoResponse.data.items[0];
      if (!video) {
        throw new VideoNotFoundException(`Video not found: ${videoId}`);
      }

      const snippet = video.snippet!;
      const statistics = video.statistics!;
      const contentDetails = video.contentDetails!;

      // Parse duration (ISO 8601 format)
      const duration = this.parseDuration(contentDetails.duration || '');

      // Fetch channel details
      const channelResponse = await youtubeClient!.channels.list({
        part: ['snippet', 'statistics'],
        id: [snippet.channelId!],
      });

      const channel = channelResponse.data.items?.[0];

      // Fetch top comments for sentiment analysis
      const comments = await this.fetchComments(videoId, 100, youtubeClient!);

      // Calculate engagement metrics
      const viewCount = parseInt(statistics.viewCount || '0');
      const likeCount = parseInt(statistics.likeCount || '0');
      const commentCount = parseInt(statistics.commentCount || '0');

      const engagementRate =
        viewCount > 0 ? ((likeCount + commentCount) / viewCount) * 100 : 0;

      return {
        platform: Platform.YOUTUBE,
        platformVideoId: videoId,
        url: url,

        // Video info
        title: snippet.title || '',
        description: snippet.description || undefined,
        thumbnailUrl:
          snippet.thumbnails?.maxres?.url ||
          snippet.thumbnails?.high?.url ||
          snippet.thumbnails?.default?.url ||
          undefined,
        publishedAt: snippet.publishedAt || undefined,
        duration: duration,
        tags: snippet.tags || undefined,
        categoryId: snippet.categoryId || undefined,

        // Channel info
        channelName: snippet.channelTitle || '',
        channelId: snippet.channelId || '',
        channelThumbnail: channel?.snippet?.thumbnails?.default?.url || undefined,
        channelSubscribers: parseInt(channel?.statistics?.subscriberCount || '0'),

        // Statistics
        viewCount,
        likeCount,
        commentCount,
        engagementRate: parseFloat(engagementRate.toFixed(4)),

        // Comments for analysis
        comments,

        // Metadata
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof InvalidUrlException || error instanceof VideoNotFoundException || error instanceof ServiceNotConfiguredException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('YouTube API error:', errorMessage);
      throw new Error(`Failed to fetch YouTube video: ${errorMessage}`);
    }
  }

  /**
   * Fetch comments from a video
   */
  private async fetchComments(
    videoId: string,
    maxResults: number = 100,
    youtubeClient: youtube_v3.Youtube
  ): Promise<VideoComment[]> {
    if (!youtubeClient) return [];

    try {
      const commentsResponse = await youtubeClient.commentThreads.list({
        part: ['snippet'],
        videoId: videoId,
        maxResults: maxResults,
        order: 'relevance',
      });

      if (!commentsResponse.data.items) return [];

      return commentsResponse.data.items.map((item) => {
        const comment = item.snippet!.topLevelComment!.snippet!;
        return {
          id: item.id || '',
          authorName: comment.authorDisplayName || 'Unknown',
          content: this.decodeHtmlEntities(comment.textDisplay || ''),
          likeCount: comment.likeCount || 0,
          publishedAt: comment.publishedAt || undefined,
        };
      });
    } catch (error) {
      console.warn('Comments disabled or unavailable:', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  /**
   * Decode HTML entities and clean comment text
   */
  private decodeHtmlEntities(text: string): string {
    if (!text) return '';

    // Decode HTML entities
    let decoded = text
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/&nbsp;/g, ' ');

    // Remove HTML tags (like <a>, <br>, etc.)
    decoded = decoded.replace(/<[^>]*>/g, '');

    // Clean up extra whitespace
    decoded = decoded.replace(/\s+/g, ' ').trim();

    return decoded;
  }

  /**
   * Parse ISO 8601 duration to seconds
   */
  private parseDuration(duration: string): number {
    if (!duration) return 0;

    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Search for videos by query (bonus feature)
   */
  async searchVideos(
    query: string,
    maxResults: number = 10
  ): Promise<
    Array<{
      videoId: string;
      title: string;
      description: string;
      thumbnailUrl?: string;
      channelName: string;
      publishedAt?: string;
      url: string;
    }>
  > {
    if (!this.enabled || !this.youtube) {
      throw new ServiceNotConfiguredException('YouTube', 'YOUTUBE_API_KEY');
    }

    try {
      const response = await this.youtube.search.list({
        part: ['snippet'],
        q: query,
        type: ['video'],
        maxResults,
        order: 'relevance',
      });

      if (!response.data.items) return [];

      return response.data.items.map((item) => ({
        videoId: item.id?.videoId || '',
        title: item.snippet?.title || '',
        description: item.snippet?.description || '',
        thumbnailUrl: item.snippet?.thumbnails?.high?.url || undefined,
        channelName: item.snippet?.channelTitle || '',
        publishedAt: item.snippet?.publishedAt || undefined,
        url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('YouTube search error:', errorMessage);
      throw new Error(`Search failed: ${errorMessage}`);
    }
  }

  /**
   * Get trending videos (bonus feature)
   */
  async getTrendingVideos(
    regionCode: string = 'US',
    maxResults: number = 10
  ): Promise<
    Array<{
      videoId: string;
      title: string;
      thumbnailUrl?: string;
      channelName: string;
      viewCount: number;
      url: string;
    }>
  > {
    if (!this.enabled || !this.youtube) {
      throw new ServiceNotConfiguredException('YouTube', 'YOUTUBE_API_KEY');
    }

    try {
      const response = await this.youtube.videos.list({
        part: ['snippet', 'statistics'],
        chart: 'mostPopular',
        regionCode,
        maxResults,
      });

      if (!response.data.items) return [];

      return response.data.items.map((item) => ({
        videoId: item.id || '',
        title: item.snippet?.title || '',
        thumbnailUrl: item.snippet?.thumbnails?.high?.url || undefined,
        channelName: item.snippet?.channelTitle || '',
        viewCount: parseInt(item.statistics?.viewCount || '0', 10),
        url: `https://www.youtube.com/watch?v=${item.id}`,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Trending fetch error:', errorMessage);
      throw new Error(`Failed to fetch trending: ${errorMessage}`);
    }
  }
}
