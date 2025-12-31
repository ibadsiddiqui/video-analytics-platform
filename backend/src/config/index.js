// Configuration module - loads and validates environment variables
require('dotenv').config();

const config = {
  // Server
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  databaseUrl: process.env.DATABASE_URL,
  
  // Redis (Upstash)
  upstash: {
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  },
  
  // YouTube API
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY,
  },
  
  // RapidAPI (for Instagram)
  rapidApi: {
    key: process.env.RAPIDAPI_KEY,
  },
  
  // CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
  
  // Cache TTL
  cacheTtl: parseInt(process.env.CACHE_TTL_SECONDS) || 3600, // 1 hour
};

// Validate required configuration
const validateConfig = () => {
  const required = [
    ['DATABASE_URL', config.databaseUrl],
    ['UPSTASH_REDIS_REST_URL', config.upstash.url],
    ['UPSTASH_REDIS_REST_TOKEN', config.upstash.token],
    ['YOUTUBE_API_KEY', config.youtube.apiKey],
  ];
  
  const missing = required.filter(([name, value]) => !value);
  
  if (missing.length > 0) {
    console.warn('⚠️  Missing environment variables:', missing.map(([name]) => name).join(', '));
    console.warn('   Some features may not work correctly.');
  }
};

validateConfig();

module.exports = config;
