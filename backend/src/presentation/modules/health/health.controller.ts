import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheckResponse } from '@application/dtos';
import { ConfigService } from '@shared/config';

/**
 * Health Check Controller
 * Provides health check endpoint for monitoring
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly configService: ConfigService) {}

  /**
   * GET /health
   * Health check endpoint
   */
  @Get()
  @ApiOperation({
    summary: 'Health Check',
    description: 'Check the health status of the API and its dependencies',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      example: {
        status: 'healthy',
        timestamp: '2025-12-31T14:00:00.000Z',
        version: '2.0.0-typescript',
        environment: 'development',
        services: {
          database: '✅ Configured',
          cache: '✅ Configured',
          youtube: '✅ Configured',
        },
      },
    },
  })
  async check(): Promise<HealthCheckResponse> {
    // Check service configurations
    const dbConfig = this.configService.getDatabaseConfig();
    const cacheConfig = this.configService.getUpstashConfig();
    const youtubeConfig = this.configService.getYouTubeConfig();

    return new HealthCheckResponse(
      'healthy',
      '2.0.0-typescript',
      this.configService.getNodeEnv(),
      {
        database: dbConfig.url ? '✅ Configured' : '❌ Not configured',
        cache: cacheConfig.url && cacheConfig.token ? '✅ Configured' : '❌ Not configured',
        youtube: youtubeConfig.apiKey ? '✅ Configured' : '❌ Not configured',
      }
    );
  }
}
