/**
 * Benchmarks API Route
 * GET /api/benchmarks - Get benchmarks for all niches
 * POST /api/benchmarks/calculate - Recalculate benchmarks
 * Phase 2.1: Competitive Intelligence
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import BenchmarkService from "@/lib/services/benchmark";
import { VideoNiche, Platform } from "@prisma/client";
import { checkTierAccess } from "@/lib/utils/tier-access";

// GET /api/benchmarks?platform=YOUTUBE&niche=GAMING
// Fetch benchmark data for a specific platform and niche
export async function GET(request: NextRequest) {
  try {
    // Check tier access
    const tierCheck = await checkTierAccess("BENCHMARK_COMPARISONS");
    if (!tierCheck.hasAccess) {
      return tierCheck.error!;
    }
    const platform = (request.nextUrl.searchParams.get("platform") ||
      "YOUTUBE") as Platform;
    const niche = (request.nextUrl.searchParams.get("niche") ||
      "GAMING") as VideoNiche;

    // Validate inputs
    const validPlatforms = ["YOUTUBE", "INSTAGRAM", "VIMEO", "OTHER"];
    const validNiches = [
      "GAMING",
      "TECH",
      "BEAUTY",
      "VLOGS",
      "EDUCATION",
      "MUSIC",
      "SPORTS",
      "ENTERTAINMENT",
      "COOKING",
      "TRAVEL",
      "BUSINESS",
      "HEALTH",
      "OTHER",
    ];

    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: "Invalid platform", validPlatforms },
        { status: 400 },
      );
    }

    if (!validNiches.includes(niche)) {
      return NextResponse.json(
        { error: "Invalid niche", validNiches },
        { status: 400 },
      );
    }

    // Fetch benchmark
    const benchmark = await BenchmarkService.getBenchmark(platform, niche);

    if (!benchmark) {
      return NextResponse.json(
        {
          error: "No benchmark data available",
          message: `Benchmark not yet calculated for ${platform} - ${niche}. Please try again later.`,
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: benchmark,
    });
  } catch (error) {
    console.error("Benchmarks API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch benchmarks" },
      { status: 500 },
    );
  }
}

// POST /api/benchmarks/calculate
// Recalculate benchmarks for a specific platform and niche
// Requires admin or system access
export async function POST(request: NextRequest) {
  try {
    // Check tier access
    const tierCheck = await checkTierAccess("BENCHMARK_COMPARISONS");
    if (!tierCheck.hasAccess) {
      return tierCheck.error!;
    }

    const body = await request.json();
    const { platform, niche } = body as {
      platform?: Platform;
      niche?: VideoNiche;
    };

    if (!platform || !niche) {
      return NextResponse.json(
        { error: "Platform and niche are required" },
        { status: 400 },
      );
    }

    // Calculate benchmark
    const benchmark = await BenchmarkService.calculateNicheBenchmark(
      platform,
      niche,
    );

    if (!benchmark) {
      return NextResponse.json(
        { error: "Failed to calculate benchmark" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: benchmark,
        message: `Benchmark calculated for ${platform} - ${niche} with ${benchmark.sampleSize} videos`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Benchmark calculation error:", error);
    return NextResponse.json(
      { error: "Failed to calculate benchmark" },
      { status: 500 },
    );
  }
}
