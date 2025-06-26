#!/usr/bin/env tsx

/**
 * Test Scraper Script
 *
 * Manual script to test the Craigslist scraper functionality.
 * Runs the scraper and displays results, with option to save to database.
 */

import {
  scrapeRecentListings,
  ScrapingResult,
  ScrapedListing,
} from '../../src/lib/scraping/craigslist-scraper';

// ================================
// Display Functions
// ================================

function displayResults(result: ScrapingResult) {
  console.log('\n=== SCRAPING RESULTS ===');
  console.log(`Success: ${result.success}`);
  console.log(`Total Listings Found: ${result.totalFound}`);

  console.log('\n--- Borough Breakdown ---');
  for (const [borough, count] of Object.entries(result.boroughResults)) {
    console.log(`${borough}: ${count} listings`);
  }

  if (result.errors.length > 0) {
    console.log('\n--- Errors ---');
    result.errors.forEach((error) => console.log(`❌ ${error}`));
  }

  if (result.listings.length > 0) {
    console.log('\n--- Sample Listings ---');
    result.listings.slice(0, 5).forEach((listing, index) => {
      console.log(`\n${index + 1}. ${listing.title}`);
      console.log(`   Price: $${listing.price.toLocaleString()}`);
      console.log(`   Neighborhood: ${listing.neighborhood || 'Unknown'}`);
      console.log(`   Posted: ${listing.posted_at || 'Unknown'}`);
      console.log(`   URL: ${listing.listing_url}`);
      console.log(`   ID: ${listing.external_id}`);
    });

    if (result.listings.length > 5) {
      console.log(`\n... and ${result.listings.length - 5} more listings`);
    }
  }
}

async function saveToDatabase(listings: ScrapedListing[]): Promise<void> {
  console.log('\n=== SAVING TO DATABASE ===');

  let successCount = 0;
  let errorCount = 0;

  for (const listing of listings) {
    try {
      const response = await fetch('http://localhost:3000/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(listing),
      });

      if (response.ok) {
        successCount++;
      } else {
        const errorData = await response.json();
        if (
          errorData.error === 'VALIDATION_ERROR' &&
          errorData.message.includes('already exists')
        ) {
          console.log(`⚠️  Duplicate listing skipped: ${listing.external_id}`);
        } else {
          console.log(
            `❌ Failed to save listing ${listing.external_id}:`,
            errorData.message
          );
          errorCount++;
        }
      }
    } catch (error) {
      console.log(`❌ Error saving listing ${listing.external_id}:`, error);
      errorCount++;
    }
  }

  console.log(`\n✅ Successfully saved: ${successCount} listings`);
  console.log(`❌ Errors: ${errorCount} listings`);
}

// ================================
// Main Test Function
// ================================

async function main() {
  const args = process.argv.slice(2);
  const saveResults = args.includes('--save');
  const maxMinutes = args.includes('--time')
    ? parseInt(args[args.indexOf('--time') + 1], 10) || 45
    : 45;

  console.log('🏠 Testing Craigslist Scraper');
  console.log(
    `⏱️  Looking for listings posted in the last ${maxMinutes} minutes`
  );
  console.log(
    `💾 Save to database: ${saveResults ? 'Yes' : 'No (use --save flag)'}`
  );
  console.log('\n🔄 Starting scraper...\n');

  try {
    const startTime = Date.now();
    const result = await scrapeRecentListings(maxMinutes);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n⏱️  Scraping completed in ${duration} seconds`);

    displayResults(result);

    if (saveResults && result.listings.length > 0) {
      await saveToDatabase(result.listings);
    }

    if (result.listings.length === 0) {
      console.log('\n💡 No recent listings found. This is normal if:');
      console.log("   - It's not a peak posting time");
      console.log('   - The time range is very narrow');
      console.log('   - Craigslist structure has changed');
      console.log('\n   Try running with --time 120 for last 2 hours');
    }
  } catch (error) {
    console.error('❌ Scraper test failed:', error);
    process.exit(1);
  }
}

// ================================
// Usage Information
// ================================

function showUsage() {
  console.log(`
Usage: npx tsx scripts/manual/run-scraper.ts [options]

Options:
  --save              Save scraped listings to database
  --time <minutes>    Set time range (default: 45 minutes)
  --help              Show this help message

Examples:
  npx tsx scripts/manual/run-scraper.ts                    # Just test scraping
  npx tsx scripts/manual/run-scraper.ts --save             # Test and save to DB
  npx tsx scripts/manual/run-scraper.ts --time 120         # Last 2 hours
  npx tsx scripts/manual/run-scraper.ts --save --time 60   # Last hour + save

Note: Make sure your Next.js dev server is running on localhost:3000 
      if you want to use the --save option.
`);
}

// ================================
// Script Entry Point
// ================================

if (process.argv.includes('--help')) {
  showUsage();
  process.exit(0);
}

main().catch(console.error);
