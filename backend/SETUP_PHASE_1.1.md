# Phase 1.1 - Clerk Authentication Setup Instructions

## Overview
This document provides step-by-step instructions to complete the Clerk authentication implementation.

## What Has Been Implemented

### 1. Database Schema
- Added `User` model with Clerk integration
- Added `UserTier` enum (FREE, CREATOR, PRO, AGENCY)
- Added `UserApiKey` model for Phase 1.2
- Updated Prisma schema at `/backend/prisma/schema.prisma`

### 2. Backend Components
- **Auth Middleware** (`/backend/src/presentation/middleware/AuthMiddleware.ts`):
  - `requireAuth` - Enforces authentication (401 if not authenticated)
  - `withAuth` - Optional authentication (adds user info if available)
  - `checkRateLimit` - Rate limiting based on user tier
  - `getUserId` - Extract user ID from request
  - `isAuthenticated` - Check if user is authenticated

- **Auth Controller** (`/backend/src/presentation/controllers/AuthController.ts`):
  - `POST /api/auth/webhook` - Clerk webhook handler (user.created, user.updated, user.deleted)
  - `GET /api/auth/me` - Get current user profile with rate limit info

- **App.ts Updates**:
  - Integrated AuthController into routing
  - Added `withAuth` middleware globally (optional auth for all routes)
  - Added raw body parsing for webhook endpoint

### 3. Dependencies Installed
- `@clerk/clerk-sdk-node` - Clerk authentication SDK
- `svix` - Webhook verification library

## Steps to Complete Setup

### Step 1: Add Environment Variables

