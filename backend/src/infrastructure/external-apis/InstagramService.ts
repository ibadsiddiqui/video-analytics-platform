/**
 * Instagram Service Implementation
 * Implements IVideoService for Instagram platform
 * Note: Instagram's official API is restricted to business accounts with OAuth
 * This service uses RapidAPI Instagram Scraper as an alternative
 */

import { Injectable } from '@nestjs/common';
import { IVideoService, VideoAnalyticsData, VideoComment } from '@domain/interfaces/IVideoService';
import { ConfigService } from '@shared/config';
import { InvalidUrlException } from '@domain/exceptions/InvalidUrlException';
import { Platform } from '@shared/constants/Platform';

interface InstagramPost {
  pk?: string;
  id?: string;
  caption?: { text?: string };
  image_versions2?: { candidates?: Array<{ url?: string }> };
  thumbnail_url?: string;
  taken_at?: number;
  video_duration?: number;
  user?: {
    username?: string;
    pk?: string;
    profile_pic_url?: string;
    follower_count?: number;
  };
  play_count?: number;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  reshare_count?: number;
  preview_comments?: Array<{
    pk?: string;
    user?: { username?: string };
    text?: string;
    like_count?: number;
    created_at?: number;
  }>;
  media_type?: number;
  video_url?: string;
}

@Injectable()
export class InstagramService implements IVideoService {
  private enabled: boolean = false;
  private readonly baseUrl = 'https://instagram-scraper-api2.p.rapidapi.com';

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get('RAPIDAPI_KEY');
    this.enabled = !!apiKey;

    if (this.enabled) {
      console.log('✅ Instagram API initialized (via RapidAPI)');
    } else {
      console.warn('⚠️  Instagram API not configured (RapidAPI key missing)');
    }
  }

  /**
   * Check if service is enabled/configured
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Extract shortcode from Instagram URL
   */
  extractVideoId(url: string): string | null {
    const patterns = [
      // Reels
      /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
      // Posts
      /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
      // TV
      /instagram\.com\/tv\/([A-Za-z0-9_-]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) return match[1];
    }

    return null;
  }

  /**
   * Fetch post/reel analytics from Instagram
   */
  async getVideoAnalytics(url: string, _apiKey?: string): Promise<VideoAnalyticsData> {
    // Note: _apiKey parameter is not used for Instagram (for interface compatibility)
    const shortcode = this.extractVideoId(url);
    if (!shortcode) {
      throw new InvalidUrlException('Invalid Instagram URL');
    }

    if (!this.enabled) {
      // Return mock structure for development
      console.warn('Instagram API not configured - returning mock data');
      return this.getMockData(shortcode, url);
    }

    try {
      const apiKey = this.configService.get('RAPIDAPI_KEY');

      const response = await fetch(`${this.baseUrl}/v1/post_info?shortcode=${shortcode}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': apiKey || '',
          'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com',
        },
      });

      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.status}`);
      }

      const data = await response.json();
      return this.transformResponse(data, url);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Instagram API error:', errorMessage);
      throw new Error(`Failed to fetch Instagram post: ${errorMessage}`);
    }
  }

  /**
   * Transform API response to standard format
   */
  private transformResponse(data: any, url: string): VideoAnalyticsData {
    const post: InstagramPost = data.data || data;

    const likes = post.like_count || 0;
    const comments = post.comment_count || 0;
    const views = post.play_count || post.view_count || 1;

    const engagementRate = ((likes + comments) / views) * 100;

    // Transform comments
    const transformedComments: VideoComment[] = (post.preview_comments || []).map((comment) => ({
      id: comment.pk?.toString() || '',
      authorName: comment.user?.username || 'Unknown',
      content: comment.text || '',
      likeCount: comment.like_count || 0,
      publishedAt: comment.created_at
        ? new Date(comment.created_at * 1000).toISOString()
        : undefined,
    }));

    return {
      platform: Platform.INSTAGRAM,
      platformVideoId: post.pk?.toString() || post.id?.toString() || '',
      url: url,

      // Content info
      title: post.caption?.text?.slice(0, 100) || 'Instagram Post',
      description: post.caption?.text,
      thumbnailUrl: post.image_versions2?.candidates?.[0]?.url || post.thumbnail_url,
      publishedAt: post.taken_at ? new Date(post.taken_at * 1000).toISOString() : undefined,
      duration: post.video_duration || 0,

      // Account info
      channelName: post.user?.username || 'Unknown',
      channelId: post.user?.pk?.toString() || '',
      channelThumbnail: post.user?.profile_pic_url,
      channelSubscribers: post.user?.follower_count || 0,

      // Statistics
      viewCount: views,
      likeCount: likes,
      commentCount: comments,
      shareCount: post.reshare_count,
      engagementRate: parseFloat(engagementRate.toFixed(4)),

      // Comments
      comments: transformedComments,

      // Metadata
      fetchedAt: new Date().toISOString(),
    };
  }

  /**
   * Mock data for development (when API key not configured)
   */
  private getMockData(shortcode: string, url: string): VideoAnalyticsData {
    return {
      platform: Platform.INSTAGRAM,
      platformVideoId: shortcode,
      url: url,

      title: 'Instagram Post (Demo)',
      description:
        'This is demo data. Configure RAPIDAPI_KEY to fetch real Instagram analytics.',
      thumbnailUrl: 'https://via.placeholder.com/640x640?text=Instagram+Post',
      publishedAt: new Date().toISOString(),
      duration: 30,

      channelName: 'demo_account',
      channelId: 'demo123',
      channelThumbnail: 'https://via.placeholder.com/150?text=Avatar',
      channelSubscribers: 10000,

      viewCount: 50000,
      likeCount: 2500,
      commentCount: 150,
      shareCount: 100,
      engagementRate: 5.3,

      comments: [
        {
          id: '1',
          authorName: 'user1',
          content: 'Great content! 🔥',
          likeCount: 25,
        },
        {
          id: '2',
          authorName: 'user2',
          content: 'Love this!',
          likeCount: 18,
        },
        {
          id: '3',
          authorName: 'user3',
          content: 'Amazing work 👏',
          likeCount: 12,
        },
      ],

      fetchedAt: new Date().toISOString(),
    };
  }
}
