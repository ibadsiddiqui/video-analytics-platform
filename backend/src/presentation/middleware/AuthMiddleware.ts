/**
 * Clerk Authentication Middleware
 * Provides authentication, authorization, and rate limiting for the Video Analytics Platform
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';
import { PrismaClient, User, UserTier } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Extended Request interface with authentication data
 */
export interface AuthRequest extends Request {
  auth?: {
    userId: string;
    sessionId?: string;
  };
  rateLimit?: {
    limit: number;
    remaining: number;
  };
  user?: User;
}

/**
 * Middleware that requires authentication (returns 401 if not authenticated)
 * Uses Clerk's JWT token validation
 */
export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided',
      });
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the JWT token with Clerk using @clerk/backend
    const verifiedToken = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    if (!verifiedToken || !verifiedToken.sub) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authentication token',
      });
      return;
    }

    // Attach auth info to request
    req.auth = {
      userId: verifiedToken.sub,
      sessionId: verifiedToken.sid as string | undefined,
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed',
    });
  }
};

/**
 * Middleware that adds auth info but doesn't require it
 * Useful for endpoints that work for both authenticated and anonymous users
 */
export const withAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');

      // Try to verify the JWT token using @clerk/backend
      const verifiedToken = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      if (verifiedToken && verifiedToken.sub) {
        req.auth = {
          userId: verifiedToken.sub,
          sessionId: verifiedToken.sid as string | undefined,
        };
      }
    }

    next();
  } catch (error) {
    // Silently fail - this is optional auth
    console.log('Optional auth failed:', error);
    next();
  }
};

/**
 * Extract user ID from authenticated request
 */
export const getUserId = (req: AuthRequest): string | null => {
  return req.auth?.userId || null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (req: AuthRequest): boolean => {
  return !!req.auth?.userId;
};

/**
 * Rate limit check based on user tier
 * Anonymous users: 5 requests/day
 * FREE: 5 requests/day
 * CREATOR: 100 requests/day
 * PRO: 500 requests/day
 * AGENCY: 2000 requests/day
 */
export const checkRateLimit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = getUserId(req);

  if (!userId) {
    // Unauthenticated users get very limited access
    req.rateLimit = { limit: 5, remaining: 5 };
    return next();
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      // User not found in database - allow minimal access
      req.rateLimit = { limit: 5, remaining: 5 };
      return next();
    }

    // Define limits by tier
    const tierLimits: Record<UserTier, number> = {
      FREE: 5,
      CREATOR: 100,
      PRO: 500,
      AGENCY: 2000,
    };

    const dailyLimit = tierLimits[user.tier] || 5;
    const today = new Date().toDateString();
    const lastRequest = user.lastRequestDate?.toDateString();

    // Reset counter if new day
    if (lastRequest !== today) {
      await prisma.user.update({
        where: { id: user.id },
        data: { dailyRequests: 0, lastRequestDate: new Date() },
      });
      user.dailyRequests = 0;
    }

    if (user.dailyRequests >= dailyLimit) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Daily request limit exceeded',
        limit: dailyLimit,
        tier: user.tier,
        upgrade:
          user.tier === UserTier.FREE
            ? 'Upgrade to Creator for 100 requests/day'
            : null,
      });
      return;
    }

    // Increment counter
    await prisma.user.update({
      where: { id: user.id },
      data: { dailyRequests: { increment: 1 } },
    });

    req.rateLimit = {
      limit: dailyLimit,
      remaining: dailyLimit - user.dailyRequests - 1,
    };
    req.user = user;

    next();
  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow request but with minimal rate limit info
    next();
  }
};
