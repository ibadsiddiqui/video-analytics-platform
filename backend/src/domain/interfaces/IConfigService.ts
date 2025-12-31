/**
 * Configuration Service Interface
 * Defines contract for accessing application configuration
 */

export interface DatabaseConfig {
  url: string;
}

export interface UpstashConfig {
  url: string;
  token: string;
}

export interface YouTubeConfig {
  apiKey: string;
}

export interface RapidApiConfig {
  key?: string;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface IConfigService {
  // Server
  getPort(): number;
  getNodeEnv(): string;
  isProduction(): boolean;
  isDevelopment(): boolean;

  // Database
  getDatabaseConfig(): DatabaseConfig;

  // Cache
  getUpstashConfig(): UpstashConfig;

  // APIs
  getYouTubeConfig(): YouTubeConfig;
  getRapidApiConfig(): RapidApiConfig;

  // App Settings
  getFrontendUrl(): string;
  getRateLimitConfig(): RateLimitConfig;
  getCacheTtl(): number;

  // Generic getters
  get(key: string): string | undefined;
  getNumber(key: string, defaultValue?: number): number;

  // Validation
  validateRequiredConfig(): void;
}
