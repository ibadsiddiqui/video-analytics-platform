/**
 * POST /api/compare
 * Compare multiple videos side-by-side
 */

import { NextRequest, NextResponse } from 'next/server';
import { compareVideosUseCase } from '@/lib/use-cases';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { success: false, error: 'URLs array is required' },
        { status: 400 }
      );
    }

    if (urls.length > 10) {
      return NextResponse.json(
        { success: false, error: 'Maximum 10 videos can be compared at once' },
        { status: 400 }
      );
    }

    const result = await compareVideosUseCase.execute(urls);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Compare videos error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to compare videos',
      },
      { status: 500 }
    );
  }
}
