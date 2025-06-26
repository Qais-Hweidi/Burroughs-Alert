/**
 * Job System Control API Route - Manual job system control
 * Status: ✅ IMPLEMENTED - Job system management endpoint
 * Purpose: Manually start/stop job system and trigger individual jobs
 * Endpoints:
 * - POST /api/system/jobs - Start/stop job system or trigger specific jobs
 * - GET /api/system/jobs - Get job system status
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  startBackgroundJobs,
  stopBackgroundJobs,
  getJobSystemStatus,
  triggerJob,
} from '@/lib/jobs/startup';

/**
 * GET /api/system/jobs
 * Returns job system status
 */
export async function GET(request: NextRequest) {
  try {
    const status = getJobSystemStatus();

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Job status check error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get job status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/system/jobs
 * Control job system or trigger individual jobs
 *
 * Body options:
 * - { action: 'start' } - Start job system
 * - { action: 'stop' } - Stop job system
 * - { action: 'trigger', job: 'scraper' | 'matcher' | 'cleanup' } - Trigger specific job
 * - { action: 'status' } - Get status (same as GET)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, job } = body;

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing action parameter',
          validActions: ['start', 'stop', 'trigger', 'status'],
        },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'start':
        await startBackgroundJobs();
        result = { message: 'Job system started' };
        break;

      case 'stop':
        await stopBackgroundJobs();
        result = { message: 'Job system stopped' };
        break;

      case 'trigger':
        if (!job) {
          return NextResponse.json(
            {
              success: false,
              error: 'Missing job parameter for trigger action',
              validJobs: ['scraper', 'matcher', 'cleanup'],
            },
            { status: 400 }
          );
        }

        if (!['scraper', 'matcher', 'cleanup'].includes(job)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid job type',
              validJobs: ['scraper', 'matcher', 'cleanup'],
            },
            { status: 400 }
          );
        }

        await triggerJob(job as 'scraper' | 'matcher' | 'cleanup');
        result = { message: `${job} job triggered` };
        break;

      case 'status':
        result = getJobSystemStatus();
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
            validActions: ['start', 'stop', 'trigger', 'status'],
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Job control error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Job control operation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
