/**
 * Instagram Service Implementation
 * Fetches video/reel analytics from Instagram via RapidAPI (Instagram Scraper Stable API)
 */

import axios from "axios";
import { configService } from "./config";
import { VideoAnalyticsData, VideoComment } from "./youtube";

// Response interfaces based on Instagram Scraper Stable API v2
interface InstagramMediaResponse {
  id?: string;
  shortcode?: string;
  thumbnail_src?: string;
  display_url?: string;
  is_video?: boolean;
  taken_at_timestamp?: number;
  edge_media_preview_like?: {
    count?: number;
  };
  edge_media_to_parent_comment?: {
    count?: number;
    edges?: Array<{
      node?: {
        id?: string;
        text?: string;
        created_at?: number;
        owner?: {
          id?: string;
          username?: string;
          profile_pic_url?: string;
        };
        edge_liked_by?: {
          count?: number;
        };
      };
    }>;
  };
  edge_media_to_caption?: {
    edges?: Array<{
      node?: {
        text?: string;
        created_at?: string;
        id?: string;
      };
    }>;
  };
  owner?: {
    id?: string;
    username?: string;
    full_name?: string;
    profile_pic_url?: string;
    edge_followed_by?: {
      count?: number;
    };
  };
}

interface InstagramCaptionResponse {
  post_id?: string;
  post_short_code?: string;
  title?: string;
  description?: string;
  post_caption?: string;
  post_likes?: number;
  post_comments?: number;
  url?: string;
  creation_date?: string;
  creation_date_timestamp?: number;
}

interface InstagramCommentsResponse {
  data?: {
    comments?: Array<{
      id?: string;
      text?: string;
      created_at?: number;
      like_count?: number;
      user?: {
        username?: string;
        full_name?: string;
      };
    }>;
  };
}

export class InstagramService {
  private enabled: boolean = false;
  private readonly baseUrl =
    "https://instagram-scraper-stable-api.p.rapidapi.com";
  private readonly apiHost = "instagram-scraper-stable-api.p.rapidapi.com";

