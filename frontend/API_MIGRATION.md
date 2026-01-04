# Backend API Migration to Next.js - Complete ✅

This document outlines the complete migration of the NestJS backend APIs to Next.js API routes in the frontend.

## 📋 What Was Done

### 1. **Dependencies Installed**
All necessary backend dependencies have been added to `package.json`:
- `@prisma/client` - Database ORM
- `@upstash/redis` - Redis caching
- `@clerk/backend` - Server-side authentication
- `googleapis` - YouTube Data API v3
- `sentiment` - Sentiment analysis
- `natural` - NLP and keyword extraction
- `class-transformer` & `class-validator` - Data validation
- `svix` - Clerk webhook verification

### 2. **Database Setup**
- ✅ Prisma schema copied to `frontend/prisma/schema.prisma`
- ✅ Prisma client singleton created at `src/lib/prisma.ts`
- ✅ Scripts added to `package.json` for Prisma operations

### 3. **Infrastructure Services**
All infrastructure services migrated to `src/lib/`:

| Service | File | Description |
|---------|------|-------------|
| Prisma | `prisma.ts` | Database client singleton |
| Redis | `redis.ts` | Cache service with Upstash |
| Config | `config.ts` | Environment configuration |
| Encryption | `encryption.ts` | AES-256-GCM encryption for API keys |
| Sentiment | `sentiment.ts` | Comment sentiment analysis |
| YouTube | `youtube.ts` | YouTube Data API v3 integration |
| Instagram | `instagram.ts` | Instagram scraper (RapidAPI) |

### 4. **Business Logic (Use Cases)**
All use cases migrated to `src/lib/use-cases/`:

| Use Case | File | Description |
|----------|------|-------------|
| Analyze Video | `AnalyzeVideoUseCase.ts` | Main analytics workflow |
| Compare Videos | `CompareVideosUseCase.ts` | Side-by-side comparison |
| Detect Platform | `DetectPlatformUseCase.ts` | URL platform detection |
| Get History | `GetVideoHistoryUseCase.ts` | Historical data retrieval |

### 5. **Next.js API Routes**
All API endpoints implemented in `src/app/api/`:

#### Analytics Endpoints
- ✅ `POST /api/analyze` - Analyze video (with body)
- ✅ `GET /api/analyze?url=...` - Analyze video (with query params)
- ✅ `POST /api/compare` - Compare multiple videos
- ✅ `GET /api/history/:videoId` - Get video history
- ✅ `POST /api/detect-platform` - Detect platform (with body)
- ✅ `GET /api/detect-platform?url=...` - Detect platform (with query params)

#### Authentication Endpoints
- ✅ `POST /api/auth/webhook` - Clerk webhook handler
- ✅ `GET /api/auth/me` - Get current user profile

#### API Keys Management
- ✅ `GET /api/keys` - List user's API keys
- ✅ `POST /api/keys` - Create new API key
- ✅ `PUT /api/keys/:id` - Update API key
- ✅ `DELETE /api/keys/:id` - Delete API key
- ✅ `POST /api/keys/:id/test` - Test API key validity

#### Health Check
- ✅ `GET /api/health` - Health status endpoint

## 🚀 Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

**Required variables:**
```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/dbname"

# Redis Cache
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# YouTube API
YOUTUBE_API_KEY=your-youtube-api-key

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Encryption Key (generate with command below)
ENCRYPTION_KEY=your-base64-encryption-key
```

**Generate encryption key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. Database Setup

```bash
# Generate Prisma client
yarn prisma:generate

# Push schema to database
yarn prisma:push

# Or run migrations (recommended for production)
yarn prisma:migrate
```

### 3. Start Development Server

```bash
yarn dev
```

The frontend will run on `http://localhost:3000` with all API routes available at `/api/*`.

## 📡 API Usage Examples

### Analyze a Video

**POST Request:**
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

**GET Request:**
```bash
curl "http://localhost:3000/api/analyze?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

### Compare Videos

```bash
curl -X POST http://localhost:3000/api/compare \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://www.youtube.com/watch?v=video1",
      "https://www.youtube.com/watch?v=video2"
    ]
  }'
