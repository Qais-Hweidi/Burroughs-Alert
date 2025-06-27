#!/usr/bin/env npx tsx

import { config } from 'dotenv';
config({ path: '.env.local' });

import { getDatabase } from '../src/lib/database/index';
import { listings } from '../src/lib/database/schema';
import { sql, eq } from 'drizzle-orm';

async function checkExternalIds() {
  const db = getDatabase();

  // Check for the specific external IDs mentioned
  const externalIds = ['7861489232', '7861493591', '7861493383', '7861494479'];

  console.log('Checking for listings with these external IDs:');
  console.log('================================================');

  for (const extId of externalIds) {
    const result = await db
      .select({
        id: listings.id,
        external_id: listings.external_id,
        title: listings.title,
        scraped_at: listings.scraped_at,
      })
      .from(listings)
      .where(eq(listings.external_id, extId));

    if (result.length > 0) {
      console.log(`✅ FOUND in DB: ${extId}`);
      console.log(`   Title: ${result[0].title}`);
      console.log(`   DB ID: ${result[0].id}`);
      console.log(`   Scraped: ${result[0].scraped_at}`);
    } else {
      console.log(`❌ NOT IN DB: ${extId}`);
    }
    console.log('---');
  }

  // Also check what's actually in the database recently
  console.log('\n\nRecent listings in database (last 10):');
  console.log('=====================================');

  const recentListings = await db
    .select({
      id: listings.id,
      external_id: listings.external_id,
      title: listings.title,
      scraped_at: listings.scraped_at,
    })
    .from(listings)
    .orderBy(sql`${listings.scraped_at} DESC`)
    .limit(10);

  recentListings.forEach((listing, i) => {
    console.log(`${i + 1}. External ID: ${listing.external_id}`);
    console.log(`   Title: ${listing.title}`);
    console.log(`   Scraped: ${listing.scraped_at}`);
    console.log('---');
  });

  process.exit(0);
}

checkExternalIds().catch(console.error);
