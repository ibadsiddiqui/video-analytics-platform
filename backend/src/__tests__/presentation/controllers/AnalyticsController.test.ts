/**
 * AnalyticsController Unit Tests
 */

import { AnalyticsController } from '@presentation/controllers/AnalyticsController';
import { AnalyzeVideoUseCase } from '@application/use-cases/AnalyzeVideoUseCase';
import { CompareVideosUseCase } from '@application/use-cases/CompareVideosUseCase';
import { GetVideoHistoryUseCase } from '@application/use-cases/GetVideoHistoryUseCase';
import { DetectPlatformUseCase } from '@application/use-cases/DetectPlatformUseCase';
import { Platform } from '@shared/constants/Platform';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let mockAnalyzeVideoUseCase: jest.Mocked<AnalyzeVideoUseCase>;
  let mockCompareVideosUseCase: jest.Mocked<CompareVideosUseCase>;
  let mockGetVideoHistoryUseCase: jest.Mocked<GetVideoHistoryUseCase>;
  let mockDetectPlatformUseCase: jest.Mocked<DetectPlatformUseCase>;

  const mockAnalyticsResult = {
    video: {
      platform: Platform.YOUTUBE,
      id: 'test123',
      url: 'https://www.youtube.com/watch?v=test123',
      title: 'Test Video',
      description: 'Test Description',
      thumbnail: 'https://example.com/thumb.jpg',
      publishedAt: '2024-01-01T00:00:00Z',
      duration: 300,
      durationFormatted: '5:00',
    },
    channel: {
      name: 'Test Channel',
      id: 'channel123',
      thumbnail: 'https://example.com/channel.jpg',
      subscribers: 10000,
      subscribersFormatted: '10K',
    },
    metrics: {
      views: 1000,
      viewsFormatted: '1K',
      likes: 100,
      likesFormatted: '100',
      comments: 10,
      commentsFormatted: '10',
      shares: 5,
      sharesFormatted: '5',
      engagementRate: 11,
      engagementRateFormatted: '11.00%',
    },
    engagement: {
      byDay: [],
      peakDay: null,
    },
    sentiment: null,
    keywords: [],
    hashtags: [],
    demographics: {
      ageDistribution: [],
      genderSplit: { male: 50, female: 50 },
    },
    topComments: [],
    meta: {
      fetchedAt: new Date().toISOString(),
      fromCache: false,
      platform: 'youtube',
    },
  };

  beforeEach(() => {
    mockAnalyzeVideoUseCase = {
      execute: jest.fn(),
      detectPlatform: jest.fn(),
    } as any;

    mockCompareVideosUseCase = {
      execute: jest.fn(),
    } as any;

    mockGetVideoHistoryUseCase = {
      execute: jest.fn(),
    } as any;

    mockDetectPlatformUseCase = {
      execute: jest.fn(),
      isPlatformSupported: jest.fn(),
    } as any;

    controller = new AnalyticsController(
      mockAnalyzeVideoUseCase,
      mockCompareVideosUseCase,
      mockGetVideoHistoryUseCase,
      mockDetectPlatformUseCase
    );
  });

  describe('analyzeVideo', () => {
    it('should analyze video with POST request', async () => {
      mockAnalyzeVideoUseCase.execute.mockResolvedValue(mockAnalyticsResult);

      const result = await controller.analyzeVideo({
        url: 'https://www.youtube.com/watch?v=test123',
      });

      expect(mockAnalyzeVideoUseCase.execute).toHaveBeenCalledWith(
        'https://www.youtube.com/watch?v=test123',
        {
          skipCache: undefined,
          includeSentiment: undefined,
          includeKeywords: undefined,
        }
      );
      expect(result).toEqual(mockAnalyticsResult);
    });

    it('should pass options to use case', async () => {
      mockAnalyzeVideoUseCase.execute.mockResolvedValue(mockAnalyticsResult);

      await controller.analyzeVideo({
        url: 'https://www.youtube.com/watch?v=test123',
        skipCache: true,
        includeSentiment: false,
        includeKeywords: false,
      });

      expect(mockAnalyzeVideoUseCase.execute).toHaveBeenCalledWith(
        'https://www.youtube.com/watch?v=test123',
        {
          skipCache: true,
          includeSentiment: false,
          includeKeywords: false,
        }
      );
    });
  });

  describe('analyzeVideoByQuery', () => {
    it('should analyze video with GET request', async () => {
      mockAnalyzeVideoUseCase.execute.mockResolvedValue(mockAnalyticsResult);

      const result = await controller.analyzeVideoByQuery(
        'https://www.youtube.com/watch?v=test123'
      );

      expect(mockAnalyzeVideoUseCase.execute).toHaveBeenCalled();
      expect(result).toEqual(mockAnalyticsResult);
    });

    it('should handle boolean query parameters as strings', async () => {
      mockAnalyzeVideoUseCase.execute.mockResolvedValue(mockAnalyticsResult);

      await controller.analyzeVideoByQuery(
        'https://www.youtube.com/watch?v=test123',
        'true',
        'false',
        'true'
      );

      expect(mockAnalyzeVideoUseCase.execute).toHaveBeenCalledWith(
        'https://www.youtube.com/watch?v=test123',
        {
          skipCache: true,
          includeSentiment: false,
          includeKeywords: true,
        }
      );
    });
  });

  describe('getVideoHistory', () => {
    it('should get video history', async () => {
      const mockHistory = {
        videoId: 'test123',
        snapshots: [],
        summary: {
          totalSnapshots: 0,
        },
      };

      mockGetVideoHistoryUseCase.execute.mockResolvedValue(mockHistory);

      const result = await controller.getVideoHistory('test123');

      expect(mockGetVideoHistoryUseCase.execute).toHaveBeenCalledWith('test123', 7);
      expect(result).toEqual(mockHistory);
    });

    it('should use custom days parameter', async () => {
      const mockHistory = {
        videoId: 'test123',
        snapshots: [],
        summary: {
          totalSnapshots: 0,
        },
      };

      mockGetVideoHistoryUseCase.execute.mockResolvedValue(mockHistory);

      await controller.getVideoHistory('test123', 30);

      expect(mockGetVideoHistoryUseCase.execute).toHaveBeenCalledWith('test123', 30);
    });
  });

  describe('detectPlatform', () => {
    it('should detect platform with POST request', async () => {
      const mockResult = {
        url: 'https://www.youtube.com/watch?v=test',
        platform: 'youtube',
        supported: true,
        supportedPlatforms: ['youtube', 'instagram'],
      };

      mockDetectPlatformUseCase.execute.mockReturnValue(mockResult);

      const result = await controller.detectPlatform({
        url: 'https://www.youtube.com/watch?v=test',
      });

      expect(mockDetectPlatformUseCase.execute).toHaveBeenCalledWith(
        'https://www.youtube.com/watch?v=test'
      );
      expect(result).toEqual(mockResult);
    });

    it('should detect platform with GET request', async () => {
      const mockResult = {
        url: 'https://www.youtube.com/watch?v=test',
        platform: 'youtube',
        supported: true,
        supportedPlatforms: ['youtube', 'instagram'],
      };

      mockDetectPlatformUseCase.execute.mockReturnValue(mockResult);

      const result = await controller.detectPlatformByQuery(
        'https://www.youtube.com/watch?v=test'
      );

      expect(mockDetectPlatformUseCase.execute).toHaveBeenCalledWith(
        'https://www.youtube.com/watch?v=test'
      );
      expect(result).toEqual(mockResult);
    });
  });
});
