/**
 * Background Job System Entry Point - Orchestrates all background jobs for apartment alerts
 * Status: ✅ IMPLEMENTED - Complete job system with scheduler and monitoring
 * Job Types: Scraper (30-45min), Matcher (triggered), Notifier (triggered), Cleanup (daily), Health Check (5min)
 * Features: Sequential execution, error handling, graceful shutdown, monitoring
 */

import { runScraperJob, getScraperJobConfig } from './scraper-job';
import { runMatcherJob, getMatcherJobConfig } from './matcher-job';
import { runNotifierJob, getNotifierJobConfig } from './notifier-job';
import { runCleanupJob, getCleanupJobConfig } from './cleanup-job';
import { checkDatabaseHealth } from '../database/index';

// ================================
// Types
// ================================

export interface JobSystemConfig {
  scrapingIntervalMs: number;
  cleanupIntervalMs: number;
  healthCheckIntervalMs: number;
  enableHealthChecks: boolean;
  enableAutoCleanup: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface JobSystemStatus {
  isRunning: boolean;
  startTime: Date | null;
  lastScraperRun: Date | null;
  lastMatcherRun: Date | null;
  lastNotifierRun: Date | null;
  lastCleanupRun: Date | null;
  lastHealthCheck: Date | null;
  totalJobsRun: number;
  errors: string[];
}

// ================================
// Job System Class
// ================================

export class JobSystem {
  private config: JobSystemConfig;
  private status: JobSystemStatus;
  private intervals: {
    scraper: NodeJS.Timeout | null;
    cleanup: NodeJS.Timeout | null;
    healthCheck: NodeJS.Timeout | null;
  };
  private isShuttingDown: boolean = false;

  constructor(config?: Partial<JobSystemConfig>) {
    this.config = {
      scrapingIntervalMs: parseInt(process.env.SCRAPING_INTERVAL || '1800000'), // 30 minutes default
      cleanupIntervalMs: 24 * 60 * 60 * 1000, // 24 hours
      healthCheckIntervalMs: 5 * 60 * 1000, // 5 minutes
      enableHealthChecks: process.env.ENABLE_HEALTH_CHECKS !== 'false',
      enableAutoCleanup: process.env.ENABLE_AUTO_CLEANUP !== 'false',
      logLevel: (process.env.LOG_LEVEL as any) || 'info',
      ...config,
    };

    this.status = {
      isRunning: false,
      startTime: null,
      lastScraperRun: null,
      lastMatcherRun: null,
      lastNotifierRun: null,
      lastCleanupRun: null,
      lastHealthCheck: null,
      totalJobsRun: 0,
      errors: [],
    };

    this.intervals = {
      scraper: null,
      cleanup: null,
      healthCheck: null,
    };

    // Setup graceful shutdown
    this.setupGracefulShutdown();
  }

  // ================================
  // System Control
  // ================================

  /**
   * Start the job system
   */
  public async start(): Promise<void> {
    if (this.status.isRunning) {
      console.warn('Job system is already running');
      return;
    }

    console.log('Starting background job system...');
    this.status.isRunning = true;
    this.status.startTime = new Date();

    // Log configuration
    this.log(
      'info',
      `Job system started with config: ${JSON.stringify(
        {
          scrapingInterval: `${this.config.scrapingIntervalMs / 1000 / 60}min`,
          cleanupInterval: `${this.config.cleanupIntervalMs / 1000 / 60 / 60}h`,
          healthCheckInterval: `${this.config.healthCheckIntervalMs / 1000 / 60}min`,
          enableHealthChecks: this.config.enableHealthChecks,
          enableAutoCleanup: this.config.enableAutoCleanup,
        },
        null,
        2
      )}`
    );

    // Start scraper job with randomized interval
    this.scheduleScraperJob();

    // Start cleanup job if enabled
    if (this.config.enableAutoCleanup) {
      this.intervals.cleanup = setInterval(() => {
        this.runCleanupJobSafe();
      }, this.config.cleanupIntervalMs);
    }

    // Start health checks if enabled
    if (this.config.enableHealthChecks) {
      this.intervals.healthCheck = setInterval(() => {
        this.runHealthCheck();
      }, this.config.healthCheckIntervalMs);

      // Run initial health check
      setTimeout(() => this.runHealthCheck(), 1000);
    }

    console.log('Background job system started successfully');
  }

  /**
   * Stop the job system gracefully
   */
  public async stop(): Promise<void> {
    if (!this.status.isRunning) {
      console.warn('Job system is not running');
      return;
    }

    console.log('Stopping background job system...');
    this.isShuttingDown = true;

    // Clear all intervals
    if (this.intervals.scraper) {
      clearTimeout(this.intervals.scraper);
      this.intervals.scraper = null;
    }
    if (this.intervals.cleanup) {
      clearInterval(this.intervals.cleanup);
      this.intervals.cleanup = null;
    }
    if (this.intervals.healthCheck) {
      clearInterval(this.intervals.healthCheck);
      this.intervals.healthCheck = null;
    }

    this.status.isRunning = false;
    console.log('Background job system stopped');
  }

