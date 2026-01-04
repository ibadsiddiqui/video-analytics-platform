# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack video analytics platform that analyzes YouTube and Instagram videos. The application fetches video metrics, performs sentiment analysis on comments, extracts keywords/hashtags, and visualizes engagement patterns.

**Tech Stack:**
- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS, Framer Motion, Recharts
- **Backend:** NestJS, TypeScript, Node.js, Prisma ORM
- **Database:** PostgreSQL (Vercel Postgres/Neon/Supabase)
- **Cache:** Upstash Redis (1-hour TTL)
- **APIs:** YouTube Data API v3, RapidAPI (Instagram)
- **Deployment:** Vercel (serverless functions)
- **Architecture:** Clean Architecture with NestJS modules

## Development Commands

### Backend (from `/backend`)

```bash
# Development server with hot reload (TypeScript)
yarn dev

# Build TypeScript to JavaScript
yarn build

# Production server (runs compiled JS)
yarn start

# Type checking
yarn type-check

# Testing
yarn test
yarn test:watch
yarn test:coverage

# Database operations
yarn prisma:generate      # Generate Prisma client
yarn prisma:push          # Push schema changes without migrations
yarn prisma:migrate       # Create and apply migrations
npx prisma studio         # Open Prisma Studio GUI
```

### Frontend (from `/frontend`)

```bash
# Development server (runs on http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint
```

### Running the Full Stack

Open two terminals:
1. Terminal 1: `cd backend && yarn dev` (runs on port 3001)
2. Terminal 2: `cd frontend && npm run dev` (runs on port 3000)

## Architecture

### Backend Clean Architecture with NestJS

The backend follows **Clean Architecture** principles with **NestJS**, organizing code into layers with clear dependencies:

```
backend/src/
├── main.ts              # NestJS bootstrap (serverless export for Vercel)
├── app.module.ts        # Root module (imports all feature modules)
│
├── domain/              # Core business logic (no external dependencies)
│   ├── entities/        # Business entities (Video, Analytics)
│   ├── exceptions/      # Domain exceptions (VideoNotFoundException)
│   └── interfaces/      # Service contracts (IVideoService, ICacheService)
│
├── application/         # Use cases and business workflows
│   ├── application.module.ts  # Application module
│   ├── use-cases/       # Business logic orchestration
│   │   ├── AnalyzeVideoUseCase.ts
│   │   ├── CompareVideosUseCase.ts
│   │   ├── DetectPlatformUseCase.ts
│   │   └── GetVideoHistoryUseCase.ts
│   ├── dtos/            # Data Transfer Objects with validation
│   └── services/        # Application services (ApiKeyResolverService)
│
├── infrastructure/      # External service implementations
│   ├── database/
│   │   ├── database.module.ts    # Global database module
│   │   └── prisma.service.ts     # PrismaClient wrapper
│   ├── cache/
│   │   ├── cache.module.ts       # Global cache module
│   │   └── RedisCacheService.ts  # Upstash Redis
│   ├── external-apis/
│   │   ├── external-apis.module.ts
│   │   ├── YouTubeService.ts
│   │   └── InstagramService.ts
│   ├── sentiment/
│   │   ├── sentiment.module.ts
│   │   └── SentimentService.ts
│   └── encryption/
│       ├── encryption.module.ts
│       └── EncryptionService.ts
│
├── presentation/        # HTTP layer (NestJS controllers, guards, filters)
│   ├── modules/         # Feature-based modules
│   │   ├── health/
│   │   │   ├── health.module.ts
│   │   │   └── health.controller.ts
│   │   ├── analytics/
│   │   │   ├── analytics.module.ts
│   │   │   └── analytics.controller.ts
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   └── auth.controller.ts (Clerk webhook + user profile)
│   │   └── api-keys/
│   │       ├── api-keys.module.ts
│   │       └── api-keys.controller.ts
│   ├── guards/
│   │   ├── auth.guard.ts           # Requires Clerk JWT
│   │   └── optional-auth.guard.ts  # Optional authentication
│   ├── interceptors/
│   │   ├── logging.interceptor.ts         # Request logging
│   │   └── anonymous-rate-limit.interceptor.ts  # 5 req/day for anonymous
│   └── filters/
│       └── http-exception.filter.ts  # Global error handling
│
└── shared/              # Cross-cutting concerns
    ├── config/
    │   ├── config.module.ts   # Global config module
    │   └── ConfigService.ts   # Environment variables
    └── constants/
        └── Platform.ts        # Platform enum
```

**Key NestJS Modules:**

1. **Feature Modules** (Presentation Layer):
   - `HealthModule` - Health check endpoint
   - `AnalyticsModule` - Video analytics endpoints (analyze, compare, history)
   - `AuthModule` - Clerk webhook and user profile endpoints
   - `ApiKeysModule` - User API key management endpoints

