/**
 * POST /api/detect-platform
 * GET /api/detect-platform?url=...
 * Detect which platform a URL belongs to
 */

import { NextRequest, NextResponse } from "next/server";
import { detectPlatformUseCase } from "@/lib/use-cases";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 },
      );
    }

    const result = detectPlatformUseCase.execute(url);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Detect platform error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to detect platform",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 },
      );
    }

    const result = detectPlatformUseCase.execute(url);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Detect platform error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to detect platform",
      },
      { status: 500 },
    );
  }
}
