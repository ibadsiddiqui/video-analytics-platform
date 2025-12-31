// Main Analytics Service - Orchestrates all analytics functionality
const youtubeService = require('./youtube.service');
const instagramService = require('./instagram.service');
const sentimentService = require('./sentiment.service');
const cacheService = require('./cache.service');

class AnalyticsService {
  constructor() {
    this.platformServices = {
      youtube: youtubeService,
      instagram: instagramService,
    };
  }

  // Detect platform from URL
  detectPlatform(url) {
    const normalized = url.toLowerCase();
    
    if (normalized.includes('youtube.com') || normalized.includes('youtu.be')) {
      return 'youtube';
    }
    if (normalized.includes('instagram.com')) {
      return 'instagram';
    }
    if (normalized.includes('tiktok.com')) {
      return 'tiktok';
    }
    if (normalized.includes('vimeo.com')) {
      return 'vimeo';
    }
    
    return null;
  }

  // Main method: Analyze video from any supported platform
  async analyzeVideo(url, options = {}) {
    const { 
      skipCache = false, 
      includeSentiment = true,
      includeKeywords = true,
    } = options;

    // Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error('Valid URL is required');
    }

    // Detect platform
    const platform = this.detectPlatform(url);
    if (!platform) {
      throw new Error('Unsupported platform. Currently supporting: YouTube, Instagram');
    }

    // Check cache first
    const cacheKey = cacheService.getVideoKey(platform, url);
    if (!skipCache) {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return { ...cached, fromCache: true };
      }
    }

    // Fetch from platform API
    const service = this.platformServices[platform];
    if (!service) {
      throw new Error(`Service not available for platform: ${platform}`);
    }

    const videoData = await service.getVideoAnalytics(url);

    // Perform sentiment analysis on comments
    let sentimentAnalysis = null;
    if (includeSentiment && videoData.comments && videoData.comments.length > 0) {
      sentimentAnalysis = sentimentService.analyzeComments(videoData.comments);
    }

    // Extract keywords and hashtags
    let keywords = [];
    let hashtags = [];
    if (includeKeywords && videoData.comments) {
      const commentTexts = videoData.comments.map(c => c.content);
      keywords = sentimentService.extractKeywords(commentTexts);
      hashtags = sentimentService.extractHashtags([
        videoData.description || '',
        ...commentTexts,
      ]);
    }

    // Generate engagement by day
    const engagementByDay = sentimentService.generateEngagementByDay(
      videoData.viewCount,
      videoData.likeCount,
      videoData.commentCount,
      videoData.publishedAt
    );

    // Generate demographics (simulated - real data requires OAuth)
    const demographics = sentimentService.generateAudienceDemographics();

    // Compile full analytics response
    const analytics = {
      // Video metadata
      video: {
        platform: videoData.platform,
        id: videoData.platformVideoId,
        url: videoData.url,
        title: videoData.title,
        description: videoData.description,
        thumbnail: videoData.thumbnailUrl,
        publishedAt: videoData.publishedAt,
        duration: videoData.duration,
        durationFormatted: this.formatDuration(videoData.duration),
      },
      
      // Channel/Account info
      channel: {
        name: videoData.channelName,
        id: videoData.channelId,
        thumbnail: videoData.channelThumbnail,
        subscribers: videoData.channelSubscribers,
        subscribersFormatted: this.formatNumber(videoData.channelSubscribers),
      },
      
      // Core metrics
      metrics: {
        views: videoData.viewCount,
        viewsFormatted: this.formatNumber(videoData.viewCount),
        likes: videoData.likeCount,
        likesFormatted: this.formatNumber(videoData.likeCount),
        comments: videoData.commentCount,
        commentsFormatted: this.formatNumber(videoData.commentCount),
        shares: videoData.shareCount || 0,
        sharesFormatted: this.formatNumber(videoData.shareCount || 0),
        engagementRate: videoData.engagementRate,
        engagementRateFormatted: `${videoData.engagementRate.toFixed(2)}%`,
      },
      
      // Engagement analysis
      engagement: {
        byDay: engagementByDay,
        peakDay: this.findPeakDay(engagementByDay),
      },
      
      // Sentiment analysis
      sentiment: sentimentAnalysis ? {
        overall: sentimentAnalysis.overall,
        distribution: sentimentAnalysis.distribution,
        totalAnalyzed: sentimentAnalysis.totalAnalyzed,
      } : null,
      
      // Keywords and hashtags
      keywords: keywords,
      hashtags: hashtags,
      
      // Audience demographics
      demographics: demographics,
      
      // Top comments with sentiment
      topComments: sentimentAnalysis?.analyzed?.slice(0, 10) || [],
      
      // Metadata
      meta: {
        fetchedAt: new Date().toISOString(),
        fromCache: false,
        platform: platform,
      },
    };

    // Cache the results
    await cacheService.set(cacheKey, analytics);
    
    // Add to history
    await cacheService.addToHistory(videoData.platformVideoId, {
      timestamp: new Date().toISOString(),
      views: videoData.viewCount,
      likes: videoData.likeCount,
      comments: videoData.commentCount,
    });

    return analytics;
  }

  // Format large numbers (1000 -> 1K, 1000000 -> 1M)
  formatNumber(num) {
    if (num === null || num === undefined) return '0';
    
    num = parseInt(num);
    
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

  // Format duration in seconds to human readable
  formatDuration(seconds) {
    if (!seconds) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  // Find peak engagement day
  findPeakDay(engagementByDay) {
    if (!engagementByDay || engagementByDay.length === 0) return null;
    
    return engagementByDay.reduce((peak, current) => 
      current.engagement > peak.engagement ? current : peak
    );
  }

  // Get video history (for tracking growth over time)
  async getVideoHistory(videoId, days = 7) {
    return await cacheService.getAnalyticsHistory(videoId, days);
  }

  // Compare multiple videos
  async compareVideos(urls) {
    const results = await Promise.all(
      urls.map(url => this.analyzeVideo(url).catch(err => ({ error: err.message, url })))
    );
    
    return {
      videos: results,
      comparison: this.generateComparison(results.filter(r => !r.error)),
    };
  }

  // Generate comparison metrics
  generateComparison(videos) {
    if (videos.length < 2) return null;
    
    const metrics = ['views', 'likes', 'comments', 'engagementRate'];
    const comparison = {};
    
    metrics.forEach(metric => {
      const values = videos.map(v => v.metrics[metric]);
      comparison[metric] = {
        highest: Math.max(...values),
        lowest: Math.min(...values),
        average: values.reduce((a, b) => a + b, 0) / values.length,
        winner: videos[values.indexOf(Math.max(...values))].video.title,
      };
    });
    
    return comparison;
  }
}

module.exports = new AnalyticsService();
