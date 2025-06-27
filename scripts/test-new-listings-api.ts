/**
 * Test script for new listings frontend API
 * Tests the complete flow: alert creation -> listings retrieval -> frontend display
 */

import { config } from 'dotenv';
import { getDatabase } from '../src/lib/database';
import { users, alerts, listings } from '../src/lib/database/schema';
import { nanoid } from 'nanoid';

// Load environment variables
config({ path: '.env.local' });

async function testListingsFrontendAPI() {
  console.log('🧪 Testing Listings Frontend API Flow...\n');

  const db = getDatabase();

  try {
    // 1. Check if we have data
    console.log('📊 Checking database content...');
    const alertCount = await db.select().from(alerts).limit(5);
    const listingCount = await db.select().from(listings).limit(5);

    console.log(`   Found ${alertCount.length} alerts`);
    console.log(`   Found ${listingCount.length} listings`);

    if (alertCount.length === 0) {
      // Create a test alert
      console.log('\n📝 Creating test alert...');

      // First create/find user
      const testEmail = 'test-frontend@example.com';
      let user = await db
        .select()
        .from(users)
        .where((eq) => eq.email === testEmail)
        .limit(1);

      if (user.length === 0) {
        const newUser = await db
          .insert(users)
          .values({
            email: testEmail,
            unsubscribe_token: nanoid(32),
          })
          .returning();
        user = newUser;
      }

      // Create test alert
      const testAlert = await db
        .insert(alerts)
        .values({
          user_id: user[0].id,
          neighborhoods: JSON.stringify(['Williamsburg', 'Park Slope']),
          min_price: 2000,
          max_price: 4000,
          bedrooms: 1,
          pet_friendly: false,
          max_commute_minutes: 30,
          commute_destination: 'Times Square',
        })
        .returning();

      console.log(`   ✅ Created alert with ID: ${testAlert[0].id}`);
      console.log(`   📧 User email: ${testEmail}`);
      console.log(`   🏠 Criteria: 1br, $2000-4000, Williamsburg/Park Slope`);

      return testAlert[0].id;
    } else {
      const firstAlert = alertCount[0];
      console.log(`   📌 Using existing alert ID: ${firstAlert.id}`);
      return firstAlert.id;
    }
  } catch (error) {
    console.error('❌ Error testing API:', error);
    throw error;
  }
}

async function testAPIEndpoints(alertId: number) {
  console.log('\n🔍 Testing API endpoints...');

  try {
    // Test 1: Alert retrieval
    console.log(`\n1️⃣ Testing GET /api/alerts/${alertId}`);
    const alertResponse = await fetch(
      `http://localhost:3000/api/alerts/${alertId}`
    );

    if (!alertResponse.ok) {
      throw new Error(`Alert API failed: ${alertResponse.status}`);
    }

    const alertData = await alertResponse.json();
    console.log('   ✅ Alert API working');
    console.log(
      `   📋 Alert criteria: ${alertData.alert.neighborhoods.length} neighborhoods`
    );

    // Test 2: Listings retrieval with filters
    console.log('\n2️⃣ Testing GET /api/listings with filters');
    const neighborhoods = alertData.alert.neighborhoods.join(',');
    const listingsUrl = `http://localhost:3000/api/listings?neighborhoods=${encodeURIComponent(neighborhoods)}&min_price=2000&max_price=4000&active_only=true&limit=10`;

    const listingsResponse = await fetch(listingsUrl);

    if (!listingsResponse.ok) {
      throw new Error(`Listings API failed: ${listingsResponse.status}`);
    }

    const listingsData = await listingsResponse.json();
    console.log('   ✅ Listings API working');
    console.log(
      `   🏠 Found ${listingsData.listings.length} matching listings`
    );

    if (listingsData.listings.length > 0) {
      const firstListing = listingsData.listings[0];
      console.log(
        `   📍 Sample listing: ${firstListing.title} - $${firstListing.price}`
      );
    }

    console.log('\n🎉 All API endpoints working correctly!');
    console.log(
      `\n🌐 Test the frontend at: http://localhost:3000/listings?alertId=${alertId}`
    );
  } catch (error) {
    console.error('❌ Error testing endpoints:', error);
    throw error;
  }
}

async function main() {
  try {
    const alertId = await testListingsFrontendAPI();

    // Only test endpoints if server is running
    console.log(
      '\n⚠️  Note: API endpoint tests require the dev server to be running.'
    );
    console.log('   Run "npm run dev" in another terminal, then test:');
    console.log(`   📡 Alert API: http://localhost:3000/api/alerts/${alertId}`);
    console.log(`   🏠 Listings API: http://localhost:3000/api/listings`);
    console.log(
      `   🌐 Frontend: http://localhost:3000/listings?alertId=${alertId}`
    );
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();
