import { Service } from 'typedi';
import * as dotenv from 'dotenv';
import {
  IConfigService,
  DatabaseConfig,
  UpstashConfig,
  YouTubeConfig,
  RapidApiConfig,
  RateLimitConfig,
} from '@domain/interfaces';

// Load environment variables
dotenv.config();

/**
 * Configuration Service Implementation
 * Provides centralized access to environment configuration
 */
@Service()
export class ConfigService implements IConfigService {
  private readonly config: {
    port: number;
    nodeEnv: string;
    databaseUrl: string;
    upstash: {
      url: string;
      token: string;
    };
    youtube: {
      apiKey: string;
    };
    rapidApi: {
      key?: string;
    };
    frontendUrl: string;
    rateLimit: {
      windowMs: number;
      maxRequests: number;
    };
    cacheTtl: number;
    encryptionKey?: string;
  };

  constructor() {
    this.config = {
      port: parseInt(process.env.PORT || '3001', 10),
      nodeEnv: process.env.NODE_ENV || 'development',
      databaseUrl: process.env.DATABASE_URL || '',
      upstash: {
        url: process.env.UPSTASH_REDIS_REST_URL || '',
        token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
      },
      youtube: {
        apiKey: process.env.YOUTUBE_API_KEY || '',
      },
      rapidApi: {
        key: process.env.RAPIDAPI_KEY,
      },
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
      },
      cacheTtl: parseInt(process.env.CACHE_TTL_SECONDS || '3600', 10),
      encryptionKey: process.env.ENCRYPTION_KEY,
    };

    // Validate required configuration on initialization
    this.validateRequiredConfig();
  }

  getPort(): number {
    return this.config.port;
  }

  getNodeEnv(): string {
    return this.config.nodeEnv;
  }

  isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  getDatabaseConfig(): DatabaseConfig {
    return {
      url: this.config.databaseUrl,
    };
  }

  getUpstashConfig(): UpstashConfig {
    return {
      url: this.config.upstash.url,
      token: this.config.upstash.token,
    };
  }

  getYouTubeConfig(): YouTubeConfig {
    return {
      apiKey: this.config.youtube.apiKey,
    };
  }

  getRapidApiConfig(): RapidApiConfig {
    return {
      key: this.config.rapidApi.key,
    };
  }

  getFrontendUrl(): string {
    return this.config.frontendUrl;
  }

  getRateLimitConfig(): RateLimitConfig {
    return {
      windowMs: this.config.rateLimit.windowMs,
      maxRequests: this.config.rateLimit.maxRequests,
    };
  }

  getCacheTtl(): number {
    return this.config.cacheTtl;
  }

  /**
   * Get raw environment variable
   */
  get(key: string): string | undefined {
    return process.env[key];
  }

  /**
   * Get environment variable as number with optional default
   */
  getNumber(key: string, defaultValue: number = 0): number {
    const value = process.env[key];
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Validate required environment variables
   * Throws error if any required config is missing
   */
  validateRequiredConfig(): void {
    const required: Array<[string, string]> = [
      ['DATABASE_URL', this.config.databaseUrl],
      ['UPSTASH_REDIS_REST_URL', this.config.upstash.url],
      ['UPSTASH_REDIS_REST_TOKEN', this.config.upstash.token],
      ['YOUTUBE_API_KEY', this.config.youtube.apiKey],
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
