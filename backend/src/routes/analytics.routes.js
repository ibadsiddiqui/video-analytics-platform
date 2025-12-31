// Analytics API Routes
const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analytics.service');
const youtubeService = require('../services/youtube.service');

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Main analytics endpoint
router.post('/analyze', async (req, res, next) => {
  try {
    const { url, options = {} } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format',
      });
    }

    const startTime = Date.now();
    const analytics = await analyticsService.analyzeVideo(url, options);
    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: analytics,
      meta: {
        responseTime: `${responseTime}ms`,
        cached: analytics.fromCache || false,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get analytics by URL (GET version)
router.get('/analyze', async (req, res, next) => {
  try {
    const { url, skipCache } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL query parameter is required',
      });
    }

    const analytics = await analyticsService.analyzeVideo(url, { 
      skipCache: skipCache === 'true' 
    });

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
});

// Compare multiple videos
router.post('/compare', async (req, res, next) => {
  try {
    const { urls } = req.body;
    
    if (!urls || !Array.isArray(urls) || urls.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 URLs are required for comparison',
      });
    }

    if (urls.length > 5) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 5 URLs can be compared at once',
      });
    }

    const comparison = await analyticsService.compareVideos(urls);

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    next(error);
  }
});

// Get video history
router.get('/history/:videoId', async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const { days = 7 } = req.query;

    const history = await analyticsService.getVideoHistory(videoId, parseInt(days));

    res.json({
      success: true,
      data: {
        videoId,
        history,
        days: parseInt(days),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Search YouTube videos
router.get('/youtube/search', async (req, res, next) => {
  try {
    const { q, maxResults = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query (q) is required',
      });
    }

    const results = await youtubeService.searchVideos(q, parseInt(maxResults));

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

// Get YouTube trending videos
router.get('/youtube/trending', async (req, res, next) => {
  try {
    const { region = 'US', maxResults = 10 } = req.query;

    const trending = await youtubeService.getTrendingVideos(region, parseInt(maxResults));

    res.json({
      success: true,
      data: trending,
    });
  } catch (error) {
    next(error);
  }
});

// Detect platform from URL
router.post('/detect-platform', (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'URL is required',
    });
  }

  const platform = analyticsService.detectPlatform(url);

  res.json({
    success: true,
    data: {
      url,
      platform: platform || 'unknown',
      supported: !!platform,
    },
  });
});

module.exports = router;