Add the following to your `/backend/.env` file (they're already documented in `.env.local`):

```bash
# CLERK AUTHENTICATION (Phase 1.1)
CLERK_PUBLISHABLE_KEY="pk_test_your-key-here"
CLERK_SECRET_KEY="sk_test_your-key-here"
CLERK_WEBHOOK_SECRET="whsec_your-webhook-secret-here"
```

**IMPORTANT:** You mentioned you already have `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY`. You still need to add `CLERK_WEBHOOK_SECRET` which you'll get from the Clerk dashboard when setting up webhooks.

### Step 2: Run Prisma Commands

Generate the Prisma client and push schema changes to your database:

```bash
cd /Users/konoz/Desktop/personal/projects/video-analytics-platform/backend

# Generate Prisma client with new User/UserTier models
npx prisma generate

# Push schema changes to database (creates User, UserApiKey tables)
npx prisma db push
```

### Step 3: Configure Clerk Webhook

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your application
3. Navigate to "Webhooks" in the sidebar
4. Click "Add Endpoint"
5. Set the endpoint URL to: `https://your-backend-url.com/api/auth/webhook`
   - For local testing: Use ngrok or similar tool to expose localhost
6. Select the following events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
7. Copy the "Signing Secret" (starts with `whsec_`)
8. Add it to your `.env` as `CLERK_WEBHOOK_SECRET`

### Step 4: Test the Implementation

After completing the above steps, you can test:

#### Test 1: Type Check
```bash
cd /Users/konoz/Desktop/personal/projects/video-analytics-platform/backend
yarn type-check
```

#### Test 2: Build
```bash
yarn build
```

#### Test 3: Start Development Server
```bash
yarn dev
```

#### Test 4: Test Endpoints
```bash
# Test webhook (will fail without proper headers, but should return 400 not 500)
curl -X POST http://localhost:3001/api/auth/webhook

# Test /me endpoint (should return 401 without auth)
curl http://localhost:3001/api/auth/me

# Test /me with auth (replace YOUR_SESSION_TOKEN with actual Clerk session token)
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

## Rate Limiting Structure

The implementation includes tier-based rate limiting:

| Tier    | Daily Requests | Use Case                    |
|---------|---------------|-----------------------------|
| FREE    | 5             | Individual users, testing   |
| CREATOR | 100           | Content creators            |
| PRO     | 500           | Professional users          |
| AGENCY  | 2000          | Agencies, businesses        |

Rate limits are enforced via the `checkRateLimit` middleware, which:
1. Checks user's tier from database
2. Tracks daily request count
3. Resets counter at midnight (local time)
4. Returns 429 when limit exceeded
5. Includes rate limit info in response headers

## Integration with Existing Routes

The `withAuth` middleware is now applied globally, which means:
- All routes have access to `req.auth.userId` if user is authenticated
- Existing routes continue to work for anonymous users
- You can add `@UseBefore(requireAuth)` to any controller method to enforce authentication
- You can add `@UseBefore(checkRateLimit)` to enforce rate limiting

### Example: Protect an Existing Endpoint

```typescript
import { requireAuth, checkRateLimit } from '@presentation/middleware';

@Post('/analyze')
@UseBefore(requireAuth)  // Require authentication
@UseBefore(checkRateLimit)  // Enforce rate limits
async analyzeVideo(@Body() request: AnalyzeVideoRequest): Promise<VideoAnalyticsResponse> {
  // Implementation
}
```

## Database Schema Diagram

```
User
├── id (cuid)
├── clerkId (unique) ← Links to Clerk user ID
├── email (unique)
├── firstName
├── lastName
├── imageUrl
├── tier (UserTier enum) ← Controls rate limits
├── dailyRequests ← Tracks daily API usage
├── lastRequestDate ← For resetting daily counter
└── Relations:
    └── apiKeys[] (UserApiKey) ← For Phase 1.2

UserTier (enum)
├── FREE (5 requests/day)
├── CREATOR (100 requests/day)
├── PRO (500 requests/day)
└── AGENCY (2000 requests/day)

UserApiKey (Phase 1.2)
├── id (cuid)
├── userId (FK to User)
├── name
├── key (unique)
├── lastUsedAt
└── createdAt
```

## Security Considerations

1. **Webhook Verification**: All webhooks are verified using Svix signatures
2. **Token Validation**: Session tokens are validated via Clerk's SDK
3. **Rate Limiting**: Database-backed rate limiting prevents abuse
4. **Error Handling**: Auth errors return generic messages (don't leak info)
5. **CORS**: Existing CORS configuration applies to auth endpoints

## Next Steps (Phase 1.2 - API Key Management)

After completing Phase 1.1, the next phase will implement:
- API key generation for programmatic access
- API key management endpoints (create, list, revoke)
- API key authentication middleware
- Frontend UI for managing API keys

## Troubleshooting

### Issue: Prisma generate fails
**Solution**: Make sure you're in the `/backend` directory and PostgreSQL is running

### Issue: Webhook verification fails
**Solution**: Ensure `CLERK_WEBHOOK_SECRET` is correctly set and matches Clerk dashboard

### Issue: User not found after authentication
**Solution**: Ensure webhook was triggered (user.created event) when you signed up

### Issue: TypeScript errors in AuthMiddleware
**Solution**: Run `npx prisma generate` to regenerate Prisma client with User/UserTier types

## Files Modified/Created

### Created:
- `/backend/src/presentation/middleware/AuthMiddleware.ts`
- `/backend/src/presentation/controllers/AuthController.ts`
- `/backend/SETUP_PHASE_1.1.md` (this file)

### Modified:
- `/backend/prisma/schema.prisma` (added User, UserTier, UserApiKey)
- `/backend/src/App.ts` (integrated auth middleware and controller)
- `/backend/src/presentation/middleware/index.ts` (exported auth middleware)
- `/backend/src/presentation/controllers/index.ts` (exported AuthController)
- `/backend/.env.local` (documented new environment variables)
- `/backend/package.json` (added Clerk and Svix dependencies via yarn)

## Summary

Phase 1.1 implementation is complete. The system now supports:
- Clerk-based user authentication
- Webhook-driven user lifecycle management
- Tier-based rate limiting
- User profile endpoint
- Optional authentication on all routes

To activate, complete Steps 1-4 above and test thoroughly before moving to Phase 1.2.
