import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import {
  IConfigService,
  DatabaseConfig,
  UpstashConfig,
  YouTubeConfig,
  RapidApiConfig,
  RateLimitConfig,
} from '@domain/interfaces';

/**
 * Configuration Service Implementation
 * Provides centralized access to environment configuration
 */
@Injectable()
export class ConfigService implements IConfigService {
  constructor(private readonly nestConfigService: NestConfigService) {
    // Validate required configuration on initialization
    this.validateRequiredConfig();
  }

  getPort(): number {
    return this.nestConfigService.get<number>('PORT', 3001);
  }

  getNodeEnv(): string {
    return this.nestConfigService.get<string>('NODE_ENV', 'development');
  }

  isProduction(): boolean {
    return this.getNodeEnv() === 'production';
  }

  isDevelopment(): boolean {
    return this.getNodeEnv() === 'development';
  }

  getDatabaseConfig(): DatabaseConfig {
    return {
      url: this.nestConfigService.get<string>('DATABASE_URL', ''),
    };
  }

  getUpstashConfig(): UpstashConfig {
    return {
      url: this.nestConfigService.get<string>('UPSTASH_REDIS_REST_URL', ''),
      token: this.nestConfigService.get<string>('UPSTASH_REDIS_REST_TOKEN', ''),
    };
  }

  getYouTubeConfig(): YouTubeConfig {
    return {
      apiKey: this.nestConfigService.get<string>('YOUTUBE_API_KEY', ''),
    };
  }

  getRapidApiConfig(): RapidApiConfig {
    return {
      key: this.nestConfigService.get<string>('RAPIDAPI_KEY'),
    };
  }

  getFrontendUrl(): string {
    return this.nestConfigService.get<string>('FRONTEND_URL', 'http://localhost:3000');
  }

  getRateLimitConfig(): RateLimitConfig {
    return {
      windowMs: this.nestConfigService.get<number>('RATE_LIMIT_WINDOW_MS', 900000),
      maxRequests: this.nestConfigService.get<number>('RATE_LIMIT_MAX_REQUESTS', 100),
    };
  }

  getCacheTtl(): number {
    return this.nestConfigService.get<number>('CACHE_TTL_SECONDS', 3600);
  }

  /**
   * Get raw environment variable
   */
  get(key: string): string | undefined {
    return this.nestConfigService.get<string>(key);
  }

  /**
   * Get environment variable as number with optional default
   */
  getNumber(key: string, defaultValue: number = 0): number {
    return this.nestConfigService.get<number>(key, defaultValue);
  }

  /**
   * Validate required environment variables
   * Throws error if any required config is missing
   */
  validateRequiredConfig(): void {
    const required: Array<[string, string]> = [
      ['DATABASE_URL', this.getDatabaseConfig().url],
      ['UPSTASH_REDIS_REST_URL', this.getUpstashConfig().url],
      ['UPSTASH_REDIS_REST_TOKEN', this.getUpstashConfig().token],
      ['YOUTUBE_API_KEY', this.getYouTubeConfig().apiKey],
    ];

    const missing = required.filter(([, value]) => !value);

    if (missing.length > 0) {
      const missingVars = missing.map(([name]) => name).join(', ');
      throw new Error(
        `Missing required environment variables: ${missingVars}. Please check your .env file.`
      );
    }

    console.log('✅ Configuration validated successfully');
  }
}
