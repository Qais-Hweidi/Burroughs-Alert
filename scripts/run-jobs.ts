#!/usr/bin/env tsx

/**
 * Job Runner CLI - Manual execution and testing of background jobs
 * Usage:
 *   npx tsx scripts/run-jobs.ts scraper        # Run scraper job once
 *   npx tsx scripts/run-jobs.ts matcher        # Run matcher job once
 *   npx tsx scripts/run-jobs.ts cleanup        # Run cleanup job once
 *   npx tsx scripts/run-jobs.ts system-start   # Start job system
 *   npx tsx scripts/run-jobs.ts system-status  # Show system status
 */

import {
  runScraperJob,
  formatJobSummary as formatScraperSummary,
} from '../src/lib/jobs/scraper-job';
import {
  runMatcherJob,
  formatJobSummary as formatMatcherSummary,
} from '../src/lib/jobs/matcher-job';
import {
  runCleanupJob,
  formatJobSummary as formatCleanupSummary,
} from '../src/lib/jobs/cleanup-job';
import { startJobSystem, getJobSystem } from '../src/lib/jobs/index';
import { checkDatabaseHealth } from '../src/lib/database/index';

// ================================
// CLI Functions
// ================================

async function runScraper(): Promise<void> {
  console.log('🕷️  Running scraper job...\n');

  const result = await runScraperJob({
    maxMinutes: 60,
    enhancedMode: true,
    saveToDatabase: true,
  });

  console.log('\n' + formatScraperSummary(result));

  if (!result.success) {
    process.exit(1);
  }
}

async function runMatcher(): Promise<void> {
  console.log('🎯 Running matcher job...\n');

  const result = await runMatcherJob({
    maxHours: 24, // Look at last 24 hours for testing
    generateNotifications: true,
  });

  console.log('\n' + formatMatcherSummary(result));

  if (!result.success) {
    process.exit(1);
  }
}

async function runCleanup(): Promise<void> {
  console.log('🧹 Running cleanup job...\n');

  const result = await runCleanupJob({
    listingRetentionDays: 30,
    notificationRetentionDays: 90,
    tokenRetentionDays: 30,
    inactiveAlertMonths: 6,
    optimizeDatabase: true,
  });

  console.log('\n' + formatCleanupSummary(result));

  if (!result.success) {
    process.exit(1);
  }
}

async function startSystem(): Promise<void> {
  console.log('🚀 Starting job system...\n');

  try {
    const system = await startJobSystem();

    console.log('Job system started successfully!');
    console.log('Press Ctrl+C to stop');

    // Keep process alive
    process.on('SIGINT', async () => {
      console.log('\n⏹️  Stopping job system...');
      await system.stop();
      process.exit(0);
    });

    // Wait indefinitely
    await new Promise(() => {});
  } catch (error) {
    console.error('Failed to start job system:', error);
    process.exit(1);
  }
}

async function showStatus(): Promise<void> {
  console.log('📊 Job System Status\n');

  try {
    // Database health
    const dbHealth = await checkDatabaseHealth();
    console.log('Database Health:');
    console.log(`  Status: ${dbHealth.status}`);
    if (dbHealth.status === 'healthy') {
      console.log(`  Size: ${dbHealth.size}`);
      console.log(
        `  Tables: Users(${dbHealth.tables?.users}), Alerts(${dbHealth.tables?.activeAlerts}), Listings(${dbHealth.tables?.activeListings})`
      );
      console.log(
        `  Recent Notifications: ${dbHealth.tables?.recentNotifications}`
      );
    } else {
      console.log(`  Error: ${dbHealth.error}`);
    }

    // Try to get job system status
    try {
      const system = getJobSystem();
      const status = system.getStatus();

      console.log('\nJob System:');
      console.log(`  Running: ${status.isRunning}`);
      if (status.startTime) {
        console.log(`  Started: ${status.startTime.toLocaleString()}`);
      }
      console.log(`  Total Jobs Run: ${status.totalJobsRun}`);

      if (status.lastScraperRun) {
        console.log(
          `  Last Scraper: ${status.lastScraperRun.toLocaleString()}`
        );
      }
      if (status.lastMatcherRun) {
        console.log(
          `  Last Matcher: ${status.lastMatcherRun.toLocaleString()}`
        );
      }
      if (status.lastCleanupRun) {
        console.log(
          `  Last Cleanup: ${status.lastCleanupRun.toLocaleString()}`
        );
      }
      if (status.lastHealthCheck) {
        console.log(
          `  Last Health Check: ${status.lastHealthCheck.toLocaleString()}`
        );
      }

      if (status.errors.length > 0) {
        console.log(`\nRecent Errors (${status.errors.length}):`);
        status.errors.slice(-3).forEach((error) => {
          console.log(`  - ${error}`);
        });
      }
    } catch (error) {
      console.log('\nJob System: Not initialized');
    }
  } catch (error) {
    console.error('Failed to get status:', error);
    process.exit(1);
  }
}

function showHelp(): void {
  console.log(`
Job Runner CLI - Manual execution and testing of background jobs

Usage:
  npx tsx scripts/run-jobs.ts <command>

Commands:
  scraper        Run scraper job once (scrape listings and save to DB)
  matcher        Run matcher job once (match listings to alerts)
  cleanup        Run cleanup job once (clean old data and optimize DB)
  system-start   Start the full job system (runs continuously)
  system-status  Show current system status and health
  help           Show this help message

Examples:
  npx tsx scripts/run-jobs.ts scraper        # Test scraping
  npx tsx scripts/run-jobs.ts matcher        # Test matching
  npx tsx scripts/run-jobs.ts system-start   # Start background system
  npx tsx scripts/run-jobs.ts system-status  # Check status
`);
}

// ================================
// Main CLI Handler
// ================================

async function main(): Promise<void> {
  const command = process.argv[2];

  if (!command) {
    console.error('Error: Command required\n');
    showHelp();
    process.exit(1);
  }

  console.log(`🏢 Burroughs Alert - Job Runner`);
  console.log(`⏰ ${new Date().toLocaleString()}\n`);

  try {
    switch (command.toLowerCase()) {
      case 'scraper':
        await runScraper();
        break;
      case 'matcher':
        await runMatcher();
        break;
      case 'cleanup':
        await runCleanup();
        break;
      case 'system-start':
        await startSystem();
        break;
      case 'system-status':
        await showStatus();
        break;
      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;
      default:
        console.error(`Error: Unknown command '${command}'\n`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Command failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}
