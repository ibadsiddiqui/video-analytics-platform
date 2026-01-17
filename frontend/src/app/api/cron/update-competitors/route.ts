/**
 * Competitor Update Cron Job
 * Runs daily to update all competitor metrics
 * POST /api/cron/update-competitors
 * Phase 2.1: Competitor Tracking
 *
 * Configure in vercel.json:
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/update-competitors",
 *       "schedule": "0 0 * * *"
 *     }
 *   ]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import CompetitorService from '@/lib/services/competitor';

// Verify cron secret for security
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid cron secret' },
        { status: 401 }
      );
    }

    // Fetch all active competitors
    const competitors = await prisma.competitorTrack.findMany({
      where: { isActive: true },
      select: { id: true, userId: true, channelName: true },
    });

    console.log(`[CRON] Starting competitor update for ${competitors.length} competitors`);

    let updated = 0;
    let failed = 0;

    // Update each competitor
    for (const competitor of competitors) {
      try {
        const success = await CompetitorService.updateCompetitorMetrics(competitor.id);
        if (success) {
          updated++;
          console.log(`[CRON] Updated: ${competitor.channelName}`);
        } else {
          failed++;
          console.warn(`[CRON] Failed to update: ${competitor.channelName}`);
        }
      } catch (error) {
        failed++;
        console.error(`[CRON] Error updating ${competitor.channelName}:`, error);
      }
    }

    // Log summary
    const summary = {
      total: competitors.length,
      updated,
      failed,
      timestamp: new Date().toISOString(),
    };

    console.log(`[CRON] Competitor update complete:`, summary);

    return NextResponse.json({
      success: true,
      message: 'Competitor metrics updated',
      summary,
    });
  } catch (error) {
    console.error('[CRON] Fatal error in competitor update:', error);
    return NextResponse.json(
      {
        error: 'Failed to update competitors',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
