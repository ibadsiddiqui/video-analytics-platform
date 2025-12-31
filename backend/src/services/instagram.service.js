// Instagram Service
// Note: Instagram's official API is restricted to business accounts with OAuth
// This service uses RapidAPI Instagram Scraper as an alternative
// Get your key at: https://rapidapi.com/restyler/api/instagram-scraper-api2

const config = require('../config');

class InstagramService {
  constructor() {
    this.enabled = !!config.rapidApi.key;
    this.baseUrl = 'https://instagram-scraper-api2.p.rapidapi.com';
    
    if (this.enabled) {
      console.log('✅ Instagram API initialized (via RapidAPI)');
    } else {
      console.warn('⚠️  Instagram API not configured (RapidAPI key missing)');
    }
  }

  // Extract shortcode from Instagram URL
  extractShortcode(url) {
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
      if (match) return match[1];
    }

    return null;
  }

  // Fetch post/reel analytics
  async getVideoAnalytics(url) {
    const shortcode = this.extractShortcode(url);
    if (!shortcode) {
      throw new Error('Invalid Instagram URL');
    }

    if (!this.enabled) {
      // Return mock structure for development
      console.warn('Instagram API not configured - returning mock data');
      return this.getMockData(shortcode, url);
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/post_info`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': config.rapidApi.key,
          'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com',
        },
        params: {
          shortcode: shortcode,
        },
      });

      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.status}`);
      }

      const data = await response.json();
      
      return this.transformResponse(data, url);
    } catch (error) {
      console.error('Instagram API error:', error.message);
      throw new Error(`Failed to fetch Instagram post: ${error.message}`);
    }
  }

  // Transform API response to standard format
  transformResponse(data, url) {
    const post = data.data || data;
    
    return {
      platform: 'INSTAGRAM',
      platformVideoId: post.pk || post.id,
      url: url,
      
      // Content info
      title: post.caption?.text?.slice(0, 100) || 'Instagram Post',
      description: post.caption?.text || '',
      thumbnailUrl: post.image_versions2?.candidates?.[0]?.url || 
                    post.thumbnail_url,
      publishedAt: post.taken_at ? new Date(post.taken_at * 1000).toISOString() : null,
      duration: post.video_duration || 0,
      
      // Account info
      channelName: post.user?.username || 'Unknown',
      channelId: post.user?.pk,
      channelThumbnail: post.user?.profile_pic_url,
      channelSubscribers: post.user?.follower_count || 0,
      
      // Statistics
      viewCount: post.play_count || post.view_count || 0,
      likeCount: post.like_count || 0,
      commentCount: post.comment_count || 0,
      shareCount: post.reshare_count || 0,
      
      // Engagement rate
      engagementRate: this.calculateEngagement(post),
      
      // Comments (if available)
      comments: (post.preview_comments || []).map(comment => ({
        id: comment.pk,
        authorName: comment.user?.username,
        content: comment.text,
        likeCount: comment.like_count || 0,
        publishedAt: comment.created_at ? new Date(comment.created_at * 1000).toISOString() : null,
      })),
      
      // Metadata
      fetchedAt: new Date().toISOString(),
      isVideo: post.media_type === 2 || !!post.video_url,
    };
  }

  // Calculate engagement rate
  calculateEngagement(post) {
    const likes = post.like_count || 0;
    const comments = post.comment_count || 0;
    const views = post.play_count || post.view_count || 1;
    
    return parseFloat((((likes + comments) / views) * 100).toFixed(4));
  }

  // Mock data for development
  getMockData(shortcode, url) {
    return {
      platform: 'INSTAGRAM',
      platformVideoId: shortcode,
      url: url,
      
      title: 'Instagram Post (Demo)',
      description: 'This is demo data. Configure RAPIDAPI_KEY to fetch real Instagram analytics.',
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
        { id: '1', authorName: 'user1', content: 'Great content! 🔥', likeCount: 25 },
        { id: '2', authorName: 'user2', content: 'Love this!', likeCount: 18 },
        { id: '3', authorName: 'user3', content: 'Amazing work 👏', likeCount: 12 },
      ],
      
      fetchedAt: new Date().toISOString(),
      isVideo: true,
      isMockData: true,
    };
  }
}

module.exports = new InstagramService();
