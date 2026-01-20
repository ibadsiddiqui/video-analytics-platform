import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CompetitorService } from '../competitor';
import { prisma } from '@/lib/prisma';
import { Platform, VideoNiche } from '@prisma/client';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    competitorTrack: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    competitorSnapshot: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

// Mock NicheDetector
vi.mock('../niche-detector', () => ({
  default: {
    detect: vi.fn(() => VideoNiche.TECH),
  },
}));

// Mock fetch for YouTube API
global.fetch = vi.fn();

describe('CompetitorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.YOUTUBE_API_KEY = 'test-youtube-key';
  });

  describe('addCompetitor', () => {
    const mockMetrics = {
      subscriberCount: BigInt(100000),
      videoCount: 50,
      totalViews: BigInt(5000000),
      avgEngagement: 100,
    };

    beforeEach(() => {
      // Mock YouTube API response
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [
            {
              statistics: {
                subscriberCount: '100000',
                videoCount: '50',
                viewCount: '5000000',
              },
            },
          ],
        }),
      } as Response);
    });

    it('should successfully add a new competitor', async () => {
      vi.mocked(prisma.competitorTrack.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.competitorTrack.create).mockResolvedValue({
        id: 'comp-1',
        userId: 'user-1',
        platform: Platform.YOUTUBE,
        channelId: 'channel-123',
        channelName: 'Test Channel',
        channelUrl: 'https://youtube.com/@testchannel',
        thumbnailUrl: null,
        niche: VideoNiche.TECH,
        subscriberCount: mockMetrics.subscriberCount,
        videoCount: mockMetrics.videoCount,
        totalViews: mockMetrics.totalViews,
        avgEngagement: mockMetrics.avgEngagement,
        isActive: true,
        firstTrackedAt: new Date('2024-01-15'),
        lastCheckedAt: new Date('2024-01-15'),
        lastFetchedAt: null,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      });
      vi.mocked(prisma.competitorSnapshot.create).mockResolvedValue({
        id: 'snap-1',
        competitorId: 'comp-1',
        subscriberCount: mockMetrics.subscriberCount,
        videoCount: mockMetrics.videoCount,
        totalViews: mockMetrics.totalViews,
        avgEngagement: mockMetrics.avgEngagement,
        recordedAt: new Date('2024-01-15'),
        createdAt: new Date('2024-01-15'),
      });

      const result = await CompetitorService.addCompetitor(
        'user-1',
        Platform.YOUTUBE,
        'channel-123',
        'Test Channel',
        'https://youtube.com/@testchannel'
      );

      expect(result).toBeDefined();
      expect(result?.channelName).toBe('Test Channel');
      expect(result?.metrics.subscriberCount).toBe(mockMetrics.subscriberCount);
      expect(result?.niche).toBe(VideoNiche.TECH);
      expect(prisma.competitorTrack.create).toHaveBeenCalled();
      expect(prisma.competitorSnapshot.create).toHaveBeenCalled();
    });

    it('should throw error if competitor already exists and is active', async () => {
      vi.mocked(prisma.competitorTrack.findFirst).mockResolvedValue({
        id: 'comp-1',
        userId: 'user-1',
        platform: Platform.YOUTUBE,
        channelId: 'channel-123',
        channelName: 'Test Channel',
        channelUrl: 'https://youtube.com/@testchannel',
        thumbnailUrl: null,
        niche: VideoNiche.TECH,
        subscriberCount: BigInt(100000),
        videoCount: 50,
        totalViews: BigInt(5000000),
        avgEngagement: 100,
        isActive: true,
        firstTrackedAt: new Date('2024-01-15'),
        lastCheckedAt: new Date('2024-01-15'),
        lastFetchedAt: null,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      });

      await expect(
        CompetitorService.addCompetitor(
          'user-1',
          Platform.YOUTUBE,
          'channel-123',
          'Test Channel',
          'https://youtube.com/@testchannel'
        )
      ).rejects.toThrow('Competitor already being tracked');
    });

    it('should reactivate if competitor exists but is inactive', async () => {
      vi.mocked(prisma.competitorTrack.findFirst).mockResolvedValue({
        id: 'comp-1',
        userId: 'user-1',
        platform: Platform.YOUTUBE,
        channelId: 'channel-123',
        channelName: 'Test Channel',
        channelUrl: 'https://youtube.com/@testchannel',
        thumbnailUrl: null,
        niche: VideoNiche.TECH,
        subscriberCount: BigInt(100000),
        videoCount: 50,
        totalViews: BigInt(5000000),
        avgEngagement: 100,
        isActive: false,
        firstTrackedAt: new Date('2024-01-15'),
        lastCheckedAt: new Date('2024-01-15'),
        lastFetchedAt: null,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      });

      vi.mocked(prisma.competitorTrack.update).mockResolvedValue({
        id: 'comp-1',
        userId: 'user-1',
        platform: Platform.YOUTUBE,
        channelId: 'channel-123',
        channelName: 'Test Channel',
        channelUrl: 'https://youtube.com/@testchannel',
        thumbnailUrl: null,
        niche: VideoNiche.TECH,
        subscriberCount: mockMetrics.subscriberCount,
        videoCount: mockMetrics.videoCount,
        totalViews: mockMetrics.totalViews,
        avgEngagement: mockMetrics.avgEngagement,
        isActive: true,
        firstTrackedAt: new Date('2024-01-15'),
        lastCheckedAt: new Date(),
        lastFetchedAt: null,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
      });

      const result = await CompetitorService.addCompetitor(
        'user-1',
        Platform.YOUTUBE,
        'channel-123',
        'Test Channel',
        'https://youtube.com/@testchannel'
      );

      expect(result).toBeDefined();
      expect(prisma.competitorTrack.update).toHaveBeenCalledWith({
        where: { id: 'comp-1' },
        data: {
          isActive: true,
          lastCheckedAt: expect.any(Date),
        },
      });
    });

    it('should throw error if YouTube API call fails', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
      } as Response);

      vi.mocked(prisma.competitorTrack.findFirst).mockResolvedValue(null);

      await expect(
        CompetitorService.addCompetitor(
          'user-1',
          Platform.YOUTUBE,
          'channel-123',
          'Test Channel',
          'https://youtube.com/@testchannel'
        )
      ).rejects.toThrow();
    });

    it('should throw error if YouTube API key is missing', async () => {
      delete process.env.YOUTUBE_API_KEY;

      vi.mocked(prisma.competitorTrack.findFirst).mockResolvedValue(null);

      await expect(
        CompetitorService.addCompetitor(
          'user-1',
          Platform.YOUTUBE,
          'channel-123',
          'Test Channel',
          'https://youtube.com/@testchannel'
        )
      ).rejects.toThrow('Failed to fetch channel metrics');
    });
  });

  describe('removeCompetitor', () => {
    it('should successfully remove (soft delete) a competitor', async () => {
      vi.mocked(prisma.competitorTrack.findFirst).mockResolvedValue({
        id: 'comp-1',
        userId: 'user-1',
        platform: Platform.YOUTUBE,
        channelId: 'channel-123',
        channelName: 'Test Channel',
        channelUrl: 'https://youtube.com/@testchannel',
        thumbnailUrl: null,
        niche: VideoNiche.TECH,
        subscriberCount: BigInt(100000),
        videoCount: 50,
        totalViews: BigInt(5000000),
        avgEngagement: 100,
        isActive: true,
        firstTrackedAt: new Date('2024-01-15'),
        lastCheckedAt: new Date('2024-01-15'),
        lastFetchedAt: null,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      });

      vi.mocked(prisma.competitorTrack.update).mockResolvedValue({
        id: 'comp-1',
        userId: 'user-1',
        platform: Platform.YOUTUBE,
        channelId: 'channel-123',
        channelName: 'Test Channel',
        channelUrl: 'https://youtube.com/@testchannel',
        thumbnailUrl: null,
        niche: VideoNiche.TECH,
        subscriberCount: BigInt(100000),
        videoCount: 50,
        totalViews: BigInt(5000000),
        avgEngagement: 100,
        isActive: false,
        firstTrackedAt: new Date('2024-01-15'),
        lastCheckedAt: new Date('2024-01-15'),
        lastFetchedAt: null,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
      });

      const result = await CompetitorService.removeCompetitor('user-1', 'comp-1');

      expect(result).toBe(true);
      expect(prisma.competitorTrack.update).toHaveBeenCalledWith({
        where: { id: 'comp-1' },
        data: { isActive: false },
      });
    });

    it('should throw error if competitor not found', async () => {
      vi.mocked(prisma.competitorTrack.findFirst).mockResolvedValue(null);

      await expect(
        CompetitorService.removeCompetitor('user-1', 'comp-1')
      ).rejects.toThrow('Competitor not found');
    });

    it('should throw error if user does not own competitor', async () => {
      vi.mocked(prisma.competitorTrack.findFirst).mockResolvedValue(null);

      await expect(
        CompetitorService.removeCompetitor('user-2', 'comp-1')
      ).rejects.toThrow('Competitor not found');
    });
  });

  describe('getCompetitors', () => {
    it('should return all active competitors for user', async () => {
      const mockCompetitors = [
        {
          id: 'comp-1',
          userId: 'user-1',
          platform: Platform.YOUTUBE,
          channelId: 'channel-123',
          channelName: 'Test Channel 1',
          channelUrl: 'https://youtube.com/@test1',
          thumbnailUrl: null,
          niche: VideoNiche.TECH,
          subscriberCount: BigInt(100000),
          videoCount: 50,
          totalViews: BigInt(5000000),
          avgEngagement: 100,
          isActive: true,
          firstTrackedAt: new Date('2024-01-15'),
          lastCheckedAt: new Date('2024-01-15'),
          lastFetchedAt: null,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
        },
        {
          id: 'comp-2',
          userId: 'user-1',
          platform: Platform.YOUTUBE,
          channelId: 'channel-456',
          channelName: 'Test Channel 2',
          channelUrl: 'https://youtube.com/@test2',
          thumbnailUrl: null,
          niche: VideoNiche.GAMING,
          subscriberCount: BigInt(200000),
          videoCount: 100,
          totalViews: BigInt(10000000),
          avgEngagement: 200,
          isActive: true,
          firstTrackedAt: new Date('2024-01-14'),
          lastCheckedAt: new Date('2024-01-15'),
          lastFetchedAt: null,
          createdAt: new Date('2024-01-14'),
          updatedAt: new Date('2024-01-15'),
        },
      ];

      vi.mocked(prisma.competitorTrack.findMany).mockResolvedValue(mockCompetitors);

      const result = await CompetitorService.getCompetitors('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].channelName).toBe('Test Channel 1');
      expect(result[1].channelName).toBe('Test Channel 2');
      expect(prisma.competitorTrack.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          isActive: true,
        },
        orderBy: { lastCheckedAt: 'desc' },
      });
    });

    it('should return empty array if no competitors', async () => {
      vi.mocked(prisma.competitorTrack.findMany).mockResolvedValue([]);

      const result = await CompetitorService.getCompetitors('user-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('getCompetitorWithHistory', () => {
    it('should return competitor with historical snapshots', async () => {
      const mockCompetitor = {
        id: 'comp-1',
        userId: 'user-1',
        platform: Platform.YOUTUBE,
        channelId: 'channel-123',
        channelName: 'Test Channel',
        channelUrl: 'https://youtube.com/@test',
        thumbnailUrl: null,
        niche: VideoNiche.TECH,
        subscriberCount: BigInt(100000),
        videoCount: 50,
        totalViews: BigInt(5000000),
        avgEngagement: 100,
        isActive: true,
        firstTrackedAt: new Date('2024-01-01'),
        lastCheckedAt: new Date('2024-01-15'),
        lastFetchedAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      };

      const mockSnapshots = [
        {
          id: 'snap-1',
          competitorId: 'comp-1',
          subscriberCount: BigInt(90000),
          videoCount: 45,
          totalViews: BigInt(4500000),
          avgEngagement: 95,
          recordedAt: new Date('2024-01-01'),
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'snap-2',
          competitorId: 'comp-1',
          subscriberCount: BigInt(100000),
          videoCount: 50,
          totalViews: BigInt(5000000),
          avgEngagement: 100,
          recordedAt: new Date('2024-01-15'),
          createdAt: new Date('2024-01-15'),
        },
      ];

      vi.mocked(prisma.competitorTrack.findFirst).mockResolvedValue(mockCompetitor);
      vi.mocked(prisma.competitorSnapshot.findMany).mockResolvedValue(mockSnapshots);

      const result = await CompetitorService.getCompetitorWithHistory('user-1', 'comp-1', 30);

      expect(result).toBeDefined();
      expect(result.channelName).toBe('Test Channel');
      expect(result.history).toHaveLength(2);
      expect(result.history[0].subscriberCount).toBe(BigInt(90000));
      expect(result.history[1].subscriberCount).toBe(BigInt(100000));
    });

    it('should throw error if competitor not found', async () => {
      vi.mocked(prisma.competitorTrack.findFirst).mockResolvedValue(null);

      await expect(
        CompetitorService.getCompetitorWithHistory('user-1', 'comp-1')
      ).rejects.toThrow('Competitor not found');
    });
  });

  describe('updateCompetitorMetrics', () => {
    it('should successfully update competitor metrics', async () => {
      const mockCompetitor = {
        id: 'comp-1',
        userId: 'user-1',
        platform: Platform.YOUTUBE,
        channelId: 'channel-123',
        channelName: 'Test Channel',
        channelUrl: 'https://youtube.com/@test',
        thumbnailUrl: null,
        niche: VideoNiche.TECH,
        subscriberCount: BigInt(100000),
        videoCount: 50,
        totalViews: BigInt(5000000),
        avgEngagement: 100,
        isActive: true,
        firstTrackedAt: new Date('2024-01-01'),
        lastCheckedAt: new Date('2024-01-15'),
        lastFetchedAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      };

      vi.mocked(prisma.competitorTrack.findUnique).mockResolvedValue(mockCompetitor);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [
            {
              statistics: {
                subscriberCount: '110000',
                videoCount: '55',
                viewCount: '5500000',
              },
            },
          ],
        }),
      } as Response);
      vi.mocked(prisma.competitorTrack.update).mockResolvedValue(mockCompetitor);
      vi.mocked(prisma.competitorSnapshot.create).mockResolvedValue({
        id: 'snap-new',
        competitorId: 'comp-1',
        subscriberCount: BigInt(110000),
        videoCount: 55,
        totalViews: BigInt(5500000),
        avgEngagement: 100,
        recordedAt: new Date(),
        createdAt: new Date(),
      });

      const result = await CompetitorService.updateCompetitorMetrics('comp-1');

      expect(result).toBe(true);
      expect(prisma.competitorTrack.update).toHaveBeenCalled();
      expect(prisma.competitorSnapshot.create).toHaveBeenCalled();
    });

    it('should return false if competitor not found', async () => {
      vi.mocked(prisma.competitorTrack.findUnique).mockResolvedValue(null);

      const result = await CompetitorService.updateCompetitorMetrics('comp-1');

      expect(result).toBe(false);
    });

    it('should return false if competitor is inactive', async () => {
      vi.mocked(prisma.competitorTrack.findUnique).mockResolvedValue({
        id: 'comp-1',
        userId: 'user-1',
        platform: Platform.YOUTUBE,
        channelId: 'channel-123',
        channelName: 'Test Channel',
        channelUrl: 'https://youtube.com/@test',
        thumbnailUrl: null,
        niche: VideoNiche.TECH,
        subscriberCount: BigInt(100000),
        videoCount: 50,
        totalViews: BigInt(5000000),
        avgEngagement: 100,
        isActive: false,
        firstTrackedAt: new Date('2024-01-01'),
        lastCheckedAt: new Date('2024-01-15'),
        lastFetchedAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      });

      const result = await CompetitorService.updateCompetitorMetrics('comp-1');

      expect(result).toBe(false);
    });
  });

  describe('updateUserCompetitors', () => {
    it('should update all active competitors for a user', async () => {
      const mockCompetitors = [
        {
          id: 'comp-1',
          userId: 'user-1',
          platform: Platform.YOUTUBE,
          channelId: 'channel-123',
          channelName: 'Test 1',
          channelUrl: 'https://youtube.com/@test1',
          thumbnailUrl: null,
          niche: VideoNiche.TECH,
          subscriberCount: BigInt(100000),
          videoCount: 50,
          totalViews: BigInt(5000000),
          avgEngagement: 100,
          isActive: true,
          firstTrackedAt: new Date('2024-01-01'),
          lastCheckedAt: new Date('2024-01-15'),
          lastFetchedAt: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
        },
        {
          id: 'comp-2',
          userId: 'user-1',
          platform: Platform.YOUTUBE,
          channelId: 'channel-456',
          channelName: 'Test 2',
          channelUrl: 'https://youtube.com/@test2',
          thumbnailUrl: null,
          niche: VideoNiche.GAMING,
          subscriberCount: BigInt(200000),
          videoCount: 100,
          totalViews: BigInt(10000000),
          avgEngagement: 200,
          isActive: true,
          firstTrackedAt: new Date('2024-01-01'),
          lastCheckedAt: new Date('2024-01-15'),
          lastFetchedAt: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
        },
      ];

      vi.mocked(prisma.competitorTrack.findMany).mockResolvedValue(mockCompetitors);

      // Mock updateCompetitorMetrics to return true
      vi.spyOn(CompetitorService, 'updateCompetitorMetrics').mockResolvedValue(true);

      const result = await CompetitorService.updateUserCompetitors('user-1');

      expect(result).toBe(2);
      expect(CompetitorService.updateCompetitorMetrics).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures gracefully', async () => {
      const mockCompetitors = [
        {
          id: 'comp-1',
          userId: 'user-1',
          platform: Platform.YOUTUBE,
          channelId: 'channel-123',
          channelName: 'Test 1',
          channelUrl: 'https://youtube.com/@test1',
          thumbnailUrl: null,
          niche: VideoNiche.TECH,
          subscriberCount: BigInt(100000),
          videoCount: 50,
          totalViews: BigInt(5000000),
          avgEngagement: 100,
          isActive: true,
          firstTrackedAt: new Date('2024-01-01'),
          lastCheckedAt: new Date('2024-01-15'),
          lastFetchedAt: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
        },
        {
          id: 'comp-2',
          userId: 'user-1',
          platform: Platform.YOUTUBE,
          channelId: 'channel-456',
          channelName: 'Test 2',
          channelUrl: 'https://youtube.com/@test2',
          thumbnailUrl: null,
          niche: VideoNiche.GAMING,
          subscriberCount: BigInt(200000),
          videoCount: 100,
          totalViews: BigInt(10000000),
          avgEngagement: 200,
          isActive: true,
          firstTrackedAt: new Date('2024-01-01'),
          lastCheckedAt: new Date('2024-01-15'),
          lastFetchedAt: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
        },
      ];

      vi.mocked(prisma.competitorTrack.findMany).mockResolvedValue(mockCompetitors);

      // First succeeds, second fails
      vi.spyOn(CompetitorService, 'updateCompetitorMetrics')
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const result = await CompetitorService.updateUserCompetitors('user-1');

      expect(result).toBe(1); // Only 1 successful update
    });
  });
});
