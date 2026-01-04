/**
 * Analytics Controller
 * Handles all video analytics endpoints
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  HttpCode,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AnalyzeVideoUseCase } from '@application/use-cases/AnalyzeVideoUseCase';
import { CompareVideosUseCase } from '@application/use-cases/CompareVideosUseCase';
import { GetVideoHistoryUseCase } from '@application/use-cases/GetVideoHistoryUseCase';
import { DetectPlatformUseCase } from '@application/use-cases/DetectPlatformUseCase';
import { AnalyzeVideoRequest } from '@application/dtos/AnalyzeVideoRequest';
import { CompareVideosRequest } from '@application/dtos/CompareVideosRequest';
import { DetectPlatformRequest } from '@application/dtos/DetectPlatformRequest';
import { VideoAnalyticsResponse } from '@application/dtos/VideoAnalyticsResponse';
import { DetectPlatformResponse } from '@application/dtos/DetectPlatformResponse';
import { OptionalAuthGuard } from '@presentation/guards/optional-auth.guard';
import { AnonymousRateLimitInterceptor } from '@presentation/interceptors/anonymous-rate-limit.interceptor';
import { AuthRequest } from '@presentation/guards/auth.guard';

@ApiTags('Analytics')
@Controller()
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
  @Post('analyze')
  @HttpCode(200)
  @UseGuards(OptionalAuthGuard)
  @UseInterceptors(AnonymousRateLimitInterceptor)
  @ApiOperation({
    summary: 'Analyze Video (POST)',
    description: 'Analyze a video from YouTube or Instagram with detailed analytics including metrics, sentiment, and engagement data',
  })
  @ApiResponse({
    status: 200,
    description: 'Video analysis completed successfully',
    type: VideoAnalyticsResponse,
  })
  async analyzeVideo(@Body() request: AnalyzeVideoRequest, @Req() req: AuthRequest): Promise<any> {
    const result = await this.analyzeVideoUseCase.execute(request.url, {
      skipCache: request.skipCache,
      includeSentiment: request.includeSentiment,
      includeKeywords: request.includeKeywords,
      apiKey: request.apiKey,
      userId: req.auth?.userId,
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
  @Get('analyze')
  @HttpCode(200)
  @UseGuards(OptionalAuthGuard)
  @UseInterceptors(AnonymousRateLimitInterceptor)
  @ApiOperation({
    summary: 'Analyze Video (GET)',
    description: 'Analyze a video from YouTube or Instagram using query parameters',
  })
  @ApiQuery({
    name: 'url',
    required: true,
    description: 'Video URL (YouTube or Instagram)',
    schema: { type: 'string', example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  })
  @ApiQuery({
    name: 'skipCache',
    required: false,
    description: 'Skip cache and fetch fresh data',
    schema: { type: 'boolean', default: false },
  })
  @ApiQuery({
    name: 'includeSentiment',
    required: false,
    description: 'Include sentiment analysis',
    schema: { type: 'boolean', default: true },
  })
  @ApiQuery({
    name: 'includeKeywords',
    required: false,
    description: 'Include keyword extraction',
    schema: { type: 'boolean', default: true },
  })
  @ApiResponse({
    status: 200,
    description: 'Video analysis completed successfully',
    type: VideoAnalyticsResponse,
  })
  async analyzeVideoByQuery(
    @Query('url') url: string,
    @Query('skipCache') skipCache?: string | boolean,
    @Query('includeSentiment') includeSentiment?: string | boolean,
    @Query('includeKeywords') includeKeywords?: string | boolean,
    @Req() req?: AuthRequest
  ): Promise<any> {
    const result = await this.analyzeVideoUseCase.execute(url, {
      skipCache: skipCache === true || skipCache === 'true',
      includeSentiment: includeSentiment !== false && includeSentiment !== 'false',
      includeKeywords: includeKeywords !== false && includeKeywords !== 'false',
      userId: req?.auth?.userId,
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
  @Post('compare')
  @HttpCode(200)
  @UseGuards(OptionalAuthGuard)
  @UseInterceptors(AnonymousRateLimitInterceptor)
  @ApiOperation({
    summary: 'Compare Videos',
    description: 'Compare multiple videos side-by-side',
  })
  @ApiResponse({
    status: 200,
    description: 'Video comparison completed successfully',
  })
  async compareVideos(@Body() request: CompareVideosRequest): Promise<any> {
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
  @Get('history/:videoId')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Get Video History',
    description: 'Get historical analytics data for tracking growth',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days of history to retrieve',
    schema: { type: 'number', default: 7 },
  })
  @ApiResponse({
    status: 200,
    description: 'Video history retrieved successfully',
  })
  async getVideoHistory(
    @Param('videoId') videoId: string,
    @Query('days') days?: number
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
  @Post('detect-platform')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Detect Platform (POST)',
    description: 'Detect which platform a video URL belongs to',
  })
  @ApiResponse({
    status: 200,
    description: 'Platform detected successfully',
    type: DetectPlatformResponse,
  })
  async detectPlatform(@Body() request: DetectPlatformRequest): Promise<any> {
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
  @Get('detect-platform')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Detect Platform (GET)',
    description: 'Detect which platform a video URL belongs to',
  })
  @ApiQuery({
    name: 'url',
    required: true,
    description: 'Video URL',
    schema: { type: 'string', example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  })
  @ApiResponse({
    status: 200,
    description: 'Platform detected successfully',
    type: DetectPlatformResponse,
  })
  async detectPlatformByQuery(@Query('url') url: string): Promise<any> {
    const result = this.detectPlatformUseCase.execute(url);
    return {
      success: true,
      data: result,
    };
  }
}
