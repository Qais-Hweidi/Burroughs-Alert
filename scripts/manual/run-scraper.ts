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
    // Show enhanced data coverage stats
    const withBedrooms = result.listings.filter(
      (l) => l.bedrooms !== undefined
    ).length;
    const withPetInfo = result.listings.filter(
      (l) => l.pet_friendly !== undefined
    ).length;
    const withCoordinates = result.listings.filter(
      (l) => l.latitude && l.longitude
    ).length;
    const withNeighborhoods = result.listings.filter(
      (l) => l.neighborhood && l.neighborhood !== 'Unknown'
    ).length;

    console.log('\n--- Enhanced Data Coverage ---');
    console.log(
      `Bedroom count: ${withBedrooms}/${result.totalFound} (${Math.round((withBedrooms / result.totalFound) * 100)}%)`
    );
    console.log(
      `Pet policy: ${withPetInfo}/${result.totalFound} (${Math.round((withPetInfo / result.totalFound) * 100)}%)`
    );
    console.log(
      `Coordinates: ${withCoordinates}/${result.totalFound} (${Math.round((withCoordinates / result.totalFound) * 100)}%)`
    );
    console.log(
      `Neighborhoods: ${withNeighborhoods}/${result.totalFound} (${Math.round((withNeighborhoods / result.totalFound) * 100)}%)`
    );

    console.log('\n--- Sample Listings (Enhanced Data) ---');
    result.listings.slice(0, 5).forEach((listing, index) => {
      console.log(`\n${index + 1}. ${listing.title}`);
      console.log(`   Price: $${listing.price.toLocaleString()}`);
      console.log(`   Neighborhood: ${listing.neighborhood || 'Unknown'}`);
      console.log(
        `   Bedrooms: ${listing.bedrooms !== undefined ? listing.bedrooms : 'Unknown'}`
      );
      console.log(
        `   Pet Friendly: ${listing.pet_friendly !== undefined ? (listing.pet_friendly ? 'Yes' : 'No') : 'Unknown'}`
      );
      console.log(
        `   Coordinates: ${listing.latitude && listing.longitude ? `${listing.latitude}, ${listing.longitude}` : 'Not available'}`
      );
      console.log(`   Posted: ${listing.posted_at || 'Unknown'}`);
      console.log(`   URL: ${listing.listing_url}`);
      console.log(`   ID: ${listing.external_id}`);
    });

    if (result.listings.length > 5) {
      console.log(`\n... and ${result.listings.length - 5} more listings`);
      console.log('\n--- All Listings Summary ---');
      result.listings.forEach((listing, index) => {
        const bedrooms =
          listing.bedrooms !== undefined ? `${listing.bedrooms}BR` : '?BR';
        const pets =
          listing.pet_friendly !== undefined
            ? listing.pet_friendly
              ? 'Pets:Y'
              : 'Pets:N'
            : 'Pets:?';
        const coords = listing.latitude && listing.longitude ? '📍' : '';
        console.log(
          `${index + 1}. ${listing.title.substring(0, 40)}... | $${listing.price} | ${bedrooms} | ${listing.neighborhood || 'Unknown'} | ${pets} ${coords}`
        );
      });
    }
  }
}

async function saveToDatabase(listings: ScrapedListing[]): Promise<void> {
  console.log('\n=== SAVING TO DATABASE ===');

  let successCount = 0;
  let duplicateCount = 0;
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
          duplicateCount++;
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

  console.log(
    `\nDatabase save completed: ${successCount} new listings, ${duplicateCount} duplicates`
  );
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount} listings`);
  }
}

// ================================
// Main Test Function
// ================================

async function main() {
  const args = process.argv.slice(2);
  const saveResults = args.includes('--save');
  const enhancedMode = !args.includes('--basic');
  const maxMinutes = args.includes('--time')
    ? parseInt(args[args.indexOf('--time') + 1], 10) || 45
    : 45;

  console.log('🏠 Testing Craigslist Scraper');
  console.log(
    `⏱️  Looking for listings posted in the last ${maxMinutes} minutes`
  );
  console.log(
    `🔍 Scraping mode: ${enhancedMode ? 'Enhanced (default)' : 'Basic (--basic flag)'}`
  );
  console.log(
    `💾 Save to database: ${saveResults ? 'Yes' : 'No (use --save flag)'}`
  );
  console.log('\n🔄 Starting scraper...\n');

  try {
    const startTime = Date.now();
    const result = await scrapeRecentListings(maxMinutes, enhancedMode);
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
  --basic             Use basic mode (search results only, faster)
  --time <minutes>    Set time range (default: 45 minutes)
  --help              Show this help message

Examples:
  npx tsx scripts/manual/run-scraper.ts                    # Enhanced scraper (default)
  npx tsx scripts/manual/run-scraper.ts --basic            # Basic mode (faster)
  npx tsx scripts/manual/run-scraper.ts --save             # Enhanced + save to DB
  npx tsx scripts/manual/run-scraper.ts --time 120         # Last 2 hours

Data Collection Modes:
  Basic Mode (fast):
    • Neighborhood detection from titles
    • Bedroom count extraction from titles  
    • Price and basic info from search results
    
  Enhanced Mode (slower, visits individual pages):
    • All basic mode data PLUS:
    • Pet-friendly policy from full descriptions
    • Precise coordinates from map elements
    • Full listing descriptions and amenities

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
