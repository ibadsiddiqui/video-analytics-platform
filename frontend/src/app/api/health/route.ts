/**
 * GET /api/health
 * Health check endpoint for monitoring
 */

import { NextResponse } from "next/server";
import { configService } from "@/lib/config";

export async function GET() {
  try {
    const dbConfig = configService.getDatabaseConfig();
    const cacheConfig = configService.getUpstashConfig();
    const youtubeConfig = configService.getYoutubeApiKey();

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "2.0.0-nextjs",
      environment: configService.getNodeEnv(),
      services: {
        database: dbConfig.url ? "✅ Configured" : "❌ Not configured",
        cache:
          cacheConfig.url && cacheConfig.token
            ? "✅ Configured"
            : "❌ Not configured",
        youtube: youtubeConfig ? "✅ Configured" : "❌ Not configured",
      },
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
