/**
 * Configuration Service
 * Manages environment variables and app configuration
 */

export class ConfigService {
  // Database
  getDatabaseConfig() {
    return {
      url: process.env.DATABASE_URL || "",
    };
  }

  // Upstash Redis
  getUpstashConfig() {
    return {
      url: process.env.UPSTASH_REDIS_REST_URL || "",
      token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
    };
  }

  // YouTube API
  getYouTubeConfig() {
    return {
      apiKey: process.env.YOUTUBE_API_KEY || "",
    };
  }

  // Instagram API (RapidAPI)
  getInstagramConfig() {
    return {
      apiKey: process.env.RAPIDAPI_KEY || "",
    };
  }

  // Clerk Authentication
  getClerkConfig() {
    return {
      secretKey: process.env.CLERK_SECRET_KEY || "",
      publishableKey: process.env.CLERK_PUBLISHABLE_KEY || "",
      webhookSecret: process.env.CLERK_WEBHOOK_SECRET || "",
    };
  }

  // Cache settings
  getCacheTTL(): number {
    return parseInt(process.env.CACHE_TTL_SECONDS || "3600");
  }

  // Frontend URL for CORS
  getFrontendUrl(): string {
    return process.env.FRONTEND_URL || "http://localhost:3000";
  }

  // Node environment
  getNodeEnv(): string {
    return process.env.NODE_ENV || "development";
  }

  // Encryption key
  getEncryptionKey(): string {
    return process.env.ENCRYPTION_KEY || "";
  }
}

export const configService = new ConfigService();
