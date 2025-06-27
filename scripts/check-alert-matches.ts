#!/usr/bin/env npx tsx

import { config } from 'dotenv';
config({ path: '.env.local' });

import { getDatabase } from '../src/lib/database/index';
import { listings, alerts } from '../src/lib/database/schema';
import { eq, and, gte, lte, inArray, or, isNull } from 'drizzle-orm';

async function checkAlertMatches() {
  const db = getDatabase();

  try {
    // First, get the alert details
    const alertResult = await db.select().from(alerts).where(eq(alerts.id, 21));

    if (alertResult.length === 0) {
      console.log('❌ Alert ID 21 not found');
      return;
    }

    const alert = alertResult[0];
    console.log('📋 Alert Details:');
    console.log(`   ID: ${alert.id}`);
    console.log(`   Email: ${alert.email}`);
    console.log(`   Neighborhoods: ${alert.neighborhoods}`);
    console.log(`   Bedrooms: ${alert.bedrooms} (any)`);
    console.log(`   Price Range: $${alert.min_price} - $${alert.max_price}`);
    console.log(`   Pet Friendly: ${alert.pet_friendly}`);
    console.log('\n');

    // Get listings from ID 1024 to 1041
    const listingsToCheck = await db
      .select()
      .from(listings)
      .where(and(gte(listings.id, 1024), lte(listings.id, 1041)))
      .orderBy(listings.id);

    console.log(
      `🔍 Checking ${listingsToCheck.length} listings (ID 1024-1041):\n`
    );

    // Parse alert neighborhoods
    const alertNeighborhoods = JSON.parse(alert.neighborhoods || '[]');
    console.log(
      `Alert neighborhoods (${alertNeighborhoods.length}):`,
      alertNeighborhoods.slice(0, 5),
      '...\n'
    );

    let matchCount = 0;
    const matches = [];

    for (const listing of listingsToCheck) {
      console.log(`\nListing ${listing.id}: ${listing.title}`);
      console.log(`   Price: $${listing.price}`);
      console.log(`   Neighborhood: ${listing.neighborhood}`);
      console.log(`   Bedrooms: ${listing.bedrooms}`);
      console.log(`   Pet Friendly: ${listing.pet_friendly}`);

      // Check each criterion
      let isMatch = true;
      const reasons = [];

      // 1. Price check
      if (listing.price < alert.min_price || listing.price > alert.max_price) {
        isMatch = false;
        reasons.push(
          `Price $${listing.price} outside range $${alert.min_price}-$${alert.max_price}`
        );
      } else {
        reasons.push(`✓ Price OK`);
      }

      // 2. Neighborhood check
      if (
        listing.neighborhood &&
        !alertNeighborhoods.includes(listing.neighborhood)
      ) {
        // Check if it's a generic borough that should match
        const boroughMatch = ['Manhattan', 'Brooklyn', 'Bronx'].includes(
          listing.neighborhood
        );
        if (!boroughMatch) {
          isMatch = false;
          reasons.push(`Neighborhood '${listing.neighborhood}' not in alert`);
        } else {
          reasons.push(`✓ Borough match: ${listing.neighborhood}`);
        }
      } else if (!listing.neighborhood) {
        isMatch = false;
        reasons.push(`No neighborhood data`);
      } else {
        reasons.push(`✓ Neighborhood OK`);
      }

      // 3. Pet friendly check
      if (alert.pet_friendly && listing.pet_friendly !== true) {
        isMatch = false;
        reasons.push(`Not pet friendly (listing: ${listing.pet_friendly})`);
      } else if (alert.pet_friendly) {
        reasons.push(`✓ Pet friendly`);
      }

      // 4. Bedrooms - alert has null which means any
      reasons.push(`✓ Bedrooms OK (any allowed)`);

      console.log(`   Match: ${isMatch ? '✅ YES' : '❌ NO'}`);
      console.log(`   Reasons:`, reasons.join(' | '));

      if (isMatch) {
        matchCount++;
        matches.push(listing);
      }
    }

    console.log(`\n\n📊 Summary:`);
    console.log(`   Total listings checked: ${listingsToCheck.length}`);
    console.log(`   Matches found: ${matchCount}`);

    if (matches.length > 0) {
      console.log(`\n✅ Matching listings:`);
      matches.forEach((listing) => {
        console.log(
          `   - ID ${listing.id}: ${listing.title} ($${listing.price}, ${listing.neighborhood})`
        );
      });
    }

    // Now check what the API returns
    console.log('\n\n🔍 Checking API response for alert...');
    const apiParams = new URLSearchParams({
      neighborhoods: alertNeighborhoods.join(','),
      min_price: alert.min_price.toString(),
      max_price: alert.max_price.toString(),
      pet_friendly: 'true',
      active_only: 'true',
      sort_by: 'scraped_at',
      sort_order: 'desc',
    });

    console.log('API query params:', apiParams.toString());
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkAlertMatches();
