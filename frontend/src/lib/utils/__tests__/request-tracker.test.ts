import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  checkAndTrackRequest,
  getRateLimitStatus,
  getDailyLimit,
  createRateLimitHeaders,
  RateLimitResult,
} from "../request-tracker";
import { UserTier } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Mock Prisma client
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("Request Tracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset system time to a known date
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getDailyLimit", () => {
    it("should return correct limit for FREE tier", () => {
      expect(getDailyLimit(UserTier.FREE)).toBe(100);
    });

    it("should return correct limit for CREATOR tier", () => {
      expect(getDailyLimit(UserTier.CREATOR)).toBe(100);
    });

    it("should return correct limit for PRO tier", () => {
      expect(getDailyLimit(UserTier.PRO)).toBe(500);
    });

    it("should return correct limit for AGENCY tier", () => {
      expect(getDailyLimit(UserTier.AGENCY)).toBe(2000);
    });
  });

  describe("checkAndTrackRequest", () => {
    describe("User not found", () => {
      it("should allow request with FREE tier limits", async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

        const result = await checkAndTrackRequest("unknown-user-id");

        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(100); // FREE tier
        expect(result.remaining).toBe(100);
        expect(result.currentCount).toBe(0);
      });
    });

    describe("First request of the day", () => {
      it("should allow first request for FREE user", async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: "user-1",
          clerkId: "clerk-123",
          email: "test@test.com",
          tier: UserTier.FREE,
          dailyRequests: 0,
          lastRequestDate: null,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        });

        vi.mocked(prisma.user.update).mockResolvedValue({
          id: "user-1",
          clerkId: "clerk-123",
          email: "test@test.com",
          tier: UserTier.FREE,
          dailyRequests: 1,
          lastRequestDate: new Date(),
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date(),
        });

        const result = await checkAndTrackRequest("clerk-123");

        expect(result.allowed).toBe(true);
        expect(result.currentCount).toBe(1);
        expect(result.remaining).toBe(99); // 100 - 1
        expect(result.limit).toBe(100);

        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { clerkId: "clerk-123" },
          data: {
            dailyRequests: 1,
            lastRequestDate: expect.any(Date),
          },
        });
      });

      it("should allow first request for PRO user", async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: "user-1",
          clerkId: "clerk-pro",
          email: "pro@test.com",
          tier: UserTier.PRO,
          dailyRequests: 0,
          lastRequestDate: null,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        });

        vi.mocked(prisma.user.update).mockResolvedValue({
          id: "user-1",
          clerkId: "clerk-pro",
          email: "pro@test.com",
          tier: UserTier.PRO,
          dailyRequests: 1,
          lastRequestDate: new Date(),
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date(),
        });

        const result = await checkAndTrackRequest("clerk-pro");

        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(500); // PRO tier
        expect(result.remaining).toBe(499);
      });
    });

    describe("Reset count from previous day", () => {
      it("should reset count if last request was yesterday", async () => {
        // Set current time to midnight
        vi.setSystemTime(new Date("2024-01-15T00:01:00Z"));

        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: "user-1",
          clerkId: "clerk-123",
          email: "test@test.com",
          tier: UserTier.FREE,
          dailyRequests: 99, // Used all but 1 yesterday
          lastRequestDate: new Date("2024-01-14T23:59:00Z"), // Yesterday
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-14"),
        });

        vi.mocked(prisma.user.update).mockResolvedValue({
          id: "user-1",
          clerkId: "clerk-123",
          email: "test@test.com",
          tier: UserTier.FREE,
          dailyRequests: 1,
          lastRequestDate: new Date(),
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date(),
        });

        const result = await checkAndTrackRequest("clerk-123");

        expect(result.allowed).toBe(true);
        expect(result.currentCount).toBe(1); // Reset to 1
        expect(result.remaining).toBe(99);

        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { clerkId: "clerk-123" },
          data: {
            dailyRequests: 1,
            lastRequestDate: expect.any(Date),
          },
        });
      });
    });

    describe("Within daily limit", () => {
      it("should allow request when under limit", async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: "user-1",
          clerkId: "clerk-123",
          email: "test@test.com",
          tier: UserTier.FREE,
          dailyRequests: 50,
          lastRequestDate: new Date("2024-01-15T10:00:00Z"), // Today
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-15"),
        });

        vi.mocked(prisma.user.update).mockResolvedValue({
          id: "user-1",
          clerkId: "clerk-123",
          email: "test@test.com",
          tier: UserTier.FREE,
          dailyRequests: 51,
          lastRequestDate: new Date(),
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date(),
        });

        const result = await checkAndTrackRequest("clerk-123");

        expect(result.allowed).toBe(true);
        expect(result.currentCount).toBe(51);
        expect(result.remaining).toBe(49); // 100 - 51
      });
    });

    describe("At daily limit", () => {
      it("should block request when at limit", async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: "user-1",
          clerkId: "clerk-123",
          email: "test@test.com",
          tier: UserTier.FREE,
          dailyRequests: 100,
          lastRequestDate: new Date("2024-01-15T10:00:00Z"), // Today
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-15"),
        });

        const result = await checkAndTrackRequest("clerk-123");

        expect(result.allowed).toBe(false);
        expect(result.currentCount).toBe(100);
        expect(result.remaining).toBe(0);
        expect(result.limit).toBe(100);

        // Should not update database when limit reached
        expect(prisma.user.update).not.toHaveBeenCalled();
      });

      it("should block request when over limit", async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: "user-1",
          clerkId: "clerk-123",
          email: "test@test.com",
          tier: UserTier.FREE,
          dailyRequests: 150, // Somehow over limit
          lastRequestDate: new Date("2024-01-15T10:00:00Z"),
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-15"),
        });

        const result = await checkAndTrackRequest("clerk-123");

        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
        expect(prisma.user.update).not.toHaveBeenCalled();
      });
    });

    describe("Check without tracking", () => {
      it("should check limit without incrementing counter", async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: "user-1",
          clerkId: "clerk-123",
          email: "test@test.com",
          tier: UserTier.FREE,
          dailyRequests: 50,
          lastRequestDate: new Date("2024-01-15T10:00:00Z"),
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-15"),
        });

        const result = await checkAndTrackRequest("clerk-123", false);

        expect(result.allowed).toBe(true);
        expect(result.currentCount).toBe(50);
        expect(result.remaining).toBe(50); // Not decremented

        // Should not update database
        expect(prisma.user.update).not.toHaveBeenCalled();
      });
    });

    describe("Different tier limits", () => {
      it("should apply CREATOR tier limit (100)", async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: "user-1",
          clerkId: "clerk-creator",
          email: "creator@test.com",
          tier: UserTier.CREATOR,
          dailyRequests: 99,
          lastRequestDate: new Date("2024-01-15T10:00:00Z"),
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-15"),
        });

        vi.mocked(prisma.user.update).mockResolvedValue({
          id: "user-1",
          clerkId: "clerk-creator",
          email: "creator@test.com",
          tier: UserTier.CREATOR,
          dailyRequests: 100,
          lastRequestDate: new Date(),
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date(),
        });

        const result = await checkAndTrackRequest("clerk-creator");

        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(100);
        expect(result.currentCount).toBe(100);
        expect(result.remaining).toBe(0);
      });

      it("should apply PRO tier limit (500)", async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: "user-1",
          clerkId: "clerk-pro",
          email: "pro@test.com",
          tier: UserTier.PRO,
          dailyRequests: 499,
          lastRequestDate: new Date("2024-01-15T10:00:00Z"),
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-15"),
        });

        vi.mocked(prisma.user.update).mockResolvedValue({
          id: "user-1",
          clerkId: "clerk-pro",
          email: "pro@test.com",
          tier: UserTier.PRO,
          dailyRequests: 500,
          lastRequestDate: new Date(),
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date(),
        });

        const result = await checkAndTrackRequest("clerk-pro");

        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(500);
        expect(result.remaining).toBe(0);
      });

      it("should apply AGENCY tier limit (2000)", async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: "user-1",
          clerkId: "clerk-agency",
          email: "agency@test.com",
          tier: UserTier.AGENCY,
          dailyRequests: 1500,
          lastRequestDate: new Date("2024-01-15T10:00:00Z"),
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-15"),
        });

        vi.mocked(prisma.user.update).mockResolvedValue({
          id: "user-1",
          clerkId: "clerk-agency",
          email: "agency@test.com",
          tier: UserTier.AGENCY,
          dailyRequests: 1501,
          lastRequestDate: new Date(),
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date(),
        });

        const result = await checkAndTrackRequest("clerk-agency");

        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(2000);
        expect(result.remaining).toBe(499); // 2000 - 1501
      });
    });

    describe("Reset timing", () => {
      it("should set resetAt to end of current day", async () => {
        vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));

        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: "user-1",
          clerkId: "clerk-123",
          email: "test@test.com",
          tier: UserTier.FREE,
          dailyRequests: 10,
          lastRequestDate: new Date("2024-01-15T10:00:00Z"),
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-15"),
        });

        vi.mocked(prisma.user.update).mockResolvedValue({
          id: "user-1",
          clerkId: "clerk-123",
          email: "test@test.com",
          tier: UserTier.FREE,
          dailyRequests: 11,
          lastRequestDate: new Date(),
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date(),
        });

        const result = await checkAndTrackRequest("clerk-123");

        // Reset should be at midnight UTC of next day
        const expectedReset = new Date("2024-01-16T00:00:00Z");
        expect(result.resetAt.getTime()).toBe(expectedReset.getTime());
      });
    });
  });

  describe("getRateLimitStatus", () => {
    it("should return status without tracking", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-1",
        clerkId: "clerk-123",
        email: "test@test.com",
        tier: UserTier.FREE,
        dailyRequests: 75,
        lastRequestDate: new Date("2024-01-15T10:00:00Z"),
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-15"),
      });

      const result = await getRateLimitStatus("clerk-123");

      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(75);
      expect(result.remaining).toBe(25);
      expect(result.limit).toBe(100);

      // Should not update database
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe("createRateLimitHeaders", () => {
    it("should create correct headers", () => {
      const result: RateLimitResult = {
        allowed: true,
        remaining: 42,
        limit: 100,
        resetAt: new Date("2024-01-16T00:00:00Z"),
        currentCount: 58,
      };

      const headers = createRateLimitHeaders(result);

      expect(headers).toEqual({
        "X-RateLimit-Limit": "100",
        "X-RateLimit-Remaining": "42",
        "X-RateLimit-Reset": "2024-01-16T00:00:00.000Z",
      });
    });

    it("should handle zero remaining", () => {
      const result: RateLimitResult = {
        allowed: false,
        remaining: 0,
        limit: 100,
        resetAt: new Date("2024-01-16T00:00:00Z"),
        currentCount: 100,
      };

      const headers = createRateLimitHeaders(result);

      expect(headers["X-RateLimit-Remaining"]).toBe("0");
    });

    it("should handle different tier limits", () => {
      const result: RateLimitResult = {
        allowed: true,
        remaining: 1500,
        limit: 2000,
        resetAt: new Date("2024-01-16T00:00:00Z"),
        currentCount: 500,
      };

      const headers = createRateLimitHeaders(result);

      expect(headers["X-RateLimit-Limit"]).toBe("2000");
      expect(headers["X-RateLimit-Remaining"]).toBe("1500");
    });
  });

  describe("Edge Cases", () => {
    it("should handle negative dailyRequests gracefully", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-1",
        clerkId: "clerk-123",
        email: "test@test.com",
        tier: UserTier.FREE,
        dailyRequests: -5, // Corrupted data
        lastRequestDate: new Date("2024-01-15T10:00:00Z"),
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-15"),
      });

      vi.mocked(prisma.user.update).mockResolvedValue({
        id: "user-1",
        clerkId: "clerk-123",
        email: "test@test.com",
        tier: UserTier.FREE,
        dailyRequests: -4, // -5 + 1
        lastRequestDate: new Date(),
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date(),
      });

      const result = await checkAndTrackRequest("clerk-123");

      expect(result.allowed).toBe(true);
      // Current count will be -4 after incrementing from -5
      expect(result.currentCount).toBe(-4);
      // Remaining will be large since -4 < 100
      expect(result.remaining).toBeGreaterThan(0);
    });

    it("should handle requests at exactly midnight", async () => {
      vi.setSystemTime(new Date("2024-01-15T00:00:00Z"));

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-1",
        clerkId: "clerk-123",
        email: "test@test.com",
        tier: UserTier.FREE,
        dailyRequests: 100,
        lastRequestDate: new Date("2024-01-14T23:59:59Z"), // One second before midnight
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-14"),
      });

      vi.mocked(prisma.user.update).mockResolvedValue({
        id: "user-1",
        clerkId: "clerk-123",
        email: "test@test.com",
        tier: UserTier.FREE,
        dailyRequests: 1,
        lastRequestDate: new Date(),
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date(),
      });

      const result = await checkAndTrackRequest("clerk-123");

      // Should reset the count since it's a new day
      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(1);
    });
  });
});
