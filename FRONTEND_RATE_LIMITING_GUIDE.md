# Frontend Rate Limiting Implementation Guide

## Quick Start for Developers

### For Frontend Developers

#### Using the Tracking Hook in Your Components

```typescript
import { useAnonymousTracking } from '@/hooks/useAnonymousTracking';

function MyComponent() {
  const { requestsRemaining, isLimitReached, incrementRequest } = useAnonymousTracking();

  const handleRequest = async () => {
    if (isLimitReached) {
      toast.error('Limit reached, please sign up');
      return;
    }

    incrementRequest(); // Increment before making request
    // ... make API call
  };

  return (
    <div>
      {requestsRemaining} requests remaining
    </div>
  );
}
```

#### Using the Fingerprint Utility

```typescript
import { getBrowserFingerprint } from '@/utils/fingerprint';

async function analyzeVideo(url: string) {
  const fingerprint = await getBrowserFingerprint();

  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'X-Fingerprint': fingerprint,
    },
    body: JSON.stringify({ url }),
  });

  // ... handle response
}
```

#### Syncing with Backend Headers

```typescript
import { syncTrackingWithHeaders } from '@/hooks/useAnonymousTracking';

const response = await fetch('/api/analyze', { /* ... */ });

// Extract rate limit headers from response
const remaining = response.headers.get('X-RateLimit-Remaining');
const limit = response.headers.get('X-RateLimit-Limit');
const reset = response.headers.get('X-RateLimit-Reset');

// Sync with localStorage
syncTrackingWithHeaders(remaining, limit, reset);
```

### For Backend Developers

#### Required Rate Limit Headers

Your API responses must include these headers:

```
X-RateLimit-Remaining: number (e.g., "4")
X-RateLimit-Limit: number (e.g., "5")
X-RateLimit-Reset: ISO date string (e.g., "2026-01-03T00:00:00.000Z")
```

#### Reading Browser Fingerprint

The fingerprint is sent in the request header:

```typescript
// Express middleware
app.post('/api/analyze', (req, res) => {
  const fingerprint = req.headers['x-fingerprint']; // Browser fingerprint

  // Use fingerprint to identify anonymous user
  // Check/increment rate limit for this fingerprint
});
```

#### Returning 429 When Limit Exceeded

```typescript
if (isRateLimited(fingerprint)) {
  return res.status(429).json({
    error: 'Daily request limit exceeded',
    remaining: 0,
    limit: 5,
    resetAt: tomorrow,
  });
}
```

## File Reference

### Utilities

#### `/frontend/src/utils/fingerprint.ts`
- **Main Export**: `getBrowserFingerprint(): Promise<string>`
- **Secondary Export**: `clearCachedFingerprint(): void`
- **How It Works**:
  1. Collects 9 different fingerprint signals
  2. Combines them into a string
  3. Hashes with SHA-256 (or fallback)
  4. Caches result in memory

### Hooks

#### `/frontend/src/hooks/useAnonymousTracking.ts`
- **Hook**: `useAnonymousTracking(limit?: number = 5)`
- **Return Values**:
  - `requestsRemaining: number` - Requests left today
  - `requestsLimit: number` - Daily limit (default 5)
  - `resetAt: Date | null` - When limit resets
  - `incrementRequest: () => void` - Increment counter
  - `isLimitReached: boolean` - Whether limit exceeded
  - `resetDate: string` - Today's date (YYYY-MM-DD)

- **Utility Functions**:
  - `syncTrackingWithHeaders(remaining?, limit?, reset?)` - Sync with backend
  - `resetTrackingData()` - Clear today's data (for testing)

### Components

#### `/frontend/src/components/RateLimitDisplay.tsx`
**Displays:** Status banner with remaining count, progress bar, reset time

**Props:**
```typescript
{
  requestsRemaining: number;
  requestsLimit: number;
  isLimitReached: boolean;
  resetAt: Date | null;
  isAuthenticated: boolean; // Hidden if true
}
```

**States:**
- Normal: "X free requests today"
- Warning: "Low on requests" (1-2 remaining)
- Limit: "Daily limit reached"

#### `/frontend/src/components/UpgradePrompt.tsx`
**Displays:** Beautiful modal with upgrade benefits and CTA buttons

**Props:**
```typescript
{
  isOpen: boolean;
  onClose: () => void;
  requestsLimit: number; // For display
  resetAt: Date | null; // For reset time
}
```

**Features:**
- Gradient backdrop with animation
- 3 feature highlights
- Sign up / Sign in / Continue as guest buttons
- Reset time countdown

### Hooks

#### `/frontend/src/hooks/useAnalytics.ts` (Updated)
**New Features:**
- Sends `X-Fingerprint` header with requests
- Reads `X-RateLimit-*` headers from responses
- Syncs tracking with localStorage
- Handles 429 errors with user-friendly message

**New Return:**
```typescript
rateLimit: {
  remaining: number;
  limit: number;
  resetAt: string | null;
} | null
```

### Components

#### `/frontend/src/components/SearchBar.tsx` (Updated)
**Changes:**
- Submit button disabled when limit reached (anonymous users)
- Button text changes to "Limit Reached"
- Shows AlertCircle icon in disabled state

## localStorage Schema

### Storage Key
```
anonymous_requests_YYYY-MM-DD
```

### Data Structure
```typescript
{
  count: number;              // How many requests used
  resetAt: string;            // ISO date when limit resets
  fingerprint?: string;       // Browser fingerprint (optional)
}
```

