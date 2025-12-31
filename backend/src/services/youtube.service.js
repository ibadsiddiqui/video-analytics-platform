// YouTube Data API Service
const { google } = require('googleapis');
const config = require('../config');

class YouTubeService {
  constructor() {
    this.youtube = null;
    this.enabled = false;
    this.initialize();
  }

  initialize() {
    if (config.youtube.apiKey) {
      this.youtube = google.youtube({
        version: 'v3',
        auth: config.youtube.apiKey,
      });
      this.enabled = true;
      console.log('✅ YouTube API initialized');
    } else {
      console.warn('⚠️  YouTube API key not configured');
    }
  }

  // Extract video ID from various YouTube URL formats
  extractVideoId(url) {
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
      if (match) return match[1];
    }

    return null;
  }

  // Fetch video details and statistics
  async getVideoAnalytics(url) {
    if (!this.enabled) {
      throw new Error('YouTube API not configured');
    }

    const videoId = this.extractVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    try {
      // Fetch video details
      const videoResponse = await this.youtube.videos.list({
        part: ['snippet', 'statistics', 'contentDetails'],
        id: [videoId],
      });

      if (!videoResponse.data.items || videoResponse.data.items.length === 0) {
        throw new Error('Video not found');
      }

      const video = videoResponse.data.items[0];
      const snippet = video.snippet;
      const statistics = video.statistics;
      const contentDetails = video.contentDetails;

      // Parse duration (ISO 8601)
      const duration = this.parseDuration(contentDetails.duration);

      // Fetch channel details for additional context
      const channelResponse = await this.youtube.channels.list({
        part: ['snippet', 'statistics'],
        id: [snippet.channelId],
      });

      const channel = channelResponse.data.items?.[0];

      // Fetch top comments for sentiment analysis
      let comments = [];
      try {
        const commentsResponse = await this.youtube.commentThreads.list({
          part: ['snippet'],
          videoId: videoId,
          maxResults: 100,
          order: 'relevance',
        });
        
        comments = commentsResponse.data.items?.map(item => ({
          id: item.id,
          authorName: item.snippet.topLevelComment.snippet.authorDisplayName,
          content: item.snippet.topLevelComment.snippet.textDisplay,
          likeCount: item.snippet.topLevelComment.snippet.likeCount,
          publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
        })) || [];
      } catch (commentError) {
        console.warn('Comments disabled or unavailable:', commentError.message);
      }

      // Calculate engagement metrics
      const viewCount = parseInt(statistics.viewCount) || 0;
      const likeCount = parseInt(statistics.likeCount) || 0;
      const commentCount = parseInt(statistics.commentCount) || 0;
      
      const engagementRate = viewCount > 0 
        ? ((likeCount + commentCount) / viewCount) * 100 
        : 0;

      return {
        platform: 'YOUTUBE',
        platformVideoId: videoId,
        url: url,
        
        // Video info
        title: snippet.title,
        description: snippet.description,
        thumbnailUrl: snippet.thumbnails?.maxres?.url || 
                      snippet.thumbnails?.high?.url || 
                      snippet.thumbnails?.default?.url,
        publishedAt: snippet.publishedAt,
        duration: duration,
        tags: snippet.tags || [],
        categoryId: snippet.categoryId,
        
        // Channel info
        channelName: snippet.channelTitle,
        channelId: snippet.channelId,
        channelThumbnail: channel?.snippet?.thumbnails?.default?.url,
        channelSubscribers: parseInt(channel?.statistics?.subscriberCount) || 0,
        
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
      console.error('YouTube API error:', error.message);
      throw new Error(`Failed to fetch YouTube video: ${error.message}`);
    }
  }

  // Parse ISO 8601 duration to seconds
  parseDuration(duration) {
    if (!duration) return 0;
    
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  // Search for videos by query (bonus feature)
  async searchVideos(query, maxResults = 10) {
    if (!this.enabled) {
      throw new Error('YouTube API not configured');
    }

    try {
      const response = await this.youtube.search.list({
        part: ['snippet'],
        q: query,
        type: ['video'],
        maxResults,
        order: 'relevance',
      });

      return response.data.items?.map(item => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails?.high?.url,
        channelName: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      })) || [];
    } catch (error) {
      console.error('YouTube search error:', error.message);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  // Get trending videos (bonus feature)
  async getTrendingVideos(regionCode = 'US', maxResults = 10) {
    if (!this.enabled) {
      throw new Error('YouTube API not configured');
    }

    try {
      const response = await this.youtube.videos.list({
        part: ['snippet', 'statistics'],
        chart: 'mostPopular',
        regionCode,
        maxResults,
      });

      return response.data.items?.map(item => ({
        videoId: item.id,
        title: item.snippet.title,
        thumbnailUrl: item.snippet.thumbnails?.high?.url,
        channelName: item.snippet.channelTitle,
        viewCount: parseInt(item.statistics.viewCount) || 0,
        url: `https://www.youtube.com/watch?v=${item.id}`,
      })) || [];
    } catch (error) {
      console.error('Trending fetch error:', error.message);
      throw new Error(`Failed to fetch trending: ${error.message}`);
    }
  }
}

module.exports = new YouTubeService();