  /**
   * Get current system status
   */
  public getStatus(): JobSystemStatus {
    return { ...this.status };
  }

  // ================================
  // Job Execution
  // ================================

  /**
   * Schedule next scraper job with randomized interval
   */
  private scheduleScraperJob(): void {
    if (this.isShuttingDown) return;

    // Add randomization: base interval ± 25%
    const randomFactor = 0.75 + Math.random() * 0.5; // 0.75 to 1.25
    const randomizedInterval = Math.floor(
      this.config.scrapingIntervalMs * randomFactor
    );

    this.intervals.scraper = setTimeout(async () => {
      await this.runScraperJobSafe();
      this.scheduleScraperJob(); // Schedule next run
    }, randomizedInterval);

    const nextRunTime = new Date(Date.now() + randomizedInterval);
    this.log(
      'info',
      `Next scraper job scheduled for ${nextRunTime.toLocaleTimeString()} (in ${Math.round(randomizedInterval / 1000 / 60)} minutes)`
    );
  }

  /**
   * Run scraper job with error handling
   */
  private async runScraperJobSafe(): Promise<void> {
    if (this.isShuttingDown) return;

    try {
      this.log('info', 'Starting scraper job...');
      const config = getScraperJobConfig();
      const result = await runScraperJob(config);

      this.status.lastScraperRun = new Date();
      this.status.totalJobsRun++;

      if (result.success) {
        this.log(
          'info',
          `Scraper job completed successfully: ${result.newListingsCount} new listings`
        );

        // Run matcher job if we have new listings
        if (result.newListingsCount > 0) {
          await this.runMatcherJobSafe();
        }

        // Always run notifier job to process any pending notifications
        await this.runNotifierJobSafe();
      } else {
        this.log('error', `Scraper job failed: ${result.errors.join(', ')}`);
        this.status.errors.push(
          `Scraper: ${new Date().toISOString()} - ${result.errors.join(', ')}`
        );
      }
    } catch (error) {
      const errorMsg = `Scraper job crashed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.log('error', errorMsg);
      this.status.errors.push(
        `Scraper: ${new Date().toISOString()} - ${errorMsg}`
      );
    }
  }

  /**
   * Run matcher job with error handling
   */
  private async runMatcherJobSafe(): Promise<void> {
    if (this.isShuttingDown) return;

    try {
      this.log('info', 'Starting matcher job...');
      const config = getMatcherJobConfig();
      const result = await runMatcherJob(config);

      this.status.lastMatcherRun = new Date();
      this.status.totalJobsRun++;

      if (result.success) {
        this.log(
          'info',
          `Matcher job completed successfully: ${result.matchesFound} matches, ${result.notificationsGenerated} notifications`
        );

        // Run notifier job after successful matching
        await this.runNotifierJobSafe();
      } else {
        this.log('error', `Matcher job failed: ${result.errors.join(', ')}`);
        this.status.errors.push(
          `Matcher: ${new Date().toISOString()} - ${result.errors.join(', ')}`
        );
      }
    } catch (error) {
      const errorMsg = `Matcher job crashed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.log('error', errorMsg);
      this.status.errors.push(
        `Matcher: ${new Date().toISOString()} - ${errorMsg}`
      );
    }
  }

  /**
   * Run notifier job with error handling
   */
  private async runNotifierJobSafe(): Promise<void> {
    if (this.isShuttingDown) return;

    try {
      this.log('info', 'Starting notifier job...');
      const config = getNotifierJobConfig();
      const result = await runNotifierJob(config);

      this.status.lastNotifierRun = new Date();
      this.status.totalJobsRun++;

      if (result.success) {
        this.log(
          'info',
          `Notifier job completed successfully: ${result.emailsSent} emails sent to ${result.usersNotified} users`
        );
      } else {
        this.log('error', `Notifier job failed: ${result.errors.join(', ')}`);
        this.status.errors.push(
          `Notifier: ${new Date().toISOString()} - ${result.errors.join(', ')}`
        );
      }
    } catch (error) {
      const errorMsg = `Notifier job crashed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.log('error', errorMsg);
      this.status.errors.push(
        `Notifier: ${new Date().toISOString()} - ${errorMsg}`
      );
    }
  }

  /**
   * Run cleanup job with error handling
   */
  private async runCleanupJobSafe(): Promise<void> {
    if (this.isShuttingDown) return;

    try {
      this.log('info', 'Starting cleanup job...');
      const config = getCleanupJobConfig();
      const result = await runCleanupJob(config);

      this.status.lastCleanupRun = new Date();
      this.status.totalJobsRun++;

      if (result.success) {
        const totalDeleted = Object.values(result.deletedCounts).reduce(
          (sum, count) => sum + count,
          0
        );
        this.log(
          'info',
          `Cleanup job completed successfully: ${totalDeleted} items deleted`
        );
      } else {
        this.log('error', `Cleanup job failed: ${result.errors.join(', ')}`);
        this.status.errors.push(
          `Cleanup: ${new Date().toISOString()} - ${result.errors.join(', ')}`
        );
      }
    } catch (error) {
      const errorMsg = `Cleanup job crashed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.log('error', errorMsg);
      this.status.errors.push(
        `Cleanup: ${new Date().toISOString()} - ${errorMsg}`
      );
    }
  }

