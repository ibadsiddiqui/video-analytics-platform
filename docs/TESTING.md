# Testing Guide

This document describes the testing infrastructure, test coverage, and best practices for the Video Analytics Platform.

## Testing Stack

- **Test Framework**: [Vitest](https://vitest.dev/) v4.0.17
- **React Testing**: [@testing-library/react](https://testing-library.com/react) v16.3.2
- **DOM Testing**: [jsdom](https://github.com/jsdom/jsdom) v27.4.0
- **Test UI**: [@vitest/ui](https://vitest.dev/guide/ui.html) for interactive test exploration

### Why Vitest?

- **Next.js 15 Compatibility**: Better integration with Next.js App Router
- **Fast**: Native ESM support and parallel test execution
- **Vite-powered**: Uses the same config as Vite (if applicable)
- **Jest-compatible API**: Familiar syntax for Jest users
- **Built-in TypeScript**: No additional configuration needed

## Running Tests

```bash
# Run all tests in watch mode (development)
npm test

# Run all tests once (CI/CD)
npm run test:run

# Open Vitest UI (visual test runner)
npm run test:ui

# Run specific test file
npm run test:run encryption

# Run tests matching pattern
npm run test:run -- --grep "tier access"
```

## Test Coverage

**Total: 113 passing tests** (Phase 1: 85 tests, Phase 2: 28 tests)

### Phase 1: Core Infrastructure ✅

**Total: 85 passing tests**

#### 1. Tier Access System (20 tests)
**File**: `src/lib/constants/__tests__/tiers.test.ts`

Tests the tier-based access control system:

- ✅ TIER_FEATURES configuration (8 features)
- ✅ TIER_CONFIG for all 4 tiers (FREE, CREATOR, PRO, AGENCY)
- ✅ `hasFeatureAccess()` - Validates feature access by tier
- ✅ `getMinimumTier()` - Returns minimum required tier for features
- ✅ `getCommentLimit()` - Returns comment limits (-1 for unlimited)

**Coverage**:
- All tier levels (FREE, CREATOR, PRO, AGENCY)
- All Phase 1-5 features
- Undefined tier handling
- Comment limit boundaries

#### 2. Encryption Service (43 tests)
**File**: `src/lib/__tests__/encryption.test.ts`

Tests the AES-256-GCM encryption service for API keys:

**Constructor Tests**:
- ✅ Missing ENCRYPTION_KEY error
- ✅ Invalid base64 format error
- ✅ Invalid key length error (must be 32 bytes)
- ✅ Successful initialization

**Encryption Tests**:
- ✅ Empty/whitespace API key validation
- ✅ Special characters handling
- ✅ Long keys (500+ characters)
- ✅ Random IV generation (different each time)
- ✅ Base64 output encoding

**Decryption Tests**:
- ✅ Successful round-trip encryption/decryption
- ✅ Multiple cycles consistency
- ✅ Missing field validation (encryptedKey, iv, authTag, salt)
- ✅ Invalid IV/authTag/salt length detection
- ✅ Tampered data detection
- ✅ Wrong authTag rejection
- ✅ Unicode character preservation

**Security Tests**:
- ✅ Non-deterministic output (same input → different output)
- ✅ Original key not exposed in encrypted data
- ✅ Correct IV length (16 bytes)
- ✅ Correct authTag length (16 bytes)
- ✅ Correct salt length (32 bytes)
- ✅ Wrong master key rejection

**Utility Tests**:
- ✅ `maskKey()` - Shows first 4 and last 4 chars
- ✅ `testEncryption()` - Round-trip verification

#### 3. Request Tracking (22 tests)
**File**: `src/lib/utils/__tests__/request-tracker.test.ts`

Tests the rate limiting and request tracking system:

**Daily Limit Tests**:
- ✅ Correct limits for all tiers (FREE: 100, CREATOR: 100, PRO: 500, AGENCY: 2000)

**Tracking Tests**:
- ✅ User not found (defaults to FREE tier)
- ✅ First request of the day
- ✅ Reset count from previous day (midnight UTC boundary)
- ✅ Within daily limit
- ✅ At daily limit (blocks request)
- ✅ Over daily limit (blocks request)

**Non-Tracking Tests**:
- ✅ Check limit without incrementing counter

**Tier-Specific Tests**:
- ✅ CREATOR tier limit (100)
- ✅ PRO tier limit (500)
- ✅ AGENCY tier limit (2000)

**Reset Timing Tests**:
- ✅ `resetAt` set to midnight UTC of next day

**Utility Tests**:
- ✅ `getRateLimitStatus()` - Read-only status
- ✅ `createRateLimitHeaders()` - X-RateLimit-* headers

**Edge Cases**:
- ✅ Negative dailyRequests (corrupted data)
- ✅ Requests at exactly midnight UTC

### Phase 2: Advanced Features ✅

**Total: 28 passing tests**

#### 4. Competitor Tracking Service (17 tests)
**File**: `src/lib/services/__tests__/competitor.test.ts`

Tests the competitor tracking system for monitoring other channels:

**Add Competitor Tests**:
- ✅ Successfully add new competitor
- ✅ Fetch YouTube channel metrics (subscribers, videos, views)
- ✅ Detect and use YouTube API key from environment
- ✅ Prevent duplicate competitors
- ✅ Reactivate soft-deleted competitors
- ✅ Handle missing YouTube API key gracefully
- ✅ Handle YouTube API failures

**Remove Competitor Tests**:
- ✅ Successfully soft-delete competitor (isActive = false)
- ✅ Handle non-existent competitor removal

**Get Competitors Tests**:
- ✅ List all active competitors for user
- ✅ Filter out inactive competitors
- ✅ Return empty array when no competitors exist

**Get Single Competitor Tests**:
- ✅ Get competitor with historical snapshots
- ✅ Handle non-existent competitor

**Update Competitor Metrics Tests**:
- ✅ Update single competitor metrics from YouTube
- ✅ Create snapshot in database
- ✅ Batch update multiple competitors
- ✅ Handle update errors gracefully

**Coverage**:
- Prisma mocking for database operations
- YouTube Data API mocking
- BigInt handling for large numbers (subscriber counts)
- Soft delete pattern implementation
- Error handling and edge cases

#### 5. Benchmark Service (11 tests)
**File**: `src/lib/services/__tests__/benchmark.test.ts`

Tests the benchmark comparison system for video performance analysis:

**Calculate Benchmark Tests**:
- ✅ Calculate benchmark from niche videos
- ✅ Compute averages (views, likes, comments, engagement rate)
- ✅ Calculate percentiles (p10, p25, p50, p75, p90)
- ✅ Handle empty video datasets
- ✅ Handle null engagement rates

**Compare Video Tests**:
- ✅ Compare video metrics to niche benchmark
- ✅ Calculate percentage differences
- ✅ Rank videos by percentile (top_10, top_25, top_50, average, below_average)
- ✅ Handle missing benchmark data

**Get Benchmark Tests**:
- ✅ Retrieve existing benchmark from database
- ✅ Handle non-existent benchmark

**Coverage**:
- Statistical calculations (mean, median, percentiles)
- BigInt arithmetic for large view counts
- Percentile ranking algorithm:
  - top_10: >= 90th percentile
  - top_25: >= 75th percentile
  - top_50: >= 50th percentile
  - average: >= 25th percentile
  - below_average: < 25th percentile
- NicheDetector service mocking
- Prisma database mocking

## Test Configuration

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './test/setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### test/setup.ts

Global test setup file:

```typescript
import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as crypto from 'crypto';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
process.env.CLERK_SECRET_KEY = 'test-clerk-secret-key';
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_example';
```

## Writing Tests

### Test Structure

Follow the **Arrange-Act-Assert** pattern:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
    vi.clearAllMocks();
  });

  describe('Specific Function', () => {
    it('should handle expected behavior', () => {
      // Arrange: Set up test data
      const input = 'test-data';

      // Act: Execute the function
      const result = myFunction(input);

      // Assert: Verify the result
      expect(result).toBe('expected-output');
    });

    it('should handle edge cases', () => {
      // Test edge cases
      expect(() => myFunction('')).toThrow('Invalid input');
    });
  });
});
```

### Mocking Prisma

For tests that interact with the database:

```typescript
import { vi } from 'vitest';
import { prisma } from '@/lib/prisma';

