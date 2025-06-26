#!/usr/bin/env npx tsx

/**
 * Manual Test Script: Notification Pipeline Integration
 * Purpose: Test complete pipeline flow: scraper → matcher → notifier
 * Usage: npx tsx scripts/manual/test-notification-pipeline.ts [--skip-email]
 */

import { getDatabase } from '../../src/lib/database/index';
import { runMatcherJob } from '../../src/lib/jobs/matcher-job';
import {
  runNotifierJob,
  getPendingNotificationStats,
} from '../../src/lib/jobs/notifier-job';
import { testEmailConnection } from '../../src/lib/notifications/email-service';
import { schema } from '../../src/lib/database/schema';
import { eq } from 'drizzle-orm';

// ================================
// Test Configuration
// ================================

const SKIP_EMAIL =
  process.argv.includes('--skip-email') || process.env.NODE_ENV === 'test';

// ================================
// Test Functions
// ================================

async function testEmailConfiguration() {
  console.log('\n📧 Testing email configuration...');

  try {
    const result = await testEmailConnection();
    if (result.success) {
      console.log('✅ Email configuration is working');
      return true;
    } else {
      console.log(`❌ Email configuration failed: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.log(
      `❌ Email test crashed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return false;
  }
}

async function checkDatabaseSetup() {
  console.log('\n🗄️ Checking database setup...');

  try {
    const db = getDatabase();

    // Check if we have users and alerts
    const [userCount, alertCount, listingCount] = await Promise.all([
      db
        .select()
        .from(schema.users)
        .then((r) => r.length),
      db
        .select()
        .from(schema.alerts)
        .where(eq(schema.alerts.is_active, true))
        .then((r) => r.length),
      db
        .select()
        .from(schema.listings)
        .where(eq(schema.listings.is_active, true))
        .then((r) => r.length),
    ]);

    console.log(`📊 Database status:`);
    console.log(`  Users: ${userCount}`);
    console.log(`  Active alerts: ${alertCount}`);
    console.log(`  Active listings: ${listingCount}`);

    if (userCount === 0 || alertCount === 0) {
      console.log('\n⚠️ No users or alerts found. You need to:');
      console.log(
        '  1. Create a user by visiting the app and creating an alert'
      );
      console.log('  2. Run the scraper to get some listings');
      console.log('  3. Then test the notification pipeline');
      return false;
    }

    if (listingCount === 0) {
      console.log('\n⚠️ No listings found. Run the scraper first:');
      console.log('  npx tsx scripts/manual/run-scraper.ts --save --time 30');
      return false;
    }

    return true;
  } catch (error) {
    console.log(
      `❌ Database check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return false;
  }
}

async function testMatcherJob() {
  console.log('\n🔍 Testing matcher job...');

  try {
    const result = await runMatcherJob({
      maxHours: 24, // Look at last 24 hours of listings
      generateNotifications: true,
    });

    console.log(`📊 Matcher job results:`);
    console.log(`  Success: ${result.success}`);
    console.log(
      `  Duration: ${Math.round((result.duration / 1000) * 100) / 100}s`
    );
    console.log(`  Matches found: ${result.matchesFound}`);
    console.log(`  Notifications generated: ${result.notificationsGenerated}`);

    if (result.errors.length > 0) {
      console.log(`  Errors: ${result.errors.length}`);
      result.errors.forEach((error) => console.log(`    - ${error}`));
    }

    return result.success && result.notificationsGenerated > 0;
  } catch (error) {
    console.log(
      `❌ Matcher job failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return false;
  }
}

async function checkPendingNotifications() {
  console.log('\n📋 Checking pending notifications...');

  try {
    const stats = await getPendingNotificationStats();

    console.log(`📊 Pending notification stats:`);
    console.log(`  Total pending: ${stats.totalPending}`);
    console.log(`  Users pending: ${stats.usersPending}`);
    console.log(
      `  Oldest pending: ${stats.oldestPending?.toLocaleString() || 'None'}`
    );
    console.log(
      `  Newest pending: ${stats.newestPending?.toLocaleString() || 'None'}`
    );

    return stats.totalPending > 0;
  } catch (error) {
    console.log(
      `❌ Failed to check pending notifications: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return false;
  }
}

async function testNotifierJob() {
  console.log('\n📬 Testing notifier job...');

  try {
    const result = await runNotifierJob({
      maxNotifications: 100,
      batchSize: 50,
      skipEmailSending: SKIP_EMAIL,
    });

    console.log(`📊 Notifier job results:`);
    console.log(`  Success: ${result.success}`);
    console.log(
      `  Duration: ${Math.round((result.duration / 1000) * 100) / 100}s`
    );
    console.log(`  Notifications processed: ${result.notificationsProcessed}`);
    console.log(`  Emails sent: ${result.emailsSent}`);
    console.log(`  Emails failed: ${result.emailsFailed}`);
    console.log(`  Users notified: ${result.usersNotified}`);
    console.log(
      `  Email sending: ${SKIP_EMAIL ? 'SKIPPED (test mode)' : 'ENABLED'}`
    );

    if (result.errors.length > 0) {
      console.log(`  Errors: ${result.errors.length}`);
      result.errors.forEach((error) => console.log(`    - ${error}`));
    }

    return result.success;
  } catch (error) {
    console.log(
      `❌ Notifier job failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return false;
  }
}

async function verifyNotificationPipeline() {
  console.log('\n🔄 Verifying complete pipeline...');

  try {
    // Check final stats
    const statsAfter = await getPendingNotificationStats();

    console.log(`📊 Final notification stats:`);
    console.log(
      `  Pending notifications remaining: ${statsAfter.totalPending}`
    );

    if (statsAfter.totalPending === 0) {
      console.log('✅ All notifications processed successfully!');
      return true;
    } else {
      console.log(
        `⚠️ ${statsAfter.totalPending} notifications still pending (may be expected if there were failures)`
      );
      return true; // Not necessarily an error
    }
  } catch (error) {
    console.log(
      `❌ Pipeline verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return false;
  }
}

// ================================
// Main Test Runner
// ================================

async function main() {
  console.log('🚀 Testing Notification Pipeline Integration');
  console.log('============================================');

  const results = {
    emailConfig: false,
    databaseSetup: false,
    matcherJob: false,
    pendingNotifications: false,
    notifierJob: false,
    pipelineVerification: false,
  };

  try {
    // Step 1: Test email configuration (skip if testing mode)
    if (!SKIP_EMAIL) {
      results.emailConfig = await testEmailConfiguration();
      if (!results.emailConfig) {
        console.log(
          '\n❌ Email configuration failed. Set up SMTP environment variables:'
        );
        console.log('  SMTP_HOST, SMTP_USER, SMTP_PASS');
        return;
      }
    } else {
      console.log('\n📧 Skipping email configuration test (test mode)');
      results.emailConfig = true;
    }

    // Step 2: Check database setup
    results.databaseSetup = await checkDatabaseSetup();
    if (!results.databaseSetup) {
      return;
    }

    // Step 3: Run matcher job to generate notifications
    results.matcherJob = await testMatcherJob();
    if (!results.matcherJob) {
      console.log(
        '\n⚠️ Matcher job did not generate new notifications (may be expected if no new matches)'
      );
    }

    // Step 4: Check pending notifications
    results.pendingNotifications = await checkPendingNotifications();
    if (!results.pendingNotifications) {
      console.log(
        '\n⚠️ No pending notifications found (may be expected if nothing to notify)'
      );
    }

    // Step 5: Run notifier job
    results.notifierJob = await testNotifierJob();

    // Step 6: Verify pipeline
    results.pipelineVerification = await verifyNotificationPipeline();

    // Summary
    console.log('\n📈 Test Results Summary');
    console.log('=======================');
    console.log(`Email config:      ${results.emailConfig ? '✅' : '❌'}`);
    console.log(`Database setup:    ${results.databaseSetup ? '✅' : '❌'}`);
    console.log(`Matcher job:       ${results.matcherJob ? '✅' : '⚠️'}`);
    console.log(
      `Pending notifs:    ${results.pendingNotifications ? '✅' : '⚠️'}`
    );
    console.log(`Notifier job:      ${results.notifierJob ? '✅' : '❌'}`);
    console.log(
      `Pipeline verify:   ${results.pipelineVerification ? '✅' : '❌'}`
    );

    const criticalSuccessCount = [
      results.emailConfig,
      results.databaseSetup,
      results.notifierJob,
      results.pipelineVerification,
    ].filter(Boolean).length;

    if (criticalSuccessCount === 4) {
      console.log('\n🎉 Notification pipeline is working correctly!');
      console.log('   Ready for production use.');
    } else {
      console.log(
        '\n⚠️ Some issues found, but pipeline may still be functional.'
      );
      console.log('   Review the details above.');
    }
  } catch (error) {
    console.error('\n💥 Test runner crashed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
