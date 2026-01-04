/**
 * Optional Authentication Guard
 * Attempts to verify Clerk JWT token but allows request to proceed regardless
 * Useful for endpoints that work for both authenticated and anonymous users
 */

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import { Request } from 'express';

/**
 * Extended Request interface with authentication data
 */
export interface AuthRequest extends Request {
  auth?: {
    userId: string;
    sessionId?: string;
  };
}

/**
 * OptionalAuthGuard - Adds auth info when available but doesn't require it
 *
 * Flow:
 * 1. Extract Authorization header from request
 * 2. If present, attempt to verify JWT token using Clerk
 * 3. If valid, attach auth data to request object
 * 4. If missing or invalid, silently continue (request proceeds)
 * 5. Always returns true
 *
 * Usage:
 * @UseGuards(OptionalAuthGuard)
 * @Get('/public-or-private')
 * async mixedRoute(@Req() req: AuthRequest) {
 *   if (req.auth?.userId) {
 *     // User is authenticated
 *   } else {
 *     // Anonymous user
 *   }
 * }
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const authHeader = request.headers.authorization;

    // If no auth header, just continue (this is optional)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return true;
    }

    try {
      // Extract token (remove 'Bearer ' prefix)
      const token = authHeader.replace('Bearer ', '');

      // Try to verify JWT token with Clerk
      const verifiedToken = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      // If valid, attach auth info to request
      if (verifiedToken && verifiedToken.sub) {
        request.auth = {
          userId: verifiedToken.sub,
          sessionId: verifiedToken.sid as string | undefined,
        };
      }
    } catch (error) {
      // Silently fail - this is optional auth
      console.log('Optional auth failed:', error);
    }

    // Always allow request to proceed
    return true;
  }
}
