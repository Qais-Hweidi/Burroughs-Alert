#!/usr/bin/env npx tsx

/**
 * Manual Test Script for Email Service
 * Tests email configuration and basic email sending functionality
 */

import * as dotenv from 'dotenv';
import {
  sendListingNotification,
  sendWelcomeEmail,
  testEmailConnection,
} from '../../src/lib/notifications/email-service';
import { ParsedListing } from '../../src/lib/types/database.types';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function main() {
  console.log('🔧 Testing Email Service Configuration...\n');

  // Test 1: Check environment variables
  console.log('1. Checking environment variables...');
  const requiredVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
  const missingVars = requiredVars.filter((v) => !process.env[v]);

  if (missingVars.length > 0) {
    console.error(
      `❌ Missing environment variables: ${missingVars.join(', ')}`
    );
    console.log('Please check your .env.local file');
    process.exit(1);
  }
  console.log('✅ All required environment variables found');

  // Test 2: Test email connection
  console.log('\n2. Testing SMTP connection...');
  const connectionTest = await testEmailConnection();
  if (!connectionTest.success) {
    console.error('❌ Email connection failed:', connectionTest.error);
    process.exit(1);
  }
  console.log('✅ SMTP connection successful');

  // Test 3: Test welcome email (optional - only if user provides email)
  const testEmail = process.argv[2];
  if (testEmail) {
    console.log(`\n3. Sending test welcome email to: ${testEmail}`);
    const welcomeResult = await sendWelcomeEmail(testEmail);
    if (welcomeResult.success) {
      console.log(
        `✅ Welcome email sent successfully (ID: ${welcomeResult.messageId})`
      );
    } else {
      console.error('❌ Welcome email failed:', welcomeResult.error);
    }

    // Test 4: Test listing notification with mock data
    console.log(`\n4. Sending test listing notification to: ${testEmail}`);

    const mockListings: ParsedListing[] = [
      {
        id: 1,
        external_id: 'test-1',
        title: 'Beautiful 2BR in Brooklyn Heights',
        description: 'Spacious apartment with great views',
        price: 3200,
        bedrooms: 2,
        bathrooms: 1,
        square_feet: 900,
        neighborhood: 'Brooklyn Heights',
        address: '123 Main St, Brooklyn, NY',
        latitude: 40.6892,
        longitude: -73.9955,
        pet_friendly: true,
        images: ['https://example.com/image1.jpg'],
        contact_info: { phone: '555-0123', email: 'landlord@example.com' },
        listing_url:
          'https://newyork.craigslist.org/brk/apa/d/test-listing-1/1234567890.html',
        source: 'craigslist',
        posted_at: new Date().toISOString(),
        scraped_at: new Date().toISOString(),
        is_active: true,
        scam_score: 2,
      },
      {
        id: 2,
        external_id: 'test-2',
        title: 'Studio in Manhattan - Pet Friendly',
        description: 'Cozy studio apartment',
        price: 2800,
        bedrooms: 0,
        bathrooms: 1,
        square_feet: 450,
        neighborhood: 'East Village',
        address: '456 Second Ave, New York, NY',
        latitude: 40.7279,
        longitude: -73.9826,
        pet_friendly: true,
        images: [],
        contact_info: null,
        listing_url:
          'https://newyork.craigslist.org/mnh/apa/d/test-listing-2/1234567891.html',
        source: 'craigslist',
        posted_at: new Date().toISOString(),
        scraped_at: new Date().toISOString(),
        is_active: true,
        scam_score: 1,
      },
    ];

    const notificationResult = await sendListingNotification(
      testEmail,
      mockListings
    );
    if (notificationResult.success) {
      console.log(
        `✅ Listing notification sent successfully (ID: ${notificationResult.messageId})`
      );
    } else {
      console.error(
        '❌ Listing notification failed:',
        notificationResult.error
      );
    }
  } else {
    console.log('\n3. Skipping email tests (no email address provided)');
    console.log(
      '   To test email sending, run: npx tsx scripts/manual/test-email-service.ts your-email@example.com'
    );
  }

  console.log('\n🎉 Email service test completed!');
}

// Run the test
main().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
