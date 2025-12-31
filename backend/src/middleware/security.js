// Security and Error Handling Middleware
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
const config = require('../config');

// Rate limiter configuration
const createRateLimiter = () => {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
      success: false,
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.ip || req.headers['x-forwarded-for'] || 'anonymous';
    },
  });
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Escape HTML and trim
        req.body[key] = validator.escape(validator.trim(req.body[key]));
      }
    });
  }

  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = validator.escape(validator.trim(req.query[key]));
      }
    });
  }

  next();
};

// URL validation middleware for analytics endpoints
const validateUrl = (req, res, next) => {
  const url = req.body?.url || req.query?.url;
  
  if (url) {
    // Unescape URL for validation (we escaped it in sanitization)
    const unescapedUrl = validator.unescape(url);
    
    if (!validator.isURL(unescapedUrl, { 
      protocols: ['http', 'https'],
      require_protocol: true,
    })) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format. Must be a valid HTTP/HTTPS URL.',
      });
    }

    // Whitelist allowed domains
    const allowedDomains = [
      'youtube.com',
      'youtu.be',
      'www.youtube.com',
      'm.youtube.com',
      'instagram.com',
      'www.instagram.com',
      'tiktok.com',
      'www.tiktok.com',
      'vimeo.com',
      'www.vimeo.com',
    ];

    try {
      const parsedUrl = new URL(unescapedUrl);
      const domain = parsedUrl.hostname.toLowerCase();
      
      if (!allowedDomains.some(allowed => domain === allowed || domain.endsWith('.' + allowed))) {
        return res.status(400).json({
          success: false,
          error: 'Unsupported platform. Supported: YouTube, Instagram, TikTok, Vimeo',
        });
      }
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL',
      });
    }

    // Store unescaped URL for processing
    if (req.body?.url) req.body.url = unescapedUrl;
    if (req.query?.url) req.query.url = unescapedUrl;
  }

  next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      error: 'External service unavailable. Please try again later.',
    });
  }

  // Handle YouTube API specific errors
  if (err.message?.includes('quotaExceeded')) {
    return res.status(429).json({
      success: false,
      error: 'API quota exceeded. Please try again later.',
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message = config.nodeEnv === 'production' 
    ? 'An unexpected error occurred'
    : err.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(config.nodeEnv !== 'production' && { stack: err.stack }),
  });
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`
    );
  });

  next();
};

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      config.frontendUrl,
      'http://localhost:3000',
      'http://localhost:5173',
      /\.vercel\.app$/,
    ];

    const allowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) return allowed.test(origin);
      return allowed === origin;
    });

    if (allowed) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = {
  createRateLimiter,
  sanitizeInput,
  validateUrl,
  errorHandler,
  notFoundHandler,
  requestLogger,
  corsOptions,
  helmet,
};
