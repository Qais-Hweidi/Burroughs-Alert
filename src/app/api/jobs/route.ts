/**
 * Job System API Routes - Control and monitor background jobs via HTTP
 * POST /api/jobs - Start/stop job system or trigger individual jobs
 * GET /api/jobs - Get job system status and health
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getJobSystemStatus,
  triggerJob,
  startBackgroundJobs,
  stopBackgroundJobs,
  isJobSystemStarted,
} from '@/lib/jobs/startup';
import { checkDatabaseHealth } from '@/lib/database/index';

// ================================
// GET - Status and Health
// ================================

export async function GET(): Promise<NextResponse> {
  try {
    // Get job system status
    const jobStatus = getJobSystemStatus();

    // Get database health
    const dbHealth = await checkDatabaseHealth();

    return NextResponse.json({
      success: true,
      data: {
        jobSystem: {
          started: isJobSystemStarted,
          ...jobStatus,
        },
        database: dbHealth,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to get job status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get job system status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ================================
// POST - Control Actions
// ================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { action, jobType } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'start':
        if (isJobSystemStarted) {
          return NextResponse.json({
            success: true,
            message: 'Job system already running',
          });
        }

        await startBackgroundJobs();
        return NextResponse.json({
          success: true,
          message: 'Job system started successfully',
        });

      case 'stop':
        if (!isJobSystemStarted) {
          return NextResponse.json({
            success: true,
            message: 'Job system not running',
          });
        }

        await stopBackgroundJobs();
        return NextResponse.json({
          success: true,
          message: 'Job system stopped successfully',
        });

      case 'trigger':
        if (!jobType) {
          return NextResponse.json(
            { success: false, error: 'jobType required for trigger action' },
            { status: 400 }
          );
        }

        if (!['scraper', 'matcher', 'cleanup'].includes(jobType)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid jobType. Must be: scraper, matcher, or cleanup',
            },
            { status: 400 }
          );
        }

        if (!isJobSystemStarted) {
          return NextResponse.json(
            { success: false, error: 'Job system not started' },
            { status: 400 }
          );
        }

        await triggerJob(jobType);
        return NextResponse.json({
          success: true,
          message: `${jobType} job triggered successfully`,
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action. Must be: start, stop, or trigger',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Job API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Job operation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
