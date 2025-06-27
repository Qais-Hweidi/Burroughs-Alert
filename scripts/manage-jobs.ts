#!/usr/bin/env npx tsx

/**
 * Job Management Script - Control job system during development
 * Status: ✅ IMPLEMENTED - Development utility for job control
 * Purpose: Easily start/stop/trigger jobs during development
 * Usage:
 *   npm run jobs:start     # Start job system
 *   npm run jobs:stop      # Stop job system
 *   npm run jobs:status    # Check status
 *   npm run jobs:trigger scraper  # Trigger specific job
 */

import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

import { Command } from 'commander';
import {
  startBackgroundJobs,
  stopBackgroundJobs,
  getJobSystemStatus,
  triggerJob,
} from '../src/lib/jobs/startup';

const program = new Command();

program
  .name('manage-jobs')
  .description('Manage background job system')
  .version('1.0.0');

program
  .command('start')
  .description('Start the background job system')
  .action(async () => {
    try {
      console.log('Starting background job system...');
      await startBackgroundJobs();
      console.log('✅ Job system started successfully');
    } catch (error) {
      console.error('❌ Failed to start job system:', error);
      process.exit(1);
    }
  });

program
  .command('stop')
  .description('Stop the background job system')
  .action(async () => {
    try {
      console.log('Stopping background job system...');
      await stopBackgroundJobs();
      console.log('✅ Job system stopped successfully');
    } catch (error) {
      console.error('❌ Failed to stop job system:', error);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Check job system status')
  .action(async () => {
    try {
      const status = getJobSystemStatus();
      console.log('Job System Status:');
      console.log(JSON.stringify(status, null, 2));
    } catch (error) {
      console.error('❌ Failed to get job status:', error);
      process.exit(1);
    }
  });

program
  .command('trigger')
  .description('Trigger a specific job')
  .argument('<job>', 'Job type to trigger (scraper, matcher, cleanup)')
  .action(async (job: string) => {
    try {
      if (!['scraper', 'matcher', 'cleanup'].includes(job)) {
        console.error('❌ Invalid job type. Use: scraper, matcher, or cleanup');
        process.exit(1);
      }

      console.log(`Triggering ${job} job...`);
      await triggerJob(job as 'scraper' | 'matcher' | 'cleanup');
      console.log(`✅ ${job} job completed successfully`);
    } catch (error) {
      console.error(`❌ Failed to trigger ${job} job:`, error);
      process.exit(1);
    }
  });

program
  .command('health')
  .description('Check overall system health')
  .action(async () => {
    try {
      // Import here to avoid circular dependencies
      const { getAppHealth } = await import('../src/lib/app-init');
      const health = getAppHealth();
      console.log('System Health:');
      console.log(JSON.stringify(health, null, 2));
    } catch (error) {
      console.error('❌ Failed to get system health:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
