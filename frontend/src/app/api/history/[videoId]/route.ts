/**
 * GET /api/history/:videoId
 * Get historical analytics data for tracking growth
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVideoHistoryUseCase } from '@/lib/use-cases';

export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { videoId } = params;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    if (!videoId) {
      return NextResponse.json(
        { success: false, error: 'Video ID is required' },
        { status: 400 }
      );
    }

    const result = await getVideoHistoryUseCase.execute(videoId, days);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get video history error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get video history',
      },
      { status: 500 }
    );
  }
}
