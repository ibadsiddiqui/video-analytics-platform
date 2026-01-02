/**
 * Anonymous User Rate Limiting Middleware
 * Tracks and limits anonymous (non-authenticated) users to 5 video analyses per day
 *
 * Hybrid Tracking Approach:
 * - Primary: IP address (from req.ip or X-Forwarded-For header)
 * - Secondary: Browser fingerprint (from X-Fingerprint header sent by frontend)
 * - Combined: Both IP and fingerprint for better accuracy
 *
 * Rate Limit: 5 requests per day for anonymous users
 * Storage: Redis with keys: ratelimit:anon:{identifier}:{date}
 * TTL: Expires at midnight (end of day)
 */

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './AuthMiddleware';
import { RedisCacheService } from '@infrastructure/cache/RedisCacheService';
import { Container } from 'typedi';
import crypto from 'crypto';

/**
 * Anonymous rate limit configuration
 */
const ANONYMOUS_DAILY_LIMIT = 5;

/**
 * Get client IP address from request
 * Handles proxy/load balancer scenarios
 */
function getClientIp(req: Request): string {
  // Check X-Forwarded-For header (common in proxy/load balancer setups)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    if (typeof forwardedFor === 'string') {
      // Single string value
      return forwardedFor.split(',')[0]!.trim();
    } else if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
      // Array of values - take first
      const firstIp = forwardedFor[0];
      if (firstIp) {
        return firstIp.split(',')[0]!.trim();
      }
    }
  }

  // Check X-Real-IP header (nginx)
  const realIp = req.headers['x-real-ip'];
  if (realIp && typeof realIp === 'string') {
    return realIp;
  }

  // Fall back to req.ip (Express default)
  return req.ip || 'unknown';
}

/**
 * Get browser fingerprint from request header
 */
function getBrowserFingerprint(req: Request): string | null {
  const fingerprint = req.headers['x-fingerprint'];
  if (fingerprint && typeof fingerprint === 'string') {
    return fingerprint;
  }
  return null;
}

/**
 * Generate anonymous user identifier from IP and fingerprint
 * Uses a combination of both for better accuracy
 */
function generateAnonymousIdentifier(ip: string, fingerprint: string | null): string {
  if (fingerprint) {
    // Hybrid approach: hash combination of IP + fingerprint
    return crypto
      .createHash('sha256')
      .update(`${ip}:${fingerprint}`)
      .digest('hex')
      .substring(0, 16);
  }

  // Fallback: hash IP only
  return crypto
    .createHash('sha256')
    .update(ip)
    .digest('hex')
    .substring(0, 16);
}

/**
 * Get current date string (YYYY-MM-DD format)
 * Used for daily rate limiting
 */
function getCurrentDateString(): string {
  const dateStr = new Date().toISOString().split('T')[0];
  return dateStr || new Date().toISOString().substring(0, 10);
}

/**
 * Get midnight timestamp for reset header
 */
function getMidnightTimestamp(): Date {
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return midnight;
}

/**
 * Anonymous Rate Limiting Middleware
 * Limits anonymous users to 5 requests per day
 *
 * Workflow:
 * 1. Check if user is authenticated (skip if authenticated - they have tier-based limits)
 * 2. Generate anonymous identifier from IP + fingerprint
 * 3. Check Redis for current count
 * 4. If limit exceeded: Return 429 Too Many Requests
 * 5. If allowed: Increment counter and proceed
 * 6. Set response headers with rate limit info
 */
export const anonymousRateLimit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip rate limiting for authenticated users (they have tier-based limits)
    if (req.auth?.userId) {
      return next();
    }

    // Get Redis cache service
    const cacheService = Container.get(RedisCacheService);

    // If Redis is not enabled, log warning and allow request
    if (!cacheService.isEnabled()) {
      console.warn('⚠️  Redis not available - anonymous rate limiting disabled');
      return next();
    }

    // Extract IP and fingerprint
    const clientIp = getClientIp(req);
    const fingerprint = getBrowserFingerprint(req);

    // Generate unique identifier
    const identifier = generateAnonymousIdentifier(clientIp, fingerprint);
    const dateString = getCurrentDateString();

    // Increment and check rate limit
    const result = await cacheService.incrementAnonymousRequests(
      identifier,
      dateString,
      ANONYMOUS_DAILY_LIMIT
    );

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', ANONYMOUS_DAILY_LIMIT.toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', getMidnightTimestamp().toISOString());

    // Check if limit exceeded
    if (result.count > ANONYMOUS_DAILY_LIMIT) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Anonymous users are limited to 5 requests per day. Please sign up for a free account to get more requests.',
        limit: ANONYMOUS_DAILY_LIMIT,
        remaining: 0,
        resetAt: getMidnightTimestamp().toISOString(),
      });
      return;
    }

    // Log rate limit info
    console.log(
      `🔒 Anonymous user (${identifier.substring(0, 8)}...): ${result.count}/${ANONYMOUS_DAILY_LIMIT} requests used`
    );

    next();
  } catch (error) {
    // On error, log and allow request (fail open)
    console.error('Anonymous rate limit error:', error);
    next();
  }
};
