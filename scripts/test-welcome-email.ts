/**
 * Test the welcome email functionality
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function testWelcomeEmail() {
  console.log('📧 Testing Welcome Email Functionality...\n');

  try {
    // Test 1: Create alert with completely new email
    const newEmail = `test-${Date.now()}@example.com`;
    console.log(`1️⃣ Creating first alert for new user: ${newEmail}`);

    const response = await fetch('http://localhost:3001/api/alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: newEmail,
        neighborhoods: ['Williamsburg'],
        min_price: 2000,
        max_price: 3000,
        bedrooms: 1,
        pet_friendly: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`API failed: ${response.status}`);
    }

    const data = await response.json();
    console.log(`   ✅ Alert created with ID: ${data.alert.id}`);
    console.log(`   👤 User ID: ${data.user.id}`);
    console.log(`   📧 Email: ${data.user.email}`);

    // Test 2: Create second alert for same user (should NOT send welcome email)
    console.log(`\n2️⃣ Creating second alert for same user...`);

    const response2 = await fetch('http://localhost:3001/api/alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: newEmail,
        neighborhoods: ['Park Slope'],
        min_price: 2500,
        max_price: 4000,
        bedrooms: 2,
        pet_friendly: true,
      }),
    });

    if (!response2.ok) {
      throw new Error(`Second API call failed: ${response2.status}`);
    }

    const data2 = await response2.json();
    console.log(`   ✅ Second alert created with ID: ${data2.alert.id}`);
    console.log(`   👤 Same user ID: ${data2.user.id}`);

    // Test 3: Try with your real email
    console.log(`\n3️⃣ Testing with your real email (hweidiqais@pm.me)...`);

    const response3 = await fetch('http://localhost:3001/api/alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'hweidiqais@pm.me',
        neighborhoods: ['Lower East Side'],
        min_price: 2000,
        max_price: 3500,
        bedrooms: 1,
        pet_friendly: false,
      }),
    });

    if (!response3.ok) {
      throw new Error(`Real email test failed: ${response3.status}`);
    }

    const data3 = await response3.json();
    console.log(`   ✅ Alert created with ID: ${data3.alert.id}`);
    console.log(`   👤 User ID: ${data3.user.id}`);

    console.log('\n📋 Summary:');
    console.log('   ✅ First alert for new user → Should send welcome email');
    console.log(
      '   ✅ Second alert for existing user → Should NOT send welcome email'
    );
    console.log(
      '   ✅ Alert for existing user (your email) → Should NOT send welcome email'
    );

    console.log('\n🔍 To verify welcome emails:');
    console.log('   • Check your email for any welcome messages');
    console.log(
      '   • Check server console logs for "Welcome email sent" messages'
    );
    console.log(
      '   • First-time users should get a welcome email explaining the service'
    );
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

testWelcomeEmail();
