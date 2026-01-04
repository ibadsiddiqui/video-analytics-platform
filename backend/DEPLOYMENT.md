# NestJS Backend - Vercel Deployment Guide

## Overview

The backend has been migrated to NestJS and configured for Vercel serverless deployment. This guide covers deployment setup, configuration, and troubleshooting.

## Architecture

- **Framework:** NestJS (replaces Express + routing-controllers + TypeDI)
- **Language:** TypeScript with Clean Architecture
- **Deployment:** Vercel Serverless Functions
- **Build Tool:** NestJS CLI (replaces tsc + tsc-alias)
- **Entry Point:** `dist/main.js` (replaces `dist/index.js`)

## Build Configuration

### Dependencies
NestJS CLI handles TypeScript compilation and module resolution automatically:
```json
{
  "devDependencies": {
    "@nestjs/cli": "^10.x",
    "@nestjs/schematics": "^10.x"
  }
}
```

### Build Scripts
```json
{
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "vercel-build": "prisma generate && nest build",
    "start": "node dist/main.js"
  }
}
```

### Vercel Configuration
`vercel.json` points to NestJS compiled output:
```json
{
  "version": 2,
  "buildCommand": "yarn vercel-build",
  "outputDirectory": "dist",
  "installCommand": "yarn install",
  "builds": [
    {
      "src": "dist/main.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/main.js"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "VERCEL": "1"
  }
}
```

### Deployment Process

#### Local Testing
```bash
# Build for production
yarn build

# Test production build locally
NODE_ENV=production yarn start

# Verify health endpoint
curl http://localhost:3001/api/health
```

#### Deploy to Vercel

**Option 1: Vercel CLI**
```bash
cd /Users/konoz/Desktop/personal/projects/video-analytics-platform/backend
vercel --prod
```

**Option 2: Git Push (Automatic Deployment)**
```bash
git add .
git commit -m "feat: complete NestJS migration"
git push origin master
```

Vercel will automatically:
1. Run `yarn install` to install dependencies
2. Run `yarn vercel-build` which:
   - Generates Prisma Client (`prisma generate`)
   - Compiles NestJS application (`nest build`)
3. Deploy `dist/main.js` as serverless function
4. Route all requests through the NestJS application

### Environment Variables

Set these in Vercel Dashboard:

**Required:**
- `DATABASE_URL` - PostgreSQL connection string (use connection pooling)
- `UPSTASH_REDIS_REST_URL` - Redis REST endpoint
- `UPSTASH_REDIS_REST_TOKEN` - Redis token
- `YOUTUBE_API_KEY` - YouTube Data API v3 key
- `CLERK_SECRET_KEY` - Clerk authentication secret
- `CLERK_PUBLISHABLE_KEY` - Clerk publishable key