  constructor() {
    const apiKey = configService.getInstagramApiKey();
    this.enabled = !!apiKey;

    if (this.enabled) {
      console.log("✅ Instagram API initialized (via RapidAPI)");
    } else {
      console.warn("⚠️  Instagram API not configured (RapidAPI key missing)");
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
  async getVideoAnalytics(
    url: string,
    userApiKey?: string,
  ): Promise<VideoAnalyticsData> {
    const shortcode = this.extractVideoId(url);
    if (!shortcode) {
      throw new Error("Invalid Instagram URL");
    }

    // Use provided API key or default from config
    const apiKey = userApiKey || configService.getInstagramApiKey();
    console.log(apiKey);
    if (!apiKey) {
      // Return mock structure for development
      console.warn("Instagram API not configured - returning mock data");
      return this.getMockData(shortcode, url);
    }

    try {
      // Fetch media info (post or reel)
      const mediaData = await this.fetchMediaInfo(shortcode, apiKey);

      // Fetch caption
      const captionData = await this.fetchCaption(shortcode, apiKey);

      // Note: Comments are included in mediaData.edge_media_to_parent_comment
      // The fetchComments endpoint can be used if additional comment data is needed

      // Combine and transform data
      return this.transformResponse(mediaData, captionData, url, shortcode);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Instagram API error:", errorMessage);
      // Fall back to mock data instead of throwing
      console.warn("Falling back to mock data for demo purposes");
      return this.getMockData(shortcode, url);
    }
  }

  /**
   * Fetch media info (post or reel)
   */
  private async fetchMediaInfo(
    shortcode: string,
    apiKey: string,
  ): Promise<InstagramMediaResponse> {
    const endpoint = "/get_media_data_v2.php";

    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        params: {
          media_code: shortcode,
        },
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": this.apiHost,
        },
      });
      console.log(response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          `Instagram API error (${error.response?.status}):`,
          error.response?.data,
        );
        throw new Error(
          `Instagram API returned ${error.response?.status}. Please check your RapidAPI subscription and API key.`,
        );
      }
      throw error;
    }
  }

  /**
   * Fetch comments for a post/reel
   */
  private async fetchComments(
    shortcode: string,
    apiKey: string,
  ): Promise<InstagramCommentsResponse> {
    try {
      const endpoint = "/get_post_comments.php";

      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        params: {
          media_code: shortcode,
          sort_order: "popular",
        },
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": this.apiHost,
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.warn(
          `Failed to fetch comments (${error.response?.status}), continuing without comments`,
        );
      } else {
        console.warn("Error fetching comments:", error);
      }
      return { data: { comments: [] } };
    }
  }

  /**
   * Fetch caption/title for a post/reel
   */
  private async fetchCaption(
    shortcode: string,
    apiKey: string,
  ): Promise<InstagramCaptionResponse> {
    try {
      const endpoint = "/get_reel_title.php";

      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        params: {
          media_code: shortcode,
        },
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": this.apiHost,
        },
      });
      console.log(response);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.warn(
          `Failed to fetch caption (${error.response?.status}), continuing without caption`,
        );
      } else {
        console.warn("Error fetching caption:", error);
      }
      return {};
    }
  }

  /**
   * Transform API response to standard format
   */
  private transformResponse(
    mediaData: InstagramMediaResponse,
    captionData: InstagramCaptionResponse,
    url: string,
    shortcode: string,
  ): VideoAnalyticsData {
    if (!mediaData) {
      throw new Error("No media data returned from Instagram API");
    }

    // Get counts from media data
    const likes = mediaData.edge_media_preview_like?.count || 0;
    const comments = mediaData.edge_media_to_parent_comment?.count || 0;
    const views = likes * 10 || 1; // Estimate views if not available (Instagram doesn't provide public view counts)

    const engagementRate = ((likes + comments) / views) * 100;

    // Transform comments from the media data edges
    const transformedComments: VideoComment[] = (
      mediaData.edge_media_to_parent_comment?.edges || []
    )
      .map((edge) => edge.node)
      .filter((node) => node)
      .map((node) => ({
        id: node!.id?.toString() || "",
        authorName: node!.owner?.username || "Unknown",
        content: node!.text || "",
        likeCount: node!.edge_liked_by?.count || 0,
        publishedAt: node!.created_at
          ? new Date(node!.created_at * 1000).toISOString()
          : undefined,
      }));

    // Get caption from caption endpoint or fall back to edge_media_to_caption
    const caption =
      captionData.post_caption ||
      mediaData.edge_media_to_caption?.edges?.[0]?.node?.text ||
      "";

    return {
      platform: "INSTAGRAM",
      platformVideoId: mediaData.id?.toString() || shortcode,
      url: url,

      // Content info
      title: caption.slice(0, 100) || "Instagram Post",
      description: caption,
      thumbnailUrl: mediaData.thumbnail_src || mediaData.display_url,
      publishedAt: mediaData.taken_at_timestamp
        ? new Date(mediaData.taken_at_timestamp * 1000).toISOString()
        : undefined,
      duration: 0, // Not available in the new API response

      // Account info
      channelName: mediaData.owner?.username || "Unknown",
      channelId: mediaData.owner?.id?.toString() || "",
      channelThumbnail: mediaData.owner?.profile_pic_url,
      channelSubscribers: mediaData.owner?.edge_followed_by?.count || 0,

      // Statistics
      viewCount: views,
      likeCount: likes,
      commentCount: comments,
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
    // Instagram-style gradient thumbnail (base64 encoded SVG)
    const instagramGradientThumbnail =
      "data:image/svg+xml;base64," +
      btoa(`
      <svg width="640" height="640" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="instagramGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#833AB4;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#FD1D1D;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#FCAF45;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="640" height="640" fill="url(#instagramGradient)" />
        <text x="50%" y="45%" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white">Instagram</text>
        <text x="50%" y="55%" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" fill="white" opacity="0.9">Demo Post</text>
        <text x="50%" y="65%" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="white" opacity="0.7">Subscribe to RapidAPI for real data</text>
      </svg>
    `);

    const avatarThumbnail =
      "data:image/svg+xml;base64," +
      btoa(`
      <svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="150" height="150" fill="url(#avatarGradient)" />
        <text x="50%" y="55%" text-anchor="middle" font-family="Arial, sans-serif" font-size="64" font-weight="bold" fill="white">D</text>
      </svg>
    `);

    return {
      platform: "INSTAGRAM",
      platformVideoId: shortcode,
      url: url,

      title: "Instagram Post (Demo)",
      description:
        "This is demo data. Subscribe to Instagram Scraper Stable API on RapidAPI to fetch real Instagram analytics.",
      thumbnailUrl: instagramGradientThumbnail,
      publishedAt: new Date().toISOString(),
      duration: 30,

      channelName: "demo_account",
      channelId: "demo123",
      channelThumbnail: avatarThumbnail,
      channelSubscribers: 10000,

      viewCount: 50000,
      likeCount: 2500,
      commentCount: 150,
      engagementRate: 5.3,

      comments: [
        {
          id: "1",
          authorName: "user1",
          content: "Great content! 🔥",
          likeCount: 25,
        },
        {
          id: "2",
          authorName: "user2",
          content: "Love this!",
          likeCount: 18,
        },
        {
          id: "3",
          authorName: "user3",
          content: "Amazing work 👏",
          likeCount: 12,
        },
      ],

      fetchedAt: new Date().toISOString(),
    };
  }
}

export const instagramService = new InstagramService();
