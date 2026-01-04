# Vercel Deployment Guide

Complete guide for deploying the Video Analytics Platform frontend (Next.js with API routes) to Vercel.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Database Setup](#database-setup)
- [Redis Setup](#redis-setup)
- [Clerk Authentication Setup](#clerk-authentication-setup)
- [YouTube API Setup](#youtube-api-setup)
- [Vercel Deployment](#vercel-deployment)
- [Environment Variables](#environment-variables)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying to Vercel, ensure you have:

- GitHub/GitLab/Bitbucket account with your repository
- Vercel account (free tier is sufficient to start)
- PostgreSQL database (Vercel Postgres, Neon, Supabase, or Railway)
- Upstash Redis account (free tier available)
- Clerk account for authentication
- Google Cloud Platform account for YouTube API

## Database Setup

### Option 1: Vercel Postgres (Recommended)

1. Go to your Vercel dashboard
2. Select your project or create a new one
3. Navigate to **Storage** tab
4. Click **Create Database**
5. Select **Postgres** and choose a region close to your users
6. Copy the `DATABASE_URL` connection string

**Important:** Vercel Postgres automatically handles connection pooling for serverless functions.

### Option 2: Neon (Alternative)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. **Important:** Use the pooled connection string (ends with `?sslmode=require&pgbouncer=true`)

### Option 3: Supabase (Alternative)

1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Navigate to **Settings** → **Database**
4. Copy the connection string under "Connection pooling"
5. Use the **Transaction** mode connection string

### Option 4: Railway (Alternative)

1. Sign up at [railway.app](https://railway.app)
2. Create a new PostgreSQL database
3. Copy the `DATABASE_URL` from the variables tab

## Redis Setup

### Upstash Redis (Recommended)

1. Sign up at [console.upstash.com](https://console.upstash.com)
2. Create a new Redis database
3. Select a region close to your primary database
4. Enable **TLS** for secure connections
5. Copy the following credentials:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

**Note:** The free tier provides 10,000 commands/day, which is sufficient for development and small-scale production.

## Clerk Authentication Setup

1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Choose your authentication providers (Email, Google, GitHub, etc.)
4. Navigate to **API Keys** and copy:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

### Configure Webhooks

Webhooks are required for syncing user data to your database:

1. In Clerk Dashboard, go to **Webhooks**
2. Click **Add Endpoint**
3. Enter your webhook URL: `https://your-domain.vercel.app/api/auth/webhook`
4. Subscribe to the following events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Copy the **Signing Secret** (this is your `CLERK_WEBHOOK_SECRET`)

**Note:** You'll need to update this URL after your first deployment.

### Configure Allowed Origins (CORS)

1. In Clerk Dashboard, go to **Paths**
2. Add your Vercel deployment URL to allowed origins:
   - `https://your-domain.vercel.app`
   - `https://your-custom-domain.com` (if using custom domain)

## YouTube API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable **YouTube Data API v3**:
   - Navigate to **APIs & Services** → **Library**
   - Search for "YouTube Data API v3"
   - Click **Enable**
4. Create credentials:
   - Navigate to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **API Key**
   - Copy the API key
5. Restrict the API key (recommended):
   - Click on the created API key
   - Under **API restrictions**, select "Restrict key"
   - Choose "YouTube Data API v3" only
   - Under **Application restrictions**, select "HTTP referrers"
   - Add your Vercel deployment URL

**Important:** YouTube API has a default quota of 10,000 units/day. Each video analysis uses ~10 units.

## Instagram API Setup (Optional)

Instagram's official API is restricted to approved businesses. For basic analytics:

1. Sign up at [RapidAPI](https://rapidapi.com)
2. Subscribe to an Instagram scraper API (e.g., "Instagram Scraper API")
3. Copy your `RAPIDAPI_KEY`

**Note:** Most Instagram APIs on RapidAPI are paid services.

## Vercel Deployment

### Method 1: Import from Git (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select your repository
4. Configure the project:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (triggers postinstall → prisma generate)

5. Click **Deploy** (will fail initially - we need environment variables)

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend directory
cd frontend

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts to link to existing project or create new one
```

## Environment Variables

After initial deployment, add environment variables in Vercel dashboard:

1. Go to your project in Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables for **Production**, **Preview**, and **Development**:

### Required Variables

```bash
# Clerk Authentication
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxE

# YouTube API
YOUTUBE_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Encryption Key (generate with command below)
ENCRYPTION_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Optional Variables

```bash
# Instagram API (RapidAPI)
RAPIDAPI_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Cache TTL (default: 3600 seconds / 1 hour)
CACHE_TTL_SECONDS=3600

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Generate Encryption Key

Run this command locally to generate a secure encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output and set it as `ENCRYPTION_KEY` in Vercel.

### Environment Variable Notes

- **All variables must be added for Production, Preview, and Development environments**
- Variables starting with `NEXT_PUBLIC_` are exposed to the browser
- Sensitive keys (CLERK_SECRET_KEY, DATABASE_URL, etc.) are server-side only
- After adding variables, redeploy the application

## Post-Deployment

### 1. Verify Deployment

Visit your deployment URL (e.g., `https://your-project.vercel.app`) and check:

- ✅ Application loads without errors
- ✅ Authentication works (sign up/sign in via Clerk)
- ✅ Health check endpoint: `https://your-domain.vercel.app/api/health`

### 2. Update Clerk Webhook URL

1. Go to Clerk Dashboard → **Webhooks**
2. Update the webhook endpoint URL to your production URL:
   ```
   https://your-domain.vercel.app/api/auth/webhook
   ```
3. Save changes

### 3. Test Webhook

Test the webhook integration:

1. Create a test user in your application
2. Check Clerk Dashboard → **Webhooks** → **Logs** for successful delivery
3. Verify user was created in your database (use Prisma Studio or database client)

### 4. Initialize Database (First Time Only)

If this is your first deployment, you may need to push the Prisma schema:

#### Option A: Using Vercel CLI

```bash
# Set production environment variables locally
export DATABASE_URL="your-production-database-url"

# Push schema to production database
npx prisma db push
```

#### Option B: Using Migrations (Recommended for Production)

```bash
# Create migration locally
npx prisma migrate dev --name init

# Commit migration files to Git
git add prisma/migrations
git commit -m "Add initial migration"
git push

# Migration will run automatically on next deployment
```

### 5. Monitor Application

- **Vercel Dashboard:** Monitor deployments, function logs, and analytics
- **Real-time Logs:** Click on deployment → **Functions** tab → Select function
- **Error Tracking:** Consider integrating Sentry or similar service

### 6. Set Up Custom Domain (Optional)

1. Go to your Vercel project → **Settings** → **Domains**
2. Add your custom domain
3. Configure DNS records (Vercel provides instructions)
4. Update Clerk allowed origins with new domain
5. Update YouTube API key restrictions with new domain

## Troubleshooting

### Build Failures

**Error: Prisma Client not generated**

```bash
# Solution: Ensure postinstall script is in package.json
"scripts": {
  "postinstall": "prisma generate"
}
```

**Error: Database connection failed**

- Verify `DATABASE_URL` format includes `?sslmode=require` for cloud databases
- Ensure database is accessible from Vercel's IP addresses
- Check if connection pooling is enabled for serverless

### Runtime Errors

**Error: Cannot connect to Redis**

- Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- Check if Upstash Redis is in the same region or nearby
- Ensure TLS is enabled in Upstash dashboard

**Error: YouTube API quota exceeded**

- Monitor usage in Google Cloud Console
- Implement caching (already configured for 1 hour)
- Request quota increase if needed
- Consider implementing user API key feature (Phase 1.2)

**Error: Clerk webhook signature verification failed**

- Verify `CLERK_WEBHOOK_SECRET` matches Clerk dashboard
- Ensure webhook endpoint URL is correct in Clerk
- Check Vercel function logs for detailed error messages

**Error: CORS issues**

- Add your domain to Clerk allowed origins
- Verify middleware.ts is properly configured
- Check that API routes don't have conflicting CORS headers

### Database Issues

**Error: P1001: Can't reach database server**

- Check if database is running and accessible
- Verify connection string format
- Test connection locally with same credentials

**Error: P3009: Migrate failed to apply migrations**

```bash
# Reset database (CAUTION: This will delete all data)
npx prisma migrate reset

# Or push schema without migrations
npx prisma db push
```

**Error: Too many database connections**

- Use connection pooling (Neon, Supabase pooler)
- Or configure Prisma connection pool:
  ```env
  DATABASE_URL="postgresql://...?connection_limit=1&pool_timeout=0"
  ```

### Performance Issues

**Slow API responses**

- Enable Redis caching (check Upstash connection)
- Monitor Vercel function execution times
- Consider upgrading database plan if queries are slow
- Optimize Prisma queries (use select, include wisely)

**Cold starts**

- Vercel serverless functions have cold starts (~1-2s)
- Pro plan reduces cold starts significantly
- Consider keeping functions warm with periodic health checks

### Debugging Tips

**View Function Logs**

1. Go to Vercel Dashboard → Your Project
2. Click on a deployment
3. Navigate to **Functions** tab
4. Select the function (e.g., `/api/analyze`)
5. View real-time logs

**Test API Endpoints Locally**

```bash
# Run development server
npm run dev

# Test endpoints
curl http://localhost:3000/api/health
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

**Test with Vercel CLI**

```bash
# Run production build locally
vercel dev

# Test with production environment variables
vercel env pull .env.local
npm run dev
```

## Scaling Considerations

### Free Tier Limits

- **Vercel:** 100 GB bandwidth/month, 100 GB-hours compute time
- **Vercel Postgres:** 256 MB storage, 60 compute hours
- **Upstash Redis:** 10,000 commands/day
- **YouTube API:** 10,000 units/day

### Upgrading

When you hit limits, consider:

1. **Vercel Pro:** $20/month - Increased limits, reduced cold starts
2. **Database Upgrade:** More storage, compute, connections
3. **Upstash Pro:** More commands, better performance
4. **YouTube API Quota Increase:** Request from Google Cloud Console

### Monitoring Usage

- **Vercel:** Dashboard → Analytics
- **Upstash:** Console → Database → Metrics
- **YouTube API:** Google Cloud Console → APIs & Services → Dashboard
- **Database:** Provider's monitoring dashboard

## Best Practices

1. **Environment Variables:** Never commit secrets to Git
2. **Database Migrations:** Use Prisma migrate for production
3. **Error Handling:** Implement comprehensive error logging
4. **Caching:** Leverage Redis to minimize API calls
5. **Rate Limiting:** Protect your APIs from abuse
6. **Monitoring:** Set up alerts for quota limits
7. **Backups:** Enable automatic database backups
8. **Security:** Keep dependencies updated, use Dependabot

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Upstash Documentation](https://docs.upstash.com)
- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)

## Support

For issues specific to this deployment:

1. Check Vercel function logs
2. Review this troubleshooting guide
3. Consult the project's CLAUDE.md for architecture details
4. Open an issue in the project repository
