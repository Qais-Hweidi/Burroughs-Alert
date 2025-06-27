#!/usr/bin/env tsx

/**
 * Test Production Flow with Mock Listing that matches criteria
 */

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });

import { insertListings } from '../src/lib/database/queries/listings';
import { runMatcherJob } from '../src/lib/jobs/matcher-job';
import { runNotifierJob } from '../src/lib/jobs/notifier-job';
import type { ListingInsert } from '../src/lib/database/schema';

async function testWithMockListing() {
  console.log('🚀 Testing with Mock Listing that Matches hweidiqais@pm.me');
  console.log('==========================================================');

  try {
    // Create a mock listing that will match the alert
    const mockListing: ListingInsert = {
      external_id: 'test-listing-' + Date.now(),
      title: 'Beautiful 1BR in Williamsburg - Perfect Match!',
      description:
        'Stunning 1-bedroom apartment in the heart of Williamsburg. Modern amenities, great location.',
      price: 2800, // Within $1800-3500 range
      bedrooms: 1, // Matches 1 bedroom requirement
      square_feet: 750,
      neighborhood: 'Williamsburg', // In the neighborhood list
      address: '123 Test Street, Williamsburg, Brooklyn, NY',
      latitude: 40.7081,
      longitude: -73.9571,
      pet_friendly: false,
      listing_url: 'https://newyork.craigslist.org/test-listing',
      source: 'craigslist',
      posted_at: new Date().toISOString(),
      scraped_at: new Date().toISOString(),
      is_active: true,
      scam_score: 0,
    };

    console.log(
      '\n📝 Step 1: Creating mock listing that matches your criteria'
    );
    const listingResult = await insertListings([mockListing]);
    console.log('✅ Mock listing created:', {
      success: listingResult.success,
      inserted: listingResult.inserted,
      duplicates: listingResult.duplicates,
    });

    // Step 2: Run matcher to find matches
    console.log('\n🎯 Step 2: Running matcher to find matches');
    const matcherResult = await runMatcherJob({ maxHours: 1 }); // Just check last hour
    console.log('✅ Matcher completed:', {
      success: matcherResult.success,
      matchesFound: matcherResult.matchesFound,
      duration: matcherResult.duration,
    });

    // Step 3: Run notifier to send emails
    console.log('\n📧 Step 3: Running notifier to send emails');
    const notifierResult = await runNotifierJob();
    console.log('✅ Notifier completed:', {
      success: notifierResult.success,
      emailsSent: notifierResult.emailsSent,
      usersNotified: notifierResult.usersNotified,
      notificationsProcessed: notifierResult.notificationsProcessed,
      errors: notifierResult.errors,
    });

    // Summary
    console.log('\n🎉 Test Complete!');
    console.log('=================');
    console.log(`📊 Summary:`);
    console.log(`   - Mock listing created: ${listingResult.success}`);
    console.log(`   - Matches found: ${matcherResult.matchesFound || 0}`);
    console.log(`   - Emails sent: ${notifierResult.emailsSent || 0}`);

    if (notifierResult.emailsSent && notifierResult.emailsSent > 0) {
      console.log(
        '\n✉️  EMAIL SENT! Check hweidiqais@pm.me for apartment notification.'
      );
      console.log('📋 Email should contain:');
      console.log('   - Subject: New Apartment Matches Found');
      console.log(
        '   - Listing: Beautiful 1BR in Williamsburg - Perfect Match!'
      );
      console.log('   - Price: $2,800');
      console.log('   - Bedrooms: 1');
      console.log('   - Neighborhood: Williamsburg');
    } else {
      console.log('\n📭 No emails sent');
      if (notifierResult.errors && notifierResult.errors.length > 0) {
        console.log('   Errors:', notifierResult.errors);
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testWithMockListing();
