import "@testing-library/jest-dom";
import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as crypto from "crypto";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables for tests
// Generate a valid 32-byte encryption key for tests
process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString("base64");
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.UPSTASH_REDIS_REST_URL = "https://test-redis.upstash.io";
process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
process.env.CLERK_SECRET_KEY = "test-clerk-secret-key";
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_example";
