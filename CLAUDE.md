# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack video analytics platform that analyzes YouTube and Instagram videos. The application fetches video metrics, performs sentiment analysis on comments, extracts keywords/hashtags, and visualizes engagement patterns.

**Tech Stack:**
- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS, Framer Motion, Recharts
- **Backend:** Next.js API Routes (serverless functions)
- **Database:** PostgreSQL (Vercel Postgres/Neon/Supabase)
- **Cache:** Upstash Redis (1-hour TTL)
- **APIs:** YouTube Data API v3, RapidAPI (Instagram)
- **Authentication:** Clerk (JWT-based auth)
- **Deployment:** Vercel (single Next.js app with serverless functions)
- **Architecture:** Full-stack Next.js with server-side business logic

## Development Commands

All commands run from `/frontend` directory:

```bash
# Development server (runs on http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint

# Database operations
npm run prisma:generate   # Generate Prisma client (runs automatically on postinstall)
npm run prisma:push       # Push schema changes without migrations
npm run prisma:migrate    # Create and apply migrations
npm run prisma:studio     # Open Prisma Studio GUI
```

### Running the Application

```bash
cd frontend
npm install              # Install dependencies (automatically runs prisma generate)
npm run dev              # Start development server on http://localhost:3000
```

The application is now a single Next.js app with API routes handling all backend logic.

## Architecture

### Full-Stack Next.js Architecture

The application is a monolithic Next.js app with server-side business logic in API routes:

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Root layout (Clerk provider, fonts, metadata)
│   │   ├── page.tsx           # Home page (main analytics UI)
│   │   ├── middleware.ts      # Clerk auth middleware
│   │   └── api/               # API Routes (serverless functions)
│   │       ├── health/route.ts          # Health check endpoint
│   │       ├── analyze/route.ts         # Analyze video endpoint
│   │       ├── compare/route.ts         # Compare videos endpoint
│   │       ├── detect-platform/route.ts # Detect video platform
│   │       ├── history/[videoId]/route.ts # Video history
│   │       ├── auth/
│   │       │   ├── webhook/route.ts     # Clerk user sync webhook
│   │       │   └── me/route.ts          # Get current user profile
│   │       └── keys/
│   │           ├── route.ts             # List/create API keys
│   │           └── [id]/
│   │               ├── route.ts         # Get/update/delete API key
│   │               └── test/route.ts    # Test API key
│   │
│   ├── components/            # React components
│   │   ├── SearchBar.tsx     # Video URL input
│   │   ├── VideoPreview.tsx  # Video metadata display
│   │   ├── MetricsGrid.tsx   # Key metrics cards
│   │   ├── charts/           # Recharts visualizations
│   │   │   ├── EngagementChart.tsx
│   │   │   ├── SentimentChart.tsx
│   │   │   └── DemographicsChart.tsx
│   │   └── comments/         # Comment components
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── useAnalytics.ts  # Video analytics API calls
│   │   ├── useApiKeys.ts    # API key management
│   │   └── useUserProfile.ts # User profile data
│   │
│   └── lib/                  # Server-side business logic
│       ├── prisma.ts         # PrismaClient singleton
│       ├── redis.ts          # Upstash Redis client
│       ├── services/         # Business logic services
│       │   ├── youtube.ts    # YouTube Data API integration
│       │   ├── instagram.ts  # Instagram API integration
│       │   ├── sentiment.ts  # Sentiment analysis
│       │   ├── cache.ts      # Redis caching utilities
│       │   └── encryption.ts # API key encryption (AES-256-GCM)
│       ├── utils/            # Utility functions
│       │   ├── platform-detector.ts # Detect video platform from URL
│       │   ├── rate-limiter.ts      # Anonymous rate limiting
│       │   └── formatters.ts        # Number/duration formatting
│       └── types/            # TypeScript types and interfaces
│
├── prisma/
│   ├── schema.prisma         # Database schema (PostgreSQL)
│   └── migrations/           # Database migrations
│
├── public/                   # Static assets
├── next.config.js            # Next.js configuration
├── middleware.ts             # Clerk authentication middleware
└── vercel.json              # Vercel deployment config
```

**Key Architectural Patterns:**

1. **API Routes as Serverless Functions:**
   - Each route.ts file exports GET, POST, PUT, DELETE handlers
   - Runs as separate serverless functions on Vercel
   - Stateless design with external state (PostgreSQL, Redis)

2. **Server-Side Services:**
   - Located in `src/lib/services/`
   - Handle business logic: API integrations, caching, sentiment analysis
   - Shared across multiple API routes

3. **Database Layer:**
   - Prisma ORM for type-safe database access
   - PostgreSQL for persistent storage (videos, users, analytics)
   - Connection pooling for serverless compatibility

4. **Caching Layer:**
   - Upstash Redis for fast data access
   - 1-hour TTL for video analytics
   - Rate limiting for anonymous users

5. **Authentication:**
   - Clerk for user authentication and management
   - Middleware validates JWT tokens on protected routes
   - Webhooks sync user data to local database

### Request Flow (Next.js API Routes)

```
User submits URL → SearchBar (frontend)
  ↓