2. **Infrastructure Modules**:
   - `DatabaseModule` (global) - PrismaService for database access
   - `CacheModule` (global) - RedisCacheService for Upstash Redis
   - `ConfigModule` (global) - Environment variable management
   - `ExternalApisModule` - YouTubeService, InstagramService
   - `SentimentModule` - SentimentService for comment analysis
   - `EncryptionModule` - EncryptionService for API key encryption

3. **Application Module**:
   - `ApplicationModule` - Exports all use cases and application services
   - Orchestrates business logic workflows

**Dependency Injection:** NestJS built-in DI system replaces TypeDI
- All services use `@Injectable()` decorator
- Modules handle dependency registration automatically
- Constructor injection for all dependencies

### Request Flow (NestJS)

```
User submits URL → SearchBar (frontend)
  ↓
useAnalytics hook → POST /api/analyze
  ↓
NestJS Request Pipeline:
  1. Global Middleware (helmet, CORS, body parsing)
  2. LoggingInterceptor (logs request)
  3. OptionalAuthGuard (extracts user if authenticated)
  4. AnonymousRateLimitInterceptor (5 req/day for anonymous)
  5. ValidationPipe (validates DTO with class-validator)
  ↓
AnalyticsController.analyzeVideo() [Presentation Layer]
  ↓
AnalyzeVideoUseCase.execute() [Application Layer]
  ├─ DetectPlatformUseCase.execute() (identify platform)
  ├─ RedisCacheService.get() (check cache)
  ├─ YouTubeService.getVideoAnalytics() OR InstagramService.getVideoAnalytics()
  ├─ SentimentService.analyzeComments() (enrichment)
  ├─ SentimentService.extractKeywords() (enrichment)
  └─ RedisCacheService.set() + addToHistory()
  ↓
Return enriched analytics JSON (via DTOs)
  ↓
Response Pipeline:
  1. LoggingInterceptor (logs response time)
  2. HttpExceptionFilter (catches errors)
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

**API Calls:** The `useAnalytics` hook fetches from `/api/*` endpoints, which are proxied to the backend via `next.config.js` rewrites in development, or direct calls in production.

### Database Schema

The Prisma schema defines:
- **Video** - Stores video metadata and metrics (BigInt for counts to handle viral videos)
- **Analytics** - Time-series snapshots for tracking growth
- **Comment** - Comments with sentiment classification
- **ApiRequest** - Request logging for analytics

**Important:** The application uses PostgreSQL's `BigInt` for view/like/comment counts to handle very large numbers on viral videos.

### Security & Request Pipeline (NestJS)

Configured in `src/main.ts`:

**Express Middleware** (applied to NestJS app):
1. `helmet()` - Security headers (CORS policy: cross-origin)
2. `app.enableCors()` - Custom CORS with origin validation (localhost, Vercel, Clerk domains)
3. Raw body middleware - For `/api/auth/webhook` signature verification (Svix/Clerk)
4. `express.json({ limit: '1mb' })` - JSON body parsing with size limit

**Global NestJS Components**:
1. `app.setGlobalPrefix('api')` - All routes prefixed with `/api`
2. `ValidationPipe` (global) - Validates all DTOs with class-validator, transforms payloads
3. `LoggingInterceptor` (global) - Logs all requests with timing
4. `HttpExceptionFilter` (global) - Catches all errors, formats responses

**Route-Specific Guards** (applied via decorators):
- `@UseGuards(AuthGuard)` - Requires valid Clerk JWT token (for protected routes)
- `@UseGuards(OptionalAuthGuard)` - Allows anonymous + authenticated (for analyze/compare)

**Route-Specific Interceptors**:
- `@UseInterceptors(AnonymousRateLimitInterceptor)` - 5 requests/day for anonymous users
- Uses Redis to track: IP address + browser fingerprint hash

**Rate Limiting**:
- **Anonymous users**: 5 requests/day (via AnonymousRateLimitInterceptor)
- **Authenticated users**: Tier-based limits (FREE: 5, CREATOR: 100, PRO: 500, AGENCY: 2000)

### Environment Configuration

Backend requires these environment variables (see `backend/.env.example`):

**Required:**
- `DATABASE_URL` - PostgreSQL connection string (use connection pooling for serverless)
- `UPSTASH_REDIS_REST_URL` - Redis REST endpoint
- `UPSTASH_REDIS_REST_TOKEN` - Redis token
- `YOUTUBE_API_KEY` - YouTube Data API v3 key
- `CLERK_SECRET_KEY` - Clerk authentication secret key
- `CLERK_PUBLISHABLE_KEY` - Clerk publishable key

**Optional:**
- `RAPIDAPI_KEY` - For Instagram support
- `FRONTEND_URL` - CORS whitelist (default: http://localhost:3000)
- `CACHE_TTL_SECONDS` - Cache duration (default: 3600)

Frontend uses:
- `NEXT_PUBLIC_API_URL` - Backend API URL (optional, defaults to `/api` which is rewritten via next.config.js)

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
- **Backend**: NestJS app exported as default function in `main.ts`
- **App Caching**: `cachedApp` variable reduces cold start time (reuses bootstrapped app)
- **Conditional Startup**: `if (process.env.VERCEL !== '1')` prevents `app.listen()` on Vercel
- **Vercel Config**: `backend/vercel.json` points to `dist/main.js` as entry point
- **Build Command**: `yarn vercel-build` runs `prisma generate && nest build`
- **Frontend**: Next.js deployed as serverless functions + static pages
- **API Rewrites**: `next.config.js` proxies `/api/*` to backend in development

Example serverless export in `main.ts`:
```typescript
let cachedApp: NestExpressApplication;

export default async (req: any, res: any) => {
  if (!cachedApp) {
    cachedApp = await bootstrap();
  }
  return cachedApp.getHttpAdapter().getInstance()(req, res);
};
```

## Common Patterns

### Adding a New Platform (NestJS)
1. Create service in `backend/src/infrastructure/external-apis/{Platform}Service.ts`
   - Add `@Injectable()` decorator
   - Implement `IVideoService` interface with `getVideoAnalytics(url)` method
2. Add service to `ExternalApisModule` providers and exports
   ```typescript
   @Module({
     providers: [YouTubeService, InstagramService, TikTokService],
     exports: [YouTubeService, InstagramService, TikTokService],
   })
   ```
3. Update `DetectPlatformUseCase` to recognize new platform URLs
4. Update `Platform` enum in `shared/constants/Platform.ts`
5. Add platform to Prisma schema if needed (run `npx prisma migrate dev`)

### Adding New Analytics Features
1. Create or extend use case in `application/use-cases/`
2. Define DTOs in `application/dtos/` with class-validator decorators
3. Extend infrastructure services in `infrastructure/` if needed
4. Create corresponding React component in `frontend/src/components/`
5. Import and render in frontend `App.jsx`
6. Update Prisma schema if persistence is required

### Adding a New Controller Endpoint (NestJS)
1. Create DTO classes with `class-validator` decorators in `application/dtos/`
2. Add method to existing controller or create new controller in `presentation/modules/{feature}/`
3. Use NestJS decorators: `@Controller()`, `@Get()`, `@Post()`, `@Body()`, `@Query()`, `@Param()`
4. Add guards (`@UseGuards()`), interceptors (`@UseInterceptors()`), Swagger docs
5. Inject required use cases via constructor (NestJS DI handles it automatically)
6. Return DTO instances (automatically serialized to JSON)

Example (NestJS):
```typescript
import { Controller, Post, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Analytics')
@Controller()  // No path needed, set in module
export class AnalyticsController {
  constructor(private readonly analyzeVideoUseCase: AnalyzeVideoUseCase) {}

  @Post('analyze')
  @UseGuards(OptionalAuthGuard)
  @UseInterceptors(AnonymousRateLimitInterceptor)
  @ApiOperation({ summary: 'Analyze video metrics' })
  @ApiResponse({ status: 200, description: 'Video analyzed successfully' })
  async analyze(@Body() request: AnalyzeVideoRequest): Promise<AnalyticsResponse> {
    return this.analyzeVideoUseCase.execute(request);
  }
}
```

**Key differences from routing-controllers:**
- `@JsonController()` → `@Controller()` (path set in module)
- `@QueryParam()` → `@Query()`
- No need for `@Service()` - use `@Injectable()` on services
- Guards replace middleware for authentication
- Interceptors replace middleware for logging/rate limiting

### Testing API Endpoints
```bash
# Analyze video
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

# Get history
curl http://localhost:3001/api/history/{videoId}

# YouTube search
curl "http://localhost:3001/api/youtube/search?q=react+tutorial"

# Health check
curl http://localhost:3001/api/health
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
1. Backend deployed as serverless function (root: `backend`)
2. Frontend deployed as Next.js app with serverless functions (root: `frontend`)
3. Environment variables set in Vercel dashboard (not in code)
   - Backend: Standard env vars
   - Frontend: Must prefix public vars with `NEXT_PUBLIC_`
4. Database connection pooling recommended (use `?connection_limit=1` for serverless)
5. Frontend API rewrites automatically handled by `next.config.js`

### Production Checklist
- Set `NODE_ENV=production` in backend environment
- Configure proper `FRONTEND_URL` for CORS
- Use connection pooling for PostgreSQL (Prisma Data Proxy or Supabase pooler)
- Monitor YouTube API quota usage
- Set up error tracking (e.g., Sentry)
