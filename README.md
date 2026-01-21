# 📊 Video Analytics Platform

A production-ready, full-stack application that pulls comprehensive analytics for YouTube and Instagram videos. Built with Next.js 15 (App Router with API routes), PostgreSQL, and Redis (Upstash).

![Video Analytics Platform](https://via.placeholder.com/1200x600/4F46E5/FFFFFF?text=Video+Analytics+Platform)

## ✨ Features

### Core Analytics
- **Multi-Platform Support** - YouTube, Instagram, TikTok, Vimeo URL detection
- **Comprehensive Metrics** - Views, likes, comments, shares, engagement rate
- **AI Sentiment Analysis** - Positive/neutral/negative comment classification
- **Keyword Extraction** - TF-IDF based topic identification
- **Hashtag Tracking** - Popular hashtags from descriptions and comments
- **Audience Demographics** - Age distribution and gender split visualization
- **Engagement Patterns** - Daily engagement trends visualization

### Technical Features
- **Redis Caching** - 1-hour TTL with Upstash for fast responses
- **Rate Limiting** - 100 requests per 15 minutes (configurable)
- **Security** - Helmet.js, CORS, input sanitization
- **Real-time Analysis** - Instant results with loading states
- **Video Comparison** - Compare multiple videos side-by-side
- **Search & Trending** - YouTube search and trending videos

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS, Framer Motion, Recharts |
| Backend | Next.js API Routes (serverless functions) |
| Database | PostgreSQL (Vercel Postgres / Neon / Supabase) + Prisma ORM |
| Cache | Redis (Upstash) |
| Authentication | Clerk (JWT-based) |
| APIs | YouTube Data API v3, RapidAPI (Instagram) |
| Deployment | Vercel (Serverless) |

## 📁 Project Structure

```
video-analytics-platform/
├── frontend/                 # Main application (Next.js)
│   ├── src/
│   │   ├── app/             # Next.js 15 App Router
│   │   │   ├── layout.tsx   # Root layout (Clerk provider)
│   │   │   ├── page.tsx     # Home page
│   │   │   └── api/         # API Routes (backend logic)
│   │   │       ├── analyze/route.ts
│   │   │       ├── compare/route.ts
│   │   │       ├── history/[videoId]/route.ts
│   │   │       ├── auth/
│   │   │       │   ├── webhook/route.ts
│   │   │       │   └── me/route.ts
│   │   │       └── keys/    # API key management
│   │   ├── components/      # React components
│   │   │   ├── SearchBar.tsx
│   │   │   ├── MetricsGrid.tsx
│   │   │   ├── EngagementChart.tsx
│   │   │   ├── SentimentChart.tsx
│   │   │   ├── DemographicsChart.tsx
│   │   │   ├── KeywordsCloud.tsx
│   │   │   └── TopComments.tsx
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Server-side business logic
│   │   │   ├── prisma.ts    # Database client
│   │   │   ├── redis.ts     # Cache service
│   │   │   ├── services/    # Business services
│   │   │   │   ├── youtube.ts
│   │   │   │   ├── instagram.ts
│   │   │   │   ├── sentiment.ts
│   │   │   │   └── encryption.ts
│   │   │   └── utils/       # Helper utilities
│   │   └── styles/          # Tailwind CSS styles
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── .env.example         # Environment template
│   ├── package.json
│   ├── next.config.js
│   ├── middleware.ts        # Clerk authentication
│   ├── tailwind.config.js
│   └── vercel.json          # Vercel deployment config
│
├── CLAUDE.md                # Development guide
└── README.md
```

## 🧪 Testing

The project uses **Vitest** for unit testing with comprehensive test coverage for Phase 1 features.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test

# Run tests once (CI mode)
npm run test:run

# Open Vitest UI
npm run test:ui
```

### Test Coverage

✅ **143 passing tests** across Phase 1, Phase 2 & Phase 3 features:

**Phase 1 Features (85 tests):**

- **Tier Access System** (20 tests)
  - Feature access by tier (FREE, CREATOR, PRO, AGENCY)
  - Daily request limits
  - Comment limits by tier

- **Encryption Service** (43 tests)
  - AES-256-GCM encryption/decryption
  - API key security
  - Tamper detection
  - Edge cases and unicode support

- **Request Tracking** (22 tests)
  - Rate limiting enforcement
  - Daily limit tracking per tier
  - Midnight UTC reset
  - Rate limit headers

**Phase 2 Features (28 tests):**

- **Competitor Tracking** (17 tests)
  - Add/remove competitors
  - Fetch competitor metrics from YouTube
  - Historical snapshots
  - Soft delete pattern
  - Error handling

- **Benchmark Service** (11 tests)
  - Niche benchmark calculations
  - Percentile rankings (p10, p25, p50, p75, p90)
  - Video performance comparison
  - Statistical analysis

**Phase 3 Features (30 tests):**

- **Viral Predictor Service** (12 tests)
  - Calculate viral potential score
  - Weighted scoring (velocity, sentiment, comments, likes)
  - Cache management (1-hour TTL)
  - Prediction categories (viral, high_potential, moderate, low)
  - Error handling and insufficient data

- **Posting Time Optimizer Service** (18 tests)
  - Recommend optimal posting times
  - Group by day of week and 2-hour slots
  - Engagement rate ranking
  - Heatmap data generation (7 days × 24 hours)
  - Confidence levels (high, medium, low)
  - Weekday vs weekend pattern detection

### Test Files

```
frontend/
├── src/
│   ├── lib/
│   │   ├── __tests__/
│   │   │   └── encryption.test.ts
│   │   ├── constants/__tests__/
│   │   │   └── tiers.test.ts
│   │   ├── services/__tests__/
│   │   │   ├── competitor.test.ts
│   │   │   ├── benchmark.test.ts
│   │   │   ├── viral-predictor.test.ts
│   │   │   └── posting-time-optimizer.test.ts
│   │   └── utils/__tests__/
│   │       └── request-tracker.test.ts
├── test/
│   └── setup.ts
└── vitest.config.ts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL database
- Upstash Redis account
- YouTube Data API key
- Clerk account (for authentication)

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-username/video-analytics-platform.git
cd video-analytics-platform

# Navigate to frontend directory (main application)
cd frontend

# Install dependencies (automatically runs prisma generate via postinstall)
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# Redis Cache (Upstash)
UPSTASH_REDIS_REST_URL="https://your-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# YouTube Data API v3
YOUTUBE_API_KEY="your-youtube-api-key"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# Encryption Key (generate with command below)
ENCRYPTION_KEY="your-base64-encryption-key"

# Optional: Instagram via RapidAPI
RAPIDAPI_KEY="your-rapidapi-key"
```

**Generate encryption key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Setup Database

```bash
# Generate Prisma client (if not done automatically)
npm run prisma:generate

# Push schema to database
npm run prisma:push

# Or run migrations (recommended for production)
npm run prisma:migrate
```

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser. The application runs as a single Next.js app with API routes at `/api/*`.

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analyze` | Analyze video by URL |
| `GET` | `/api/analyze?url=...` | GET version of analyze |
| `POST` | `/api/compare` | Compare multiple videos |
| `GET` | `/api/history/:videoId` | Get analytics history |
| `GET` | `/api/youtube/search` | Search YouTube videos |
| `GET` | `/api/youtube/trending` | Get trending videos |
| `POST` | `/api/detect-platform` | Detect platform from URL |
| `GET` | `/api/health` | Health check endpoint |

### Example Request

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

### Example Response

```json
{
  "success": true,
  "data": {
    "video": {
      "platform": "YOUTUBE",
      "title": "Video Title",
      "thumbnail": "https://...",
      "publishedAt": "2024-01-15T10:30:00Z"
    },
    "metrics": {
      "views": 1500000,
      "viewsFormatted": "1.5M",
      "likes": 85000,
      "likesFormatted": "85K",
      "comments": 12500,
      "engagementRate": 6.5
    },
    "sentiment": {
      "overall": "positive",
      "distribution": {
        "positive": 65,
        "neutral": 25,
        "negative": 10
      }
    },
    "keywords": ["tutorial", "coding", "javascript"],
    "hashtags": ["#programming", "#webdev"]
  }
}
```

## 🌐 Deployment to Vercel

### Quick Deploy

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/video-analytics-platform.git
git push -u origin main
```

2. **Deploy to Vercel**
- Go to [vercel.com/new](https://vercel.com/new)
- Import your repository
- Set **root directory** to `frontend`
- Framework will be auto-detected as Next.js
- Add environment variables (see below)
- Click **Deploy**

3. **Post-Deployment**
- Update Clerk webhook URL to your production domain
- Update Clerk allowed origins
- Restrict YouTube API key to your domain
- Test all endpoints

### Environment Variables for Vercel

Add these in **Project Settings → Environment Variables** for all environments (Production, Preview, Development):

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `UPSTASH_REDIS_REST_URL` | ✅ | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Upstash Redis token |
| `YOUTUBE_API_KEY` | ✅ | YouTube Data API v3 key |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk publishable key |
| `CLERK_SECRET_KEY` | ✅ | Clerk secret key |
| `CLERK_WEBHOOK_SECRET` | ✅ | Clerk webhook secret |
| `ENCRYPTION_KEY` | ✅ | Base64 encryption key |
| `RAPIDAPI_KEY` | - | Instagram API (optional) |

**For detailed deployment instructions**, see `frontend/VERCEL_DEPLOYMENT.md`

## 🔑 Getting API Keys

### YouTube Data API v3

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable "YouTube Data API v3"
4. Create credentials → API Key
5. Restrict key to YouTube Data API only

### Upstash Redis

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Copy REST URL and token

### PostgreSQL Database

Options:
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Neon](https://neon.tech/)
- [Supabase](https://supabase.com/)
- [Railway](https://railway.app/)

### RapidAPI (Instagram - Optional)

1. Go to [RapidAPI](https://rapidapi.com/)
2. Subscribe to "Instagram Scraper" API
3. Get your API key

## 🎨 Design System

### Colors
- **Primary**: Indigo (#4F46E5)
- **Accent Purple**: #8B5CF6
- **Accent Pink**: #EC4899
- **Success**: Emerald (#10B981)
- **Warning**: Amber (#F59E0B)
- **Error**: Red (#EF4444)

### Components
- Glass morphism cards with subtle shadows
- Animated metric cards with hover effects
- Gradient text and backgrounds
- Responsive grid layouts
- Skeleton loading states

## 📊 Database Schema

```prisma
model Video {
  id               String      @id @default(uuid())
  platform         Platform
  platformVideoId  String      @unique
  url              String
  title            String?
  description      String?
  thumbnailUrl     String?
  channelName      String?
  channelId        String?
  publishedAt      DateTime?
  analytics        Analytics[]
  comments         Comment[]
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
}

model Analytics {
  id             String   @id @default(uuid())
  videoId        String
  video          Video    @relation(fields: [videoId], references: [id])
  viewCount      Int      @default(0)
  likeCount      Int      @default(0)
  commentCount   Int      @default(0)
  shareCount     Int      @default(0)
  engagementRate Float    @default(0)
  fetchedAt      DateTime @default(now())
}
```

## 🔒 Security Features

- **Helmet.js** - HTTP security headers
- **CORS** - Whitelist configuration
- **Rate Limiting** - 100 req/15min (configurable)
- **Input Sanitization** - XSS prevention
- **URL Validation** - Domain whitelisting
- **Error Handling** - Secure error responses

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 👤 Author

**Ibad Siddiqui**

---

Built with ❤️ using Claude AI assistance
