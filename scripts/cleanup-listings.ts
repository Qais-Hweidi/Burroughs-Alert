#!/usr/bin/env npx tsx

/**
 * Cleanup Script: Remove Poor Quality Listings
 *
 * This script removes old test data and poor quality listings,
 * keeping only the most recent high-quality scraped listings.
 */

import { getDatabase } from '../src/lib/database/index';
import { listings, notifications } from '../src/lib/database/schema';
import { sql, desc, and, or, isNull, lt } from 'drizzle-orm';
import { schema } from '../src/lib/database/schema';

async function cleanupListings() {
  console.log('🧹 Starting listings cleanup...\n');

  const database = getDatabase();

  try {
    // Get current stats
    const beforeStats = await database
      .select({ count: sql<number>`count(*)` })
      .from(schema.listings);

    console.log(`📊 Current listings: ${beforeStats[0].count}`);

    // Keep only the most recent 15 listings
    console.log('\n📅 Keeping only the last 15 scraped listings...');

    // Get the 15 most recent listing IDs
    const recentListings = await database
      .select({ id: schema.listings.id })
      .from(schema.listings)
      .orderBy(desc(schema.listings.scraped_at))
      .limit(15);

    if (recentListings.length > 0) {
      const recentIds = recentListings.map((l) => l.id);

      // Delete notifications for old listings first (foreign key constraint)
      const notificationsDeleted = await database
        .delete(schema.notifications)
        .where(
          sql`listing_id NOT IN (${sql.join(
            recentIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        );

      console.log(
        `   Deleted ${notificationsDeleted.rowsAffected} old notifications`
      );

      // Delete old listings
      const oldListingsDeleted = await database.delete(schema.listings).where(
        sql`id NOT IN (${sql.join(
          recentIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      );

      console.log(`   Deleted ${oldListingsDeleted.rowsAffected} old listings`);
    } else {
      console.log('   No listings to delete - keeping all existing listings');
    }

    // Clean up orphaned notifications (just in case)
    console.log('\n🔗 Cleaning up orphaned notifications...');
    const orphanedDeleted = await database
      .delete(schema.notifications)
      .where(sql`listing_id NOT IN (SELECT id FROM listings)`);

    console.log(
      `   Deleted ${orphanedDeleted.rowsAffected} orphaned notifications`
    );

    // Get final stats
    const afterStats = await database
      .select({ count: sql<number>`count(*)` })
      .from(schema.listings);

    const finalCount = afterStats[0].count;
    const totalDeleted = beforeStats[0].count - finalCount;

    console.log('\n✅ Cleanup completed!');
    console.log(`📊 Final stats:`);
    console.log(`   Before: ${beforeStats[0].count} listings`);
    console.log(`   After: ${finalCount} listings`);
    console.log(`   Deleted: ${totalDeleted} listings`);
    console.log(`   Kept: ${finalCount} most recent listings\n`);

    // Show remaining listings
    if (finalCount > 0) {
      console.log('📋 Remaining listings:');
      const remaining = await database
        .select({
          id: schema.listings.id,
          title: schema.listings.title,
          price: schema.listings.price,
          neighborhood: schema.listings.neighborhood,
          scraped_at: schema.listings.scraped_at,
        })
        .from(schema.listings)
        .orderBy(desc(schema.listings.scraped_at));

      remaining.forEach((listing, index) => {
        console.log(
          `   ${index + 1}. ${listing.title} - $${listing.price} in ${listing.neighborhood || 'Unknown'}`
        );
        console.log(`      Scraped: ${listing.scraped_at}`);
      });
    }
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the cleanup
cleanupListings();
