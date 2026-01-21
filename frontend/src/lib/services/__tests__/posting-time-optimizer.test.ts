/**
 * Posting Time Optimizer Service Tests
 * Phase 3.2: Optimal Posting Time Recommendations
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { PostingTimeOptimizerService } from "../posting-time-optimizer";
import { prisma } from "@/lib/prisma";
import { cacheService } from "@/lib/redis";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    video: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/redis", () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

describe("PostingTimeOptimizerService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("recommendPostingTimes", () => {
    it("should return cached result if available", async () => {
      const cachedResult = {
        topSlots: [
          {
            dayOfWeek: "Tuesday",
            hourRange: "6-8 PM",
            startHour: 18,
            endHour: 20,
            averageEngagementRate: 8.5,
            videoCount: 3,
            averageViews: 50000,
            averageLikes: 2500,
            confidence: "high" as const,
          },
        ],
        heatmapData: [],
        insights: ["Your best time is Tuesday at 6-8 PM"],
        totalAnalyzed: 10,
      };

      vi.mocked(cacheService.get).mockResolvedValue(cachedResult);

      const result =
        await PostingTimeOptimizerService.recommendPostingTimes("user-1");

      expect(result).toEqual(cachedResult);
      expect(cacheService.get).toHaveBeenCalledWith("posting-times:user-1:all");
      expect(cacheService.set).not.toHaveBeenCalled();
    });

    it("should return null if no videos found", async () => {
      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.video.findMany).mockResolvedValue([]);

      const result =
        await PostingTimeOptimizerService.recommendPostingTimes("user-1");

      expect(result).toBeNull();
    });

    it("should analyze single video with low confidence", async () => {
      const mockVideos = [
        {
          id: "video-1",
          publishedAt: new Date("2024-01-15T18:00:00Z"), // Monday 6 PM
          engagementRate: 5.0,
          viewCount: BigInt(30000),
          likeCount: BigInt(1500),
          commentCount: BigInt(150),
        },
      ];

      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.video.findMany).mockResolvedValue(mockVideos as any);

      const result =
        await PostingTimeOptimizerService.recommendPostingTimes("user-1");

      expect(result).not.toBeNull();
      expect(result!.topSlots.length).toBeGreaterThan(0);
      expect(result!.topSlots[0].confidence).toBe("low");
      expect(result!.topSlots[0].videoCount).toBe(1);
    });

    it("should analyze multiple videos and rank by engagement", async () => {
      const mockVideos = [
        {
          id: "video-1",
          publishedAt: new Date("2024-01-15T18:00:00Z"), // Monday 6 PM
          engagementRate: 8.5,
          viewCount: BigInt(50000),
          likeCount: BigInt(2500),
          commentCount: BigInt(250),
        },
        {
          id: "video-2",
          publishedAt: new Date("2024-01-15T20:00:00Z"), // Monday 8 PM
          engagementRate: 6.0,
          viewCount: BigInt(40000),
          likeCount: BigInt(2000),
          commentCount: BigInt(200),
        },
        {
          id: "video-3",
          publishedAt: new Date("2024-01-16T18:00:00Z"), // Tuesday 6 PM
          engagementRate: 9.0,
          viewCount: BigInt(55000),
          likeCount: BigInt(2750),
          commentCount: BigInt(275),
        },
      ];

      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.video.findMany).mockResolvedValue(mockVideos as any);

      const result =
        await PostingTimeOptimizerService.recommendPostingTimes("user-1");

      expect(result!.topSlots.length).toBeGreaterThan(0);
      expect(result!.topSlots[0].averageEngagementRate).toBeGreaterThanOrEqual(
        result!.topSlots[1].averageEngagementRate,
      );
      expect(result!.totalAnalyzed).toBe(3);
    });

    it("should set medium confidence for 2 videos in same slot", async () => {
      const mockVideos = [
        {
          id: "video-1",
          publishedAt: new Date("2024-01-15T18:00:00Z"), // Monday 6 PM
          engagementRate: 5.0,
          viewCount: BigInt(30000),
          likeCount: BigInt(1500),
          commentCount: BigInt(150),
        },
        {
          id: "video-2",
          publishedAt: new Date("2024-01-22T18:00:00Z"), // Monday 6 PM (different week)
          engagementRate: 6.0,
          viewCount: BigInt(35000),
          likeCount: BigInt(1750),
          commentCount: BigInt(175),
        },
      ];

      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.video.findMany).mockResolvedValue(mockVideos as any);

      const result =
        await PostingTimeOptimizerService.recommendPostingTimes("user-1");

      expect(
        result!.topSlots.some((slot) => slot.confidence === "medium"),
      ).toBe(true);
    });

    it("should set high confidence for 3+ videos in same slot", async () => {
      const mockVideos = [
        {
          id: "video-1",
          publishedAt: new Date("2024-01-15T18:00:00Z"), // Monday 6 PM
          engagementRate: 5.0,
          viewCount: BigInt(30000),
          likeCount: BigInt(1500),
          commentCount: BigInt(150),
        },
        {
          id: "video-2",
          publishedAt: new Date("2024-01-22T18:00:00Z"), // Monday 6 PM (different week)
          engagementRate: 6.0,
          viewCount: BigInt(35000),
          likeCount: BigInt(1750),
          commentCount: BigInt(175),
        },
        {
          id: "video-3",
          publishedAt: new Date("2024-01-29T18:00:00Z"), // Monday 6 PM (different week)
          engagementRate: 5.5,
          viewCount: BigInt(32000),
          likeCount: BigInt(1600),
          commentCount: BigInt(160),
        },
      ];

      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.video.findMany).mockResolvedValue(mockVideos as any);

      const result =
        await PostingTimeOptimizerService.recommendPostingTimes("user-1");

      const highConfidenceSlots = result!.topSlots.filter(
        (slot) => slot.confidence === "high",
      );
      expect(highConfidenceSlots.length).toBeGreaterThan(0);
    });

    it("should generate heatmap data for all days and hours", async () => {
      const mockVideos = [
        {
          id: "video-1",
          publishedAt: new Date("2024-01-15T18:00:00Z"),
          engagementRate: 5.0,
          viewCount: BigInt(30000),
          likeCount: BigInt(1500),
          commentCount: BigInt(150),
        },
      ];

      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.video.findMany).mockResolvedValue(mockVideos as any);

      const result =
        await PostingTimeOptimizerService.recommendPostingTimes("user-1");

      expect(result!.heatmapData.length).toBe(7 * 24); // 7 days x 24 hours
      expect(
        result!.heatmapData.every(
          (point) =>
            typeof point.day === "string" &&
            typeof point.dayIndex === "number" &&
            typeof point.hour === "number" &&
            typeof point.engagement === "number",
        ),
      ).toBe(true);
    });

    it("should format hour ranges correctly", async () => {
      const mockVideos = [
        {
          id: "video-1",
          publishedAt: new Date("2024-01-15T00:00:00Z"), // 12 AM
          engagementRate: 5.0,
          viewCount: BigInt(30000),
          likeCount: BigInt(1500),
          commentCount: BigInt(150),
        },
        {
          id: "video-2",
          publishedAt: new Date("2024-01-16T12:00:00Z"), // 12 PM
          engagementRate: 6.0,
          viewCount: BigInt(35000),
          likeCount: BigInt(1750),
          commentCount: BigInt(175),
        },
        {
          id: "video-3",
          publishedAt: new Date("2024-01-17T14:00:00Z"), // 2 PM
          engagementRate: 5.5,
          viewCount: BigInt(32000),
          likeCount: BigInt(1600),
          commentCount: BigInt(160),
        },
      ];

      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.video.findMany).mockResolvedValue(mockVideos as any);

      const result =
        await PostingTimeOptimizerService.recommendPostingTimes("user-1");

      const hourRanges = result!.topSlots.map((slot) => slot.hourRange);
      expect(
        hourRanges.some(
          (range) => range.includes("AM") || range.includes("PM"),
        ),
      ).toBe(true);
    });

    it("should aggregate views and likes correctly", async () => {
      const mockVideos = [
        {
          id: "video-1",
          publishedAt: new Date("2024-01-15T18:00:00Z"),
          engagementRate: 5.0,
          viewCount: BigInt(30000),
          likeCount: BigInt(1500),
          commentCount: BigInt(150),
        },
        {
          id: "video-2",
          publishedAt: new Date("2024-01-22T18:00:00Z"),
          engagementRate: 6.0,
          viewCount: BigInt(40000),
          likeCount: BigInt(2000),
          commentCount: BigInt(200),
        },
      ];

      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.video.findMany).mockResolvedValue(mockVideos as any);

      const result =
        await PostingTimeOptimizerService.recommendPostingTimes("user-1");

      const topSlot = result!.topSlots[0];
      expect(topSlot.averageViews).toBe(35000); // (30000 + 40000) / 2
      expect(topSlot.averageLikes).toBe(1750); // (1500 + 2000) / 2
    });

    it("should cache result for 24 hours", async () => {
      const mockVideos = [
        {
          id: "video-1",
          publishedAt: new Date("2024-01-15T18:00:00Z"),
          engagementRate: 5.0,
          viewCount: BigInt(30000),
          likeCount: BigInt(1500),
          commentCount: BigInt(150),
        },
      ];

      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.video.findMany).mockResolvedValue(mockVideos as any);

      await PostingTimeOptimizerService.recommendPostingTimes("user-1");

      expect(cacheService.set).toHaveBeenCalledWith(
        "posting-times:user-1:all",
        expect.any(Object),
        86400,
      );
    });

    it("should include niche in cache key", async () => {
      const mockVideos = [
        {
          id: "video-1",
          publishedAt: new Date("2024-01-15T18:00:00Z"),
          engagementRate: 5.0,
          viewCount: BigInt(30000),
          likeCount: BigInt(1500),
          commentCount: BigInt(150),
        },
      ];

      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.video.findMany).mockResolvedValue(mockVideos as any);

      await PostingTimeOptimizerService.recommendPostingTimes(
        "user-1",
        "GAMING",
      );

      expect(cacheService.get).toHaveBeenCalledWith(
        "posting-times:user-1:GAMING",
      );
    });

    it("should generate insights for insufficient videos", async () => {
      const mockVideos = [
        {
          id: "video-1",
          publishedAt: new Date("2024-01-15T18:00:00Z"),
          engagementRate: 5.0,
          viewCount: BigInt(30000),
          likeCount: BigInt(1500),
          commentCount: BigInt(150),
        },
      ];

      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.video.findMany).mockResolvedValue(mockVideos as any);

      const result =
        await PostingTimeOptimizerService.recommendPostingTimes("user-1");

      expect(result!.insights.length).toBeGreaterThan(0);
      expect(result!.insights[0]).toContain("at least 3 videos");
    });

    it("should generate best time insight", async () => {
      const mockVideos = [
        {
          id: "video-1",
          publishedAt: new Date("2024-01-15T18:00:00Z"),
          engagementRate: 8.0,
          viewCount: BigInt(50000),
          likeCount: BigInt(2500),
          commentCount: BigInt(250),
        },
        {
          id: "video-2",
          publishedAt: new Date("2024-01-22T18:00:00Z"),
          engagementRate: 8.5,
          viewCount: BigInt(55000),
          likeCount: BigInt(2750),
          commentCount: BigInt(275),
        },
        {
          id: "video-3",
          publishedAt: new Date("2024-01-29T18:00:00Z"),
          engagementRate: 8.2,
          viewCount: BigInt(52000),
          likeCount: BigInt(2600),
          commentCount: BigInt(260),
        },
      ];

      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.video.findMany).mockResolvedValue(mockVideos as any);

      const result =
        await PostingTimeOptimizerService.recommendPostingTimes("user-1");

      expect(
        result!.insights.some((insight) => insight.includes("best time")),
      ).toBe(true);
    });

    it("should detect weekday vs weekend patterns", async () => {
      const mockVideos = [
        // Weekday videos
        {
          id: "video-1",
          publishedAt: new Date("2024-01-15T18:00:00Z"), // Monday
          engagementRate: 8.0,
          viewCount: BigInt(50000),
          likeCount: BigInt(2500),
          commentCount: BigInt(250),
        },
        {
          id: "video-2",
          publishedAt: new Date("2024-01-16T18:00:00Z"), // Tuesday
          engagementRate: 8.5,
          viewCount: BigInt(55000),
          likeCount: BigInt(2750),
          commentCount: BigInt(275),
        },
        {
          id: "video-3",
          publishedAt: new Date("2024-01-17T18:00:00Z"), // Wednesday
          engagementRate: 8.2,
          viewCount: BigInt(52000),
          likeCount: BigInt(2600),
          commentCount: BigInt(260),
        },
        // Weekend videos
        {
          id: "video-4",
          publishedAt: new Date("2024-01-20T14:00:00Z"), // Saturday
          engagementRate: 4.0,
          viewCount: BigInt(25000),
          likeCount: BigInt(1250),
          commentCount: BigInt(125),
        },
        {
          id: "video-5",
          publishedAt: new Date("2024-01-21T14:00:00Z"), // Sunday
          engagementRate: 4.5,
          viewCount: BigInt(27500),
          likeCount: BigInt(1375),
          commentCount: BigInt(137),
        },
      ];

      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.video.findMany).mockResolvedValue(mockVideos as any);

      const result =
        await PostingTimeOptimizerService.recommendPostingTimes("user-1");

      expect(
        result!.insights.some(
          (insight) =>
            insight.includes("weekday") || insight.includes("weekend"),
        ),
      ).toBe(true);
    });

    it("should handle videos without publishedAt", async () => {
      const mockVideos = [
        {
          id: "video-1",
          publishedAt: null, // No publish date
          engagementRate: 5.0,
          viewCount: BigInt(30000),
          likeCount: BigInt(1500),
          commentCount: BigInt(150),
        },
        {
          id: "video-2",
          publishedAt: new Date("2024-01-15T18:00:00Z"),
          engagementRate: 6.0,
          viewCount: BigInt(35000),
          likeCount: BigInt(1750),
          commentCount: BigInt(175),
        },
        {
          id: "video-3",
          publishedAt: new Date("2024-01-22T18:00:00Z"),
          engagementRate: 5.5,
          viewCount: BigInt(32000),
          likeCount: BigInt(1600),
          commentCount: BigInt(160),
        },
      ];

      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.video.findMany).mockResolvedValue(mockVideos as any);

      const result =
        await PostingTimeOptimizerService.recommendPostingTimes("user-1");

      expect(result).not.toBeNull();
      expect(result!.topSlots.length).toBeGreaterThan(0);
    });

    it("should return null on error", async () => {
      vi.mocked(cacheService.get).mockRejectedValue(new Error("Cache error"));

      const result =
        await PostingTimeOptimizerService.recommendPostingTimes("user-1");

      expect(result).toBeNull();
    });

    it("should handle null engagement rates", async () => {
      const mockVideos = [
        {
          id: "video-1",
          publishedAt: new Date("2024-01-15T18:00:00Z"),
          engagementRate: null, // No engagement rate
          viewCount: BigInt(30000),
          likeCount: BigInt(1500),
          commentCount: BigInt(150),
        },
        {
          id: "video-2",
          publishedAt: new Date("2024-01-22T18:00:00Z"),
          engagementRate: null,
          viewCount: BigInt(35000),
          likeCount: BigInt(1750),
          commentCount: BigInt(175),
        },
      ];

      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.video.findMany).mockResolvedValue(mockVideos as any);

      const result =
        await PostingTimeOptimizerService.recommendPostingTimes("user-1");

      expect(result).not.toBeNull();
      expect(result!.topSlots[0].averageEngagementRate).toBeDefined();
    });

    it("should correctly group videos into 2-hour slots", async () => {
      const mockVideos = [
        {
          id: "video-1",
          publishedAt: new Date("2024-01-15T14:30:00Z"), // Monday 2:30 PM (in 2-4 PM slot)
          engagementRate: 5.0,
          viewCount: BigInt(30000),
          likeCount: BigInt(1500),
          commentCount: BigInt(150),
        },
        {
          id: "video-2",
          publishedAt: new Date("2024-01-22T15:45:00Z"), // Monday 3:45 PM (in 2-4 PM slot, different week)
          engagementRate: 6.0,
          viewCount: BigInt(35000),
          likeCount: BigInt(1750),
          commentCount: BigInt(175),
        },
      ];

      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.video.findMany).mockResolvedValue(mockVideos as any);

      const result =
        await PostingTimeOptimizerService.recommendPostingTimes("user-1");

      expect(result!.topSlots.length).toBeGreaterThan(0);
      expect(result!.topSlots[0]).toBeDefined();
      expect(result!.topSlots[0].hourRange).toMatch(/(\d+\s+(AM|PM|am|pm))/);
    });
  });
});
