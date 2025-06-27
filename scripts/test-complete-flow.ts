/**
 * Test the complete user flow: Create Alert → View Listings
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function testCompleteFlow() {
  console.log('🧪 Testing Complete User Flow...\n');

  try {
    // Step 1: Create a new alert
    console.log('1️⃣ Creating new alert...');
    const alertData = {
      email: 'test-flow@example.com',
      neighborhoods: ['Williamsburg', 'Park Slope'],
      min_price: 2000,
      max_price: 4000,
      bedrooms: 1,
      pet_friendly: false,
    };

    const createResponse = await fetch('http://localhost:3001/api/alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(alertData),
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create alert: ${createResponse.status}`);
    }

    const createData = await createResponse.json();
    const alertId = createData.alert.id;

    console.log(`   ✅ Alert created with ID: ${alertId}`);
    console.log(`   📧 Email: ${alertData.email}`);
    console.log(
      `   🏠 Criteria: ${alertData.neighborhoods.join(', ')}, $${alertData.min_price}-${alertData.max_price}, ${alertData.bedrooms}BR`
    );

    // Step 2: Test alert retrieval
    console.log('\n2️⃣ Testing alert retrieval...');
    const alertResponse = await fetch(
      `http://localhost:3001/api/alerts/${alertId}`
    );

    if (!alertResponse.ok) {
      throw new Error(`Failed to get alert: ${alertResponse.status}`);
    }

    const alertResult = await alertResponse.json();
    console.log('   ✅ Alert retrieval working');
    console.log(`   📋 Retrieved alert for: ${alertResult.alert.email}`);

    // Step 3: Test listings with alert criteria
    console.log('\n3️⃣ Testing listings with alert criteria...');
    const listingsResponse = await fetch(
      `http://localhost:3001/api/listings?neighborhoods=${alertData.neighborhoods.join(',')}&min_price=${alertData.min_price}&max_price=${alertData.max_price}&bedrooms=${alertData.bedrooms}&active_only=true&limit=10`
    );

    if (!listingsResponse.ok) {
      throw new Error(`Failed to get listings: ${listingsResponse.status}`);
    }

    const listingsResult = await listingsResponse.json();
    console.log('   ✅ Listings API working');
    console.log(
      `   🏠 Found ${listingsResult.listings.length} matching listings`
    );

    if (listingsResult.listings.length > 0) {
      const listing = listingsResult.listings[0];
      console.log(
        `   📍 Sample: ${listing.title} - $${listing.price} in ${listing.neighborhood}`
      );
    }

    // Step 4: Test frontend page
    console.log('\n4️⃣ Testing frontend page...');
    const frontendResponse = await fetch(
      `http://localhost:3001/listings?alertId=${alertId}`
    );

    if (!frontendResponse.ok) {
      throw new Error(`Frontend page failed: ${frontendResponse.status}`);
    }

    const frontendHtml = await frontendResponse.text();
    if (frontendHtml.includes('<!DOCTYPE html>')) {
      console.log('   ✅ Frontend page loads successfully');
    } else {
      throw new Error('Frontend returned unexpected content');
    }

    // Success summary
    console.log('\n🎉 Complete flow test PASSED!');
    console.log('\n📋 What this means for you:');
    console.log('   ✅ Alert creation form will work');
    console.log('   ✅ Real alert IDs will be generated');
    console.log('   ✅ Listings page will show real data');
    console.log('   ✅ No more "mock-alert-123" errors');

    console.log('\n🌐 Try it yourself:');
    console.log('   1. Go to: http://localhost:3001');
    console.log('   2. Fill out the alert form');
    console.log('   3. Get redirected to real listings');
    console.log(
      `   4. Or test directly: http://localhost:3001/listings?alertId=${alertId}`
    );
  } catch (error) {
    console.error('\n❌ Flow test FAILED:', error);
    console.log('\n🔍 Troubleshooting:');
    console.log('   • Make sure server is running: npm run dev');
    console.log('   • Check server is on port 3001');
    console.log('   • Verify database has been initialized');
    throw error;
  }
}

testCompleteFlow();
