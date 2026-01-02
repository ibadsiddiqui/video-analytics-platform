# 🚀 Video Analytics Platform - Feature Roadmap

## Overview

This document outlines the complete feature roadmap for the Video Analytics Platform. Each feature includes detailed implementation instructions designed for Claude Code agents to execute autonomously.

**Current Stack:**
- Frontend: Next.js 15, React 19, Tailwind CSS, Framer Motion, Recharts
- Backend: TypeScript, Node.js, Express, Prisma ORM, PostgreSQL
- Cache: Upstash Redis
- APIs: YouTube Data API v3, RapidAPI (Instagram)
- Deployment: Vercel (Serverless)

---

# 📋 Table of Contents

1. [Phase 1: Core Infrastructure](#phase-1-core-infrastructure)
   - [1.1 Authentication System (Clerk)](#11-authentication-system-clerk)
   - [1.2 User API Key Management](#12-user-api-key-management)
   - [1.3 Anonymous User Rate Limiting](#13-anonymous-user-rate-limiting)
2. [Phase 2: Competitive Intelligence](#phase-2-competitive-intelligence)
3. [Phase 3: Predictive Analytics](#phase-3-predictive-analytics)
4. [Phase 4: Content Strategy Tools](#phase-4-content-strategy-tools)
5. [Phase 5: Audience Analytics](#phase-5-audience-analytics)
6. [Phase 6: Monetization Insights](#phase-6-monetization-insights)
7. [Phase 7: Trend Detection & Alerts](#phase-7-trend-detection--alerts)
8. [Phase 8: Cross-Platform Analytics](#phase-8-cross-platform-analytics)
9. [Phase 9: Campaign & Collaboration](#phase-9-campaign--collaboration)
10. [Phase 10: Comment Intelligence](#phase-10-comment-intelligence)
11. [Phase 11: Reporting & Export](#phase-11-reporting--export)

---

# Phase 1: Core Infrastructure

## 1.1 Authentication System (Clerk)

### Feature Description
Implement user authentication using Clerk (chosen for ease of setup, generous free tier of 10,000 MAUs, and React SDK). Users can sign up/sign in via email, Google, or GitHub.

### Why Clerk over Auth0?
- **Free Tier**: Clerk offers 10,000 MAUs free vs Auth0's 7,000
- **React Integration**: First-class React hooks and components
- **Simpler Setup**: No complex configuration required
- **Built-in UI**: Pre-built sign-in/sign-up components
- **Webhook Support**: Easy event handling for user lifecycle

### Technical Specifications

```
Dependencies to Install:
- Frontend: @clerk/clerk-react
- Backend: @clerk/clerk-sdk-node, svix (for webhooks)

Environment Variables:
- VITE_CLERK_PUBLISHABLE_KEY (frontend)
- CLERK_SECRET_KEY (backend)
- CLERK_WEBHOOK_SECRET (backend, for webhooks)
```

### Database Schema Changes

```prisma
// Add to prisma/schema.prisma

model User {
  id              String    @id @default(cuid())
  clerkId         String    @unique
  email           String    @unique
  firstName       String?
  lastName        String?
  imageUrl        String?
  
  // Subscription tier
  tier            UserTier  @default(FREE)
  
  // Usage tracking
  dailyRequests   Int       @default(0)
  lastRequestDate DateTime?
  
  // Relations
  apiKeys         UserApiKey[]
  analyses        VideoAnalysis[]
  competitors     CompetitorTrack[]
  campaigns       Campaign[]
  alerts          Alert[]
  reports         Report[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([clerkId])
  @@index([email])
}

enum UserTier {
  FREE
  CREATOR
  PRO
  AGENCY
}
```

### Implementation Steps for Claude Code

#### Step 1: Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install @clerk/clerk-sdk-node svix
```

**Create file: `backend/src/middleware/auth.middleware.ts`**

```typescript
// Clerk Authentication Middleware
import { ClerkExpressRequireAuth, ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient, User, UserTier } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  auth?: {
    userId: string;
  };
  rateLimit?: {
    limit: number;
    remaining: number;
  };
  user?: User;
}

// Middleware that requires authentication (returns 401 if not authenticated)
export const requireAuth = ClerkExpressRequireAuth({
  // Optional: customize error handling
  onError: (err: Error) => {
    console.error('Auth error:', err);
  }
});

// Middleware that adds auth info but doesn't require it
export const withAuth = ClerkExpressWithAuth();

// Extract user ID from authenticated request
export const getUserId = (req: AuthRequest): string | null => {
  return req.auth?.userId || null;
};

// Check if user is authenticated
export const isAuthenticated = (req: AuthRequest): boolean => {
  return !!req.auth?.userId;
};

// Rate limit check based on user tier
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
      where: { clerkId: userId }
    });

    if (!user) {
      req.rateLimit = { limit: 5, remaining: 5 };
      return next();
    }

    // Define limits by tier
    const tierLimits: Record<UserTier, number> = {
      FREE: 5,
      CREATOR: 100,
      PRO: 500,
      AGENCY: 2000
    };

    const dailyLimit = tierLimits[user.tier] || 5;
    const today = new Date().toDateString();
    const lastRequest = user.lastRequestDate?.toDateString();

    // Reset counter if new day
    if (lastRequest !== today) {
      await prisma.user.update({
        where: { id: user.id },
        data: { dailyRequests: 0, lastRequestDate: new Date() }
      });
      user.dailyRequests = 0;
    }

    if (user.dailyRequests >= dailyLimit) {
      res.status(429).json({
        error: 'Daily request limit exceeded',
        limit: dailyLimit,
        tier: user.tier,
        upgrade: user.tier === 'FREE' ? 'Upgrade to Creator for 100 requests/day' : null
      });
      return;
    }

    // Increment counter
    await prisma.user.update({
      where: { id: user.id },
      data: { dailyRequests: { increment: 1 } }
    });

    req.rateLimit = {
      limit: dailyLimit,
      remaining: dailyLimit - user.dailyRequests - 1
    };
    req.user = user;

    next();
  } catch (error) {
    console.error('Rate limit check error:', error);
    next();
  }
};
```

**Create file: `backend/src/routes/auth.routes.ts`**

```typescript
// Authentication Routes - Webhook handler for Clerk events
import express, { Request, Response, Router } from 'express';
import { Webhook } from 'svix';
import { PrismaClient } from '@prisma/client';

const router: Router = express.Router();
const prisma = new PrismaClient();

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

// Clerk webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Get headers
  const svix_id = req.headers['svix-id'] as string;
  const svix_timestamp = req.headers['svix-timestamp'] as string;
  const svix_signature = req.headers['svix-signature'] as string;

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: 'Missing svix headers' });
  }

  // Verify webhook
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: ClerkWebhookEvent;

  try {
    evt = wh.verify(req.body, {
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
        await prisma.user.create({
          data: {
            clerkId: id,
            email: email_addresses[0]?.email_address,
            firstName: first_name,
            lastName: last_name,
            imageUrl: image_url,
            tier: 'FREE'
          }
        });
        console.log(`User created: ${id}`);
        break;
        
      case 'user.updated':
        await prisma.user.update({
          where: { clerkId: id },
          data: {
            email: email_addresses[0]?.email_address,
            firstName: first_name,
            lastName: last_name,
            imageUrl: image_url
          }
        });
        console.log(`User updated: ${id}`);
        break;
        
      case 'user.deleted':
        await prisma.user.delete({
          where: { clerkId: id }
        });
        console.log(`User deleted: ${id}`);
        break;
        
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Get current user profile
router.get('/me', async (req: Request, res: Response) => {
  const { getUserId } = await import('../middleware/auth.middleware');

  try {
    const userId = getUserId(req as any);
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        apiKeys: {
          select: {
            id: true,
            platform: true,
            createdAt: true,
            lastUsedAt: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      tier: user.tier,
      dailyRequests: user.dailyRequests,
      apiKeys: user.apiKeys
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

export default router;
```

**Update: `backend/src/index.ts`**

Add the following to integrate auth routes:

```typescript
// Add after other imports
import authRoutes from './routes/auth.routes';
import { withAuth, checkRateLimit } from './middleware/auth.middleware';

// Add after CORS middleware
app.use(withAuth);

// Add auth routes (before /api routes)
app.use('/auth', authRoutes);

// Update API routes to use rate limiting
app.use('/api', checkRateLimit, validateUrl, analyticsRoutes);
```

#### Step 2: Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install Clerk
npm install @clerk/clerk-react
```

**Update: `frontend/src/app/layout.tsx` (Next.js 15 App Router)**

```typescript
import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import './globals.css';

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
}

export const metadata: Metadata = {
  title: 'Video Analytics Platform',
  description: 'Analyze video performance across platforms',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

**Create file: `frontend/src/components/AuthButton.tsx`**

```typescript
'use client';

import React from 'react';
import {
  SignInButton,
  SignUpButton,
  UserButton,
  useUser
} from '@clerk/nextjs';
import { User, LogIn } from 'lucide-react';

export default function AuthButton() {
  const { isSignedIn, user, isLoaded } = useUser();
  
  if (!isLoaded) {
    return (
      <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" />
    );
  }
  
  if (isSignedIn) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600 hidden sm:block">
          {user.firstName || user.emailAddresses[0]?.emailAddress}
        </span>
        <UserButton 
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: 'w-10 h-10'
            }
          }}
        />
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2">
      <SignInButton mode="modal">
        <button className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors">
          <LogIn className="w-4 h-4" />
          <span className="hidden sm:inline">Sign In</span>
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
          <User className="w-4 h-4" />
          <span>Sign Up</span>
        </button>
      </SignUpButton>
    </div>
  );
}
```

**Create file: `frontend/src/components/ProtectedRoute.tsx`**

```typescript
'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isSignedIn, isLoaded } = useUser();
  
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader" />
      </div>
    );
  }
  
  if (!isSignedIn) {
    redirect('/sign-in');
  }

  return <>{children}</>;
}
```

**Update: `frontend/src/components/Header.jsx`**

Add AuthButton to the header navigation.

#### Step 3: Environment Variables

**Backend `.env` additions:**
```env
# Clerk Authentication
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# System API Rate Limits (requests per day for unauthenticated/free users)
SYSTEM_API_DAILY_LIMIT=5
```

**Frontend `.env` additions:**
```env
# Clerk Authentication (Next.js uses NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
```

### Clerk Dashboard Setup

1. Go to https://dashboard.clerk.com
2. Create a new application
3. Enable sign-in methods: Email, Google, GitHub
4. Get Publishable Key and Secret Key
5. Set up webhook endpoint: `https://your-backend.vercel.app/auth/webhook`
6. Subscribe to events: `user.created`, `user.updated`, `user.deleted`

### Acceptance Criteria

- [ ] Users can sign up with email/Google/GitHub
- [ ] Users can sign in and see their profile in header
- [ ] Protected routes redirect to sign-in
- [ ] User data syncs to database via webhooks
- [ ] Rate limiting works based on user tier
- [ ] Sign out clears session properly

---

## 1.2 User API Key Management

### Feature Description
Allow users to save their own API keys for YouTube, Instagram, TikTok, etc. Keys are encrypted at rest using AES-256-GCM. Users can choose to use their own keys (unlimited requests) or the system's shared keys (rate limited).

### Technical Specifications

```
Dependencies to Install:
- Backend: crypto (built-in Node.js)

Encryption: AES-256-GCM
- Key derivation from ENCRYPTION_MASTER_KEY env var
- Unique IV per encryption
- Auth tag for integrity verification
```

### Database Schema Changes

```prisma
// Add to prisma/schema.prisma

model UserApiKey {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  platform        ApiPlatform
  encryptedKey    String    // AES-256-GCM encrypted
  iv              String    // Initialization vector
  authTag         String    // Authentication tag
  
  // Metadata
  label           String?   // User-friendly name like "My YouTube Key"
  isActive        Boolean   @default(true)
  lastUsedAt      DateTime?
  usageCount      Int       @default(0)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([userId, platform])
  @@index([userId])
}

enum ApiPlatform {
  YOUTUBE
  INSTAGRAM
  TIKTOK
  TWITTER
  RAPIDAPI
}
```

### Implementation Steps for Claude Code

#### Step 1: Create Encryption Service

**Create file: `backend/src/services/encryption.service.ts`**

```typescript
// AES-256-GCM Encryption Service for API Keys
import crypto from 'crypto';

interface EncryptionResult {
  encrypted: string;
  iv: string;
  authTag: string;
}

class EncryptionService {
  private algorithm: string = 'aes-256-gcm';
  private masterKey: Buffer;

  constructor() {
    const envKey = process.env.ENCRYPTION_MASTER_KEY;

    // SECURITY FIX: Fail fast if encryption key is not properly configured
    if (!envKey || envKey.length < 32) {
      throw new Error(
        'CRITICAL: ENCRYPTION_MASTER_KEY must be set and at least 32 characters. ' +
        'Generate one with: openssl rand -hex 32'
      );
    }

    // Ensure key is exactly 32 bytes for AES-256
    this.masterKey = Buffer.from(envKey.slice(0, 32), 'utf-8');
  }

  /**
   * Encrypt a plaintext string
   * @param plaintext - The text to encrypt
   * @returns Object containing encrypted data, IV, and auth tag
   */
  encrypt(plaintext: string): EncryptionResult {
    if (!plaintext) {
      throw new Error('Plaintext is required');
    }

    // Generate random IV (12 bytes for GCM)
    const iv = crypto.randomBytes(12);

    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);

    // Encrypt
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get auth tag
    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  /**
   * Decrypt an encrypted string
   * @param encrypted - The encrypted hex string
   * @param ivHex - The IV as hex string
   * @param authTagHex - The auth tag as hex string
   * @returns The decrypted plaintext
   */
  decrypt(encrypted: string, ivHex: string, authTagHex: string): string {
    if (!encrypted || !ivHex || !authTagHex) {
      throw new Error('Encrypted data, IV, and auth tag are required');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    // Create decipher
    const decipher = crypto.createDecipheriv(this.algorithm, this.masterKey, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Mask an API key for display (show first 4 and last 4 chars)
   * @param key - The API key
   * @returns Masked key like "AIza...7x9k"
   */
  maskKey(key: string): string {
    if (!key || key.length < 8) {
      return '****';
    }
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  }
}

export default new EncryptionService();
```

#### Step 2: Create API Keys Routes

**Create file: `backend/src/routes/apikeys.routes.ts`**

```typescript
// User API Keys Management Routes
import express, { Request, Response, Router } from 'express';
import { PrismaClient, ApiPlatform } from '@prisma/client';
import { requireAuth, getUserId } from '../middleware/auth.middleware';
import encryptionService from '../services/encryption.service';
import validator from 'validator';

const router: Router = express.Router();
const prisma = new PrismaClient();

interface PlatformValidation {
  pattern: RegExp;
  message: string;
}

// Validation rules for different platforms
const platformValidation: Record<string, PlatformValidation> = {
  YOUTUBE: {
    pattern: /^AIza[0-9A-Za-z-_]{35}$/,
    message: 'YouTube API key should start with "AIza" and be 39 characters'
  },
  RAPIDAPI: {
    pattern: /^[a-f0-9]{50}$/i,
    message: 'RapidAPI key should be 50 hexadecimal characters'
  },
  TWITTER: {
    pattern: /^[A-Za-z0-9]{25,}$/,
    message: 'Twitter API key should be at least 25 alphanumeric characters'
  },
  // Add more platform validations as needed
};

// Get all API keys for current user (masked)
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req as any);
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const apiKeys = await prisma.userApiKey.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        platform: true,
        label: true,
        isActive: true,
        lastUsedAt: true,
        usageCount: true,
        createdAt: true,
        // Don't return encrypted data
        encryptedKey: true,
        iv: true,
        authTag: true
      }
    });
    
    // Mask the keys for display
    const maskedKeys = apiKeys.map(key => {
      const decrypted = encryptionService.decrypt(key.encryptedKey, key.iv, key.authTag);
      return {
        id: key.id,
        platform: key.platform,
        label: key.label,
        maskedKey: encryptionService.maskKey(decrypted),
        isActive: key.isActive,
        lastUsedAt: key.lastUsedAt,
        usageCount: key.usageCount,
        createdAt: key.createdAt
      };
    });
    
    res.json({ apiKeys: maskedKeys });
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ error: 'Failed to retrieve API keys' });
  }
});

// Add new API key
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req as any);
    const { platform, apiKey, label }: { platform: ApiPlatform; apiKey: string; label?: string } = req.body;
    
    // Validate platform
    const validPlatforms = ['YOUTUBE', 'INSTAGRAM', 'TIKTOK', 'TWITTER', 'RAPIDAPI'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({ 
        error: 'Invalid platform',
        validPlatforms 
      });
    }
    
    // Validate API key format (if validation exists for platform)
    if (platformValidation[platform]) {
      const { pattern, message } = platformValidation[platform];
      if (!pattern.test(apiKey)) {
        return res.status(400).json({ 
          error: 'Invalid API key format',
          message 
        });
      }
    }
    
    // Sanitize label
    const sanitizedLabel = label ? validator.escape(label.slice(0, 100)) : null;
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if key already exists for this platform
    const existingKey = await prisma.userApiKey.findUnique({
      where: {
        userId_platform: {
          userId: user.id,
          platform
        }
      }
    });
    
    // Encrypt the API key
    const { encrypted, iv, authTag } = encryptionService.encrypt(apiKey);
    
    let savedKey;
    
    if (existingKey) {
      // Update existing key
      savedKey = await prisma.userApiKey.update({
        where: { id: existingKey.id },
        data: {
          encryptedKey: encrypted,
          iv,
          authTag,
          label: sanitizedLabel,
          isActive: true
        }
      });
    } else {
      // Create new key
      savedKey = await prisma.userApiKey.create({
        data: {
          userId: user.id,
          platform,
          encryptedKey: encrypted,
          iv,
          authTag,
          label: sanitizedLabel
        }
      });
    }
    
    res.status(201).json({
      success: true,
      apiKey: {
        id: savedKey.id,
        platform: savedKey.platform,
        label: savedKey.label,
        maskedKey: encryptionService.maskKey(apiKey),
        isActive: savedKey.isActive,
        createdAt: savedKey.createdAt
      }
    });
  } catch (error) {
    console.error('Add API key error:', error);
    res.status(500).json({ error: 'Failed to save API key' });
  }
});

// Toggle API key active status
router.patch('/:id/toggle', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req as any);
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const apiKey = await prisma.userApiKey.findFirst({
      where: { id, userId: user.id }
    });
    
    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    const updatedKey = await prisma.userApiKey.update({
      where: { id },
      data: { isActive: !apiKey.isActive }
    });
    
    res.json({
      success: true,
      isActive: updatedKey.isActive
    });
  } catch (error) {
    console.error('Toggle API key error:', error);
    res.status(500).json({ error: 'Failed to toggle API key' });
  }
});

// Delete API key
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req as any);
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const apiKey = await prisma.userApiKey.findFirst({
      where: { id, userId: user.id }
    });
    
    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    await prisma.userApiKey.delete({
      where: { id }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

// Test API key validity
router.post('/:id/test', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req as any);
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const apiKey = await prisma.userApiKey.findFirst({
      where: { id, userId: user.id }
    });
    
    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    // Decrypt the key
    const decryptedKey = encryptionService.decrypt(
      apiKey.encryptedKey,
      apiKey.iv,
      apiKey.authTag
    );
    
    // Test the key based on platform
    let isValid = false;
    let message = '';
    
    switch (apiKey.platform) {
      case 'YOUTUBE':
        isValid = await testYouTubeKey(decryptedKey);
        message = isValid ? 'YouTube API key is valid' : 'YouTube API key is invalid or quota exceeded';
        break;
      case 'RAPIDAPI':
        isValid = await testRapidAPIKey(decryptedKey);
        message = isValid ? 'RapidAPI key is valid' : 'RapidAPI key is invalid';
        break;
      default:
        message = 'Testing not implemented for this platform';
    }
    
    res.json({ isValid, message });
  } catch (error) {
    console.error('Test API key error:', error);
    res.status(500).json({ error: 'Failed to test API key' });
  }
});

// Helper: Test YouTube API key
async function testYouTubeKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=id&id=dQw4w9WgXcQ&key=${apiKey}`
    );
    return response.ok;
  } catch {
    return false;
  }
}

// Helper: Test RapidAPI key
async function testRapidAPIKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(
      'https://instagram-scraper-api2.p.rapidapi.com/v1/info?username_or_id_or_url=instagram',
      {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'instagram-scraper-api2.p.rapidapi.com'
        }
      }
    );
    return response.ok || response.status !== 401;
  } catch {
    return false;
  }
}

export default router;
```

#### Step 3: Update API Key Resolution Service

**Create file: `backend/src/services/apikey-resolver.service.ts`**

```typescript
// API Key Resolver - Determines which API key to use for requests
import { PrismaClient, ApiPlatform } from '@prisma/client';
import encryptionService from './encryption.service';
import config from '../config';

const prisma = new PrismaClient();

interface ApiKeyResult {
  key: string;
  source: 'user' | 'system';
  userId: string | null;
  unlimited: boolean;
}

class ApiKeyResolverService {
  /**
   * Get the appropriate API key for a platform
   * Priority: User's own key > System key
   *
   * @param clerkUserId - The Clerk user ID
   * @param platform - The platform (YOUTUBE, INSTAGRAM, etc.)
   * @returns Object containing key, source, userId, and unlimited flag
   */
  async getApiKey(clerkUserId: string | null, platform: ApiPlatform): Promise<ApiKeyResult> {
    // If user is authenticated, try to get their key first
    if (clerkUserId) {
      const user = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
        include: {
          apiKeys: {
            where: {
              platform,
              isActive: true
            }
          }
        }
      });
      
      if (user?.apiKeys?.length > 0) {
        const userKey = user.apiKeys[0];
        
        // Decrypt the key
        const decryptedKey = encryptionService.decrypt(
          userKey.encryptedKey,
          userKey.iv,
          userKey.authTag
        );
        
        // Update usage stats
        await prisma.userApiKey.update({
          where: { id: userKey.id },
          data: {
            lastUsedAt: new Date(),
            usageCount: { increment: 1 }
          }
        });
        
        return {
          key: decryptedKey,
          source: 'user',
          userId: user.id,
          unlimited: true // User's own key has no platform-level rate limit from us
        };
      }
    }
    
    // Fall back to system key
    return this.getSystemKey(platform);
  }
  
  /**
   * Get the system API key for a platform
   */
  getSystemKey(platform: ApiPlatform): ApiKeyResult {
    const keyMap: Partial<Record<ApiPlatform, string>> = {
      YOUTUBE: config.youtube.apiKey,
      RAPIDAPI: config.rapidApi.key,
      INSTAGRAM: config.rapidApi.key, // Instagram uses RapidAPI
      // Add more platforms as needed
    };

    const key = keyMap[platform];

    if (!key) {
      throw new Error(`No system API key configured for ${platform}`);
    }

    return {
      key,
      source: 'system',
      userId: null,
      unlimited: false // System key is rate limited
    };
  }

  /**
   * Check if user has configured their own key for a platform
   */
  async hasUserKey(clerkUserId: string | null, platform: ApiPlatform): Promise<boolean> {
    if (!clerkUserId) return false;

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      include: {
        apiKeys: {
          where: {
            platform,
            isActive: true
          }
        }
      }
    });

    return (user?.apiKeys?.length ?? 0) > 0;
  }
}

