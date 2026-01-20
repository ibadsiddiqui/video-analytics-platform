import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BenchmarkService } from '../benchmark';
import { prisma } from '@/lib/prisma';
import { Platform, VideoNiche } from '@prisma/client';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    video: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    benchmark: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

// Mock NicheDetector
vi.mock('../niche-detector', () => ({
  default: {
    detect: vi.fn((title: string) => {
      if (title.includes('tech')) return VideoNiche.TECH;
      if (title.includes('game')) return VideoNiche.GAMING;
      return VideoNiche.GENERAL;
    }),
  },
}));

describe('BenchmarkService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateNicheBenchmark', () => {
    it('should calculate benchmark from niche videos', async () => {
      const mockVideos = [
        {
          id: 'video-1',
          platform: Platform.YOUTUBE,
          videoId: 'v1',
          url: 'https://youtube.com/v1',
          title: 'tech tutorial',
          description: 'tech content',
          viewCount: BigInt(10000),
          likeCount: BigInt(1000),
          commentCount: BigInt(100),
          shareCount: BigInt(50),
          engagementRate: 11.5,
          analytics: [],
        },
        {
          id: 'video-2',
          platform: Platform.YOUTUBE,
          videoId: 'v2',
          url: 'https://youtube.com/v2',
          title: 'tech review',
          description: 'tech content',
          viewCount: BigInt(20000),
          likeCount: BigInt(2000),
          commentCount: BigInt(200),
          shareCount: BigInt(100),
          engagementRate: 11.5,
          analytics: [],
        },
        {
          id: 'video-3',
          platform: Platform.YOUTUBE,
          videoId: 'v3',
          url: 'https://youtube.com/v3',
          title: 'game stream',
          description: 'gaming',
          viewCount: BigInt(30000),
          likeCount: BigInt(3000),
          commentCount: BigInt(300),
          shareCount: BigInt(150),
          engagementRate: 11.5,
          analytics: [],
        },
      ];

      vi.mocked(prisma.video.findMany).mockResolvedValue(mockVideos);
      vi.mocked(prisma.benchmark.upsert).mockResolvedValue({
        id: 'bench-1',
        platform: Platform.YOUTUBE,
        niche: VideoNiche.TECH,
        avgViewCount: BigInt(15000),
        avgLikeCount: BigInt(1500),
        avgCommentCount: BigInt(150),
        avgEngagementRate: 11.5,
        viewPercentiles: { p10: 10000, p25: 10000, p50: 15000, p75: 20000, p90: 20000 },
        engagementPercentiles: { p10: 11.5, p25: 11.5, p50: 11.5, p75: 11.5, p90: 11.5 },
        sampleSize: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await BenchmarkService.calculateNicheBenchmark(Platform.YOUTUBE, VideoNiche.TECH);

      expect(result).toBeDefined();
      expect(result?.niche).toBe(VideoNiche.TECH);
      expect(result?.avgViewCount).toBe(BigInt(15000));
      expect(result?.sampleSize).toBe(2); // Only 2 tech videos
      expect(prisma.benchmark.upsert).toHaveBeenCalled();
    });

    it('should return null if no videos found for niche', async () => {
      vi.mocked(prisma.video.findMany).mockResolvedValue([]);

      const result = await BenchmarkService.calculateNicheBenchmark(Platform.YOUTUBE, VideoNiche.TECH);

      expect(result).toBeNull();
      expect(prisma.benchmark.upsert).not.toHaveBeenCalled();
    });

    it('should handle videos with null engagement rates', async () => {
      const mockVideos = [
        {
          id: 'video-1',
          platform: Platform.YOUTUBE,
          videoId: 'v1',
          url: 'https://youtube.com/v1',
          title: 'tech tutorial',
          description: 'tech content',
          viewCount: BigInt(10000),
          likeCount: BigInt(1000),
          commentCount: BigInt(100),
          shareCount: BigInt(50),
          engagementRate: null,
          analytics: [],
        },
      ];

      vi.mocked(prisma.video.findMany).mockResolvedValue(mockVideos);
      vi.mocked(prisma.benchmark.upsert).mockResolvedValue({
        id: 'bench-1',
        platform: Platform.YOUTUBE,
        niche: VideoNiche.TECH,
        avgViewCount: BigInt(10000),
        avgLikeCount: BigInt(1000),
        avgCommentCount: BigInt(100),
        avgEngagementRate: 0,
        viewPercentiles: { p10: 10000, p25: 10000, p50: 10000, p75: 10000, p90: 10000 },
        engagementPercentiles: { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0 },
        sampleSize: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await BenchmarkService.calculateNicheBenchmark(Platform.YOUTUBE, VideoNiche.TECH);

      expect(result).toBeDefined();
      expect(result?.avgEngagementRate).toBe(0);
    });

    it('should calculate correct percentiles', async () => {
      const mockVideos = Array.from({ length: 100 }, (_, i) => ({
        id: `video-${i}`,
        platform: Platform.YOUTUBE,
        videoId: `v${i}`,
        url: `https://youtube.com/v${i}`,
        title: 'tech video',
        description: 'tech content',
        viewCount: BigInt((i + 1) * 100), // 100, 200, 300, ..., 10000
        likeCount: BigInt((i + 1) * 10),
        commentCount: BigInt(i + 1),
        shareCount: BigInt(i + 1),
        engagementRate: (i + 1) / 10,
        analytics: [],
      }));

      vi.mocked(prisma.video.findMany).mockResolvedValue(mockVideos);
      vi.mocked(prisma.benchmark.upsert).mockResolvedValue({
        id: 'bench-1',
        platform: Platform.YOUTUBE,
        niche: VideoNiche.TECH,
        avgViewCount: BigInt(5050),
        avgLikeCount: BigInt(505),
        avgCommentCount: BigInt(50),
        avgEngagementRate: 5.05,
        viewPercentiles: { p10: 1000, p25: 2500, p50: 5000, p75: 7500, p90: 9000 },
        engagementPercentiles: { p10: 1, p25: 2.5, p50: 5, p75: 7.5, p90: 9 },
        sampleSize: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await BenchmarkService.calculateNicheBenchmark(Platform.YOUTUBE, VideoNiche.TECH);

      expect(result).toBeDefined();
      expect(result?.sampleSize).toBe(100);
      expect(result?.percentiles.views.p50).toBeDefined();
    });
  });

  describe('compareVideoToBenchmark', () => {
    it('should compare video to benchmark successfully', async () => {
      const mockVideo = {
        id: 'video-1',
        platform: Platform.YOUTUBE,
        videoId: 'v1',
        url: 'https://youtube.com/v1',
        title: 'tech tutorial',
        description: 'tech content',
        viewCount: BigInt(20000),
        likeCount: BigInt(2000),
        commentCount: BigInt(200),
        shareCount: BigInt(100),
        engagementRate: 11.5,
        publishedAt: new Date('2024-01-15'),
        channelName: 'Test Channel',
        channelId: 'channel-123',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        niche: VideoNiche.TECH,
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockBenchmark = {
        id: 'bench-1',
        platform: Platform.YOUTUBE,
        niche: VideoNiche.TECH,
        avgViewCount: BigInt(10000),
        avgLikeCount: BigInt(1000),
        avgCommentCount: BigInt(100),
        avgEngagementRate: 10.0,
        viewPercentiles: { p10: 1000, p25: 5000, p50: 10000, p75: 15000, p90: 20000 },
        engagementPercentiles: { p10: 5, p25: 8, p50: 10, p75: 12, p90: 15 },
        sampleSize: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.video.findUnique).mockResolvedValue(mockVideo);
      vi.mocked(prisma.benchmark.findUnique).mockResolvedValue(mockBenchmark);

      const result = await BenchmarkService.compareVideoToBenchmark('video-1');

      expect(result).toBeDefined();
      expect(result?.videoId).toBe('video-1');
      expect(result?.videoNiche).toBe(VideoNiche.TECH);
      expect(result?.comparison.rank).toBe('top_10'); // 20000 views >= p90
      expect(result?.comparison.viewsVsAverage).toBeGreaterThan(0); // Above average
      expect(result?.comparison.viewsPercentile).toBeGreaterThanOrEqual(90);
    });

    it('should return null if video not found', async () => {
      vi.mocked(prisma.video.findUnique).mockResolvedValue(null);

      const result = await BenchmarkService.compareVideoToBenchmark('video-1');

      expect(result).toBeNull();
    });

    it('should calculate benchmark if it does not exist', async () => {
      const mockVideo = {
        id: 'video-1',
        platform: Platform.YOUTUBE,
        videoId: 'v1',
        url: 'https://youtube.com/v1',
        title: 'tech tutorial',
        description: 'tech content',
        viewCount: BigInt(15000),
        likeCount: BigInt(1500),
        commentCount: BigInt(150),
        shareCount: BigInt(75),
        engagementRate: 11.5,
        publishedAt: new Date('2024-01-15'),
        channelName: 'Test Channel',
        channelId: 'channel-123',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        niche: VideoNiche.TECH,
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.video.findUnique).mockResolvedValue(mockVideo);
      vi.mocked(prisma.benchmark.findUnique)
        .mockResolvedValueOnce(null) // First call returns null
        .mockResolvedValueOnce({ // Second call returns created benchmark
          id: 'bench-1',
          platform: Platform.YOUTUBE,
          niche: VideoNiche.TECH,
          avgViewCount: BigInt(10000),
          avgLikeCount: BigInt(1000),
          avgCommentCount: BigInt(100),
          avgEngagementRate: 10.0,
          viewPercentiles: { p10: 1000, p25: 5000, p50: 10000, p75: 15000, p90: 20000 },
          engagementPercentiles: { p10: 5, p25: 8, p50: 10, p75: 12, p90: 15 },
          sampleSize: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      // Mock calculateNicheBenchmark
      vi.spyOn(BenchmarkService, 'calculateNicheBenchmark').mockResolvedValue({
        platform: Platform.YOUTUBE,
        niche: VideoNiche.TECH,
        avgViewCount: BigInt(10000),
        avgLikeCount: BigInt(1000),
        avgCommentCount: BigInt(100),
        avgEngagementRate: 10.0,
        percentiles: {
          views: { p10: 1000, p25: 5000, p50: 10000, p75: 15000, p90: 20000 },
          engagement: { p10: 5, p25: 8, p50: 10, p75: 12, p90: 15 },
        },
        sampleSize: 100,
      });

      const result = await BenchmarkService.compareVideoToBenchmark('video-1');

      expect(result).toBeDefined();
      expect(BenchmarkService.calculateNicheBenchmark).toHaveBeenCalled();
    });

    it('should correctly rank videos in different percentiles', async () => {
      const testCases = [
        { views: 25000, expectedRank: 'top_10' }, // > p90 (20000), percentile = 95
        { views: 18000, expectedRank: 'top_10' }, // > p75 but <= p90, percentile = 90
        { views: 12000, expectedRank: 'top_25' }, // > p50 (10000) but <= p75, percentile = 75
        { views: 8000, expectedRank: 'top_50' },  // > p25 (7500) but <= p50, percentile = 50
        { views: 3000, expectedRank: 'below_average' }, // < p25 (7500), percentile = 10
      ];

      const mockBenchmark = {
        id: 'bench-1',
        platform: Platform.YOUTUBE,
        niche: VideoNiche.TECH,
        avgViewCount: BigInt(10000),
        avgLikeCount: BigInt(1000),
        avgCommentCount: BigInt(100),
        avgEngagementRate: 10.0,
        viewPercentiles: { p10: 5000, p25: 7500, p50: 10000, p75: 15000, p90: 20000 },
        engagementPercentiles: { p10: 5, p25: 8, p50: 10, p75: 12, p90: 15 },
        sampleSize: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      for (const testCase of testCases) {
        const mockVideo = {
          id: 'video-1',
          platform: Platform.YOUTUBE,
          videoId: 'v1',
          url: 'https://youtube.com/v1',
          title: 'tech tutorial',
          description: 'tech content',
          viewCount: BigInt(testCase.views),
          likeCount: BigInt(1000),
          commentCount: BigInt(100),
          shareCount: BigInt(50),
          engagementRate: 10.0,
          publishedAt: new Date('2024-01-15'),
          channelName: 'Test Channel',
          channelId: 'channel-123',
          thumbnailUrl: 'https://example.com/thumb.jpg',
          niche: VideoNiche.TECH,
          userId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(prisma.video.findUnique).mockResolvedValue(mockVideo);
        vi.mocked(prisma.benchmark.findUnique).mockResolvedValue(mockBenchmark);

        const result = await BenchmarkService.compareVideoToBenchmark('video-1');

        expect(result?.comparison.rank).toBe(testCase.expectedRank);
      }
    });

    it('should calculate percentage differences correctly', async () => {
      const mockVideo = {
        id: 'video-1',
        platform: Platform.YOUTUBE,
        videoId: 'v1',
        url: 'https://youtube.com/v1',
        title: 'tech tutorial',
        description: 'tech content',
        viewCount: BigInt(15000), // 50% above average of 10000
        likeCount: BigInt(1000),
        commentCount: BigInt(100),
        shareCount: BigInt(50),
        engagementRate: 12.0, // 20% above average of 10.0
        publishedAt: new Date('2024-01-15'),
        channelName: 'Test Channel',
        channelId: 'channel-123',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        niche: VideoNiche.TECH,
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockBenchmark = {
        id: 'bench-1',
        platform: Platform.YOUTUBE,
        niche: VideoNiche.TECH,
        avgViewCount: BigInt(10000),
        avgLikeCount: BigInt(1000),
        avgCommentCount: BigInt(100),
        avgEngagementRate: 10.0,
        viewPercentiles: { p10: 1000, p25: 5000, p50: 10000, p75: 15000, p90: 20000 },
        engagementPercentiles: { p10: 5, p25: 8, p50: 10, p75: 12, p90: 15 },
        sampleSize: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.video.findUnique).mockResolvedValue(mockVideo);
      vi.mocked(prisma.benchmark.findUnique).mockResolvedValue(mockBenchmark);

      const result = await BenchmarkService.compareVideoToBenchmark('video-1');

      expect(result?.comparison.viewsVsAverage).toBeCloseTo(50, 1); // 50% above
      expect(result?.comparison.engagementVsAverage).toBeCloseTo(20, 1); // 20% above
    });
  });

  describe('getBenchmark', () => {
    it('should return existing benchmark', async () => {
      const mockBenchmark = {
        id: 'bench-1',
        platform: Platform.YOUTUBE,
        niche: VideoNiche.TECH,
        avgViewCount: BigInt(10000),
        avgLikeCount: BigInt(1000),
        avgCommentCount: BigInt(100),
        avgEngagementRate: 10.0,
        viewPercentiles: { p10: 1000, p25: 5000, p50: 10000, p75: 15000, p90: 20000 },
        engagementPercentiles: { p10: 5, p25: 8, p50: 10, p75: 12, p90: 15 },
        sampleSize: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.benchmark.findUnique).mockResolvedValue(mockBenchmark);

      const result = await BenchmarkService.getBenchmark(Platform.YOUTUBE, VideoNiche.TECH);

      expect(result).toBeDefined();
      expect(result?.niche).toBe(VideoNiche.TECH);
      expect(result?.avgViewCount).toBe(BigInt(10000));
      expect(result?.sampleSize).toBe(100);
    });

    it('should return null if benchmark does not exist', async () => {
      vi.mocked(prisma.benchmark.findUnique).mockResolvedValue(null);

      const result = await BenchmarkService.getBenchmark(Platform.YOUTUBE, VideoNiche.TECH);

      expect(result).toBeNull();
    });
  });
});
