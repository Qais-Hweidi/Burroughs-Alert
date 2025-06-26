/**
 * System Status API Route - Provides app and job system status
 * Status: ✅ IMPLEMENTED - System monitoring and control endpoint
 * Purpose: Monitor app health and job system status
 * Endpoints:
 * - GET /api/system/status - Get overall system status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAppHealth } from '@/lib/app-init';

/**
 * GET /api/system/status
 * Returns comprehensive system status including app and job system health
 */
export async function GET(request: NextRequest) {
  try {
    const health = getAppHealth();

    return NextResponse.json({
      success: true,
      data: health,
    });
  } catch (error) {
    console.error('System status check error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get system status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
