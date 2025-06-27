#!/usr/bin/env tsx

/**
 * Production Flow Test Script with proper environment loading
 * Tests the complete pipeline: Alert Creation -> Scraping -> Matching -> Email Notification
 */

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createAlert } from '../src/lib/database/queries/alerts';
import { runScraperJob } from '../src/lib/jobs/scraper-job';
import { runMatcherJob } from '../src/lib/jobs/matcher-job';
import { runNotifierJob } from '../src/lib/jobs/notifier-job';

async function testProductionFlow() {
  console.log('🚀 Starting Production Flow Test');
  console.log('================================');

  // Check SMTP config
  console.log('📧 SMTP Configuration:');
  console.log(`   Host: ${process.env.SMTP_HOST || 'NOT SET'}`);
  console.log(`   Port: ${process.env.SMTP_PORT || 'NOT SET'}`);
  console.log(`   User: ${process.env.SMTP_USER || 'NOT SET'}`);
  console.log(`   Pass: ${process.env.SMTP_PASS ? 'SET' : 'NOT SET'}`);

  try {
    // Step 1: Create alert for test email
    console.log('\n📝 Step 1: Creating alert for hweidiqais@pm.me');
    const alert = await createAlert({
      email: 'hweidiqais@pm.me',
      neighborhoods: [
        'Williamsburg',
        'Park Slope',
        'East Village',
        'Brooklyn Heights',
      ],
      min_price: 1800,
      max_price: 3500,
      bedrooms: 1,
      pet_friendly: null,
    });
    console.log('✅ Alert created:', alert);

    // Step 2: Run scraper to get fresh listings
    console.log('\n🔍 Step 2: Running scraper to get fresh listings');
    const scraperResult = await runScraperJob({ maxMinutes: 60 });
    console.log('✅ Scraper completed:', {
      success: scraperResult.success,
      duration: scraperResult.duration,
      errors: scraperResult.errors,
    });

    // Step 3: Run matcher to find matches
    console.log(
      '\n🎯 Step 3: Running matcher to find matches for hweidiqais@pm.me'
    );
    const matcherResult = await runMatcherJob({ maxHours: 24 }); // Check last 24 hours
    console.log('✅ Matcher completed:', {
      success: matcherResult.success,
      matchesFound: matcherResult.matchesFound,
      duration: matcherResult.duration,
    });

    // Step 4: Run notifier to send emails
    console.log('\n📧 Step 4: Running notifier to send emails');
    const notifierResult = await runNotifierJob();
    console.log('✅ Notifier completed:', {
      success: notifierResult.success,
      emailsSent: notifierResult.emailsSent,
      usersNotified: notifierResult.usersNotified,
      notificationsProcessed: notifierResult.notificationsProcessed,
      errors: notifierResult.errors,
    });

    // Summary
    console.log('\n🎉 Production Flow Test Complete!');
    console.log('==================================');
    console.log(`📊 Summary:`);
    console.log(`   - Alert created for: hweidiqais@pm.me`);
    console.log(`   - Scraper success: ${scraperResult.success}`);
    console.log(`   - Matches found: ${matcherResult.matchesFound || 0}`);
    console.log(`   - Emails sent: ${notifierResult.emailsSent || 0}`);

    if (notifierResult.emailsSent && notifierResult.emailsSent > 0) {
      console.log(
        '\n✉️  EMAIL SENT! Check hweidiqais@pm.me for apartment notifications.'
      );
    } else {
      console.log('\n📭 No emails sent - checking reasons...');
      if (notifierResult.errors && notifierResult.errors.length > 0) {
        console.log('   Errors:', notifierResult.errors);
      }
    }
  } catch (error) {
    console.error('❌ Production flow test failed:', error);
    process.exit(1);
  }
}

// Run the test
testProductionFlow();
