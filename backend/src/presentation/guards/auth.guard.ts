/**
 * Authentication Guard
 * Requires valid Clerk JWT token for protected routes
 * Throws UnauthorizedException if token is missing or invalid
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
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
 * AuthGuard - Protects routes requiring authentication
 *
 * Flow:
 * 1. Extract Authorization header from request
 * 2. Verify JWT token using Clerk's verifyToken
 * 3. Attach auth data to request object
 * 4. Throw UnauthorizedException if token is missing/invalid
 *
 * Usage:
 * @UseGuards(AuthGuard)
 * @Get('/protected')
 * async protectedRoute(@Req() req: AuthRequest) {
 *   const userId = req.auth?.userId;
 * }
 */
@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const authHeader = request.headers.authorization;

    // Check if Authorization header exists and has Bearer token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        error: 'Unauthorized',
        message: 'No authentication token provided',
      });
    }

    try {
      // Extract token (remove 'Bearer ' prefix)
      const token = authHeader.replace('Bearer ', '');

      // Verify JWT token with Clerk
      const verifiedToken = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      // Validate token has required claims
      if (!verifiedToken || !verifiedToken.sub) {
        throw new UnauthorizedException({
          error: 'Unauthorized',
          message: 'Invalid authentication token',
        });
      }

      // Attach auth info to request for use in controllers
      request.auth = {
        userId: verifiedToken.sub,
        sessionId: verifiedToken.sid as string | undefined,
      };

      return true;
    } catch (error) {
      // Log error for debugging
      console.error('Auth error:', error);

      // Throw UnauthorizedException for any verification failures
      throw new UnauthorizedException({
        error: 'Unauthorized',
        message: 'Authentication failed',
      });
    }
  }
}
