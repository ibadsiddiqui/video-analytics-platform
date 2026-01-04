# 🚀 Vercel Deployment Guide - Video Analytics Platform

**Complete guide for deploying both Backend and Frontend on Vercel**

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Frontend Deployment](#frontend-deployment)
4. [Database Setup](#database-setup)
5. [Environment Variables](#environment-variables)
6. [Clerk Configuration](#clerk-configuration)
7. [Post-Deployment Steps](#post-deployment-steps)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ GitHub account (for repository)
- ✅ Vercel account (sign up at [vercel.com](https://vercel.com))
- ✅ Clerk account (for authentication - [clerk.com](https://clerk.com))
- ✅ PostgreSQL database (Neon, Supabase, or Vercel Postgres)
- ✅ Upstash Redis account (for caching - [upstash.com](https://upstash.com))
- ✅ YouTube Data API key (from Google Cloud Console)
- ✅ Encryption key for API key storage

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│             Vercel Platform                 │
├─────────────────────────────────────────────┤
│                                             │
│  ┌────────────────┐  ┌──────────────────┐  │
│  │   Frontend     │  │    Backend       │  │
│  │   (Next.js)    │──│  (Express API)   │  │
│  │   Port: 3000   │  │  Serverless Fn   │  │
│  └────────────────┘  └──────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
         │                    │
         │                    │
    ┌────▼────┐          ┌───▼──────┐
    │  Clerk  │          │PostgreSQL│
    │  Auth   │          │  (Neon)  │
    └─────────┘          └──────────┘
                              │
                         ┌────▼─────┐
                         │  Redis   │
                         │(Upstash) │
                         └──────────┘
```

**Two Separate Deployments:**
1. **Backend**: Express API deployed as Vercel Serverless Functions
2. **Frontend**: Next.js app with SSR/SSG capabilities

---

## Frontend Deployment

### Step 1: Prepare Frontend for Vercel

#### 1.1 Update `next.config.mjs`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // API rewrites for production
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`
          : 'http://localhost:3001/api/:path*',
      },
    ];
  },
};

export default nextConfig;
```

#### 1.2 Create `vercel.json` in `/frontend` directory (optional)

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

### Step 2: Deploy Frontend to Vercel

#### Option A: Using Vercel CLI

```bash
# Navigate to frontend directory
cd frontend

# Deploy
vercel --prod

# Follow prompts:
# - Project name: video-analytics-frontend
# - Framework: Next.js
```

#### Option B: Using Vercel Dashboard

1. Click **"Add New Project"**
2. Import from GitHub
3. Select your repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: (auto-detected: `.next`)
   - **Install Command**: `npm install`

### Step 3: Configure Frontend Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables:

```env
# Clerk (Public - can be exposed to browser)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx

# Backend API URL (set after backend is deployed)
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
```

### Step 4: Verify Frontend Deployment

Visit your frontend URL:
- Homepage should load
- Authentication should work
- API calls should reach backend

---

## Database Setup

### Option 1: Neon (Recommended)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Get connection string from dashboard
4. Add to backend environment variables:
   ```
   DATABASE_URL=postgresql://user:password@host.neon.tech:5432/database?sslmode=require
   ```

### Option 2: Supabase

1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Get connection string: Settings → Database → Connection String
4. Use "Connection Pooling" for serverless

### Option 3: Vercel Postgres

1. In Vercel Dashboard → Storage → Create Database
2. Select PostgreSQL
3. Connect to your backend project
4. Connection string added automatically

### Run Database Migrations

After connecting database:

```bash
# From backend directory
npx prisma db push

# Verify
npx prisma studio
```

---

## Environment Variables

### Complete Environment Variables Checklist

#### Backend Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string | `postgresql://...` |
| `CLERK_SECRET_KEY` | ✅ | Clerk secret key | `sk_live_xxxxx` |
| `CLERK_WEBHOOK_SECRET` | ✅ | Clerk webhook secret | `whsec_xxxxx` |
| `CLERK_PUBLISHABLE_KEY` | ✅ | Clerk public key | `pk_live_xxxxx` |
| `UPSTASH_REDIS_REST_URL` | ✅ | Redis REST URL | `https://xxxxx.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Redis token | `xxxxx` |
| `YOUTUBE_API_KEY` | ✅ | YouTube Data API key | `AIzaSyXXXXX` |
| `ENCRYPTION_KEY` | ✅ | 32-byte base64 key | `xxxxx` |
| `FRONTEND_URL` | ✅ | Frontend URL for CORS | `https://app.vercel.app` |
| `RAPIDAPI_KEY` | ⚪ | For Instagram (optional) | `xxxxx` |
| `NODE_ENV` | ✅ | Environment | `production` |
| `PORT` | ⚪ | Server port | `3000` |

#### Frontend Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk public key | `pk_live_xxxxx` |
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API URL | `https://backend.vercel.app` |

---

## Clerk Configuration

### Step 1: Update Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application

#### Configure Domains

**Development:**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

**Production:**
- Frontend: `https://your-frontend.vercel.app`
- Backend: `https://your-backend.vercel.app`

#### Configure Webhooks

1. Go to **Webhooks** → **Add Endpoint**
2. Endpoint URL: `https://your-backend.vercel.app/api/auth/webhook`
3. Subscribe to events:
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`
4. Copy **Signing Secret** to `CLERK_WEBHOOK_SECRET`

#### Configure Redirect URLs

**Sign-in redirect:** `https://your-frontend.vercel.app`
**Sign-up redirect:** `https://your-frontend.vercel.app`
**Sign-out redirect:** `https://your-frontend.vercel.app`

---

## Post-Deployment Steps

### 1. Test Complete Flow

```bash
# Test backend health
curl https://your-backend.vercel.app/api/health

# Test authentication endpoint
curl https://your-backend.vercel.app/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test frontend
open https://your-frontend.vercel.app
```

### 2. Monitor Logs

**Backend Logs:**
- Vercel Dashboard → Backend Project → Deployments → View Function Logs

**Frontend Logs:**
- Vercel Dashboard → Frontend Project → Deployments → View Build Logs

### 3. Set Up Custom Domain (Optional)

**Backend:**
1. Vercel Dashboard → Backend Project → Settings → Domains
2. Add: `api.yourdomain.com`

**Frontend:**
1. Vercel Dashboard → Frontend Project → Settings → Domains
2. Add: `yourdomain.com` or `app.yourdomain.com`

Update environment variables:
- Backend `FRONTEND_URL`: `https://yourdomain.com`
- Frontend `NEXT_PUBLIC_API_URL`: `https://api.yourdomain.com`

### 4. Configure CORS

Ensure backend `FRONTEND_URL` matches your deployed frontend URL.

### 5. Enable Production Mode

Verify all environment variables are set to **Production** environment.

---

## Troubleshooting

### Common Issues

#### 1. Backend Returns 500 Error

**Cause:** Database connection or missing environment variables

**Solution:**
```bash
# Check logs
vercel logs your-backend-url

# Verify DATABASE_URL
# Ensure DATABASE_URL has ?sslmode=require for Neon/Supabase
```

#### 2. CORS Errors

**Cause:** `FRONTEND_URL` not set correctly

**Solution:**
- Backend → Environment Variables → `FRONTEND_URL` = `https://your-frontend.vercel.app`
- No trailing slash
- Redeploy backend after changing

#### 3. Authentication Fails

**Cause:** Clerk configuration mismatch

**Solution:**
- Verify `CLERK_PUBLISHABLE_KEY` matches in frontend and backend
- Check Clerk Dashboard domains are correct
- Ensure webhook is configured

#### 4. Database Connection Timeout

**Cause:** Serverless cold starts

**Solution:**
- Use connection pooling: Add `?connection_limit=1` to `DATABASE_URL`
- Consider Prisma Data Proxy or Supabase Pooler

#### 5. Build Fails on Vercel

**Backend:**
```bash
# Check build logs
# Common fix: Ensure tsconfig.json is correct
# Run locally: yarn vercel-build
```

**Frontend:**
```bash
# Check Next.js build errors
# Run locally: npm run build
```

#### 6. Environment Variables Not Working

**Solution:**
- Ensure variables are set for correct environment (Production/Preview/Development)
- Redeploy after adding environment variables
- Check variable names (no typos)

#### 7. API Routes Return 404

**Cause:** Incorrect routing in `vercel.json`

**Solution:**
- Backend should have `/api/(.*)` route
- Frontend should proxy `/api` to backend

#### 8. Prisma Client Not Generated

**Cause:** Missing `prisma generate` in build

**Solution:**
- Add to `vercel-build` script: `prisma generate && tsc`
- Verify `@prisma/client` is in `dependencies`, not `devDependencies`

---

## Performance Optimization

### 1. Enable Caching

**Backend:** Redis is already configured for caching

**Frontend:**
- Use Next.js ISR (Incremental Static Regeneration)
- Configure `revalidate` in `getStaticProps`

### 2. Database Connection Pooling

Add to `DATABASE_URL`:
```
?connection_limit=1&pool_timeout=0
```

### 3. Enable Vercel Analytics

1. Vercel Dashboard → Project → Analytics → Enable
2. Add to `next.config.mjs`:
   ```javascript
   const nextConfig = {
     experimental: {
       serverActions: true,
     },
   };
   ```

### 4. Configure Regions

Deploy close to your users:
- Vercel Dashboard → Settings → Functions → Region

---

## Deployment Checklist

Before going live:

### Security
- [ ] All environment variables set in Production
- [ ] `ENCRYPTION_KEY` is 32-byte random string
- [ ] CORS configured correctly
- [ ] Clerk webhook secret verified
- [ ] Database uses SSL (`?sslmode=require`)
- [ ] Redis URL uses HTTPS

### Testing
- [ ] Backend health check passes
- [ ] Frontend loads successfully
- [ ] Authentication flow works
- [ ] API requests succeed
- [ ] Webhook receives events
- [ ] Database queries work
- [ ] Rate limiting functional

### Monitoring
- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Enable Vercel Analytics
- [ ] Configure uptime monitoring
- [ ] Set up Clerk event logs

### Documentation
- [ ] Update README with production URLs
- [ ] Document environment variables
- [ ] Create runbook for common issues

---

## Maintenance

### Regular Tasks

**Weekly:**
- Check Vercel deployment logs
- Monitor Clerk webhook events
- Review Redis cache hit rates

**Monthly:**
- Review database storage usage
- Check API quota usage (YouTube API)
- Update dependencies

### Backup Strategy

**Database:**
- Neon: Automatic backups (7-day retention)
- Supabase: Configure backup schedule
- Export critical data monthly

**Environment Variables:**
- Keep secure backup of all `.env` values
- Document in password manager

---

## Cost Estimates

### Vercel
- **Hobby (Free):** Good for testing
- **Pro ($20/month):** Recommended for production
  - Unlimited bandwidth
  - Advanced analytics
  - Password protection

### Database (Neon)
- **Free Tier:** 0.5 GB storage
- **Pro ($19/month):** 10 GB storage, better performance

### Redis (Upstash)
- **Free Tier:** 10,000 requests/day
- **Pay-as-you-go:** $0.20 per 100k requests

### Clerk
- **Free:** 10,000 MAUs (Monthly Active Users)
- **Pro ($25/month):** 1,000 MAUs included

**Total Monthly Cost (Estimated):**
- Development: **$0** (all free tiers)
- Production (low traffic): **~$20-50**
- Production (medium traffic): **~$100-200**

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Clerk Deployment Guide](https://clerk.com/docs/deployments/overview)
- [Prisma on Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Neon Serverless Postgres](https://neon.tech/docs/introduction)

---

## Support

For issues:
1. Check Vercel deployment logs
2. Review error messages in browser console
3. Test API endpoints with curl
4. Check Clerk dashboard for authentication issues
5. Verify all environment variables are set

**Need help?** Open an issue in the GitHub repository.

---

**Last Updated:** 2026-01-02
**Version:** 1.0
**Status:** Production Ready ✅
