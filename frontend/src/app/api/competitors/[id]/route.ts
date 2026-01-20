/**
 * Individual Competitor API Route
 * DELETE /api/competitors/[id] - Remove competitor
 * GET /api/competitors/[id] - Get competitor details
 * Phase 2.1: Competitor Tracking
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import CompetitorService from "@/lib/services/competitor";
import { checkTierAccess } from "@/lib/utils/tier-access";

// DELETE /api/competitors/[id]
// Remove competitor from tracking
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Check tier access
    const tierCheck = await checkTierAccess("COMPETITOR_TRACKING");
    if (!tierCheck.hasAccess) {
      return tierCheck.error!;
    }

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;

    // Verify competitor ownership
    const competitor = await prisma.competitorTrack.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!competitor) {
      return NextResponse.json(
        { error: "Competitor not found" },
        { status: 404 },
      );
    }

    // Remove competitor
    await CompetitorService.removeCompetitor(user.id, id);

    return NextResponse.json({
      success: true,
      message: "Competitor removed from tracking",
    });
  } catch (error: any) {
    console.error("Delete competitor error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove competitor" },
      { status: 500 },
    );
  }
}

// GET /api/competitors/[id]
// Get competitor details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Check tier access
    const tierCheck = await checkTierAccess("COMPETITOR_TRACKING");
    if (!tierCheck.hasAccess) {
      return tierCheck.error!;
    }

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;
    const days = parseInt(request.nextUrl.searchParams.get("days") || "30", 10);

    // Get competitor with history
    const competitorWithHistory =
      await CompetitorService.getCompetitorWithHistory(
        user.id,
        id,
        Math.min(days, 365), // Cap at 1 year of history
      );

    return NextResponse.json({
      success: true,
      data: competitorWithHistory,
    });
  } catch (error: any) {
    console.error("Get competitor error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch competitor" },
      { status: 500 },
    );
  }
}