```

### Get Video History

```bash
curl "http://localhost:3000/api/history/dQw4w9WgXcQ?days=7"
```

### Detect Platform

```bash
curl -X POST http://localhost:3000/api/detect-platform \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

### Get Current User (requires authentication)

```bash
curl "http://localhost:3000/api/auth/me" \
  -H "Authorization: Bearer your-clerk-token"
```

### Manage API Keys (requires authentication)

**List API Keys:**
```bash
curl "http://localhost:3000/api/keys" \
  -H "Authorization: Bearer your-clerk-token"
```

**Create API Key:**
```bash
curl -X POST http://localhost:3000/api/keys \
  -H "Authorization: Bearer your-clerk-token" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "YOUTUBE",
    "apiKey": "your-youtube-api-key",
    "label": "My YouTube Key"
  }'
```

**Test API Key:**
```bash
curl -X POST "http://localhost:3000/api/keys/{id}/test" \
  -H "Authorization: Bearer your-clerk-token"
```

### Health Check

```bash
curl http://localhost:3000/api/health
```

## 🏗️ Architecture

The frontend now follows the same clean architecture as the backend:

```
frontend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   └── api/               # Next.js API routes
│   │       ├── analyze/
│   │       ├── compare/
│   │       ├── detect-platform/
│   │       ├── history/
│   │       ├── auth/
│   │       ├── keys/
│   │       └── health/
│   └── lib/                   # Business logic & services
│       ├── prisma.ts          # Database client
│       ├── redis.ts           # Cache service
│       ├── config.ts          # Configuration
│       ├── encryption.ts      # Encryption service
│       ├── sentiment.ts       # Sentiment analysis
│       ├── youtube.ts         # YouTube API
│       ├── instagram.ts       # Instagram API
│       ├── use-cases/         # Business workflows
│       └── value-objects/     # Domain models
└── package.json
```

## 🔑 Key Features

### 1. **Caching**
- All video analytics cached for 1 hour in Redis
- Cache keys: `video:{platform}:{videoId}`
- History stored as Redis lists with 30-day TTL

### 2. **Authentication**
- Optional authentication using Clerk
- Protected routes require valid JWT token
- User profile and API key management

### 3. **Encryption**
- User API keys encrypted with AES-256-GCM
- Secure key derivation using scrypt
- Random IV and salt per encryption

### 4. **Sentiment Analysis**
- Analyzes video comments
- Extracts keywords using TF-IDF
- Identifies hashtags
- Generates engagement metrics

### 5. **Rate Limiting**
- API key testing: 5 tests per hour per user
- In-memory rate limiting (consider Redis for production)

## ⚠️ Important Notes

1. **Database**: Ensure PostgreSQL is running and `DATABASE_URL` is configured
2. **Redis**: Upstash Redis is required for caching and history
3. **YouTube API**: Get API key from [Google Cloud Console](https://console.cloud.google.com/)
4. **Instagram**: Optional RapidAPI key for Instagram analytics
5. **Encryption**: Generate a secure encryption key for API key storage
6. **Clerk Webhook**: Configure webhook URL in Clerk dashboard

## 🧪 Testing

Test all endpoints using the examples above or use tools like:
- Postman
- Insomnia
- curl
- Thunder Client (VS Code)

## 📚 Scripts

```bash
# Development
yarn dev                  # Start dev server

# Database
yarn prisma:generate     # Generate Prisma client
yarn prisma:push         # Push schema to DB
yarn prisma:migrate      # Run migrations
yarn prisma:studio       # Open Prisma Studio GUI

# Build
yarn build               # Build for production
yarn start               # Start production server
```

## ✨ What's Different from Backend

1. **No NestJS decorators** - Pure Next.js API routes
2. **Clerk auth** instead of Express middleware
3. **Next.js conventions** - File-based routing
4. **Simplified DI** - Direct imports instead of NestJS DI
5. **Runtime: Edge compatible** - Can be deployed to Edge

## 🎉 Migration Complete!

All backend APIs have been successfully migrated to the Next.js frontend. You can now:
- ✅ Analyze videos directly from the frontend
- ✅ Manage user authentication
- ✅ Store and encrypt API keys
- ✅ Cache analytics data
- ✅ Track video history

The frontend is now a **standalone application** with all backend functionality built-in!
