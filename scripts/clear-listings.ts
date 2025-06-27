#!/usr/bin/env npx tsx

import { config } from 'dotenv';
config({ path: '.env.local' });

import { getDatabase } from '../src/lib/database/index';
import { listings, notifications } from '../src/lib/database/schema';
import { sql } from 'drizzle-orm';

async function clearAllListings() {
  const db = getDatabase();

  try {
    // Get current counts
    const listingCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(listings);
    const notificationCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications);

    console.log('📊 Current database state:');
    console.log(`   - Listings: ${listingCount[0].count}`);
    console.log(`   - Notifications: ${notificationCount[0].count}`);

    if (listingCount[0].count === 0) {
      console.log('\n✅ No listings to delete - database is already clean');
      return;
    }

    console.log('\n🗑️  Clearing all listings...');

    // 1. Delete all notifications first (foreign key constraint)
    const deletedNotifications = await db.delete(notifications);
    console.log(`   ✓ Deleted ${notificationCount[0].count} notifications`);

    // 2. Delete all listings
    const deletedListings = await db.delete(listings);
    console.log(`   ✓ Deleted ${listingCount[0].count} listings`);

    console.log('\n✅ Successfully cleared all listings and notifications');
    console.log('🆕 Database is ready for fresh listings');
  } catch (error) {
    console.error('❌ Error clearing listings:', error);
  } finally {
    process.exit(0);
  }
}

clearAllListings();
