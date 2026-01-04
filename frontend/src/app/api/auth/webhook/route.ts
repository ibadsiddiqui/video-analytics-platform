/**
 * POST /api/auth/webhook
 * Handles Clerk user lifecycle events (created, updated, deleted)
 */

import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { prisma } from '@/lib/prisma';

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

export async function POST(request: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  // Get Svix headers
  const svix_id = request.headers.get('svix-id');
  const svix_timestamp = request.headers.get('svix-timestamp');
  const svix_signature = request.headers.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: 'Missing svix headers' },
      { status: 400 }
    );
  }

  // Get the raw body
  const payload = await request.text();

  // Verify webhook
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: ClerkWebhookEvent;

  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error('Webhook verification failed:', (err as Error).message);
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 400 }
    );
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