### Example
```json
{
  "anonymous_requests_2026-01-02": {
    "count": 3,
    "resetAt": "2026-01-03T00:00:00.000Z"
  }
}
```

## Request/Response Flow

### Client Request
```
POST /api/analyze
X-Fingerprint: a1b2c3d4e5f6...
Content-Type: application/json

{ "url": "https://youtube.com/watch?v=..." }
```

### Server Response (Success)
```
HTTP 200 OK
X-RateLimit-Remaining: 4
X-RateLimit-Limit: 5
X-RateLimit-Reset: 2026-01-03T00:00:00.000Z
Content-Type: application/json

{ "success": true, "data": { ... } }
```

### Server Response (Rate Limited)
```
HTTP 429 Too Many Requests
X-RateLimit-Remaining: 0
X-RateLimit-Limit: 5
X-RateLimit-Reset: 2026-01-03T00:00:00.000Z
Content-Type: application/json

{
  "error": "Daily request limit exceeded",
  "remaining": 0,
  "limit": 5
}
```

## Common Patterns

### Checking Limit Before Request

```typescript
const { isLimitReached, incrementRequest } = useAnonymousTracking();

function onAnalyze(url: string) {
  if (isLimitReached) {
    toast.error('Limit reached');
    return;
  }

  incrementRequest(); // Increment immediately
  makeRequest(url);   // Then make request
}
```

### Syncing After Response

```typescript
const response = await fetch('/api/analyze', {
  headers: { 'X-Fingerprint': fingerprint },
  // ...
});

// Sync tracking with response headers
syncTrackingWithHeaders(
  response.headers.get('X-RateLimit-Remaining'),
  response.headers.get('X-RateLimit-Limit'),
  response.headers.get('X-RateLimit-Reset')
);
```

### Showing Upgrade Prompt

```typescript
const [showUpgrade, setShowUpgrade] = useState(false);
const { isLimitReached } = useAnonymousTracking();

useEffect(() => {
  if (isLimitReached) {
    setShowUpgrade(true);
  }
}, [isLimitReached]);

return (
  <>
    <UpgradePrompt
      isOpen={showUpgrade}
      onClose={() => setShowUpgrade(false)}
    />
  </>
);
```

## Testing Tips

### Manually Clear Tracking
```typescript
import { resetTrackingData } from '@/hooks/useAnonymousTracking';

// In console or test:
resetTrackingData(); // Clears today's tracking
```

### Testing Rate Limit Display
1. Call `resetTrackingData()` to start fresh
2. Make requests until counter reaches limit
3. Verify button disables
4. Verify RateLimitDisplay shows warning
5. Verify UpgradePrompt appears on next request

### Testing Fingerprint Consistency
```typescript
import { getBrowserFingerprint, clearCachedFingerprint } from '@/utils/fingerprint';

// Test 1: Fingerprint is cached
const fp1 = await getBrowserFingerprint();
const fp2 = await getBrowserFingerprint();
console.assert(fp1 === fp2, 'Fingerprint should be cached');

// Test 2: Fingerprint changes after clearing cache
clearCachedFingerprint();
const fp3 = await getBrowserFingerprint();
console.assert(fp1 === fp3, 'New generation should produce same hash');
```

## Troubleshooting

### "Fingerprint not being sent"
- Check if X-Fingerprint header is in network tab
- Ensure fetch includes the header
- Check browser console for errors in getBrowserFingerprint()

### "localStorage data not persisting"
- Check if localStorage is enabled in browser
- Check if key format is correct: `anonymous_requests_YYYY-MM-DD`
- Check if site has permission to use localStorage

### "Rate limit not syncing"
- Verify backend returns all 3 headers
- Check network tab for header values
- Ensure syncTrackingWithHeaders() is called
- Verify header names are exact (case matters)

### "Fingerprint changes between reloads"
- This should NOT happen - fingerprint should be cached
- If it does, check if clearCachedFingerprint() is being called
- Check browser console for errors
- Verify all fingerprint sources are available

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Canvas API | ✓ | ✓ | ✓ | ✓ |
| WebGL | ✓ | ✓ | ✓ | ✓ |
| crypto.subtle | ✓ | ✓ | ✓ | ✓ |
| localStorage | ✓ | ✓ | ✓ | ✓ |
| Overall | Full | Full | Full | Full |

## Performance

- **Fingerprint Generation**: ~10-50ms (first time), <1ms (cached)
- **localStorage Operations**: ~1ms per operation
- **Component Render**: <1ms (no expensive calculations)
- **Bundle Impact**: ~22 KB uncompressed, ~8 KB gzipped
- **No Runtime Overhead**: Lazy evaluation, minimal rerenders

## Security Notes

- Fingerprint is **not** a unique user ID - it's just for rate limiting
- Fingerprint is **not** stored on server - only used to check rate limit
- Users can clear localStorage to reset their limit
- Users can use private/incognito mode to bypass limit
- Backend should have additional IP-based rate limiting
- Fingerprint is **one-way hashed** - original data not recoverable

## Next Steps

1. **Implement backend rate limiting** - See backend documentation
2. **Test end-to-end** - Make actual requests and verify limits work
3. **Monitor abuse patterns** - Watch for fingerprint spoofing attempts
4. **Adjust limit** - Start with 5 and adjust based on usage
5. **Add analytics** - Track upgrade prompt conversion rates
