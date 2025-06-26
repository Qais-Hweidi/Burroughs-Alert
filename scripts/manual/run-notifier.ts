#!/usr/bin/env npx tsx

/**
 * Manual Script: Run Notifier Job
 * Purpose: Process pending notifications and send emails
 * Usage: npx tsx scripts/manual/run-notifier.ts [--skip-email] [--max-notifications=N]
 */

import {
  runNotifierJob,
  formatJobSummary,
  getPendingNotificationStats,
} from '../../src/lib/jobs/notifier-job';

// Parse command line arguments
const SKIP_EMAIL = process.argv.includes('--skip-email');
const MAX_NOTIFICATIONS_ARG = process.argv.find((arg) =>
  arg.startsWith('--max-notifications=')
);
const MAX_NOTIFICATIONS = MAX_NOTIFICATIONS_ARG
  ? parseInt(MAX_NOTIFICATIONS_ARG.split('=')[1])
  : 100;

async function main() {
  console.log('🔔 Running Notifier Job');
  console.log('========================');
  console.log(`Max notifications: ${MAX_NOTIFICATIONS}`);
  console.log(
    `Skip email sending: ${SKIP_EMAIL ? 'YES (test mode)' : 'NO (production mode)'}`
  );
  console.log('');

  try {
    // Check pending notifications first
    console.log('📋 Checking pending notifications...');
    const statsBefore = await getPendingNotificationStats();
    console.log(`  Total pending: ${statsBefore.totalPending}`);
    console.log(`  Users pending: ${statsBefore.usersPending}`);
    console.log(
      `  Oldest: ${statsBefore.oldestPending?.toLocaleString() || 'None'}`
    );
    console.log(
      `  Newest: ${statsBefore.newestPending?.toLocaleString() || 'None'}`
    );
    console.log('');

    if (statsBefore.totalPending === 0) {
      console.log('✅ No pending notifications to process');
      return;
    }

    // Run the notifier job
    console.log('🚀 Starting notifier job...');
    const result = await runNotifierJob({
      maxNotifications: MAX_NOTIFICATIONS,
      skipEmailSending: SKIP_EMAIL,
    });

    // Display results
    console.log('');
    console.log(formatJobSummary(result));

    // Check remaining notifications
    console.log('');
    console.log('📋 Checking remaining notifications...');
    const statsAfter = await getPendingNotificationStats();
    console.log(`  Total pending: ${statsAfter.totalPending}`);
    console.log(`  Users pending: ${statsAfter.usersPending}`);

    // Summary
    console.log('');
    if (result.success) {
      console.log('🎉 Notifier job completed successfully!');
      if (result.emailsSent > 0) {
        console.log(
          `📧 Sent ${result.emailsSent} email${result.emailsSent !== 1 ? 's' : ''} to ${result.usersNotified} user${result.usersNotified !== 1 ? 's' : ''}`
        );
      }
      if (result.emailsFailed > 0) {
        console.log(
          `⚠️ ${result.emailsFailed} email${result.emailsFailed !== 1 ? 's' : ''} failed`
        );
      }
    } else {
      console.log('❌ Notifier job failed');
      console.log('Check the errors above for details');
    }
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
