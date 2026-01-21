/**
 * Viral Predictor Service Tests
 * Phase 3.1: Predictive Analytics - Viral Potential Score
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ViralPredictorService } from "../viral-predictor";
import { prisma } from "@/lib/prisma";
import { cacheService } from "@/lib/redis";
import BenchmarkService from "../benchmark";
import NicheDetector from "../niche-detector";
import { Platform, VideoNiche } from "@prisma/client";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    video: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/redis", () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock("../benchmark");
vi.mock("../niche-detector");

describe("ViralPredictorService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("calculateViralPotential", () => {
    it("should return cached result if available", async () => {
      const cachedResult = {
        score: 75,
        factors: {
          velocityScore: 80,
          sentimentScore: 70,
          commentVelocityScore: 75,
          likeRatioScore: 75,
        },
        explanation: "This video shows high viral potential.",
        prediction: "high_potential" as const,
      };

      vi.mocked(cacheService.get).mockResolvedValue(cachedResult);

      const result =
        await ViralPredictorService.calculateViralPotential("video-1");

      expect(result).toEqual(cachedResult);
      expect(cacheService.get).toHaveBeenCalledWith("viral:video-1");
      expect(cacheService.set).not.toHaveBeenCalled();
    });

    it("should return null if video not found", async () => {
      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.video.findUnique).mockResolvedValue(null);

      const result =
        await ViralPredictorService.calculateViralPotential("video-1");

      expect(result).toBeNull();
    });

    it("should calculate viral potential score for viral video", async () => {
      const mockVideo = {
        id: "video-1",
        title: "Amazing viral video",
        description: "This is a viral video",
        platform: Platform.YOUTUBE,
        videoId: "youtube-123",
        publishedAt: new Date("2024-01-15T10:00:00Z"),
        viewCount: BigInt(100000),
        likeCount: BigInt(5000),
        commentCount: BigInt(500),
        engagementRate: 5.5,
        niche: VideoNiche.TECH,
        analytics: [
          {
            id: "analytic-1",
            videoId: "video-1",
            recordedAt: new Date("2024-01-15T14:00:00Z"),
            viewCount: BigInt(100000),
            likeCount: BigInt(5000),
            commentCount: BigInt(500),
            positivePercent: 75,
            neutralPercent: 15,
            negativePercent: 10,
          },
          {
            id: "analytic-2",
            videoId: "video-1",
            recordedAt: new Date("2024-01-15T10:00:00Z"),
            viewCount: BigInt(50000),
            likeCount: BigInt(2000),
            commentCount: BigInt(200),
            positivePercent: 70,
            neutralPercent: 20,
            negativePercent: 10,
          },
        ],
        comments: [],
      };

      const mockBenchmark = {
        id: "bench-1",
        platform: Platform.YOUTUBE,
        niche: VideoNiche.TECH,
        avgViewCount: BigInt(20000),
        avgLikeCount: BigInt(800),
        avgCommentCount: BigInt(80),
        sentiment: { positivePercent: 60 },
        sampleSize: 100,
      };

      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.video.findUnique).mockResolvedValue(mockVideo as any);
      vi.mocked(BenchmarkService.getBenchmark).mockResolvedValue(
        mockBenchmark as any,
      );
      vi.mocked(NicheDetector.detect).mockReturnValue(VideoNiche.TECH);

      const result =
        await ViralPredictorService.calculateViralPotential("video-1");

      expect(result).not.toBeNull();
      expect(result!.score).toBeGreaterThanOrEqual(0);
      expect(result!.score).toBeLessThanOrEqual(100);
      expect(["high_potential", "viral"]).toContain(result!.prediction);
      expect(result!.factors.velocityScore).toBeGreaterThanOrEqual(0);
      expect(result!.factors.sentimentScore).toBeGreaterThanOrEqual(0);
      expect(result!.factors.commentVelocityScore).toBeGreaterThanOrEqual(0);
      expect(result!.factors.likeRatioScore).toBeGreaterThanOrEqual(0);
    });

    it("should predict viral for high score (>= 80)", async () => {
      const mockVideo = {
        id: "video-1",
        title: "Extremely viral video",
        description: "This is extremely viral",
        platform: Platform.YOUTUBE,
        videoId: "youtube-123",
        publishedAt: new Date("2024-01-15T10:00:00Z"),
        viewCount: BigInt(1000000),
        likeCount: BigInt(100000),
        commentCount: BigInt(50000),
        engagementRate: 15,
        niche: VideoNiche.TECH,
        analytics: [
          {
            id: "analytic-1",
            videoId: "video-1",
            recordedAt: new Date("2024-01-15T14:00:00Z"),
            viewCount: BigInt(1000000),
            likeCount: BigInt(100000),
            commentCount: BigInt(50000),
            positivePercent: 85,
            neutralPercent: 10,
            negativePercent: 5,
          },
          {
            id: "analytic-2",
            videoId: "video-1",
            recordedAt: new Date("2024-01-15T10:00:00Z"),
            viewCount: BigInt(100000),
            likeCount: BigInt(10000),
            commentCount: BigInt(5000),
            positivePercent: 80,
            neutralPercent: 15,
            negativePercent: 5,
          },
        ],
        comments: [],
      };

      const mockBenchmark = {
        id: "bench-1",
        platform: Platform.YOUTUBE,
        niche: VideoNiche.TECH,
        avgViewCount: BigInt(20000),
        avgLikeCount: BigInt(800),
        avgCommentCount: BigInt(80),
        sentiment: { positivePercent: 60 },
        sampleSize: 100,
      };

      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.video.findUnique).mockResolvedValue(mockVideo as any);
      vi.mocked(BenchmarkService.getBenchmark).mockResolvedValue(
        mockBenchmark as any,
      );
      vi.mocked(NicheDetector.detect).mockReturnValue(VideoNiche.TECH);

      const result =
        await ViralPredictorService.calculateViralPotential("video-1");

      expect(result!.score).toBeGreaterThanOrEqual(80);
      expect(result!.prediction).toBe("viral");
    });

    it("should return score and prediction for moderately good video", async () => {
      const mockVideo = {
        id: "video-1",
        title: "Good video",
        description: "Good content",
        platform: Platform.YOUTUBE,
        videoId: "youtube-123",
        publishedAt: new Date("2024-01-15T10:00:00Z"),
        viewCount: BigInt(90000),
        likeCount: BigInt(4050),
        commentCount: BigInt(360),
        engagementRate: 4.9,
        niche: VideoNiche.TECH,
        analytics: [
          {
            id: "analytic-1",
            videoId: "video-1",
            recordedAt: new Date("2024-01-15T14:00:00Z"),
            viewCount: BigInt(90000),
            likeCount: BigInt(4050),
            commentCount: BigInt(360),
            positivePercent: 66,
            neutralPercent: 24,
            negativePercent: 10,
          },
          {
            id: "analytic-2",
            videoId: "video-1",
            recordedAt: new Date("2024-01-15T10:00:00Z"),
            viewCount: BigInt(45000),
            likeCount: BigInt(2025),
            commentCount: BigInt(180),
            positivePercent: 61,
            neutralPercent: 29,
            negativePercent: 10,
          },
        ],
        comments: [],
      };

      const mockBenchmark = {
        id: "bench-1",
        platform: Platform.YOUTUBE,
        niche: VideoNiche.TECH,
        avgViewCount: BigInt(20000),
        avgLikeCount: BigInt(800),
        avgCommentCount: BigInt(80),
        sentiment: { positivePercent: 60 },
        sampleSize: 100,
      };

      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.video.findUnique).mockResolvedValue(mockVideo as any);
      vi.mocked(BenchmarkService.getBenchmark).mockResolvedValue(
        mockBenchmark as any,
      );
      vi.mocked(NicheDetector.detect).mockReturnValue(VideoNiche.TECH);

      const result =
        await ViralPredictorService.calculateViralPotential("video-1");

      expect(result!.score).toBeGreaterThan(50);
      expect(["high_potential", "viral"]).toContain(result!.prediction);
    });

    it("should return score and prediction for average video", async () => {
      const mockVideo = {
        id: "video-1",
        title: "Average video",
        description: "Average content",
        platform: Platform.YOUTUBE,
        videoId: "youtube-123",
        publishedAt: new Date("2024-01-15T10:00:00Z"),
        viewCount: BigInt(22000),
        likeCount: BigInt(660),
        commentCount: BigInt(66),
        engagementRate: 3.3,
        niche: VideoNiche.TECH,
        analytics: [
          {
            id: "analytic-1",
            videoId: "video-1",
            recordedAt: new Date("2024-01-15T14:00:00Z"),
            viewCount: BigInt(22000),
            likeCount: BigInt(660),
            commentCount: BigInt(66),
            positivePercent: 50,
            neutralPercent: 35,
            negativePercent: 15,
          },
          {
            id: "analytic-2",
            videoId: "video-1",
            recordedAt: new Date("2024-01-15T10:00:00Z"),
            viewCount: BigInt(11000),
            likeCount: BigInt(330),
            commentCount: BigInt(33),
            positivePercent: 46,
            neutralPercent: 39,
            negativePercent: 15,
          },
        ],
        comments: [],
      };

      const mockBenchmark = {
        id: "bench-1",
        platform: Platform.YOUTUBE,
        niche: VideoNiche.TECH,
        avgViewCount: BigInt(20000),
        avgLikeCount: BigInt(800),
        avgCommentCount: BigInt(80),
        sentiment: { positivePercent: 60 },
        sampleSize: 100,
      };

      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.video.findUnique).mockResolvedValue(mockVideo as any);
      vi.mocked(BenchmarkService.getBenchmark).mockResolvedValue(
        mockBenchmark as any,
      );
      vi.mocked(NicheDetector.detect).mockReturnValue(VideoNiche.TECH);

      const result =
        await ViralPredictorService.calculateViralPotential("video-1");

      expect(result!.score).toBeGreaterThan(20);
      expect(result!.score).toBeLessThan(100);
      expect(["low", "moderate", "high_potential", "viral"]).toContain(
        result!.prediction,
      );
    });

    it("should return score and prediction for below-average video", async () => {
      const mockVideo = {
        id: "video-1",
        title: "Poor video",
        description: "Poor content",
        platform: Platform.YOUTUBE,
        videoId: "youtube-123",
        publishedAt: new Date("2024-01-15T10:00:00Z"),
        viewCount: BigInt(12000),
        likeCount: BigInt(180),
        commentCount: BigInt(24),
        engagementRate: 1.7,
        niche: VideoNiche.TECH,
        analytics: [
          {
            id: "analytic-1",
            videoId: "video-1",
            recordedAt: new Date("2024-01-15T14:00:00Z"),
            viewCount: BigInt(12000),
            likeCount: BigInt(180),
            commentCount: BigInt(24),
            positivePercent: 25,
            neutralPercent: 55,
            negativePercent: 20,
          },
          {
            id: "analytic-2",
            videoId: "video-1",
            recordedAt: new Date("2024-01-15T10:00:00Z"),
            viewCount: BigInt(6000),
            likeCount: BigInt(90),
            commentCount: BigInt(12),
            positivePercent: 22,
            neutralPercent: 58,
            negativePercent: 20,
          },
        ],
        comments: [],
      };

      const mockBenchmark = {
        id: "bench-1",
        platform: Platform.YOUTUBE,
        niche: VideoNiche.TECH,
        avgViewCount: BigInt(20000),
        avgLikeCount: BigInt(800),
        avgCommentCount: BigInt(80),
        sentiment: { positivePercent: 60 },
        sampleSize: 100,
      };

      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.video.findUnique).mockResolvedValue(mockVideo as any);
      vi.mocked(BenchmarkService.getBenchmark).mockResolvedValue(
        mockBenchmark as any,
      );
      vi.mocked(NicheDetector.detect).mockReturnValue(VideoNiche.TECH);

      const result =
        await ViralPredictorService.calculateViralPotential("video-1");

      expect(result!.score).toBeDefined();
      expect(["low", "moderate", "high_potential", "viral"]).toContain(
        result!.prediction,
      );
    });

    it("should cache result for 1 hour", async () => {
      const mockVideo = {
        id: "video-1",
        title: "Test video",
        description: "Test content",
        platform: Platform.YOUTUBE,
        videoId: "youtube-123",
        publishedAt: new Date("2024-01-15T10:00:00Z"),
        viewCount: BigInt(50000),
        likeCount: BigInt(2000),
        commentCount: BigInt(200),
        engagementRate: 4.4,
        niche: VideoNiche.TECH,
        analytics: [
          {
            id: "analytic-1",
            videoId: "video-1",
            recordedAt: new Date("2024-01-15T14:00:00Z"),
            viewCount: BigInt(50000),
            likeCount: BigInt(2000),
            commentCount: BigInt(200),
            positivePercent: 55,
            neutralPercent: 30,
            negativePercent: 15,
          },
          {
            id: "analytic-2",
            videoId: "video-1",
            recordedAt: new Date("2024-01-15T10:00:00Z"),
            viewCount: BigInt(20000),
            likeCount: BigInt(800),
            commentCount: BigInt(80),
            positivePercent: 50,
            neutralPercent: 35,
            negativePercent: 15,
          },
        ],
        comments: [],
      };

      const mockBenchmark = {
        id: "bench-1",
        platform: Platform.YOUTUBE,
        niche: VideoNiche.TECH,
        avgViewCount: BigInt(20000),
        avgLikeCount: BigInt(800),
        avgCommentCount: BigInt(80),
        sentiment: { positivePercent: 60 },
        sampleSize: 100,
      };

      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.video.findUnique).mockResolvedValue(mockVideo as any);
      vi.mocked(BenchmarkService.getBenchmark).mockResolvedValue(
        mockBenchmark as any,
      );
      vi.mocked(NicheDetector.detect).mockReturnValue(VideoNiche.TECH);

      await ViralPredictorService.calculateViralPotential("video-1");

      expect(cacheService.set).toHaveBeenCalledWith(
        "viral:video-1",
        expect.any(Object),
        3600,
      );
    });

    it("should use provided niche instead of detecting", async () => {
      const mockVideo = {
        id: "video-1",
        title: "Test video",
        description: "Test content",
        platform: Platform.YOUTUBE,
        videoId: "youtube-123",
        publishedAt: new Date("2024-01-15T10:00:00Z"),
        viewCount: BigInt(50000),
        likeCount: BigInt(2000),
        commentCount: BigInt(200),
        engagementRate: 4.4,
        niche: VideoNiche.TECH,
        analytics: [
          {
            id: "analytic-1",
            videoId: "video-1",
            recordedAt: new Date("2024-01-15T14:00:00Z"),
            viewCount: BigInt(50000),
            likeCount: BigInt(2000),
            commentCount: BigInt(200),
            positivePercent: 55,
            neutralPercent: 30,
            negativePercent: 15,
          },
          {
            id: "analytic-2",
            videoId: "video-1",
            recordedAt: new Date("2024-01-15T10:00:00Z"),
            viewCount: BigInt(20000),
            likeCount: BigInt(800),
            commentCount: BigInt(80),
            positivePercent: 50,
            neutralPercent: 35,
            negativePercent: 15,
          },
        ],
        comments: [],
      };

      const mockBenchmark = {
        id: "bench-1",
        platform: Platform.YOUTUBE,
        niche: VideoNiche.GAMING,
        avgViewCount: BigInt(20000),
        avgLikeCount: BigInt(800),
        avgCommentCount: BigInt(80),
        sentiment: { positivePercent: 60 },
        sampleSize: 100,
      };

      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.video.findUnique).mockResolvedValue(mockVideo as any);
      vi.mocked(BenchmarkService.getBenchmark).mockResolvedValue(
        mockBenchmark as any,
      );

      await ViralPredictorService.calculateViralPotential("video-1", "GAMING");

      expect(NicheDetector.detect).not.toHaveBeenCalled();
      expect(BenchmarkService.getBenchmark).toHaveBeenCalledWith(
        Platform.YOUTUBE,
        "GAMING",
      );
    });

    it("should return null on error", async () => {
      vi.mocked(cacheService.get).mockRejectedValue(new Error("Cache error"));

      const result =
        await ViralPredictorService.calculateViralPotential("video-1");

      expect(result).toBeNull();
    });

    it("should handle insufficient analytics data", async () => {
      const mockVideo = {
        id: "video-1",
        title: "Test video",
        description: "Test content",
        platform: Platform.YOUTUBE,
        videoId: "youtube-123",
        publishedAt: new Date("2024-01-15T10:00:00Z"),
        viewCount: BigInt(1000),
        likeCount: BigInt(50),
        commentCount: BigInt(5),
        engagementRate: 5.5,
        niche: VideoNiche.TECH,
        analytics: [], // Empty analytics
        comments: [],
      };

      const mockBenchmark = {
        id: "bench-1",
        platform: Platform.YOUTUBE,
        niche: VideoNiche.TECH,
        avgViewCount: BigInt(20000),
        avgLikeCount: BigInt(800),
        avgCommentCount: BigInt(80),
        sentiment: { positivePercent: 60 },
        sampleSize: 100,
      };

      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.video.findUnique).mockResolvedValue(mockVideo as any);
      vi.mocked(BenchmarkService.getBenchmark).mockResolvedValue(
        mockBenchmark as any,
      );
      vi.mocked(NicheDetector.detect).mockReturnValue(VideoNiche.TECH);

      const result =
        await ViralPredictorService.calculateViralPotential("video-1");

      expect(result).not.toBeNull();
      expect(result!.factors.velocityScore).toBe(50); // Neutral score for insufficient data
    });

    it("should generate meaningful explanation", async () => {
      const mockVideo = {
        id: "video-1",
        title: "Test video",
        description: "Test content",
        platform: Platform.YOUTUBE,
        videoId: "youtube-123",
        publishedAt: new Date("2024-01-15T10:00:00Z"),
        viewCount: BigInt(100000),
        likeCount: BigInt(5000),
        commentCount: BigInt(500),
        engagementRate: 5.5,
        niche: VideoNiche.TECH,
        analytics: [
          {
            id: "analytic-1",
            videoId: "video-1",
            recordedAt: new Date("2024-01-15T14:00:00Z"),
            viewCount: BigInt(100000),
            likeCount: BigInt(5000),
            commentCount: BigInt(500),
            positivePercent: 75,
            neutralPercent: 15,
            negativePercent: 10,
          },
          {
            id: "analytic-2",
            videoId: "video-1",
            recordedAt: new Date("2024-01-15T10:00:00Z"),
            viewCount: BigInt(50000),
            likeCount: BigInt(2000),
            commentCount: BigInt(200),
            positivePercent: 70,
            neutralPercent: 20,
            negativePercent: 10,
          },
        ],
        comments: [],
      };

      const mockBenchmark = {
        id: "bench-1",
        platform: Platform.YOUTUBE,
        niche: VideoNiche.TECH,
        avgViewCount: BigInt(20000),
        avgLikeCount: BigInt(800),
        avgCommentCount: BigInt(80),
        sentiment: { positivePercent: 60 },
        sampleSize: 100,
      };

      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(prisma.video.findUnique).mockResolvedValue(mockVideo as any);
      vi.mocked(BenchmarkService.getBenchmark).mockResolvedValue(
        mockBenchmark as any,
      );
      vi.mocked(NicheDetector.detect).mockReturnValue(VideoNiche.TECH);

      const result =
        await ViralPredictorService.calculateViralPotential("video-1");

      expect(result!.explanation).toBeTruthy();
      expect(result!.explanation).toContain("viral");
    });
  });
});