useAnalytics hook → POST /api/analyze
  ↓
Next.js Middleware (src/middleware.ts):
  1. Clerk authentication (extracts user if authenticated)
  2. Public routes allowed without auth
  ↓
API Route Handler (/api/analyze/route.ts):
  1. Validate request body
  2. Check user authentication status
  3. Apply rate limiting (5 req/day for anonymous users)
  ↓
Business Logic Flow:
  ├─ detectPlatform(url) → Identify YouTube/Instagram/etc
  ├─ checkCache(videoId) → Redis lookup (1-hour TTL)
  ├─ If cache miss:
  │   ├─ fetchYouTubeAnalytics() OR fetchInstagramAnalytics()
  │   ├─ analyzeSentiment(comments) → Positive/Neutral/Negative
  │   ├─ extractKeywords(comments) → Top keywords/hashtags
  │   ├─ calculateEngagementRate() → (likes + comments) / views * 100
  │   ├─ saveToDatabase() → Prisma insert/update
  │   └─ cacheResults() → Redis set with TTL
  └─ If cache hit: Return cached data
  ↓
Return JSON Response:
  - Video metadata (title, channel, thumbnail)
  - Engagement metrics (views, likes, comments, shares)
  - Sentiment analysis (score, distribution)
  - Keywords and hashtags
  - Demographics (mocked data for now)
  ↓
Frontend renders: VideoPreview, MetricsGrid, Charts, Comments
```

### Frontend Architecture (Next.js App Router)

The frontend uses Next.js 15 with the App Router pattern:

```
src/app/
├─ layout.jsx (Root layout with metadata, fonts)
└─ page.jsx (Home page - Client Component with 'use client')
   ├─ Header
   ├─ SearchBar (triggers analyze via useAnalytics hook)
   └─ Conditional render based on state:
      ├─ LoadingState (while fetching)
      ├─ Error state (if failed)
      ├─ EmptyState (initial state)
      └─ Analytics view:
         ├─ VideoPreview (metadata + thumbnail)
         ├─ MetricsGrid (views, likes, comments, engagement)
         ├─ EngagementChart (Recharts line chart - daily patterns)
         ├─ SentimentChart (Recharts pie chart - pos/neg/neutral)
         ├─ DemographicsChart (Recharts bar chart - age/gender)
         ├─ KeywordsCloud (tag cloud)
         └─ TopComments (sentiment-annotated comments)
