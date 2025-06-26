/**
 * Job System Startup Utility - Initializes background jobs alongside Next.js app
 * Status: ✅ IMPLEMENTED - Startup integration for Next.js app
 * Purpose: Seamlessly start job system when Next.js app starts
 * Usage: Call startBackgroundJobs() in your app initialization
 */

import { startJobSystem, stopJobSystem, getJobSystem } from './index';

// ================================
// Startup Management
// ================================

let isStarted = false;

/**
 * Start background jobs - safe to call multiple times
 */
export async function startBackgroundJobs(): Promise<void> {
  if (isStarted) {
    console.log('Background jobs already started');
    return;
  }

  try {
    console.log('Initializing background job system...');

    // Check if we're in a suitable environment
    if (
      process.env.NODE_ENV === 'development' &&
      process.env.DISABLE_BACKGROUND_JOBS === 'true'
    ) {
      console.log('Background jobs disabled in development mode');
      return;
    }

    // Start the job system
    await startJobSystem();
    isStarted = true;

    console.log('Background job system started successfully');
  } catch (error) {
    console.error('Failed to start background jobs:', error);
    throw error;
  }
}

/**
 * Stop background jobs - safe to call multiple times
 */
export async function stopBackgroundJobs(): Promise<void> {
  if (!isStarted) {
    console.log('Background jobs not running');
    return;
  }

  try {
    console.log('Stopping background job system...');
    await stopJobSystem();
    isStarted = false;
    console.log('Background job system stopped');
  } catch (error) {
    console.error('Failed to stop background jobs:', error);
    throw error;
  }
}

/**
 * Get job system status
 */
export function getJobSystemStatus() {
  if (!isStarted) {
    return { running: false, message: 'Job system not started' };
  }

  try {
    const system = getJobSystem();
    const status = system.getStatus();
    return {
      running: status.isRunning,
      startTime: status.startTime,
      lastRuns: {
        scraper: status.lastScraperRun,
        matcher: status.lastMatcherRun,
        cleanup: status.lastCleanupRun,
        healthCheck: status.lastHealthCheck,
      },
      totalJobsRun: status.totalJobsRun,
      recentErrors: status.errors.slice(-5), // Last 5 errors
    };
  } catch (error) {
    return {
      running: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Manually trigger jobs (for testing/debugging)
 */
export async function triggerJob(
  jobType: 'scraper' | 'matcher' | 'cleanup'
): Promise<void> {
  if (!isStarted) {
    throw new Error('Job system not started');
  }

  const system = getJobSystem();

  switch (jobType) {
    case 'scraper':
      await system.runScraperNow();
      break;
    case 'matcher':
      await system.runMatcherNow();
      break;
    case 'cleanup':
      await system.runCleanupNow();
      break;
    default:
      throw new Error(`Unknown job type: ${jobType}`);
  }
}

// ================================
// Environment Checks
// ================================

/**
 * Check if current environment supports background jobs
 */
export function shouldRunBackgroundJobs(): boolean {
  // Don't run in test environment
  if (process.env.NODE_ENV === 'test') {
    return false;
  }

  // Check for explicit disable flag
  if (process.env.DISABLE_BACKGROUND_JOBS === 'true') {
    return false;
  }

  // Check for required environment variables
  const requiredEnvVars = ['DATABASE_URL'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.warn(`Missing required environment variable: ${envVar}`);
      return false;
    }
  }

  return true;
}

/**
 * Auto-start background jobs if environment is suitable
 */
export async function autoStartBackgroundJobs(): Promise<void> {
  if (shouldRunBackgroundJobs()) {
    await startBackgroundJobs();
  } else {
    console.log('Background jobs not started due to environment constraints');
  }
}

// ================================
// Exports
// ================================

export { isStarted as isJobSystemStarted };