  /**
   * Run health check
   */
  private async runHealthCheck(): Promise<void> {
    if (this.isShuttingDown) return;

    try {
      const health = await checkDatabaseHealth();
      this.status.lastHealthCheck = new Date();

      if (health.status === 'healthy') {
        this.log(
          'debug',
          `Health check passed: ${health.tables?.activeListings || 0} listings, ${health.tables?.activeAlerts || 0} alerts`
        );
      } else {
        this.log('error', `Health check failed: ${health.error}`);
        this.status.errors.push(
          `Health: ${new Date().toISOString()} - ${health.error}`
        );
      }
    } catch (error) {
      const errorMsg = `Health check crashed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.log('error', errorMsg);
      this.status.errors.push(
        `Health: ${new Date().toISOString()} - ${errorMsg}`
      );
    }
  }

  // ================================
  // Manual Job Triggers
  // ================================

  /**
   * Manually trigger scraper job
   */
  public async runScraperNow(): Promise<void> {
    this.log('info', 'Manually triggering scraper job...');
    await this.runScraperJobSafe();
  }

  /**
   * Manually trigger matcher job
   */
  public async runMatcherNow(): Promise<void> {
    this.log('info', 'Manually triggering matcher job...');
    await this.runMatcherJobSafe();
  }

  /**
   * Manually trigger notifier job
   */
  public async runNotifierNow(): Promise<void> {
    this.log('info', 'Manually triggering notifier job...');
    await this.runNotifierJobSafe();
  }

  /**
   * Manually trigger cleanup job
   */
  public async runCleanupNow(): Promise<void> {
    this.log('info', 'Manually triggering cleanup job...');
    await this.runCleanupJobSafe();
  }

  // ================================
  // Utilities
  // ================================

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}, shutting down job system...`);
      await this.stop();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }

  /**
   * Log with level filtering
   */
  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string
  ): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = levels[this.config.logLevel];
    const messageLevel = levels[level];

    if (messageLevel >= configLevel) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${level.toUpperCase()}] [JobSystem]`;
      console.log(`${prefix} ${message}`);
    }
  }

  /**
   * Clean up old errors (keep last 100)
   */
  private cleanupErrors(): void {
    if (this.status.errors.length > 100) {
      this.status.errors = this.status.errors.slice(-50); // Keep last 50
    }
  }
}

// ================================
// Singleton Instance
// ================================

let jobSystemInstance: JobSystem | null = null;

/**
 * Get or create job system singleton
 */
export function getJobSystem(config?: Partial<JobSystemConfig>): JobSystem {
  if (!jobSystemInstance) {
    jobSystemInstance = new JobSystem(config);
  }
  return jobSystemInstance;
}

/**
 * Start the default job system
 */
export async function startJobSystem(
  config?: Partial<JobSystemConfig>
): Promise<JobSystem> {
  const system = getJobSystem(config);
  await system.start();
  return system;
}

/**
 * Stop the job system
 */
export async function stopJobSystem(): Promise<void> {
  if (jobSystemInstance) {
    await jobSystemInstance.stop();
  }
}

// ================================
// Exports
// ================================

export {
  runScraperJob,
  getScraperJobConfig,
  formatJobSummary as formatScraperJobSummary,
  type ScraperJobResult,
  type ScraperJobOptions,
} from './scraper-job';

export {
  runMatcherJob,
  getMatcherJobConfig,
  formatJobSummary as formatMatcherJobSummary,
  type MatcherJobResult,
  type MatcherJobOptions,
} from './matcher-job';

export {
  runNotifierJob,
  getNotifierJobConfig,
  formatJobSummary as formatNotifierJobSummary,
  type NotifierJobResult,
  type NotifierJobOptions,
} from './notifier-job';

export {
  runCleanupJob,
  getCleanupJobConfig,
  formatJobSummary as formatCleanupJobSummary,
  type CleanupJobResult,
  type CleanupJobOptions,
} from './cleanup-job';

// For backward compatibility and direct access
export { JobSystem as default };

// Environment configuration helper
export function getJobSystemConfig(): JobSystemConfig {
  return {
    scrapingIntervalMs: parseInt(process.env.SCRAPING_INTERVAL || '1800000'),
    cleanupIntervalMs: parseInt(process.env.CLEANUP_INTERVAL || '86400000'),
    healthCheckIntervalMs: parseInt(
      process.env.HEALTH_CHECK_INTERVAL || '300000'
    ),
    enableHealthChecks: process.env.ENABLE_HEALTH_CHECKS !== 'false',
    enableAutoCleanup: process.env.ENABLE_AUTO_CLEANUP !== 'false',
    logLevel: (process.env.LOG_LEVEL as any) || 'info',
  };
}
