# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack video analytics platform that analyzes YouTube and Instagram videos. The application fetches video metrics, performs sentiment analysis on comments, extracts keywords/hashtags, and visualizes engagement patterns.

**Tech Stack:**
- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS, Framer Motion, Recharts
- **Backend:** TypeScript, Node.js, Express, routing-controllers, TypeDI, Prisma ORM
- **Database:** PostgreSQL (Vercel Postgres/Neon/Supabase)
- **Cache:** Upstash Redis (1-hour TTL)
- **APIs:** YouTube Data API v3, RapidAPI (Instagram)
- **Deployment:** Vercel (serverless functions)
- **Architecture:** Clean Architecture with domain-driven design

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

### Backend Clean Architecture

The backend follows **Clean Architecture** principles with TypeScript, organizing code into layers with clear dependencies:

```
backend/src/
├── domain/              # Core business logic (no external dependencies)
│   ├── entities/        # Business entities (Video, Analytics)
│   ├── exceptions/      # Domain exceptions (VideoNotFoundException)
│   └── interfaces/      # Service contracts (IVideoService, ICacheService)
├── application/         # Use cases and business workflows
│   ├── use-cases/       # Business logic orchestration
│   │   ├── AnalyzeVideoUseCase.ts
│   │   ├── CompareVideosUseCase.ts
│   │   └── DetectPlatformUseCase.ts
│   └── dtos/            # Data Transfer Objects with validation
├── infrastructure/      # External service implementations
│   ├── cache/           # RedisCacheService (Upstash Redis)
│   ├── database/        # Prisma repositories
│   └── external/        # YouTubeService, InstagramService, SentimentService
├── presentation/        # HTTP layer
│   ├── controllers/     # HealthController, AnalyticsController
│   └── middleware/      # ErrorHandler, validation
├── shared/              # Cross-cutting concerns
│   ├── config/          # ConfigService
│   └── constants/       # Platform enums
├── App.ts               # Application bootstrap
└── index.ts             # Entry point
```

**Key Services:**

1. **Use Cases** (Application Layer):
   - `AnalyzeVideoUseCase` - Orchestrates video analysis workflow
   - `CompareVideosUseCase` - Compares multiple videos
   - `DetectPlatformUseCase` - Identifies platform from URL

2. **Infrastructure Services**:
   - `YouTubeService` - YouTube Data API v3 integration
   - `InstagramService` - Instagram API integration (RapidAPI)
   - `SentimentService` - Comment sentiment analysis using `sentiment` package
   - `RedisCacheService` - Upstash Redis caching layer

3. **Controllers** (Presentation Layer):
   - `HealthController` - Health check endpoint
   - `AnalyticsController` - Video analytics endpoints

**Dependency Injection:** Services are injected using **TypeDI**, enabling testability and loose coupling.

### Request Flow

```
User submits URL → SearchBar (frontend)
  ↓
useAnalytics hook → POST /api/analyze
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

### Security Middleware Stack (in order)

Applied in `src/index.js`:
1. `helmet()` - Security headers (CORS policy set to cross-origin for API)
2. `cors(corsOptions)` - CORS with whitelist (configured via FRONTEND_URL env var)
3. `createRateLimiter()` - 100 requests per 15 minutes (configurable)
4. `express.json({ limit: '1mb' })` - JSON body parsing with size limit
5. `requestLogger` - Logs requests to console
6. `sanitizeInput` - XSS prevention via validator library
7. `validateUrl` - Validates video URLs against domain whitelist

### Environment Configuration

Backend requires these environment variables (see `backend/.env.example`):

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `UPSTASH_REDIS_REST_URL` - Redis REST endpoint
- `UPSTASH_REDIS_REST_TOKEN` - Redis token
- `YOUTUBE_API_KEY` - YouTube Data API v3 key

**Optional:**
- `RAPIDAPI_KEY` - For Instagram support
- `FRONTEND_URL` - CORS whitelist (default: http://localhost:3000)
- `RATE_LIMIT_MAX_REQUESTS` - Rate limit threshold (default: 100)
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

### Serverless Compatibility
- Backend exports Express app for Vercel serverless functions
- Conditional server startup: `if (process.env.VERCEL !== '1')`
- Vercel configuration in `backend/vercel.json`
- Frontend: Next.js deployed as serverless functions (API routes) + static pages
- API rewrites in `next.config.js` proxy `/api/*` to backend in development

## Common Patterns

### Adding a New Platform
1. Create service in `backend/src/infrastructure/external/{Platform}Service.ts`
2. Implement `IVideoService` interface with `getVideoAnalytics(url)` method
3. Add platform detection logic to `DetectPlatformUseCase`
4. Register service in TypeDI container (automatically via `@Service()` decorator)
5. Update `Platform` enum in `shared/constants/Platform.ts`
6. Add platform to Prisma schema if needed

### Adding New Analytics Features
1. Create or extend use case in `application/use-cases/`
2. Define DTOs in `application/dtos/` with class-validator decorators
3. Extend infrastructure services in `infrastructure/` if needed
4. Create corresponding React component in `frontend/src/components/`
5. Import and render in frontend `App.jsx`
6. Update Prisma schema if persistence is required

### Adding a New Controller Endpoint
1. Create DTO classes with validation decorators in `application/dtos/`
2. Add method to existing controller or create new controller in `presentation/controllers/`
3. Use `@Get()`, `@Post()`, etc. decorators from routing-controllers
4. Inject required use cases via constructor (TypeDI handles injection)
5. Return DTO instances (automatically serialized to JSON)

Example:
```typescript
@JsonController('/api/analytics')
export class AnalyticsController {
  constructor(private analyzeVideoUseCase: AnalyzeVideoUseCase) {}

  @Post('/analyze')
  async analyze(@Body() request: AnalyzeVideoRequest): Promise<AnalyticsResponse> {
    return this.analyzeVideoUseCase.execute(request);
  }
}
```

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
