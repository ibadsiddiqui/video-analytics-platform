# 📊 Video Analytics Platform

A production-ready, full-stack application that pulls comprehensive analytics for YouTube and Instagram videos. Built with React, Node.js, PostgreSQL, and Redis (Upstash).

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
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Recharts |
| Backend | Node.js, Express, Prisma ORM |
| Database | PostgreSQL (Vercel Postgres / Neon / Supabase) |
| Cache | Redis (Upstash) |
| APIs | YouTube Data API v3, RapidAPI (Instagram) |
| Deployment | Vercel (Serverless) |

## 📁 Project Structure

```
video-analytics-platform/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment configuration
│   │   ├── middleware/      # Security, rate limiting, validation
│   │   ├── routes/          # API endpoints
│   │   └── services/        # Business logic
│   │       ├── analytics.service.js   # Main orchestration
│   │       ├── youtube.service.js     # YouTube Data API
│   │       ├── instagram.service.js   # Instagram via RapidAPI
│   │       ├── sentiment.service.js   # AI sentiment analysis
│   │       └── cache.service.js       # Upstash Redis
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── .env.example         # Environment template
│   ├── package.json
│   └── vercel.json          # Vercel deployment config
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── SearchBar.jsx
│   │   │   ├── MetricsGrid.jsx
│   │   │   ├── EngagementChart.jsx
│   │   │   ├── SentimentChart.jsx
│   │   │   ├── DemographicsChart.jsx
│   │   │   ├── KeywordsCloud.jsx
│   │   │   └── TopComments.jsx
│   │   ├── hooks/           # Custom React hooks
│   │   └── styles/          # Tailwind CSS styles
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL database
- Upstash Redis account
- YouTube Data API key

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-username/video-analytics-platform.git
cd video-analytics-platform

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

```bash
# Backend
cd backend
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# Upstash Redis
UPSTASH_REDIS_REST_URL="https://your-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# YouTube API
YOUTUBE_API_KEY="your-youtube-api-key"

# Optional: Instagram via RapidAPI
RAPIDAPI_KEY="your-rapidapi-key"

# App Config
FRONTEND_URL="http://localhost:3000"
```

### 3. Setup Database

```bash
cd backend
npx prisma generate
npx prisma db push
```

### 4. Run Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Open http://localhost:3000 in your browser.

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
curl -X POST http://localhost:3001/api/analyze \
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

### Backend Deployment

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/video-analytics-platform.git
git push -u origin main
```

2. **Deploy Backend**
- Go to [vercel.com](https://vercel.com)
- Import your repository
- Set root directory to `backend`
- Add environment variables in Vercel dashboard
- Deploy!

3. **Deploy Frontend**
- Create another Vercel project
- Set root directory to `frontend`
- Add `VITE_API_URL` pointing to your backend URL
- Deploy!

### Environment Variables for Vercel

| Variable | Backend | Frontend |
|----------|---------|----------|
| `DATABASE_URL` | ✅ | - |
| `UPSTASH_REDIS_REST_URL` | ✅ | - |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | - |
| `YOUTUBE_API_KEY` | ✅ | - |
| `RAPIDAPI_KEY` | ✅ (optional) | - |
| `FRONTEND_URL` | ✅ | - |
| `VITE_API_URL` | - | ✅ |

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
