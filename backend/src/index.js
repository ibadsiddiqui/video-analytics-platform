// Video Analytics Platform - Backend API Server
const express = require('express');
const cors = require('cors');
const config = require('./config');
const analyticsRoutes = require('./routes/analytics.routes');
const {
  createRateLimiter,
  sanitizeInput,
  validateUrl,
  errorHandler,
  notFoundHandler,
  requestLogger,
  corsOptions,
  helmet,
} = require('./middleware/security');

// Initialize Express app
const app = express();

// ===========================================
// Security Middleware
// ===========================================

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disable for API
}));

// CORS
app.use(cors(corsOptions));

// Rate limiting
app.use(createRateLimiter());

// ===========================================
// Request Processing
// ===========================================

// Parse JSON bodies
app.use(express.json({ limit: '1mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logging
app.use(requestLogger);

// Input sanitization
app.use(sanitizeInput);

// ===========================================
// Routes
// ===========================================

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Video Analytics API',
    version: '1.0.0',
    description: 'Analyze YouTube and Instagram video metrics',
    endpoints: {
      analyze: 'POST /api/analyze',
      compare: 'POST /api/compare',
      history: 'GET /api/history/:videoId',
      youtubeSearch: 'GET /api/youtube/search',
      youtubeTrending: 'GET /api/youtube/trending',
      detectPlatform: 'POST /api/detect-platform',
      health: 'GET /api/health',
    },
    documentation: 'https://github.com/your-username/video-analytics-platform',
  });
});

// API routes with URL validation
app.use('/api', validateUrl, analyticsRoutes);

// ===========================================
// Error Handling
// ===========================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ===========================================
// Server Startup
// ===========================================

const PORT = config.port;

// Only start server if not in serverless environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║   Video Analytics API                     ║
║   Running on http://localhost:${PORT}        ║
╚══════════════════════════════════════════╝

Environment: ${config.nodeEnv}
YouTube API: ${config.youtube.apiKey ? '✅ Configured' : '❌ Not configured'}
Redis Cache: ${config.upstash.url ? '✅ Configured' : '❌ Not configured'}
Instagram API: ${config.rapidApi.key ? '✅ Configured' : '❌ Not configured'}
    `);
  });
}

// Export for Vercel serverless
module.exports = app;