// Mock the entire Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// In your test
it('should fetch user data', async () => {
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    id: 'user-1',
    email: 'test@test.com',
    tier: 'PRO',
  });

  const result = await getUserData('user-1');

  expect(prisma.user.findUnique).toHaveBeenCalledWith({
    where: { id: 'user-1' },
  });
  expect(result.tier).toBe('PRO');
});
```

### Testing with Time

Use `vi.useFakeTimers()` for time-dependent tests:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Time-dependent feature', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should reset at midnight', () => {
    // Test runs at fixed time
    expect(getCurrentDate()).toBe('2024-01-15');
  });
});
```

## Best Practices

### 1. Test Naming

Use clear, descriptive test names:

```typescript
// ✅ Good
it('should return 403 when user lacks PRO tier access')

// ❌ Bad
it('test access')
```

### 2. Test Independence

Each test should be independent and not rely on other tests:

```typescript
// ✅ Good - Use beforeEach for setup
beforeEach(() => {
  vi.clearAllMocks();
  testData = createTestData();
});

// ❌ Bad - Tests depend on execution order
let sharedState;
it('test 1', () => { sharedState = 'value'; });
it('test 2', () => { expect(sharedState).toBe('value'); });
```

### 3. Test Coverage Goals

- **Utilities/Services**: Aim for 80%+ coverage
- **Business Logic**: 100% coverage for critical paths
- **UI Components**: Test user interactions and state changes
- **API Routes**: Test authentication, validation, error handling

