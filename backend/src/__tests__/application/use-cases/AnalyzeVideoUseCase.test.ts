/**
 * AnalyzeVideoUseCase Unit Tests
 */

import { AnalyzeVideoUseCase } from '@application/use-cases/AnalyzeVideoUseCase';
import { ICacheService } from '@domain/interfaces/ICacheService';
import { YouTubeService } from '@infrastructure/external-apis/YouTubeService';
import { InstagramService } from '@infrastructure/external-apis/InstagramService';
import { SentimentService } from '@infrastructure/sentiment/SentimentService';
import { Platform } from '@shared/constants/Platform';

describe('AnalyzeVideoUseCase', () => {
  let useCase: AnalyzeVideoUseCase;
  let mockCacheService: jest.Mocked<ICacheService>;
  let mockYouTubeService: jest.Mocked<YouTubeService>;
  let mockInstagramService: jest.Mocked<InstagramService>;
  let mockSentimentService: jest.Mocked<SentimentService>;

  beforeEach(() => {
    // Mock services
    mockCacheService = {
      isEnabled: jest.fn().mockReturnValue(false),
      getVideoKey: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      getAnalyticsHistory: jest.fn(),
      addToHistory: jest.fn(),
    };

    mockYouTubeService = {
      isEnabled: jest.fn().mockReturnValue(true),
      extractVideoId: jest.fn(),
      getVideoAnalytics: jest.fn(),
    } as any;

    mockInstagramService = {
      isEnabled: jest.fn().mockReturnValue(true),
      extractVideoId: jest.fn(),
      getVideoAnalytics: jest.fn(),
    } as any;

    mockSentimentService = {
      analyzeText: jest.fn(),
      analyzeComments: jest.fn(),
      extractKeywords: jest.fn(),
      extractHashtags: jest.fn(),
      generateEngagementByDay: jest.fn(),
      generateAudienceDemographics: jest.fn(),
      createSentimentAnalysis: jest.fn(),
    } as any;

    useCase = new AnalyzeVideoUseCase(
      mockCacheService,
      mockYouTubeService,
      mockInstagramService,
      mockSentimentService
    );
  });

  describe('detectPlatform', () => {
    it('should detect YouTube from youtube.com URL', () => {
      const platform = useCase.detectPlatform('https://www.youtube.com/watch?v=test');
      expect(platform).toBe('youtube');
    });

    it('should detect YouTube from youtu.be URL', () => {
      const platform = useCase.detectPlatform('https://youtu.be/test');
      expect(platform).toBe('youtube');
    });

    it('should detect Instagram from instagram.com URL', () => {
      const platform = useCase.detectPlatform('https://www.instagram.com/p/test');
      expect(platform).toBe('instagram');
    });

    it('should detect TikTok from tiktok.com URL', () => {
      const platform = useCase.detectPlatform('https://www.tiktok.com/@user/video/123');
      expect(platform).toBe('tiktok');
    });

    it('should detect Vimeo from vimeo.com URL', () => {
      const platform = useCase.detectPlatform('https://vimeo.com/123456');
      expect(platform).toBe('vimeo');
    });

    it('should return null for unknown platform', () => {
      const platform = useCase.detectPlatform('https://example.com/video');
      expect(platform).toBeNull();
    });

    it('should be case insensitive', () => {
      const platform = useCase.detectPlatform('https://WWW.YOUTUBE.COM/watch?v=test');
      expect(platform).toBe('youtube');
    });
  });

  describe('execute', () => {
    it('should throw error for invalid URL', async () => {
      await expect(useCase.execute('')).rejects.toThrow('Valid URL is required');
    });

    it('should throw error for unsupported platform', async () => {
      await expect(
        useCase.execute('https://example.com/video')
      ).rejects.toThrow('Unsupported platform');
    });

    it('should use YouTube service for YouTube URL', async () => {
      const mockVideoData = {
        platform: Platform.YOUTUBE,
        platformVideoId: 'test123',
        url: 'https://www.youtube.com/watch?v=test123',
        title: 'Test Video',
        channelName: 'Test Channel',
        channelId: 'channel123',
        viewCount: 1000,
        likeCount: 100,
        commentCount: 10,
        engagementRate: 11,
        comments: [],
        fetchedAt: new Date().toISOString(),
      };

      mockYouTubeService.getVideoAnalytics.mockResolvedValue(mockVideoData);
      mockSentimentService.generateEngagementByDay.mockReturnValue([]);
      mockSentimentService.generateAudienceDemographics.mockReturnValue({
        ageDistribution: [],
        genderSplit: { male: 50, female: 50 },
      });

      const result = await useCase.execute('https://www.youtube.com/watch?v=test123');

      expect(mockYouTubeService.getVideoAnalytics).toHaveBeenCalledWith(
        'https://www.youtube.com/watch?v=test123'
      );
      expect(result.video.platform).toBe(Platform.YOUTUBE);
      expect(result.video.title).toBe('Test Video');
    });

    it('should skip cache when skipCache is true', async () => {
      const mockVideoData = {
        platform: Platform.YOUTUBE,
        platformVideoId: 'test123',
        url: 'https://www.youtube.com/watch?v=test123',
        title: 'Test Video',
        channelName: 'Test Channel',
        channelId: 'channel123',
        viewCount: 1000,
        likeCount: 100,
        commentCount: 10,
        engagementRate: 11,
        comments: [],
        fetchedAt: new Date().toISOString(),
      };

      mockYouTubeService.getVideoAnalytics.mockResolvedValue(mockVideoData);
      mockSentimentService.generateEngagementByDay.mockReturnValue([]);
      mockSentimentService.generateAudienceDemographics.mockReturnValue({
        ageDistribution: [],
        genderSplit: { male: 50, female: 50 },
      });

      await useCase.execute('https://www.youtube.com/watch?v=test123', {
        skipCache: true,
      });

      expect(mockCacheService.get).not.toHaveBeenCalled();
    });
  });
});
