/**
 * YouTubeService Unit Tests
 */

import { YouTubeService } from '@infrastructure/external-apis/YouTubeService';
import { IConfigService } from '@domain/interfaces/IConfigService';
import { InvalidUrlException } from '@domain/exceptions/InvalidUrlException';
import { ServiceNotConfiguredException } from '@domain/exceptions/ServiceNotConfiguredException';

describe('YouTubeService', () => {
  let youtubeService: YouTubeService;
  let mockConfigService: jest.Mocked<IConfigService>;

  beforeEach(() => {
    // Mock ConfigService
    mockConfigService = {
      get: jest.fn(),
      getNumber: jest.fn(),
      getPort: jest.fn(),
      getNodeEnv: jest.fn(),
      isProduction: jest.fn(),
      isDevelopment: jest.fn(),
      getDatabaseConfig: jest.fn(),
      getUpstashConfig: jest.fn(),
      getYouTubeConfig: jest.fn(),
      getRapidApiConfig: jest.fn(),
      getFrontendUrl: jest.fn(),
      getRateLimitConfig: jest.fn(),
      getCacheTtl: jest.fn(),
      validateRequiredConfig: jest.fn(),
    };

    // Mock YouTube API key
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'YOUTUBE_API_KEY') return 'test-api-key';
      return undefined;
    });

    youtubeService = new YouTubeService(mockConfigService);
  });

  describe('isEnabled', () => {
    it('should return true when API key is configured', () => {
      expect(youtubeService.isEnabled()).toBe(true);
    });

    it('should return false when API key is not configured', () => {
      mockConfigService.get.mockReturnValue(undefined);
      const service = new YouTubeService(mockConfigService);
      expect(service.isEnabled()).toBe(false);
    });
  });

  describe('extractVideoId', () => {
    it('should extract video ID from standard watch URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const id = youtubeService.extractVideoId(url);
      expect(id).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from short URL', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      const id = youtubeService.extractVideoId(url);
      expect(id).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from embed URL', () => {
      const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      const id = youtubeService.extractVideoId(url);
      expect(id).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from shorts URL', () => {
      const url = 'https://www.youtube.com/shorts/dQw4w9WgXcQ';
      const id = youtubeService.extractVideoId(url);
      expect(id).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from mobile URL', () => {
      const url = 'https://m.youtube.com/watch?v=dQw4w9WgXcQ';
      const id = youtubeService.extractVideoId(url);
      expect(id).toBe('dQw4w9WgXcQ');
    });

    it('should return null for invalid URL', () => {
      const url = 'https://example.com/video';
      const id = youtubeService.extractVideoId(url);
      expect(id).toBeNull();
    });

    it('should extract video ID from URL with multiple parameters', () => {
      const url = 'https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ';
      const id = youtubeService.extractVideoId(url);
      expect(id).toBe('dQw4w9WgXcQ');
    });
  });

  describe('getVideoAnalytics', () => {
    it('should throw ServiceNotConfiguredException when not enabled', async () => {
      mockConfigService.get.mockReturnValue(undefined);
      const service = new YouTubeService(mockConfigService);

      await expect(
        service.getVideoAnalytics('https://www.youtube.com/watch?v=test123')
      ).rejects.toThrow(ServiceNotConfiguredException);
    });

    it('should throw InvalidUrlException for invalid URL', async () => {
      await expect(
        youtubeService.getVideoAnalytics('https://example.com/video')
      ).rejects.toThrow(InvalidUrlException);
    });
  });
});