### 4. What to Test

✅ **Do Test**:
- Business logic and algorithms
- Input validation
- Error handling
- Edge cases and boundary conditions
- Authentication and authorization
- Data transformations

❌ **Don't Test**:
- Third-party libraries (YouTube API, Clerk)
- Framework internals (Next.js, React)
- Simple getters/setters
- Constants

### 5. Mock External Dependencies

Always mock:
- Database calls (Prisma)
- External APIs (YouTube, Instagram)
- Redis cache
- Authentication (Clerk)

```typescript
vi.mock('@/lib/prisma');
vi.mock('@/lib/redis');
vi.mock('@clerk/nextjs');
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd frontend
          npm install

      - name: Run tests
        run: |
          cd frontend
          npm run test:run
```

## Future Test Coverage

### Phase 2: API Key Management (Pending)
- [ ] API key CRUD operations
- [ ] Key encryption/decryption in API routes
- [ ] Key validation and testing

### Phase 3: Predictive Analytics (Pending)
- [ ] Viral potential score calculation
- [ ] Posting time optimizer
- [ ] Historical data aggregation

### Phase 4: Content Strategy (Pending)
- [ ] Title analysis service
- [ ] Thumbnail analysis service

### Phase 5: Audience Analytics (Pending)
- [ ] Audience overlap calculation
- [ ] Superfan identification

### Integration Tests (Future)
- [ ] API endpoint integration tests
- [ ] Authentication flow tests
- [ ] Database transaction tests

### E2E Tests (Future)
- [ ] Full user journey tests with Playwright
- [ ] Video analysis workflow
- [ ] Multi-video comparison

## Troubleshooting

### Common Issues

**Issue**: `Error: ENCRYPTION_KEY must be exactly 32 bytes`

**Solution**: Update `test/setup.ts` to generate a valid key:
```typescript
process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');
```

---

**Issue**: Tests timeout when mocking Prisma

**Solution**: Ensure all Prisma mocks return resolved promises:
```typescript
vi.mocked(prisma.user.findUnique).mockResolvedValue(userData);
```

---

**Issue**: `ReferenceError: expect is not defined`

**Solution**: Add `globals: true` to `vitest.config.ts`:
```typescript
export default defineConfig({
  test: {
    globals: true,
  },
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Vitest UI](https://vitest.dev/guide/ui.html)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Last Updated**: January 2026
**Test Coverage**: 85 tests passing
