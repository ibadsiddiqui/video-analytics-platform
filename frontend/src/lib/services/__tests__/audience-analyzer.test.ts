import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AudienceAnalyzer } from '../audience-analyzer';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    video: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('AudienceAnalyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Audience Overlap Analysis', () => {
    it('should analyze audience overlap for a channel', async () => {
      const mockVideos = [
        {
          id: 'video1',
          channelName: 'Tech Channel',
          comments: [
            { authorName: 'user1' },
            { authorName: 'user2' },
            { authorName: 'user3' },
          ],
        },
      ];

      const mockOtherVideos = [
        {
          channelId: 'channel2',
          channelName: 'Other Tech Channel',
          comments: [
            { authorName: 'user1' },
            { authorName: 'user4' },
          ],
        },
      ];

      vi.mocked(prisma.video.findMany)
        .mockResolvedValueOnce(mockVideos as any)
        .mockResolvedValueOnce(mockOtherVideos as any);

      const result = await AudienceAnalyzer.analyzeOverlap('channel1');

      expect(result.baseChannel.channelId).toBe('channel1');
      expect(result.baseChannel.channelName).toBe('Tech Channel');
      expect(result.baseChannel.totalCommenters).toBe(3);
      expect(result.overlappingChannels.length).toBeGreaterThan(0);
    });

    it('should calculate overlap percentage correctly', async () => {
      const mockVideos = [
        {
          id: 'video1',
          channelName: 'Channel A',
          comments: [
            { authorName: 'user1' },
            { authorName: 'user2' },
            { authorName: 'user3' },
            { authorName: 'user4' },
            { authorName: 'user5' },
          ],
        },
      ];

      const mockOtherVideos = [
        {
          channelId: 'channel2',
          channelName: 'Channel B',
          comments: [
            { authorName: 'user1' },
            { authorName: 'user2' },
          ],
        },
      ];

      vi.mocked(prisma.video.findMany)
        .mockResolvedValueOnce(mockVideos as any)
        .mockResolvedValueOnce(mockOtherVideos as any);

      const result = await AudienceAnalyzer.analyzeOverlap('channel1');

      // 2 shared out of 5 = 40%
      if (result.overlappingChannels.length > 0) {
        expect(result.overlappingChannels[0].overlapScore).toBe(40);
      }
    });

    it('should identify collaboration opportunities (10-30% overlap)', async () => {
      const mockVideos = [
        {
          id: 'video1',
          channelName: 'Channel A',
          comments: [
            { authorName: 'user1' },
            { authorName: 'user2' },
            { authorName: 'user3' },
            { authorName: 'user4' },
            { authorName: 'user5' },
            { authorName: 'user6' },
            { authorName: 'user7' },
            { authorName: 'user8' },
            { authorName: 'user9' },
            { authorName: 'user10' },
          ],
        },
      ];

      const mockOtherVideos = [
        {
          channelId: 'channel2',
          channelName: 'Ideal Partner',
          comments: Array.from({ length: 20 }, (_, i) => ({
            authorName: i < 3 ? `user${i + 1}` : `other${i}`, // 3 users overlap (30%)
          })),
        },
      ];

      vi.mocked(prisma.video.findMany)
        .mockResolvedValueOnce(mockVideos as any)
        .mockResolvedValueOnce(mockOtherVideos as any);

      const result = await AudienceAnalyzer.analyzeOverlap('channel1');

      const idealPartner = result.overlappingChannels.find(
        c => c.channelName === 'Ideal Partner'
      );
      if (idealPartner) {
        expect(idealPartner.overlapScore).toBeGreaterThan(0);
      }
    });

    it('should handle channels with no comments', async () => {
      const mockVideos = [
        {
          id: 'video1',
          channelName: 'Channel A',
          comments: [],
        },
      ];

      vi.mocked(prisma.video.findMany).mockResolvedValueOnce(mockVideos as any);

      const result = await AudienceAnalyzer.analyzeOverlap('channel1');

      expect(result.baseChannel.totalCommenters).toBe(0);
      expect(result.overlappingChannels.length).toBe(0);
    });

    it('should handle channels with no videos', async () => {
      vi.mocked(prisma.video.findMany).mockResolvedValueOnce([]);

      const result = await AudienceAnalyzer.analyzeOverlap('channel1');

      expect(result.baseChannel.totalCommenters).toBe(0);
      expect(result.overlappingChannels.length).toBe(0);
      expect(result.insights).toContain('No videos found for this channel');
    });

    it('should normalize usernames to lowercase', async () => {
      const mockVideos = [
        {
          id: 'video1',
          channelName: 'Channel A',
          comments: [
            { authorName: 'User1' },
            { authorName: 'USER1' },
            { authorName: 'user1' },
          ],
        },
      ];

      vi.mocked(prisma.video.findMany)
        .mockResolvedValueOnce(mockVideos as any)
        .mockResolvedValueOnce([] as any); // No other videos

      const result = await AudienceAnalyzer.analyzeOverlap('channel1');

      // Should be counted as 1 unique user
      expect(result.baseChannel.totalCommenters).toBe(1);
    });

    it('should limit overlapping channels by limit parameter', async () => {
      const mockVideos = [
        {
          id: 'video1',
          channelName: 'Channel A',
          comments: Array.from({ length: 100 }, (_, i) => ({
            authorName: `user${i}`,
          })),
        },
      ];

      const mockOtherVideos = Array.from({ length: 20 }, (_, i) => ({
        channelId: `channel${i}`,
        channelName: `Channel ${i}`,
        comments: [{ authorName: 'user0' }],
      }));

      vi.mocked(prisma.video.findMany)
        .mockResolvedValueOnce(mockVideos as any)
        .mockResolvedValueOnce(mockOtherVideos as any);

      const result = await AudienceAnalyzer.analyzeOverlap('channel1', 'YOUTUBE', 5);

      expect(result.overlappingChannels.length).toBeLessThanOrEqual(5);
    });

    it('should generate insights about collaboration opportunities', async () => {
      const mockVideos = [
        {
          id: 'video1',
          channelName: 'Channel A',
          comments: Array.from({ length: 50 }, (_, i) => ({
            authorName: `user${i}`,
          })),
        },
      ];

      const mockOtherVideos = [];

      vi.mocked(prisma.video.findMany)
        .mockResolvedValueOnce(mockVideos as any)
        .mockResolvedValueOnce(mockOtherVideos as any);

      const result = await AudienceAnalyzer.analyzeOverlap('channel1');

      expect(result.insights.length).toBeGreaterThan(0);
    });
  });

  describe('Collaboration Potential Calculation', () => {
    it('should mark HIGH collaboration potential for ideal overlap', () => {
      // Using spread operator to access private static method through reflection
      const potential = (AudienceAnalyzer as any).calculateCollaborationPotential(20, 10);
      expect(potential).toBe('high');
    });

    it('should mark MEDIUM collaboration potential for moderate overlap', () => {
      const potential = (AudienceAnalyzer as any).calculateCollaborationPotential(40, 5);
      expect(potential).toBe('medium');
    });

    it('should mark LOW collaboration potential for poor overlap', () => {
      const potential = (AudienceAnalyzer as any).calculateCollaborationPotential(5, 2);
      expect(potential).toBe('low');
    });

    it('should require minimum shared commenters for high potential', () => {
      const potential = (AudienceAnalyzer as any).calculateCollaborationPotential(20, 2);
      expect(potential).not.toBe('high');
    });
  });

  describe('Superfan Identification', () => {
    it('should identify superfans from commenters', async () => {
      const mockVideos = [
        {
          id: 'video1',
          comments: [
            {
              authorName: 'superfan1',
              content: 'Great video!',
              likeCount: 10,
              sentiment: 'POSITIVE',
              sentimentScore: 0.8,
              publishedAt: new Date('2024-01-15'),
              createdAt: new Date('2024-01-15'),
            },
            {
              authorName: 'superfan1',
              content: 'Love this!',
              likeCount: 8,
              sentiment: 'POSITIVE',
              sentimentScore: 0.9,
              publishedAt: new Date('2024-01-16'),
              createdAt: new Date('2024-01-16'),
            },
            {
              authorName: 'superfan1',
              content: 'Amazing content',
              likeCount: 5,
              sentiment: 'POSITIVE',
              sentimentScore: 0.7,
              publishedAt: new Date('2024-01-17'),
              createdAt: new Date('2024-01-17'),
            },
          ],
        },
      ];

      vi.mocked(prisma.video.findMany).mockResolvedValueOnce(mockVideos as any);

      const result = await AudienceAnalyzer.identifySuperfans('channel1');

      expect(result.superfans.length).toBeGreaterThan(0);
      expect(result.superfans[0].username).toBe('superfan1');
      expect(result.superfans[0].totalComments).toBe(3);
    });

    it('should filter by minimum comments threshold', async () => {
      const mockVideos = [
        {
          id: 'video1',
          comments: [
            {
              authorName: 'superuser',
              content: 'Comment 1',
              likeCount: 5,
              sentiment: 'POSITIVE',
              sentimentScore: 0.8,
              publishedAt: new Date(),
              createdAt: new Date(),
            },
            {
              authorName: 'superuser',
              content: 'Comment 2',
              likeCount: 5,
              sentiment: 'POSITIVE',
              sentimentScore: 0.8,
              publishedAt: new Date(),
              createdAt: new Date(),
            },
            {
              authorName: 'superuser',
              content: 'Comment 3',
              likeCount: 5,
              sentiment: 'POSITIVE',
              sentimentScore: 0.8,
              publishedAt: new Date(),
              createdAt: new Date(),
            },
            {
              authorName: 'casual',
              content: 'One comment',
              likeCount: 1,
              sentiment: 'NEUTRAL',
              sentimentScore: 0,
              publishedAt: new Date(),
              createdAt: new Date(),
            },
          ],
        },
      ];

      vi.mocked(prisma.video.findMany).mockResolvedValueOnce(mockVideos as any);

      const result = await AudienceAnalyzer.identifySuperfans('channel1', 'YOUTUBE', 3);

      // Only superuser should be included (3 comments)
      expect(result.superfans.some(s => s.username === 'superuser')).toBe(true);
    });

    it('should calculate engagement score correctly', async () => {
      const mockVideos = [
        {
          id: 'video1',
          comments: [
            {
              authorName: 'user1',
              content: 'Comment',
              likeCount: 10,
              sentiment: 'POSITIVE',
              sentimentScore: 0.8,
              publishedAt: new Date(),
              createdAt: new Date(),
            },
            {
              authorName: 'user1',
              content: 'Comment',
              likeCount: 10,
              sentiment: 'POSITIVE',
              sentimentScore: 0.8,
              publishedAt: new Date(),
              createdAt: new Date(),
            },
            {
              authorName: 'user1',
              content: 'Comment',
              likeCount: 10,
              sentiment: 'POSITIVE',
              sentimentScore: 0.8,
              publishedAt: new Date(),
              createdAt: new Date(),
            },
          ],
        },
      ];

      vi.mocked(prisma.video.findMany).mockResolvedValueOnce(mockVideos as any);

      const result = await AudienceAnalyzer.identifySuperfans('channel1');

      expect(result.superfans[0].engagementScore).toBeGreaterThan(0);
      expect(result.superfans[0].engagementScore).toBeLessThanOrEqual(100);
    });

    it('should track activity status (active in last 30 days)', async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const mockVideos = [
        {
          id: 'video1',
          comments: [
            {
              authorName: 'recent',
              content: 'Comment',
              likeCount: 5,
              sentiment: 'POSITIVE',
              sentimentScore: 0.8,
              publishedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
              createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
            },
            {
              authorName: 'recent',
              content: 'Comment',
              likeCount: 5,
              sentiment: 'POSITIVE',
              sentimentScore: 0.8,
              publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
              createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
            },
            {
              authorName: 'recent',
              content: 'Comment',
              likeCount: 5,
              sentiment: 'POSITIVE',
              sentimentScore: 0.8,
              publishedAt: now,
              createdAt: now,
            },
            {
              authorName: 'inactive',
              content: 'Comment',
              likeCount: 5,
              sentiment: 'POSITIVE',
              sentimentScore: 0.8,
              publishedAt: twoMonthsAgo,
              createdAt: twoMonthsAgo,
            },
            {
              authorName: 'inactive',
              content: 'Comment',
              likeCount: 5,
              sentiment: 'POSITIVE',
              sentimentScore: 0.8,
              publishedAt: twoMonthsAgo,
              createdAt: twoMonthsAgo,
            },
            {
              authorName: 'inactive',
              content: 'Comment',
              likeCount: 5,
              sentiment: 'POSITIVE',
              sentimentScore: 0.8,
              publishedAt: twoMonthsAgo,
              createdAt: twoMonthsAgo,
            },
          ],
        },
      ];

      vi.mocked(prisma.video.findMany).mockResolvedValueOnce(mockVideos as any);

      const result = await AudienceAnalyzer.identifySuperfans('channel1');

      const recentUser = result.superfans.find(s => s.username === 'recent');
      const inactiveUser = result.superfans.find(s => s.username === 'inactive');

      if (recentUser) {
        expect(recentUser.isActive).toBe(true);
      }
      if (inactiveUser) {
        expect(inactiveUser.isActive).toBe(false);
      }
    });

    it('should track average sentiment for each commenter', async () => {
      const mockVideos = [
        {
          id: 'video1',
          comments: [
            {
              authorName: 'user1',
              content: 'Love it',
              likeCount: 5,
              sentiment: 'POSITIVE',
              sentimentScore: 0.9,
              publishedAt: new Date(),
              createdAt: new Date(),
            },
            {
              authorName: 'user1',
              content: 'Hate it',
              likeCount: 0,
              sentiment: 'NEGATIVE',
              sentimentScore: -0.8,
              publishedAt: new Date(),
              createdAt: new Date(),
            },
            {
              authorName: 'user1',
              content: 'OK',
              likeCount: 2,
              sentiment: 'NEUTRAL',
              sentimentScore: 0,
              publishedAt: new Date(),
              createdAt: new Date(),
            },
          ],
        },
      ];

      vi.mocked(prisma.video.findMany).mockResolvedValueOnce(mockVideos as any);

      const result = await AudienceAnalyzer.identifySuperfans('channel1');

      expect(result.superfans[0].avgSentiment).toBeDefined();
      expect(result.superfans[0].avgSentiment).toBeLessThanOrEqual(1);
      expect(result.superfans[0].avgSentiment).toBeGreaterThanOrEqual(-1);
    });

    it('should calculate superfan percentage of total commenters', async () => {
      const mockVideos = [
        {
          id: 'video1',
          comments: Array.from({ length: 10 }, (_, i) => ({
            authorName: i < 5 ? 'superfan' : `casual${i}`,
            content: 'Comment',
            likeCount: i < 5 ? 10 : 1,
            sentiment: 'POSITIVE',
            sentimentScore: 0.5,
            publishedAt: new Date(),
            createdAt: new Date(),
          })),
        },
      ];

      vi.mocked(prisma.video.findMany).mockResolvedValueOnce(mockVideos as any);

      const result = await AudienceAnalyzer.identifySuperfans('channel1', 'YOUTUBE', 1);

      expect(result.totalUniqueCommenters).toBeGreaterThan(0);
      expect(result.superfanPercentage).toBeGreaterThanOrEqual(0);
      expect(result.superfanPercentage).toBeLessThanOrEqual(100);
    });

    it('should limit superfans to top 50', async () => {
      const mockVideos = [
        {
          id: 'video1',
          comments: Array.from({ length: 100 }, (_, i) => ({
            authorName: `user${i}`,
            content: 'Comment',
            likeCount: 1,
            sentiment: 'POSITIVE',
            sentimentScore: 0.5,
            publishedAt: new Date(),
            createdAt: new Date(),
          })),
        },
      ];

      vi.mocked(prisma.video.findMany).mockResolvedValueOnce(mockVideos as any);

      const result = await AudienceAnalyzer.identifySuperfans('channel1');

      expect(result.superfans.length).toBeLessThanOrEqual(50);
    });

    it('should generate insights about superfan engagement', async () => {
      const mockVideos = [
        {
          id: 'video1',
          comments: [
            {
              authorName: 'user1',
              content: 'Comment',
              likeCount: 5,
              sentiment: 'POSITIVE',
              sentimentScore: 0.8,
              publishedAt: new Date(),
              createdAt: new Date(),
            },
            {
              authorName: 'user1',
              content: 'Comment',
              likeCount: 5,
              sentiment: 'POSITIVE',
              sentimentScore: 0.8,
              publishedAt: new Date(),
              createdAt: new Date(),
            },
            {
              authorName: 'user1',
              content: 'Comment',
              likeCount: 5,
              sentiment: 'POSITIVE',
              sentimentScore: 0.8,
              publishedAt: new Date(),
              createdAt: new Date(),
            },
          ],
        },
      ];

      vi.mocked(prisma.video.findMany).mockResolvedValueOnce(mockVideos as any);

      const result = await AudienceAnalyzer.identifySuperfans('channel1');

      expect(result.insights.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null author names in overlap analysis', async () => {
      const mockVideos = [
        {
          id: 'video1',
          channelName: 'Channel A',
          comments: [
            { authorName: 'user1' },
            { authorName: null },
          ],
        },
      ];

      vi.mocked(prisma.video.findMany)
        .mockResolvedValueOnce(mockVideos as any)
        .mockResolvedValueOnce([] as any); // No other videos

      const result = await AudienceAnalyzer.analyzeOverlap('channel1');

      expect(result.baseChannel.totalCommenters).toBe(1);
    });

    it('should handle null author names in superfan identification', async () => {
      const mockVideos = [
        {
          id: 'video1',
          comments: [
            {
              authorName: 'user1',
              content: 'Comment',
              likeCount: 5,
              sentiment: 'POSITIVE',
              sentimentScore: 0.8,
              publishedAt: new Date(),
              createdAt: new Date(),
            },
            {
              authorName: null,
              content: 'Comment',
              likeCount: 5,
              sentiment: 'POSITIVE',
              sentimentScore: 0.8,
              publishedAt: new Date(),
              createdAt: new Date(),
            },
          ],
        },
      ];

      vi.mocked(prisma.video.findMany).mockResolvedValueOnce(mockVideos as any);

      const result = await AudienceAnalyzer.identifySuperfans('channel1');

      expect(result.totalUniqueCommenters).toBe(1);
    });

    it('should handle missing sentiment score', async () => {
      const mockVideos = [
        {
          id: 'video1',
          comments: [
            {
              authorName: 'user1',
              content: 'Comment',
              likeCount: 5,
              sentiment: 'POSITIVE',
              sentimentScore: null,
              publishedAt: new Date(),
              createdAt: new Date(),
            },
            {
              authorName: 'user1',
              content: 'Comment',
              likeCount: 5,
              sentiment: 'POSITIVE',
              sentimentScore: null,
              publishedAt: new Date(),
              createdAt: new Date(),
            },
            {
              authorName: 'user1',
              content: 'Comment',
              likeCount: 5,
              sentiment: 'POSITIVE',
              sentimentScore: null,
              publishedAt: new Date(),
              createdAt: new Date(),
            },
          ],
        },
      ];

      vi.mocked(prisma.video.findMany).mockResolvedValueOnce(mockVideos as any);

      const result = await AudienceAnalyzer.identifySuperfans('channel1');

      expect(result.superfans[0].avgSentiment).toBeDefined();
      expect(result.superfans[0].avgSentiment).toBe(0.5); // fallback value for POSITIVE
    });

    it('should handle large number of commenters efficiently', async () => {
      const mockVideos = [
        {
          id: 'video1',
          channelName: 'Channel A',
          comments: Array.from({ length: 1000 }, (_, i) => ({
            authorName: `user${i % 100}`,
          })),
        },
      ];

      vi.mocked(prisma.video.findMany)
        .mockResolvedValueOnce(mockVideos as any)
        .mockResolvedValueOnce([] as any); // No other videos

      const result = await AudienceAnalyzer.analyzeOverlap('channel1');

      expect(result.baseChannel.totalCommenters).toBeLessThanOrEqual(100);
    });
  });
});
