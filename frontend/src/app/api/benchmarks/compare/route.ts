/**
 * Video Comparison API Route
 * POST /api/benchmarks/compare - Compare a video against its niche benchmark
 * Phase 2.1: Competitive Intelligence
 */

import { NextRequest, NextResponse } from "next/server";
import BenchmarkService from "@/lib/services/benchmark";
import { prisma } from "@/lib/prisma";
import { checkTierAccess } from "@/lib/utils/tier-access";

export async function POST(request: NextRequest) {
  try {
    // Check tier access
    const tierCheck = await checkTierAccess("BENCHMARK_COMPARISONS");
    if (!tierCheck.hasAccess) {
      return tierCheck.error!;
    }

    const body = await request.json();
    const { videoId } = body as { videoId?: string };

    if (!videoId) {
      return NextResponse.json(
        { error: "videoId is required" },
        { status: 400 },
      );
    }

    // Verify video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Compare video to benchmark
    const comparison = await BenchmarkService.compareVideoToBenchmark(videoId);

    if (!comparison) {
      return NextResponse.json(
        { error: "Unable to compare video to benchmark" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    console.error("Video comparison error:", error);
    return NextResponse.json(
      { error: "Failed to compare video to benchmark" },
      { status: 500 },
    );
  }
}
