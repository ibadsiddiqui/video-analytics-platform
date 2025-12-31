/**
 * Analytics Controller
 * Handles all video analytics endpoints
 */

import {
  JsonController,
  Post,
  Get,
  Body,
  QueryParam,
  Param,
  HttpCode,
} from 'routing-controllers';
import { Service } from 'typedi';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { AnalyzeVideoUseCase } from '@application/use-cases/AnalyzeVideoUseCase';
import { CompareVideosUseCase } from '@application/use-cases/CompareVideosUseCase';
import { GetVideoHistoryUseCase } from '@application/use-cases/GetVideoHistoryUseCase';
import { DetectPlatformUseCase } from '@application/use-cases/DetectPlatformUseCase';
import { AnalyzeVideoRequest } from '@application/dtos/AnalyzeVideoRequest';
import { CompareVideosRequest } from '@application/dtos/CompareVideosRequest';
import { DetectPlatformRequest } from '@application/dtos/DetectPlatformRequest';
import { VideoAnalyticsResponse } from '@application/dtos/VideoAnalyticsResponse';
import { DetectPlatformResponse } from '@application/dtos/DetectPlatformResponse';

@Service()
@JsonController()
export class AnalyticsController {
  constructor(
    private readonly analyzeVideoUseCase: AnalyzeVideoUseCase,
    private readonly compareVideosUseCase: CompareVideosUseCase,
    private readonly getVideoHistoryUseCase: GetVideoHistoryUseCase,
    private readonly detectPlatformUseCase: DetectPlatformUseCase
  ) {}

  /**
   * POST /analyze
   * Analyze a single video from any supported platform
   */
  @Post('/analyze')
  @HttpCode(200)
  @OpenAPI({
    summary: 'Analyze Video (POST)',
    description: 'Analyze a video from YouTube or Instagram with detailed analytics including metrics, sentiment, and engagement data',
    tags: ['Analytics'],
  })
  @ResponseSchema(VideoAnalyticsResponse)
  async analyzeVideo(@Body() request: AnalyzeVideoRequest): Promise<any> {
    const result = await this.analyzeVideoUseCase.execute(request.url, {
      skipCache: request.skipCache,
      includeSentiment: request.includeSentiment,
      includeKeywords: request.includeKeywords,
      apiKey: request.apiKey,
    });

    return {
      success: true,
      data: result,
    };
  }

  /**
   * GET /analyze?url=...
   * Analyze a single video using query parameters
   */
  @Get('/analyze')
  @HttpCode(200)
  @OpenAPI({
    summary: 'Analyze Video (GET)',
    description: 'Analyze a video from YouTube or Instagram using query parameters',
    tags: ['Analytics'],
    parameters: [
      {
        in: 'query',
        name: 'url',
        required: true,
        description: 'Video URL (YouTube or Instagram)',
        schema: { type: 'string', example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
      },
      {
        in: 'query',
        name: 'skipCache',
        required: false,
        description: 'Skip cache and fetch fresh data',
        schema: { type: 'boolean', default: false },
      },
      {
        in: 'query',
        name: 'includeSentiment',
        required: false,
        description: 'Include sentiment analysis',
        schema: { type: 'boolean', default: true },
      },
      {
        in: 'query',
        name: 'includeKeywords',
        required: false,
        description: 'Include keyword extraction',
        schema: { type: 'boolean', default: true },
      },
    ],
  })
  @ResponseSchema(VideoAnalyticsResponse)
  async analyzeVideoByQuery(
    @QueryParam('url', { required: true }) url: string,
    @QueryParam('skipCache') skipCache?: boolean | string,
    @QueryParam('includeSentiment') includeSentiment?: boolean | string,
    @QueryParam('includeKeywords') includeKeywords?: boolean | string
  ): Promise<any> {
    const result = await this.analyzeVideoUseCase.execute(url, {
      skipCache: skipCache === true || skipCache === 'true',
      includeSentiment: includeSentiment !== false && includeSentiment !== 'false',
      includeKeywords: includeKeywords !== false && includeKeywords !== 'false',
    });

    return {
      success: true,
      data: result,
    };
  }

  /**
   * POST /compare
   * Compare multiple videos side-by-side
   */
  @Post('/compare')
  @HttpCode(200)
  async compareVideos(
    @Body() request: CompareVideosRequest
  ): Promise<any> {
    const result = await this.compareVideosUseCase.execute(request.urls);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * GET /history/:videoId
   * Get historical analytics data for tracking growth
   */
  @Get('/history/:videoId')
  @HttpCode(200)
  async getVideoHistory(
    @Param('videoId') videoId: string,
    @QueryParam('days') days?: number
  ): Promise<any> {
    const result = await this.getVideoHistoryUseCase.execute(
      videoId,
      days ? parseInt(days.toString()) : 7
    );
    return {
      success: true,
      data: result,
    };
  }

  /**
   * POST /detect-platform
   * Detect which platform a URL belongs to
   */
  @Post('/detect-platform')
  @HttpCode(200)
  async detectPlatform(
    @Body() request: DetectPlatformRequest
  ): Promise<any> {
    const result = this.detectPlatformUseCase.execute(request.url);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * GET /detect-platform?url=...
   * Detect platform using query parameters
   */
  @Get('/detect-platform')
  @HttpCode(200)
  @OpenAPI({
    summary: 'Detect Platform',
    description: 'Detect which platform a video URL belongs to',
    tags: ['Analytics'],
    parameters: [
      {
        in: 'query',
        name: 'url',
        required: true,
        description: 'Video URL',
        schema: { type: 'string', example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
      },
    ],
  })
  @ResponseSchema(DetectPlatformResponse)
  async detectPlatformByQuery(
    @QueryParam('url', { required: true }) url: string
  ): Promise<any> {
    const result = this.detectPlatformUseCase.execute(url);
    return {
      success: true,
      data: result,
    };
  }
}
