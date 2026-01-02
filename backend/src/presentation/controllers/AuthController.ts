/**
 * Authentication Controller
 * Handles Clerk webhooks and user profile endpoints
 */

import {
  JsonController,
  Post,
  Get,
  Req,
  Res,
  UseBefore,
} from 'routing-controllers';
import { Request, Response } from 'express';
import { Webhook } from 'svix';
import { PrismaClient } from '@prisma/client';
import { Service } from 'typedi';
import { requireAuth, AuthRequest } from '@presentation/middleware/AuthMiddleware';

const prisma = new PrismaClient();

/**
 * Clerk webhook event type
 */
interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{ email_address: string }>;
    first_name?: string;
    last_name?: string;
    image_url?: string;
  };
}

/**
 * Auth Controller
 * Routes: /api/auth/*
 */
@Service()
@JsonController('/auth')
export class AuthController {
  /**
   * Clerk webhook handler
   * Handles user.created, user.updated, user.deleted events
   * POST /api/auth/webhook
   */
  @Post('/webhook')
  async handleWebhook(
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
      console.error('Missing CLERK_WEBHOOK_SECRET');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Get Svix headers
    const svix_id = req.headers['svix-id'] as string;
    const svix_timestamp = req.headers['svix-timestamp'] as string;
    const svix_signature = req.headers['svix-signature'] as string;

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return res.status(400).json({ error: 'Missing svix headers' });
    }

    // Get the raw body
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    // Verify webhook
    const wh = new Webhook(WEBHOOK_SECRET);
    let evt: ClerkWebhookEvent;

    try {
      evt = wh.verify(rawBody, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as ClerkWebhookEvent;
    } catch (err) {
      console.error('Webhook verification failed:', (err as Error).message);
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    // Handle events
    const eventType = evt.type;
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    try {
      switch (eventType) {
        case 'user.created':
          console.log(`User created: ${id}`);
          await prisma.user.create({
            data: {
              clerkId: id,
              email: email_addresses?.[0]?.email_address || '',
              firstName: first_name,
              lastName: last_name,
              imageUrl: image_url,
            },
          });
          break;

        case 'user.updated':
          console.log(`User updated: ${id}`);
          await prisma.user.update({
            where: { clerkId: id },
            data: {
              email: email_addresses?.[0]?.email_address,
              firstName: first_name,
              lastName: last_name,
              imageUrl: image_url,
            },
          });
          break;

        case 'user.deleted':
          console.log(`User deleted: ${id}`);
          await prisma.user.delete({
            where: { clerkId: id },
          });
          break;

        default:
          console.log(`Unhandled webhook event: ${eventType}`);
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Webhook handler error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  @Get('/me')
  @UseBefore(requireAuth)
  async getCurrentUser(@Req() req: AuthRequest): Promise<any> {
    const userId = req.auth?.userId;

    if (!userId) {
      throw new Error('Unauthorized');
    }

    try {
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: {
          id: true,
          clerkId: true,
          email: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
          tier: true,
          dailyRequests: true,
          lastRequestDate: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Calculate remaining requests
      const tierLimits: Record<string, number> = {
        FREE: 5,
        CREATOR: 100,
        PRO: 500,
        AGENCY: 2000,
      };

      const dailyLimit = tierLimits[user.tier] || 5;
      const today = new Date().toDateString();
      const lastRequest = user.lastRequestDate?.toDateString();

      const remainingRequests =
        lastRequest === today
          ? Math.max(0, dailyLimit - user.dailyRequests)
          : dailyLimit;

      return {
        user,
        rateLimit: {
          limit: dailyLimit,
          remaining: remainingRequests,
          tier: user.tier,
        },
      };
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }
}
