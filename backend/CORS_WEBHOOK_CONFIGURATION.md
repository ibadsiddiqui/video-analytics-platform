# CORS Configuration for Clerk Webhooks

This document explains the CORS configuration changes made to support Clerk webhook integration.

## Problem Statement

Clerk webhooks are sent from Clerk's infrastructure (*.clerk.com or *.clerk.accounts.dev domains) and require proper CORS configuration to work correctly. The webhook endpoint at `/api/auth/webhook` needs to:

1. Accept POST requests from Clerk's servers
2. Process Svix signature headers for webhook verification
3. Access the raw request body for cryptographic signature validation

## Changes Made

### 1. Updated CORS Configuration (`/backend/src/App.ts`)

**Added Clerk webhook domains to allowed origins:**
```typescript
const allowedOrigins = [
  this.configService.getFrontendUrl(),
  'http://localhost:3000',
  'http://localhost:5173',
  /\.vercel\.app$/,
  // Clerk webhook domains
  /\.clerk\.com$/,
  /\.clerk\.accounts\.dev$/,
];
```

**Added Svix headers to allowed headers:**
```typescript
allowedHeaders: [
  'Content-Type',
  'Authorization',
  // Svix headers for Clerk webhook signature verification
  'svix-id',
  'svix-timestamp',
  'svix-signature',
],
```

**Extended allowed methods:**
```typescript
methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
```

### 2. Fixed Raw Body Handling for Webhook Signature Verification

**Moved webhook raw body middleware before JSON parser:**
```typescript
// Special handling for webhook routes - they need raw body for signature verification
// MUST be before express.json() middleware
this.app.use(
  '/api/auth/webhook',
  express.raw({ type: 'application/json' }),
  (req, _res, next) => {
    // Store raw body for Svix signature verification
    (req as any).rawBody = req.body;
    next();
  }
);

// Parse JSON bodies (for non-webhook routes)
this.app.use(express.json({ limit: '1mb' }));
```

**Why this order matters:**
- Svix signatures are cryptographically sensitive to any changes in the request body
- The raw body parser must run BEFORE the JSON parser to preserve the exact bytes
- The signature verification in `AuthController.ts` requires the untouched raw body

## How It Works

### Request Flow for Clerk Webhooks:

1. **Clerk sends webhook** from `*.clerk.com` domain
   ```http
   POST /api/auth/webhook
   Content-Type: application/json
   svix-id: msg_xxxxx
   svix-timestamp: 1234567890
   svix-signature: v1,xxxxx

   {"type": "user.created", "data": {...}}
   ```

2. **Helmet middleware** adds security headers (allows cross-origin)

3. **CORS middleware** validates the origin:
   - Checks if origin matches `/\.clerk\.com$/` or `/\.clerk\.accounts\.dev$/`
   - Validates required headers (`svix-*` headers)
   - Allows POST method
   - Returns appropriate CORS headers

4. **Raw body middleware** (webhook-specific):
   - Parses body as raw Buffer
   - Stores in `req.rawBody` for signature verification
   - Does NOT parse as JSON

5. **AuthController.handleWebhook()**:
   - Extracts Svix headers from request
   - Uses `req.rawBody` for Webhook verification
   - Verifies signature using Svix SDK
   - Processes webhook event (user.created, user.updated, etc.)

### Request Flow for Other Endpoints:

1. **Regular API requests** from frontend (localhost:3000 or Vercel)
2. **CORS middleware** validates against frontend URLs
3. **JSON middleware** parses body as JSON
4. **Regular controllers** handle the request

## Security Considerations

### What's Protected:
- All webhook requests are verified using HMAC-SHA256 signatures
- Only requests with valid Svix signatures are processed
- The `CLERK_WEBHOOK_SECRET` environment variable must be configured
- Requests without matching origins are rejected by CORS

### What's Allowed:
- Requests from `*.clerk.com` domains (official Clerk infrastructure)
- Requests from `*.clerk.accounts.dev` (Clerk development domains)
- Requests with no origin (allows Postman/curl for testing)
- Frontend requests from configured domains

### What's Blocked:
- Requests from unauthorized domains
- Requests without required Svix headers (for webhook endpoint)
- Requests with invalid signatures
- Requests exceeding body size limit (1MB)

## Environment Variables Required

```bash
# Required for webhook functionality
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxx

# Required for CORS (frontend)
FRONTEND_URL=https://your-frontend.vercel.app
```

## Testing the Configuration

### Test Webhook Endpoint:
```bash
# This will fail signature verification but confirms CORS/routing works
curl -X POST http://localhost:3001/api/auth/webhook \
  -H "Content-Type: application/json" \
  -H "svix-id: test_id" \
  -H "svix-timestamp: 1234567890" \
  -H "svix-signature: test_sig" \
  -d '{"type":"user.created","data":{"id":"test"}}'

# Expected: 400 Bad Request (invalid signature)
# NOT: CORS error or 404
```

### Test CORS Headers:
```bash
curl -X OPTIONS http://localhost:3001/api/auth/webhook \
  -H "Origin: https://api.clerk.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: svix-id,svix-timestamp,svix-signature" \
  -v

# Expected: 200 OK with CORS headers
# Access-Control-Allow-Origin: https://api.clerk.com
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
# Access-Control-Allow-Headers: Content-Type, Authorization, svix-id, svix-timestamp, svix-signature
```

## Clerk Dashboard Configuration

In your Clerk Dashboard (https://dashboard.clerk.com):

1. Go to **Webhooks** section
2. Click **Add Endpoint**
3. Set endpoint URL to: `https://your-backend.vercel.app/api/auth/webhook`
4. Subscribe to events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Copy the **Signing Secret** and set it as `CLERK_WEBHOOK_SECRET` environment variable
6. Test the webhook using Clerk's "Send test event" feature

## Common Issues and Solutions

### Issue: "CORS not allowed" error
**Cause:** Origin not in allowlist
**Solution:** Verify the origin header matches a pattern in `allowedOrigins`

### Issue: "Invalid webhook signature" error
**Cause:** Raw body not preserved or wrong secret
**Solution:**
- Ensure raw body middleware runs BEFORE JSON parser
- Verify `CLERK_WEBHOOK_SECRET` matches Clerk dashboard
- Check that body hasn't been modified by other middleware

### Issue: "Missing svix headers" error
**Cause:** Headers not being sent or not in allowedHeaders
**Solution:** Ensure Svix headers are in CORS `allowedHeaders` array

### Issue: Webhook endpoint returns 404
**Cause:** Routing issue
**Solution:** Verify endpoint is `POST /api/auth/webhook` and controller is registered

## References

- [Clerk Webhooks Documentation](https://clerk.com/docs/webhooks/overview)
- [Svix Webhook Verification](https://docs.svix.com/receiving/verifying-payloads/how)
- [Express CORS Middleware](https://www.npmjs.com/package/cors)

## Files Modified

- `/backend/src/App.ts` - CORS configuration and raw body middleware
- `/backend/src/presentation/controllers/AuthController.ts` - Webhook handler (already implemented)

---

**Last Updated:** 2026-01-02
**Version:** 2.0.0
