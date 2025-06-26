#!/usr/bin/env tsx

/**
 * Test Script for Job System - Verify all components work together
 * Usage: npx tsx scripts/test-jobs.ts
 */

import { checkDatabaseHealth } from '../src/lib/database/index';
import { runScraperJob } from '../src/lib/jobs/scraper-job';
import { runMatcherJob } from '../src/lib/jobs/matcher-job';
import { runCleanupJob } from '../src/lib/jobs/cleanup-job';

async function testJobSystem(): Promise<void> {
  console.log('🧪 Testing Job System Components\n');

  // Test 1: Database Health
  console.log('1️⃣  Testing Database Health...');
  try {
    const health = await checkDatabaseHealth();
    console.log(`   ✅ Database health: ${health.status}`);
    if (health.status === 'healthy') {
      console.log(
        `   📊 Size: ${health.size}, Tables: ${JSON.stringify(health.tables)}`
      );
    } else {
      console.log(`   ❌ Error: ${health.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Database health check failed: ${error}`);
  }

  // Test 2: Scraper Job (dry run)
  console.log('\n2️⃣  Testing Scraper Job (dry run)...');
  try {
    const scraperResult = await runScraperJob({
      maxMinutes: 15, // Short time for testing
      enhancedMode: false, // Faster basic mode
      saveToDatabase: false, // Don't save for this test
    });
    console.log(
      `   ✅ Scraper job: ${scraperResult.success ? 'SUCCESS' : 'FAILED'}`
    );
    console.log(
      `   📈 Found ${scraperResult.scrapingResult?.totalFound || 0} listings`
    );
    if (scraperResult.errors.length > 0) {
      console.log(
        `   ⚠️  Errors: ${scraperResult.errors.slice(0, 2).join(', ')}`
      );
    }
  } catch (error) {
    console.log(`   ❌ Scraper job failed: ${error}`);
  }

  // Test 3: Matcher Job
  console.log('\n3️⃣  Testing Matcher Job...');
  try {
    const matcherResult = await runMatcherJob({
      maxHours: 24,
      generateNotifications: false, // Don't generate notifications for test
    });
    console.log(
      `   ✅ Matcher job: ${matcherResult.success ? 'SUCCESS' : 'FAILED'}`
    );
    console.log(`   🎯 Found ${matcherResult.matchesFound} matches`);
    if (matcherResult.errors.length > 0) {
      console.log(
        `   ⚠️  Errors: ${matcherResult.errors.slice(0, 2).join(', ')}`
      );
    }
  } catch (error) {
    console.log(`   ❌ Matcher job failed: ${error}`);
  }

  // Test 4: Cleanup Job (dry run)
  console.log('\n4️⃣  Testing Cleanup Job...');
  try {
    const cleanupResult = await runCleanupJob({
      listingRetentionDays: 30,
      notificationRetentionDays: 90,
      tokenRetentionDays: 30,
      inactiveAlertMonths: 6,
      optimizeDatabase: false, // Skip DB optimization for test
    });
    console.log(
      `   ✅ Cleanup job: ${cleanupResult.success ? 'SUCCESS' : 'FAILED'}`
    );
    const totalDeleted = Object.values(cleanupResult.deletedCounts).reduce(
      (sum, count) => sum + count,
      0
    );
    console.log(`   🗑️  Total deleted: ${totalDeleted}`);
    if (cleanupResult.errors.length > 0) {
      console.log(
        `   ⚠️  Errors: ${cleanupResult.errors.slice(0, 2).join(', ')}`
      );
    }
  } catch (error) {
    console.log(`   ❌ Cleanup job failed: ${error}`);
  }

  console.log('\n🎉 Job System Test Completed!');
}

// Run tests
if (require.main === module) {
  testJobSystem().catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}
