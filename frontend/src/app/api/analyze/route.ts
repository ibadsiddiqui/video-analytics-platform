/**
 * POST /api/analyze
 * GET /api/analyze?url=...
 * Analyze a single video from any supported platform
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzeVideoUseCase } from "@/lib/use-cases";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    // Optional authentication
    const { userId } = await auth();

    const body = await request.json();
    const {
      url,
      skipCache,
      includeSentiment,
      includeKeywords,
      youtubeApiKey,
      rapidApiKey,
    } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 },
      );
    }

    const result = await analyzeVideoUseCase.execute(url, {
      skipCache: skipCache || false,
      includeSentiment: includeSentiment !== false,
      includeKeywords: includeKeywords !== false,
      youtubeApiKey,
      rapidApiKey,
      userId: userId || undefined,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Analyze video error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to analyze video",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Optional authentication
    const { userId } = await auth();

    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const skipCache = searchParams.get("skipCache") === "true";
    const includeSentiment = searchParams.get("includeSentiment") !== "false";
    const includeKeywords = searchParams.get("includeKeywords") !== "false";

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 },
      );
    }

    const result = await analyzeVideoUseCase.execute(url, {
      skipCache,
      includeSentiment,
      includeKeywords,
      userId: userId || undefined,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Analyze video error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to analyze video",
      },
      { status: 500 },
    );
  }
}