export default new ApiKeyResolverService();
```

#### Step 4: Create Settings Page (Frontend)

**Create file: `frontend/src/app/settings/page.tsx` (Next.js 15 App Router)**

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key, Plus, Trash2, Eye, EyeOff, Check, X,
  AlertCircle, Loader2, Shield, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface ApiKey {
  id: string;
  platform: string;
  maskedKey: string;
  label?: string;
  isActive: boolean;
  lastUsedAt?: Date;
  usageCount: number;
  createdAt: Date;
}

interface Platform {
  id: string;
  name: string;
  color: string;
  icon: string;
}

const PLATFORMS = [
  { id: 'YOUTUBE', name: 'YouTube', color: 'bg-red-500', icon: '📺' },
  { id: 'INSTAGRAM', name: 'Instagram', color: 'bg-pink-500', icon: '📸' },
  { id: 'TIKTOK', name: 'TikTok', color: 'bg-black', icon: '🎵' },
  { id: 'TWITTER', name: 'Twitter/X', color: 'bg-blue-500', icon: '🐦' },
  { id: 'RAPIDAPI', name: 'RapidAPI', color: 'bg-blue-600', icon: '⚡' },
];

export default function Settings() {
  const { user, isLoaded } = useUser();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKey, setNewKey] = useState({ platform: '', apiKey: '', label: '' });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  
  // Fetch user's API keys
  useEffect(() => {
    if (isLoaded && user) {
      fetchApiKeys();
    }
  }, [isLoaded, user]);
  
  const fetchApiKeys = async () => {
    try {
      const response = await fetch(`${API_URL}/apikeys`, {
        credentials: 'include'
      });
      const data = await response.json();
      setApiKeys(data.apiKeys || []);
    } catch (error) {
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await fetch(`${API_URL}/apikeys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newKey)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to save API key');
      }
      
      setApiKeys(prev => [...prev.filter(k => k.platform !== newKey.platform), data.apiKey]);
      setShowAddModal(false);
      setNewKey({ platform: '', apiKey: '', label: '' });
      toast.success('API key saved successfully');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;
    
    try {
      const response = await fetch(`${API_URL}/apikeys/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      
      setApiKeys(prev => prev.filter(k => k.id !== id));
      toast.success('API key deleted');
    } catch (error) {
      toast.error('Failed to delete API key');
    }
  };
  
  const handleTestKey = async (id: string) => {
    setTesting(id);
    
    try {
      const response = await fetch(`${API_URL}/apikeys/${id}/test`, {
        method: 'POST',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.isValid) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to test API key');
    } finally {
      setTesting(null);
    }
  };
  
  const handleToggleKey = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/apikeys/${id}/toggle`, {
        method: 'PATCH',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      setApiKeys(prev => prev.map(k => 
        k.id === id ? { ...k, isActive: data.isActive } : k
      ));
      
      toast.success(data.isActive ? 'API key enabled' : 'API key disabled');
    } catch (error) {
      toast.error('Failed to toggle API key');
    }
  };
  
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-2">Manage your API keys and preferences</p>
      </div>
      
      {/* API Keys Section */}
      <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Key className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">API Keys</h2>
              <p className="text-sm text-slate-500">Use your own API keys for unlimited requests</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Key
          </button>
        </div>
        
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-900 font-medium">Your keys are encrypted</p>
              <p className="text-sm text-blue-700 mt-1">
                API keys are encrypted using AES-256-GCM before storage. We never store or log plaintext keys.
              </p>
            </div>
          </div>
        </div>
        
        {/* API Keys List */}
        {apiKeys.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
            <Key className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No API keys configured</p>
            <p className="text-slate-400 text-sm mt-1">
              Add your own API keys to unlock unlimited requests
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((key) => {
              const platform = PLATFORMS.find(p => p.id === key.platform);
              return (
                <motion.div
                  key={key.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center justify-between p-4 rounded-xl border ${
                    key.isActive ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 ${platform?.color || 'bg-slate-500'} rounded-lg flex items-center justify-center text-xl`}>
                      {platform?.icon || '🔑'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">
                          {platform?.name || key.platform}
                        </span>
                        {!key.isActive && (
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs rounded-full">
                            Disabled
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <code className="text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {key.maskedKey}
                        </code>
                        {key.label && (
                          <span className="text-sm text-slate-400">{key.label}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestKey(key.id)}
                      disabled={testing === key.id}
                      className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Test key"
                    >
                      {testing === key.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleToggleKey(key.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        key.isActive 
                          ? 'text-green-600 hover:bg-green-50' 
                          : 'text-slate-400 hover:bg-slate-100'
                      }`}
                      title={key.isActive ? 'Disable key' : 'Enable key'}
                    >
                      {key.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteKey(key.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
        
        {/* Usage Stats */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <p className="text-sm text-slate-500">
            <span className="font-medium text-slate-700">Tip:</span> Using your own API keys gives you unlimited requests and faster response times. 
            System keys are limited to {import.meta.env.VITE_SYSTEM_API_LIMIT || 5} requests per day.
          </p>
        </div>
      </div>
      
      {/* Add Key Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Add API Key</h3>
              
              <form onSubmit={handleAddKey}>
                <div className="space-y-4">
                  {/* Platform Select */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Platform
                    </label>
                    <select
                      value={newKey.platform}
                      onChange={(e) => setNewKey(prev => ({ ...prev, platform: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a platform</option>
                      {PLATFORMS.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.icon} {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* API Key Input */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={newKey.apiKey}
                      onChange={(e) => setNewKey(prev => ({ ...prev, apiKey: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                      placeholder="Paste your API key here"
                      required
                    />
                  </div>
                  
                  {/* Label Input */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Label (optional)
                    </label>
                    <input
                      type="text"
                      value={newKey.label}
                      onChange={(e) => setNewKey(prev => ({ ...prev, label: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., Personal YouTube Key"
                      maxLength={100}
                    />
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !newKey.platform || !newKey.apiKey}
                    className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Save Key
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

#### Step 5: Environment Variables

**Add to `backend/.env`:**
```env
# Encryption (REQUIRED - Generate a secure 32+ character key)
# Use: openssl rand -hex 32
ENCRYPTION_MASTER_KEY=your-32-character-minimum-secret-key-here

# System API Daily Limit (for users without their own keys)
SYSTEM_API_DAILY_LIMIT=5
```

### Acceptance Criteria

- [ ] Users can add API keys for YouTube, Instagram, TikTok, Twitter, RapidAPI
- [ ] Keys are encrypted with AES-256-GCM before storage
- [ ] Keys are masked in UI (show only first/last 4 characters)
- [ ] Users can test key validity
- [ ] Users can enable/disable keys without deleting
- [ ] Users can delete keys
- [ ] System falls back to shared keys when user has none
- [ ] Rate limiting differentiates between user keys (unlimited) and system keys (limited)

---

## 1.3 Anonymous User Rate Limiting

### Feature Description
Implement rate limiting for anonymous (unauthenticated) users who use the video analytics search bar on the main page. Limit anonymous users to 5 video analysis requests per day to prevent abuse while allowing trial usage. This encourages sign-ups for unlimited access.

### Why This Matters
- **Prevents API Abuse**: Protects system resources and API quotas (YouTube API has daily limits)
- **Encourages Sign-ups**: Free tier gets limited access, authenticated users get more
- **Cost Control**: Prevents excessive usage of shared API keys
- **Fair Usage**: Ensures all users get a fair chance to try the platform

### Technical Specifications

```
Tracking Methods (Hybrid Approach):
1. IP Address (Server-side) - Primary method
2. Browser Fingerprint (Client-side) - Secondary method
3. localStorage (Client-side) - User experience enhancement

Rate Limit:
- Anonymous users: 5 requests per day
- Authenticated FREE tier: 5 requests per day (from Phase 1.1)
- Authenticated CREATOR+: Higher limits (from Phase 1.1)

Cache Layer:
- Redis keys: ratelimit:ip:{ip_address}:{date} (TTL: 24 hours)
- Redis keys: ratelimit:fingerprint:{fingerprint}:{date} (TTL: 24 hours)
```

### Implementation Approach

**Hybrid Strategy:**
1. **Server-side (IP-based)** - Authoritative, cannot be bypassed
2. **Client-side (localStorage + fingerprint)** - Fast feedback, better UX
3. **Combined approach** - Client shows remaining count, server enforces limit

### Database Schema Changes

No database changes required. All tracking done in Redis for performance.

**Redis Key Structure:**
```
ratelimit:ip:192.168.1.1:2024-01-15 → "3" (TTL: 86400s)
ratelimit:fingerprint:abc123xyz:2024-01-15 → "3" (TTL: 86400s)
```

### Implementation Steps for Claude Code

#### Step 1: Create Browser Fingerprint Utility (Frontend)

**Create file: `frontend/src/lib/fingerprint.ts`**

```typescript
// Browser fingerprinting for anonymous user tracking
// Note: Not cryptographically secure, just for rate limiting UX

interface FingerprintData {
  userAgent: string;
  language: string;
  platform: string;
  screenResolution: string;
  timezone: number;
  colorDepth: number;
  hardwareConcurrency: number;
}

export class BrowserFingerprint {
  private static STORAGE_KEY = 'vap_fingerprint';
  private static REQUESTS_KEY = 'vap_requests';

  /**
   * Generate a simple fingerprint from browser characteristics
   */
  static generate(): string {
    const data: FingerprintData = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: new Date().getTimezoneOffset(),
      colorDepth: screen.colorDepth,
      hardwareConcurrency: navigator.hardwareConcurrency || 0
    };

    const fingerprint = this.simpleHash(JSON.stringify(data));

    // Store in localStorage for persistence
    localStorage.setItem(this.STORAGE_KEY, fingerprint);

    return fingerprint;
  }

  /**
   * Get existing fingerprint or generate new one
   */
  static get(): string {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored || this.generate();
  }

  /**
   * Simple hash function (not cryptographic)
   */
  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get request count from localStorage
   */
  static getRequestCount(): { count: number; date: string } {
    const stored = localStorage.getItem(this.REQUESTS_KEY);
    if (!stored) {
      return { count: 0, date: new Date().toDateString() };
    }

    try {
      const data = JSON.parse(stored);
      const today = new Date().toDateString();

      // Reset count if it's a new day
      if (data.date !== today) {
        return { count: 0, date: today };
      }

      return data;
    } catch {
      return { count: 0, date: new Date().toDateString() };
    }
  }

  /**
   * Increment request count in localStorage
   */
  static incrementRequestCount(): number {
    const { count, date } = this.getRequestCount();
    const today = new Date().toDateString();

    const newCount = date === today ? count + 1 : 1;

    localStorage.setItem(this.REQUESTS_KEY, JSON.stringify({
      count: newCount,
      date: today
    }));

    return newCount;
  }

  /**
   * Check if user has exceeded rate limit (client-side check)
   */
  static hasExceededLimit(limit: number = 5): boolean {
    const { count } = this.getRequestCount();
    return count >= limit;
  }

  /**
   * Get remaining requests
   */
  static getRemainingRequests(limit: number = 5): number {
    const { count } = this.getRequestCount();
    return Math.max(0, limit - count);
  }

  /**
   * Clear rate limit data (for testing or user request)
   */
  static clearLimitData(): void {
    localStorage.removeItem(this.REQUESTS_KEY);
  }
}
```

#### Step 2: Create Rate Limit Service (Backend)

**Create file: `backend/src/services/anonymous-ratelimit.service.ts`**

```typescript
// Anonymous User Rate Limiting Service
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
}

export class AnonymousRateLimitService {
  private readonly DAILY_LIMIT = 5;

  /**
   * Check and increment rate limit for IP address
   */
  async checkIpRateLimit(ipAddress: string): Promise<RateLimitResult> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const key = `ratelimit:ip:${ipAddress}:${today}`;

    // Get current count
    const currentCount = await redis.get<number>(key) || 0;

    if (currentCount >= this.DAILY_LIMIT) {
      return {
        allowed: false,
        remaining: 0,
        limit: this.DAILY_LIMIT,
        resetAt: this.getResetTime()
      };
    }

    // Increment and set expiry
    const newCount = await redis.incr(key);

    // Set TTL to end of day (only on first increment)
    if (newCount === 1) {
      const secondsUntilMidnight = this.getSecondsUntilMidnight();
      await redis.expire(key, secondsUntilMidnight);
    }

    return {
      allowed: true,
      remaining: Math.max(0, this.DAILY_LIMIT - newCount),
      limit: this.DAILY_LIMIT,
      resetAt: this.getResetTime()
    };
  }

  /**
   * Check and increment rate limit for browser fingerprint
   */
  async checkFingerprintRateLimit(fingerprint: string): Promise<RateLimitResult> {
    const today = new Date().toISOString().split('T')[0];
    const key = `ratelimit:fingerprint:${fingerprint}:${today}`;

    const currentCount = await redis.get<number>(key) || 0;

    if (currentCount >= this.DAILY_LIMIT) {
      return {
        allowed: false,
        remaining: 0,
        limit: this.DAILY_LIMIT,
        resetAt: this.getResetTime()
      };
    }

    const newCount = await redis.incr(key);

    if (newCount === 1) {
      const secondsUntilMidnight = this.getSecondsUntilMidnight();
      await redis.expire(key, secondsUntilMidnight);
    }

    return {
      allowed: true,
      remaining: Math.max(0, this.DAILY_LIMIT - newCount),
      limit: this.DAILY_LIMIT,
      resetAt: this.getResetTime()
    };
  }

  /**
   * Combined check: Both IP and fingerprint must be under limit
   */
  async checkRateLimit(ipAddress: string, fingerprint?: string): Promise<RateLimitResult> {
    // Always check IP
    const ipResult = await this.checkIpRateLimit(ipAddress);

    if (!ipResult.allowed) {
      return ipResult;
    }

    // If fingerprint provided, check it too
    if (fingerprint) {
      const fingerprintResult = await this.checkFingerprintRateLimit(fingerprint);

      if (!fingerprintResult.allowed) {
        return fingerprintResult;
      }

      // Return the more restrictive limit
      return {
        allowed: true,
        remaining: Math.min(ipResult.remaining, fingerprintResult.remaining),
        limit: this.DAILY_LIMIT,
        resetAt: this.getResetTime()
      };
    }

    return ipResult;
  }

  /**
   * Get current usage for IP
   */
  async getIpUsage(ipAddress: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const key = `ratelimit:ip:${ipAddress}:${today}`;
    return await redis.get<number>(key) || 0;
  }

  /**
   * Calculate seconds until midnight (for Redis TTL)
   */
  private getSecondsUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    return Math.floor((midnight.getTime() - now.getTime()) / 1000);
  }

  /**
   * Get reset time (midnight)
   */
  private getResetTime(): Date {
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    return midnight;
  }

  /**
   * Clear rate limit for testing
   */
  async clearRateLimit(ipAddress: string, fingerprint?: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const ipKey = `ratelimit:ip:${ipAddress}:${today}`;
    await redis.del(ipKey);

    if (fingerprint) {
      const fpKey = `ratelimit:fingerprint:${fingerprint}:${today}`;
      await redis.del(fpKey);
    }
  }
}

export default new AnonymousRateLimitService();
```

#### Step 3: Create Rate Limit Middleware (Backend)

**Create file: `backend/src/middleware/anonymous-ratelimit.middleware.ts`**

```typescript
// Middleware for anonymous user rate limiting
import { Request, Response, NextFunction } from 'express';
import anonymousRateLimitService from '../services/anonymous-ratelimit.service';
import { getUserId } from './auth.middleware';

interface RateLimitRequest extends Request {
  anonymousRateLimit?: {
    allowed: boolean;
    remaining: number;
    limit: number;
    resetAt: Date;
  };
}

/**
 * Extract IP address from request (handles proxies)
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];

  if (forwarded) {
    const ips = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',');
    return ips[0].trim();
  }

  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Check rate limit for anonymous users
 * Authenticated users bypass this check (handled by auth middleware)
 */
export const checkAnonymousRateLimit = async (
  req: RateLimitRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip rate limit check for authenticated users
    const userId = getUserId(req as any);
    if (userId) {
      // Authenticated users are handled by auth middleware
      return next();
    }

    // Get IP address
    const ipAddress = getClientIp(req);

    // Get fingerprint from header (sent by client)
    const fingerprint = req.headers['x-fingerprint'] as string | undefined;

    // Check rate limit
    const result = await anonymousRateLimitService.checkRateLimit(ipAddress, fingerprint);

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', result.limit.toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', result.resetAt.toISOString());

    // Attach to request for use in controllers
    req.anonymousRateLimit = result;

    if (!result.allowed) {
      res.status(429).json({
        error: 'Daily request limit exceeded',
        message: `You have reached the limit of ${result.limit} free requests per day. Sign up for unlimited access!`,
        limit: result.limit,
        remaining: 0,
        resetAt: result.resetAt,
        signUpUrl: '/sign-up'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Anonymous rate limit check error:', error);
    // On error, allow the request (fail open)
    next();
  }
};

/**
 * Get rate limit status without incrementing
 */
export const getRateLimitStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const ipAddress = getClientIp(req);
    const usage = await anonymousRateLimitService.getIpUsage(ipAddress);
    const limit = 5;

    res.json({
      limit,
      remaining: Math.max(0, limit - usage),
      used: usage,
      resetAt: new Date(new Date().setHours(24, 0, 0, 0))
    });
  } catch (error) {
    console.error('Get rate limit status error:', error);
    res.status(500).json({ error: 'Failed to get rate limit status' });
  }
};
```

#### Step 4: Update Analytics Routes to Use Rate Limit

**Update: `backend/src/routes/analytics.routes.ts`**

Add the anonymous rate limit middleware to the analyze endpoint:

```typescript
import { checkAnonymousRateLimit, getRateLimitStatus } from '../middleware/anonymous-ratelimit.middleware';

// Add rate limit status endpoint
router.get('/ratelimit/status', getRateLimitStatus);

// Update analyze endpoint to use anonymous rate limiting
router.post('/analyze', checkAnonymousRateLimit, async (req: Request, res: Response) => {
  // Existing analyze logic...
});
```

#### Step 5: Update Frontend SearchBar Component

**Update: `frontend/src/components/SearchBar.tsx`**

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Search, AlertCircle, Clock } from 'lucide-react';
import { BrowserFingerprint } from '@/lib/fingerprint';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchBarProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
}

export default function SearchBar({ onAnalyze, isLoading }: SearchBarProps) {
  const { isSignedIn } = useUser();
  const [url, setUrl] = useState('');
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null);
  const [showLimitWarning, setShowLimitWarning] = useState(false);

  // Update remaining requests count
  useEffect(() => {
    if (!isSignedIn) {
      const remaining = BrowserFingerprint.getRemainingRequests(5);
      setRemainingRequests(remaining);

      if (remaining === 0) {
        setShowLimitWarning(true);
      }
    }
  }, [isSignedIn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) return;

    // Client-side rate limit check for UX
    if (!isSignedIn) {
      const hasExceeded = BrowserFingerprint.hasExceededLimit(5);

      if (hasExceeded) {
        setShowLimitWarning(true);
        return;
      }

      // Optimistic increment (server will be authoritative)
      BrowserFingerprint.incrementRequestCount();
      const remaining = BrowserFingerprint.getRemainingRequests(5);
      setRemainingRequests(remaining);
    }

    // Call parent analyze function
    onAnalyze(url);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube or Instagram video URL..."
            className="w-full px-6 py-4 pr-32 text-lg border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Search className="w-5 h-5" />
            Analyze
          </button>
        </div>

        {/* Anonymous user rate limit indicator */}
        {!isSignedIn && remainingRequests !== null && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="w-4 h-4" />
              <span>
                {remainingRequests > 0 ? (
                  <>
                    <span className="font-medium text-slate-900">{remainingRequests}</span> free
                    {remainingRequests === 1 ? ' analysis' : ' analyses'} remaining today
                  </>
                ) : (
                  <span className="text-red-600 font-medium">Daily limit reached</span>
                )}
              </span>
            </div>

            {remainingRequests <= 2 && remainingRequests > 0 && (
              <a
                href="/sign-up"
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                Sign up for unlimited access →
              </a>
            )}
          </motion.div>
        )}
      </form>

      {/* Rate limit exceeded warning */}
      <AnimatePresence>
        {showLimitWarning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mt-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 mb-1">
                  Daily Limit Reached
                </h3>
                <p className="text-sm text-amber-800 mb-3">
                  You've used all 5 free video analyses for today. Create a free account to get unlimited access!
                </p>
                <div className="flex gap-2">
                  <a
                    href="/sign-up"
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
                  >
                    Sign Up Free
                  </a>
                  <a
                    href="/sign-in"
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                  >
                    Sign In
                  </a>
                </div>
              </div>
              <button
                onClick={() => setShowLimitWarning(false)}
                className="text-amber-600 hover:text-amber-700"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

#### Step 6: Update API Client to Send Fingerprint

**Update: `frontend/src/hooks/useAnalytics.ts`**

```typescript
import { BrowserFingerprint } from '@/lib/fingerprint';

export const useAnalytics = () => {
  const analyzeVideo = async (url: string) => {
    const fingerprint = BrowserFingerprint.get();

    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Fingerprint': fingerprint // Send fingerprint to backend
      },
      credentials: 'include',
      body: JSON.stringify({ url })
    });

    if (response.status === 429) {
      // Rate limit exceeded
      const data = await response.json();
      throw new Error(data.message || 'Rate limit exceeded');
    }

    if (!response.ok) {
      throw new Error('Analysis failed');
    }

    return response.json();
  };

  return { analyzeVideo };
};
```

#### Step 7: Environment Variables

No new environment variables required. Uses existing Redis configuration:

```env
# Already configured in Phase 1
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

### How It Works

**User Flow:**

1. **Anonymous user visits homepage**
   - Browser fingerprint generated on first visit
   - localStorage tracks client-side request count
   - UI shows "5 free analyses remaining today"

2. **User submits video URL**
   - Client checks localStorage (fast feedback)
   - If limit exceeded, show sign-up prompt immediately
   - If OK, send request with fingerprint header

3. **Backend receives request**
   - Middleware checks if user is authenticated (bypass if yes)
   - For anonymous: Check IP + fingerprint in Redis
   - If under limit: Increment counters, process request
   - If over limit: Return 429 with sign-up link

4. **After each request**
   - Client updates remaining count display
   - When count reaches 2, show "Sign up" suggestion
   - When count reaches 0, show prominent sign-up banner

**Rate Limit Reset:**
- Automatic at midnight (Redis TTL)
- localStorage automatically resets on new day
- User sees "5 free analyses remaining" next day

### Acceptance Criteria

- [ ] Anonymous users limited to 5 video analyses per day
- [ ] Limit tracked by both IP address and browser fingerprint
- [ ] Client-side localStorage provides instant feedback
- [ ] Server-side Redis enforcement (cannot be bypassed)
- [ ] UI shows remaining request count
- [ ] Rate limit resets at midnight automatically
- [ ] 429 response includes helpful sign-up message
- [ ] Authenticated users bypass anonymous rate limiting
- [ ] Rate limit headers included in response (X-RateLimit-*)
- [ ] Graceful error handling (fail open on Redis errors)

### Testing Checklist

**Manual Testing:**
- [ ] Visit homepage as anonymous user, see "5 analyses remaining"
- [ ] Analyze 5 videos, counter decrements correctly
- [ ] 6th request shows rate limit banner
- [ ] Sign up, verify unlimited access
- [ ] Clear localStorage, verify server still enforces limit
- [ ] Use VPN/different IP, verify separate limit

**Edge Cases:**
- [ ] Test at 11:59 PM (verify reset at midnight)
- [ ] Test with VPN (IP changes)
- [ ] Test in incognito (fingerprint different)
- [ ] Test with Redis down (should fail open)
- [ ] Test with same IP, different browsers

### Future Enhancements (Phase 2+)

- Add "share via email" to bypass limit (viral growth)
- Implement "watch ad to get +2 analyses" (monetization)
- Track analytics on limit-hit rate (conversion funnel)
- A/B test different limit values (5 vs 3 vs 10)
- Add CAPTCHA after limit to prevent bot abuse

---

# Phase 2: Competitive Intelligence

## 2.1 Competitor Tracking

### Feature Description
Allow users to track competitor channels and compare performance metrics over time.

### Database Schema

```prisma
model CompetitorTrack {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  platform        Platform
  channelId       String
  channelName     String
  channelUrl      String
  thumbnailUrl    String?
  
  // Latest metrics (updated periodically)
  subscriberCount BigInt    @default(0)
  videoCount      Int       @default(0)
  totalViews      BigInt    @default(0)
  avgEngagement   Float?
  
  // Tracking
  isActive        Boolean   @default(true)
  lastCheckedAt   DateTime?
  
  // Historical data stored in CompetitorSnapshot
  snapshots       CompetitorSnapshot[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([userId, platform, channelId])
  @@index([userId])
}

model CompetitorSnapshot {
  id              String    @id @default(cuid())
  competitorId    String
  competitor      CompetitorTrack @relation(fields: [competitorId], references: [id], onDelete: Cascade)
  
  subscriberCount BigInt
  videoCount      Int
  totalViews      BigInt
  recentVideos    Json?     // Last 5 video performance
  
  recordedAt      DateTime  @default(now())
  
  @@index([competitorId, recordedAt])
}
```

### Implementation Steps for Claude Code

1. **Create `backend/src/services/competitor.service.js`**
   - Methods: `addCompetitor`, `removeCompetitor`, `getCompetitors`, `updateMetrics`
   - Use YouTube Channels API to fetch channel data
   - Schedule daily updates via cron job or Vercel cron

2. **Create `backend/src/routes/competitor.routes.js`**
   - `POST /api/competitors` - Add competitor
   - `GET /api/competitors` - List user's tracked competitors
   - `DELETE /api/competitors/:id` - Remove competitor
   - `GET /api/competitors/:id/history` - Get historical data

3. **Create `frontend/src/pages/Competitors.jsx`**
   - Grid of competitor cards with metrics
   - Add competitor modal (search by channel name/URL)
   - Comparison charts (line charts showing growth over time)
   - Export comparison data

4. **Create `backend/src/jobs/competitor-update.js`**
   - Vercel cron job to update competitor metrics daily
   - Add to `vercel.json`: `"crons": [{ "path": "/api/cron/update-competitors", "schedule": "0 0 * * *" }]`

### Acceptance Criteria

- [ ] Users can add competitors by channel URL or name
- [ ] Dashboard shows side-by-side metrics comparison
- [ ] Historical charts show growth trends
- [ ] Daily automated updates of competitor metrics
- [ ] Export comparison to CSV/PDF

---

## 2.2 Benchmark Comparisons

### Feature Description
Provide contextual benchmarks comparing user's video performance against similar creators in their niche.

### Implementation Steps for Claude Code

1. **Create niche detection service**
   - Analyze video tags, descriptions, and categories
   - Build taxonomy of niches (Gaming, Tech, Beauty, etc.)

2. **Create benchmark database**
   - Store aggregate metrics by niche
   - Update weekly with sampled public data

3. **Create benchmark API**
   - `GET /api/benchmarks/:niche` - Get niche benchmarks
   - `GET /api/benchmarks/compare/:videoId` - Compare video against niche

4. **Add benchmark cards to analytics dashboard**
   - "Your engagement is 23% above average for Tech videos"
   - Percentile ranking visualization

---

# Phase 3: Predictive Analytics

## 3.1 Viral Potential Score

### Feature Description
ML model that predicts the likelihood of a video going viral based on title, thumbnail characteristics, first-hour metrics, and historical patterns.

### Technical Approach

```
Model: Gradient Boosting (XGBoost) or Random Forest
Features:
- Title sentiment score
- Title length
- Number of power words in title
- Thumbnail brightness/contrast scores
- Time of posting
- Day of week
- Channel historical performance
- First-hour view velocity
- Comment-to-view ratio
- Like-to-view ratio
```

### Implementation Steps for Claude Code

1. **Create training data pipeline**
   - Collect historical data from public viral videos
   - Extract features using NLP and image analysis

2. **Train model** (can use Python microservice or TensorFlow.js)
   - `backend/src/ml/viral-predictor/train.py`
   - Export model to ONNX or TensorFlow.js format

3. **Create prediction service**
   - `backend/src/services/viral-predictor.service.js`
   - Load model and run inference
   - Return score 0-100 with explanation

4. **Add to analytics response**
   - Include `viralPotentialScore` in video analysis
   - Show breakdown of contributing factors

---

## 3.2 Optimal Posting Time

### Feature Description
Analyze user's historical video performance to recommend the best days and times to post.

### Implementation Steps for Claude Code

1. **Analyze historical data**
   - Group videos by posting day/time
   - Calculate average performance per time slot

2. **Create recommendation engine**
   - `backend/src/services/posting-time.service.js`
   - Consider audience timezone distribution
   - Weight recent videos more heavily

3. **Create visualization**
   - Heatmap showing optimal posting times
   - "Your best time to post: Tuesday 6-8 PM"

---

# Phase 4: Content Strategy Tools

## 4.1 Title A/B Testing Analyzer

### Feature Description
Analyze which title styles perform best for the user's content.

### Implementation Steps for Claude Code

1. **Categorize title styles**
   - Questions vs Statements
   - Numbered lists ("Top 10...")
   - How-to titles
   - Emotional triggers
   - Emoji usage

2. **Create analysis service**
   - Parse user's video titles
   - Correlate style with performance

3. **Generate recommendations**
   - "Question-style titles get 34% more clicks for your channel"

---

## 4.2 Thumbnail Analysis

### Feature Description
Use computer vision to analyze thumbnail effectiveness.

### Technical Approach

```
Using: Google Cloud Vision API or custom TensorFlow model
Analyze:
- Face detection (thumbnails with faces perform better)
- Text presence and readability
- Color contrast
- Brightness distribution
- Emotion detection
```

### Implementation Steps for Claude Code

1. **Integrate Vision API**
   - `backend/src/services/thumbnail-analyzer.service.js`
   
2. **Create scoring system**
   - Score 0-100 for thumbnail effectiveness
   - Provide specific recommendations

3. **Add to analytics dashboard**
   - Thumbnail score card
   - Heatmap overlay showing visual interest

---

# Phase 5: Audience Analytics

## 5.1 Audience Overlap Analysis

### Feature Description
Identify which other creators share audience with the user (for collaboration opportunities).

### Implementation Steps for Claude Code

1. **Analyze comment patterns**
   - Find users who comment on multiple channels
   - Build co-viewership graph

2. **Create overlap API**
   - `GET /api/audience/overlap` - Returns channels with shared audience

3. **Visualize as network graph**
   - D3.js force-directed graph
   - Node size = overlap percentage

---

## 5.2 Superfan Identification

### Feature Description
Identify the most engaged community members.

### Database Schema

```prisma
model Superfan {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  
  platform        Platform
  fanUsername     String
  fanProfileUrl   String?
  
  // Engagement metrics
  totalComments   Int       @default(0)
  totalLikes      Int       @default(0)
  firstSeenAt     DateTime
  lastSeenAt      DateTime
  
  // Sentiment
  avgSentiment    Float?
  
  createdAt       DateTime  @default(now())
  
  @@unique([userId, platform, fanUsername])
}
```

---

# Phase 6: Monetization Insights

## 6.1 Sponsorship Rate Calculator

### Feature Description
Calculate fair market sponsorship rates based on engagement, niche, and audience quality.

### Formula

```
Base Rate = (Avg Views × CPM Rate) + (Engagement Premium)

Where:
- CPM Rate varies by niche ($2-50)
- Engagement Premium = Engagement Rate × Multiplier
- Audience Quality Score = (% Adult + % Purchasing Power + % Target Demo)
```

### Implementation Steps for Claude Code

1. **Create rate calculation service**
   - `backend/src/services/sponsorship-calculator.service.js`
   - Input: channel metrics, niche
   - Output: recommended rate ranges (low, mid, high)

2. **Add niche CPM database**
   - Seed with industry average CPMs

3. **Create sponsorship insights page**
   - Rate calculator widget
   - Comparison to industry averages

---

## 6.2 Media Kit Generator

### Feature Description
Auto-generate professional media kits with channel statistics.

### Implementation Steps for Claude Code

1. **Create PDF generation service**
   - Use `@react-pdf/renderer` or Puppeteer
   - Include: channel stats, demographics, past sponsors, rate card

2. **Create media kit templates**
   - Multiple design options
   - White-label option for agencies

3. **Add media kit page**
   - Preview and customize
   - Download as PDF

---

# Phase 7: Trend Detection & Alerts

## 7.1 Trending Topics Detection

### Feature Description
Real-time detection of rising topics in user's niche before they peak.

### Implementation Steps for Claude Code

1. **Create trend detection service**
   - Monitor YouTube trending, Google Trends API
   - Filter by user's niche/keywords

2. **Build trend scoring algorithm**
   - Velocity of search interest
   - Competition level
   - Relevance to user's content

3. **Create alerts system**
   - `backend/src/services/alerts.service.js`
   - Email/push notifications for trending topics

---

## 7.2 Anomaly Alerts

### Feature Description
Notify users when videos perform significantly above/below average.

### Database Schema

```prisma
model Alert {
  id              String      @id @default(cuid())
  userId          String
  user            User        @relation(fields: [userId], references: [id])
  
  type            AlertType
  title           String
  message         String
  videoId         String?
  data            Json?
  
  isRead          Boolean     @default(false)
  createdAt       DateTime    @default(now())
  
  @@index([userId, isRead])
}

enum AlertType {
  VIRAL_VIDEO
  PERFORMANCE_DROP
  TRENDING_TOPIC
  COMPETITOR_ACTIVITY
  MILESTONE_REACHED
}
```

---

# Phase 8: Cross-Platform Analytics

## 8.1 Unified Dashboard

### Feature Description
Single view combining YouTube, Instagram, TikTok, and Twitter analytics.

### Implementation Steps for Claude Code

1. **Add platform integrations**
   - TikTok: Use RapidAPI TikTok scraper
   - Twitter: Twitter API v2
   - Instagram: RapidAPI Instagram scraper

2. **Create unified data model**
   - Normalize metrics across platforms
   - Map engagement types (likes, hearts, retweets)

3. **Build unified dashboard**
   - Platform selector/filter
   - Aggregate metrics view
   - Per-platform breakdown

---

# Phase 9: Campaign & Collaboration

## 9.1 Campaign Tracker

### Feature Description
Group videos into campaigns and measure collective performance.

### Database Schema

```prisma
model Campaign {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  
  name            String
  description     String?
  startDate       DateTime?
  endDate         DateTime?
  
  // Goals
  targetViews     BigInt?
  targetEngagement Float?
  
  // Videos in campaign
  videos          CampaignVideo[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model CampaignVideo {
  id              String    @id @default(cuid())
  campaignId      String
  campaign        Campaign  @relation(fields: [campaignId], references: [id])
  
  platform        Platform
  videoId         String
  videoUrl        String
  
  addedAt         DateTime  @default(now())
}
```

---

# Phase 10: Comment Intelligence

## 10.1 Question Extraction

### Feature Description
Automatically extract questions from comments as content ideas.

### Implementation Steps for Claude Code

1. **Create question detector**
   - NLP-based question identification
   - Filter duplicates and noise

2. **Categorize questions**
   - FAQ-style grouping
   - Topic clustering

3. **Build content ideas dashboard**
   - List of extracted questions
   - Frequency/engagement scores
   - "Answer this" quick action

---

## 10.2 Product Mention Detection

### Feature Description
Identify products viewers mention in comments.

### Implementation Steps for Claude Code

1. **Create entity extraction service**
   - Named entity recognition for products/brands
   - Build product database

2. **Create affiliate opportunity matcher**
   - Match mentioned products with affiliate programs

---

# Phase 11: Reporting & Export

## 11.1 Automated Weekly Reports

### Feature Description
Email digest with key metrics and insights.

### Implementation Steps for Claude Code

1. **Create report generation service**
   - `backend/src/services/report-generator.service.js`
   - Compile weekly stats, trends, insights

2. **Create email templates**
   - React Email or MJML templates
   - Mobile-responsive design

3. **Set up email delivery**
   - Use Resend, SendGrid, or AWS SES
   - Vercel cron for weekly scheduling

4. **Add report preferences**
   - Frequency selection
   - Metric selection
   - Unsubscribe option

---

## 11.2 PDF Export

### Feature Description
Export analytics to professional PDF reports.

### Implementation Steps for Claude Code

1. **Create PDF service**
   - Use Puppeteer or @react-pdf/renderer
   - `backend/src/services/pdf-export.service.js`

2. **Design PDF templates**
   - Cover page with branding
   - Executive summary
   - Detailed metrics sections
   - Charts and visualizations

3. **Add export button**
   - One-click PDF download
   - Date range selection

---

## 11.3 Google Sheets Sync

### Feature Description
Auto-populate Google Sheets with analytics data.

### Implementation Steps for Claude Code

1. **Integrate Google Sheets API**
   - OAuth flow for user authorization
   - Sheets API for data writing

2. **Create sync service**
   - Map analytics data to sheet columns
   - Append new data or update existing

3. **Add sync settings**
   - Select sheet destination
   - Choose metrics to sync
   - Set sync frequency

---

# 📊 Implementation Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Authentication (Clerk) | High | Low | P0 |
| API Key Management | High | Medium | P0 |
| Competitor Tracking | High | Medium | P1 |
| PDF Reports | High | Low | P1 |
| Viral Potential Score | High | High | P2 |
| Optimal Posting Time | Medium | Medium | P2 |
| Thumbnail Analysis | Medium | High | P3 |
| Cross-Platform Dashboard | High | High | P3 |

---

# 🔧 Development Guidelines for Claude Code

## Code Standards

1. **TypeScript preferred** for new services
2. **Error handling** - All services should have try-catch with proper error messages
3. **Logging** - Use structured logging with levels (info, warn, error)
4. **Testing** - Write unit tests for services, integration tests for routes
5. **Documentation** - JSDoc comments for all public methods

## File Naming Conventions

```
Services:     [name].service.ts
Routes:       [name].routes.ts
Middleware:   [name].middleware.ts
Components:   PascalCase.tsx
Pages:        PascalCase.tsx (in app/ directory for Next.js App Router)
Hooks:        use[Name].ts
Utils:        camelCase.ts
Types:        [name].types.ts
```

## API Response Format

```typescript
// Success
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

// Error
interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: Record<string, any>;
}

// Example
{
  success: true,
  data: { ... },
  meta: {
    timestamp: "2024-01-15T10:30:00Z",
    requestId: "abc123"
  }
}
```

## Environment Variables

Always add new env vars to:
1. `.env.example` with placeholder
2. `config/index.js` with validation
3. README documentation

---

# 📝 Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2024-01-15 | 1.0.0 | Initial roadmap created |

---

*This document is designed to be used by Claude Code agents. Each feature section contains all necessary context for autonomous implementation.*