**Optional:**
- `RAPIDAPI_KEY` - For Instagram support
- `FRONTEND_URL` - CORS whitelist (e.g., https://your-app.vercel.app)
- `RATE_LIMIT_MAX_REQUESTS` - Rate limit threshold (default: 100)
- `CACHE_TTL_SECONDS` - Cache duration (default: 3600)

### Verification

After deployment:

```bash
# Health check
curl https://your-backend.vercel.app/api/health

# Test analyze endpoint
curl -X POST https://your-backend.vercel.app/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

### Troubleshooting

#### Build Errors
**Issue**: NestJS build fails
- Check that all `@Injectable()`, `@Controller()` decorators are present
- Verify all modules are imported in `app.module.ts`
- Ensure `tsconfig.json` has `experimentalDecorators: true` and `emitDecoratorMetadata: true`
- Run `yarn build` locally to see detailed error messages

**Issue**: Module not found errors
- NestJS CLI handles path aliases automatically - no `tsc-alias` needed
- Verify imports use correct paths relative to `src/` directory
- Check that `baseUrl` in `tsconfig.json` is set to `"./src"`

#### Database Connection Issues
- Use connection pooling for PostgreSQL in serverless environment
- Add `?connection_limit=1` to `DATABASE_URL` for serverless
- Consider using Prisma Data Proxy or Supabase connection pooler
- Verify `PrismaService` is properly initialized in `DatabaseModule`

#### Cold Start Performance
- App instance is cached in `main.ts` to reduce cold starts
- First request after deploy may take 2-3 seconds
- Subsequent requests should be <500ms
- Consider keeping functions warm with periodic health checks

#### Webhook Signature Verification Fails
- Ensure raw body middleware is configured in `AuthModule`
- Verify `CLERK_WEBHOOK_SECRET` environment variable is set
- Check that webhook endpoint is `/api/auth/webhook` (with `/api` prefix)
- Test with Clerk dashboard webhook testing tool

#### Rate Limiting Not Working
- Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
- Check that `RedisCacheService` is connected
- Anonymous rate limit uses IP + browser fingerprint
- Authenticated users have tier-based limits (check database for user tier)

#### Memory/Timeout Issues
- Vercel serverless functions have 10-second timeout (Hobby)
- Upgrade to Pro for 60-second timeout
- Optimize database queries with Prisma query optimization
- Use Redis caching to reduce API calls

#### Development Watch Mode Issues
**Issue**: File change detection causes module not found errors
- This is a known NestJS watch mode quirk with hot reload
- Solution: Restart the dev server (`yarn dev`)
- The production build (`yarn build` + `yarn start`) is not affected
- Only impacts local development with `--watch` flag

### NestJS-Specific Features

**Dependency Injection**
- All services use `@Injectable()` decorator
- Modules handle dependency registration automatically
- No manual container configuration needed (unlike TypeDI)

**Global Components** (configured in `main.ts`):
- `ValidationPipe` - Validates all DTOs with class-validator
- `LoggingInterceptor` - Logs all HTTP requests with timing
- `HttpExceptionFilter` - Handles all errors with consistent format

**Route Protection**:
- `@UseGuards(AuthGuard)` - Requires Clerk JWT authentication
- `@UseGuards(OptionalAuthGuard)` - Allows both authenticated and anonymous
- `@UseInterceptors(AnonymousRateLimitInterceptor)` - Rate limits anonymous users

**API Documentation**:
- Swagger/OpenAPI at `/api/spec-docs`
- Auto-generated from NestJS decorators
- Use `@ApiTags()`, `@ApiOperation()`, `@ApiResponse()` for rich docs

### Production Checklist

- [ ] Environment variables configured in Vercel
- [ ] Database connection pooling enabled
- [ ] `NODE_ENV=production` set
- [ ] CORS configured for frontend domain
- [ ] Error tracking enabled (Sentry, etc.)
- [ ] YouTube API quota monitoring set up
- [ ] Health check endpoint responding
- [ ] Test endpoints with production URLs

### Build Output Structure

After `yarn build` (NestJS CLI compiles to CommonJS):
```
dist/
├── main.js (NestJS entry point - serverless export)
├── app.module.js (root module)
├── application/
│   ├── application.module.js
│   ├── dtos/
│   ├── use-cases/
│   │   ├── AnalyzeVideoUseCase.js
│   │   ├── CompareVideosUseCase.js
│   │   ├── DetectPlatformUseCase.js
│   │   └── GetVideoHistoryUseCase.js
│   └── services/
│       └── ApiKeyResolverService.js
├── domain/ (unchanged - pure TypeScript classes)
│   ├── entities/
│   ├── exceptions/
│   ├── interfaces/
│   └── value-objects/
├── infrastructure/
│   ├── cache/
│   │   ├── cache.module.js
│   │   └── RedisCacheService.js
│   ├── database/
│   │   ├── database.module.js
│   │   └── prisma.service.js
│   ├── encryption/
│   │   ├── encryption.module.js
│   │   └── EncryptionService.js
│   ├── external-apis/
│   │   ├── external-apis.module.js
│   │   ├── YouTubeService.js
│   │   └── InstagramService.js
│   └── sentiment/
│       ├── sentiment.module.js
│       └── SentimentService.js
├── presentation/
│   ├── modules/
│   │   ├── analytics/
│   │   │   ├── analytics.module.js
│   │   │   └── analytics.controller.js
│   │   ├── auth/
│   │   │   ├── auth.module.js
│   │   │   └── auth.controller.js
│   │   ├── api-keys/
│   │   │   ├── api-keys.module.js
│   │   │   └── api-keys.controller.js
│   │   └── health/
│   │       ├── health.module.js
│   │       └── health.controller.js
│   ├── guards/
│   │   ├── auth.guard.js
│   │   └── optional-auth.guard.js
│   ├── interceptors/
│   │   ├── logging.interceptor.js
│   │   └── anonymous-rate-limit.interceptor.js
│   └── filters/
│       └── http-exception.filter.js
└── shared/
    ├── config/
    │   ├── config.module.js
    │   └── ConfigService.js
    └── constants/
        └── Platform.js
```

**Key differences from Express version:**
- Entry point is `main.js` (not `index.js`)
- All modules have `.module.js` files for NestJS dependency injection
- Guards, interceptors, and filters replace Express middleware
- Path aliases (`@shared/*`, `@application/*`) automatically resolved by NestJS CLI
- No `Container.js` - NestJS handles DI internally