```

**Important:** All components use `'use client'` directive because they use client-side features:
- Framer Motion animations (motion components)
- React hooks (useState, useCallback, useEffect)
- Event handlers and interactivity

**API Calls:** The `useAnalytics` hook makes fetch requests to `/api/*` endpoints, which are handled by Next.js API route handlers in the same application.

### Database Schema

The Prisma schema defines:
- **Video** - Stores video metadata and metrics (BigInt for counts to handle viral videos)
- **Analytics** - Time-series snapshots for tracking growth
- **Comment** - Comments with sentiment classification
- **ApiRequest** - Request logging for analytics

**Important:** The application uses PostgreSQL's `BigInt` for view/like/comment counts to handle very large numbers on viral videos.

### Security & Request Pipeline

**Next.js Middleware** (`src/middleware.ts`):
1. Clerk authentication - Validates JWT tokens, extracts user info
2. Public routes - Allows `/api/analyze`, `/api/compare` without auth
3. Protected routes - Requires authentication for `/api/keys`, `/api/auth/me`

**API Route Security**:
1. Request validation - Validate request body/query parameters
2. Rate limiting - Redis-based rate limiting for anonymous users
3. Error handling - Try-catch blocks with proper error responses
4. CORS - Configured in Next.js config and Clerk settings

**Clerk Webhook Security** (`/api/auth/webhook`):
1. Signature verification using Svix library
2. Raw body parsing for signature validation
3. User sync to local database (create/update/delete)

**Rate Limiting**:
- **Anonymous users**: 5 requests/day (IP + browser fingerprint)
- **Authenticated users**: Tier-based limits (FREE: 5, CREATOR: 100, PRO: 500, AGENCY: 2000)
- Tracked in Redis with 24-hour rolling window

### Environment Configuration

The application requires these environment variables (see `frontend/.env.example`):

**Required:**
- `DATABASE_URL` - PostgreSQL connection string (use connection pooling for serverless)
- `UPSTASH_REDIS_REST_URL` - Redis REST endpoint
- `UPSTASH_REDIS_REST_TOKEN` - Redis token
- `YOUTUBE_API_KEY` - YouTube Data API v3 key
- `CLERK_SECRET_KEY` - Clerk authentication secret key (server-side only)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key (exposed to browser)
- `CLERK_WEBHOOK_SECRET` - Clerk webhook signature verification
- `ENCRYPTION_KEY` - AES-256-GCM key for encrypting user API keys

**Optional:**
- `RAPIDAPI_KEY` - For Instagram support
- `CACHE_TTL_SECONDS` - Cache duration (default: 3600 seconds)
- `RATE_LIMIT_WINDOW_MS` - Rate limit window (default: 900000ms / 15 minutes)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 100)

**Note:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. All other variables are server-side only.

## Key Implementation Details

### Cache Strategy
- All video analytics cached for 1 hour in Redis
- Cache keys: `video:{platform}:{videoId}`
- History stored as Redis lists: `history:{videoId}` (max 30 snapshots)
- Rate limit keys: `ratelimit:{identifier}` (15-minute expiry)

### Engagement Rate Calculation
```javascript
engagementRate = ((likes + comments) / views) * 100
```

### Sentiment Analysis
- Uses `sentiment` npm package for positive/negative/neutral classification
- Scores range from -1 (very negative) to +1 (very positive)
- Overall sentiment determined by majority classification
- Applied to all comments, top 10 displayed in UI

### Data Formatting
- Numbers formatted with K/M/B suffixes (handled in `analytics.service.formatNumber()`)
- Duration formatted as HH:MM:SS (handled in `analytics.service.formatDuration()`)
- All BigInt values converted to numbers in API responses

### Serverless Compatibility (Vercel)
- **Single Next.js App**: Frontend and backend in one deployment
- **API Routes**: Each route handler runs as a separate serverless function
- **Prisma Client**: Singleton pattern to reuse database connections
- **Redis Client**: Singleton pattern with connection pooling
- **Build Command**: `npm run build` (automatically runs `prisma generate` via postinstall)
- **Environment Variables**: Set in Vercel dashboard (not in code)
- **Database Pooling**: Required for PostgreSQL (use Vercel Postgres, Neon pooling, or Supabase)

Example singleton pattern for Prisma:
```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
```

## Common Patterns

### Adding a New Platform
1. Create service in `frontend/src/lib/services/{platform}.ts`
   - Export async function `fetch{Platform}Analytics(url: string)`
   - Use platform's API to fetch video data
   - Return standardized analytics object
2. Update `detectPlatform()` in `src/lib/utils/platform-detector.ts`
   - Add URL pattern matching for new platform
3. Update `Platform` enum in Prisma schema
4. Run `npx prisma migrate dev` to update database
5. Update `/api/analyze/route.ts` to call new service

Example service structure:
```typescript
// src/lib/services/tiktok.ts
export async function fetchTikTokAnalytics(url: string) {
  const videoId = extractVideoId(url);
  // Call TikTok API
  const response = await fetch(`https://api.tiktok.com/...`);
  const data = await response.json();

  return {
    platform: 'TIKTOK',
    videoId,
    title: data.title,
    // ... other fields
  };
}
```

### Adding New Analytics Features
1. Create service function in `src/lib/services/` if needed
2. Update Prisma schema to store new data
3. Update API route handler to call service and return data
4. Create React component in `src/components/`
5. Import and render in `src/app/page.tsx`

### Adding a New API Endpoint
1. Create route file: `src/app/api/{endpoint}/route.ts`
2. Export HTTP method handlers: `GET`, `POST`, `PUT`, `DELETE`
3. Add authentication check if needed (using Clerk)
4. Validate request body/query parameters
5. Implement business logic or call service functions
6. Return `NextResponse.json()` with data

Example API route:
```typescript
// src/app/api/videos/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication (optional)
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch data
    const video = await prisma.video.findUnique({
      where: { id: params.id },
      include: { analytics: true, comments: true },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Return response
    return NextResponse.json(video);
  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Testing API Endpoints
```bash
# Health check
curl http://localhost:3000/api/health

# Analyze video
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

# Compare videos
curl -X POST http://localhost:3000/api/compare \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://www.youtube.com/watch?v=abc", "https://www.youtube.com/watch?v=xyz"]}'

# Get history
curl http://localhost:3000/api/history/{videoId}

# Detect platform
curl http://localhost:3000/api/detect-platform?url=https://www.youtube.com/watch?v=abc
```

## Important Constraints

- **YouTube API Quota:** 10,000 units/day by default (each video analysis uses ~10 units)
- **Instagram:** No official API access; using RapidAPI scraper (paid service)
- **Demographics:** Currently mocked data; real data requires YouTube OAuth and Analytics API
- **Real-time Data:** Not implemented; analytics are point-in-time snapshots
- **Redis Requirement:** Cache fails gracefully but rate limiting won't work without Redis
- **Prisma Client:** Must run `npx prisma generate` after schema changes

## Deployment Notes

### Vercel Deployment
1. **Single deployment** - Next.js app with API routes (root: `frontend`)
2. **Environment variables** - Set in Vercel dashboard (Production, Preview, Development)
   - Must prefix public vars with `NEXT_PUBLIC_`
   - Server-side vars are only accessible in API routes
3. **Database setup** - Use Vercel Postgres, Neon, Supabase, or Railway
   - Connection pooling required for serverless (Neon pooling or Supabase transaction mode)
4. **Build process** - `npm run build` automatically runs `prisma generate`
5. **Clerk webhook** - Update webhook URL after first deployment

For detailed deployment instructions, see `frontend/VERCEL_DEPLOYMENT.md`

### Production Checklist
- Set environment variables in Vercel dashboard
- Use connection pooling for PostgreSQL (`?connection_limit=1&pool_timeout=0`)
- Configure Clerk webhook URL to production domain
- Update Clerk allowed origins with production domain
- Restrict YouTube API key to production domain
- Monitor YouTube API quota usage (Google Cloud Console)
- Set up error tracking (e.g., Sentry, LogRocket)
- Enable Vercel Analytics for performance monitoring
- Test all API endpoints after deployment
