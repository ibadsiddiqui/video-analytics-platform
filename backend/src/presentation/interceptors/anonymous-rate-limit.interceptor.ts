/**
 * Anonymous Rate Limit Interceptor
 * Limits anonymous (non-authenticated) users to 5 requests per day
 * Uses Redis for tracking with identifier from IP + browser fingerprint
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request, Response } from 'express';
import { RedisCacheService } from '@infrastructure/cache/RedisCacheService';
import crypto from 'crypto';

/**
 * Extended Request interface with authentication data
 */
interface AuthRequest extends Request {
  auth?: {
    userId: string;
    sessionId?: string;
  };
}

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
      return forwardedFor.split(',')[0]!.trim();
    } else if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
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
 * AnonymousRateLimitInterceptor
 *
 * Limits anonymous users to 5 requests per day
 * Skips rate limiting for authenticated users (they have tier-based limits)
 *
 * Usage:
 * @UseInterceptors(AnonymousRateLimitInterceptor)
 * @Post('analyze')
 * async analyze() {}
 */
@Injectable()
export class AnonymousRateLimitInterceptor implements NestInterceptor {
  constructor(private readonly cacheService: RedisCacheService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const response = context.switchToHttp().getResponse<Response>();

    // Skip rate limiting for authenticated users (they have tier-based limits)
    if (request.auth?.userId) {
      return next.handle();
    }

    try {
      // If Redis is not enabled, log warning and allow request
      if (!this.cacheService.isEnabled()) {
        console.warn('⚠️  Redis not available - anonymous rate limiting disabled');
        return next.handle();
      }

      // Extract IP and fingerprint
      const clientIp = getClientIp(request);
      const fingerprint = getBrowserFingerprint(request);

      // Generate unique identifier
      const identifier = generateAnonymousIdentifier(clientIp, fingerprint);
      const dateString = getCurrentDateString();

      // Increment and check rate limit
      const result = await this.cacheService.incrementAnonymousRequests(
        identifier,
        dateString,
        ANONYMOUS_DAILY_LIMIT
      );

      // Set rate limit headers
      response.setHeader('X-RateLimit-Limit', ANONYMOUS_DAILY_LIMIT.toString());
      response.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      response.setHeader('X-RateLimit-Reset', getMidnightTimestamp().toISOString());

      // Check if limit exceeded
      if (result.count > ANONYMOUS_DAILY_LIMIT) {
        throw new HttpException(
          {
            error: 'Rate limit exceeded',
            message: 'Anonymous users are limited to 5 requests per day. Please sign up for a free account to get more requests.',
            limit: ANONYMOUS_DAILY_LIMIT,
            remaining: 0,
            resetAt: getMidnightTimestamp().toISOString(),
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      // Log rate limit info
      console.log(
        `🔒 Anonymous user (${identifier.substring(0, 8)}...): ${result.count}/${ANONYMOUS_DAILY_LIMIT} requests used`
      );

      return next.handle();
    } catch (error) {
      // If it's already an HttpException, re-throw it
      if (error instanceof HttpException) {
        throw error;
      }

      // On other errors, log and allow request (fail open)
      console.error('Anonymous rate limit error:', error);
      return next.handle();
    }
  }
}
