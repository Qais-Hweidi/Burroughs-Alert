#!/usr/bin/env npx tsx

import { config } from 'dotenv';
config({ path: '.env.local' });

import { getDatabase } from '../src/lib/database/index';
import { alerts, users } from '../src/lib/database/schema';
import { eq } from 'drizzle-orm';

async function checkAlert21() {
  const db = getDatabase();
  
  try {
    // Get alert 21 with user info
    const result = await db
      .select({
        alert: alerts,
        user: users
      })
      .from(alerts)
      .leftJoin(users, eq(alerts.user_id, users.id))
      .where(eq(alerts.id, 21));
    
    if (result.length === 0) {
      console.log('❌ Alert 21 not found');
      return;
    }
    
    const { alert, user } = result[0];
    
    console.log('📋 Alert 21 Details:');
    console.log('   ID:', alert.id);
    console.log('   User ID:', alert.user_id);
    console.log('   Is Active:', alert.is_active);
    console.log('   Created:', alert.created_at);
    
    console.log('\n👤 User Details:');
    if (user) {
      console.log('   User ID:', user.id);
      console.log('   Email:', user.email);
    } else {
      console.log('   ❌ No user found!');
    }
    
    console.log('\n🏠 Alert Criteria:');
    console.log('   Neighborhoods:', alert.neighborhoods?.substring(0, 100) + '...');
    console.log('   Price Range:', alert.min_price, '-', alert.max_price);
    console.log('   Bedrooms:', alert.bedrooms);
    console.log('   Pet Friendly:', alert.pet_friendly);
    
    // Check if neighborhoods is valid JSON
    try {
      const neighborhoods = JSON.parse(alert.neighborhoods || '[]');
      console.log('   ✅ Valid JSON, count:', neighborhoods.length);
    } catch (e) {
      console.log('   ❌ Invalid JSON!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkAlert21();