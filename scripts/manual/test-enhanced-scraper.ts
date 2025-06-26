#!/usr/bin/env tsx

import { scrapeRecentListings } from '../../src/lib/scraping/craigslist-scraper';

async function testEnhancedScraper() {
  console.log(
    '🏠 Testing Enhanced Craigslist Scraper with new data fields...\n'
  );

  try {
    const result = await scrapeRecentListings(60); // Last 60 minutes

    console.log('📊 Scraping Results:');
    console.log(`- Success: ${result.success}`);
    console.log(`- Total Listings: ${result.totalFound}`);
    console.log(`- Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      result.errors.forEach((error) => console.log(`  - ${error}`));
    }

    console.log('\n🏘️ Borough Breakdown:');
    Object.entries(result.boroughResults).forEach(([borough, count]) => {
      console.log(`  - ${borough}: ${count} listings`);
    });

    if (result.listings.length > 0) {
      console.log('\n🔍 Sample Listing Details:');
      const sample = result.listings[0];
      console.log(`Title: ${sample.title}`);
      console.log(`Price: $${sample.price}`);
      console.log(`Neighborhood: ${sample.neighborhood || 'Unknown'}`);
      console.log(
        `Bedrooms: ${sample.bedrooms !== undefined ? sample.bedrooms : 'Unknown'}`
      );
      console.log(
        `Pet Friendly: ${sample.pet_friendly !== undefined ? sample.pet_friendly : 'Unknown'}`
      );
      console.log(
        `Coordinates: ${sample.latitude && sample.longitude ? `${sample.latitude}, ${sample.longitude}` : 'Not available'}`
      );
      console.log(`URL: ${sample.listing_url}`);

      // Show enhanced data summary
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

      console.log('\n📈 Enhanced Data Coverage:');
      console.log(
        `- Listings with bedroom count: ${withBedrooms}/${result.totalFound} (${Math.round((withBedrooms / result.totalFound) * 100)}%)`
      );
      console.log(
        `- Listings with pet policy: ${withPetInfo}/${result.totalFound} (${Math.round((withPetInfo / result.totalFound) * 100)}%)`
      );
      console.log(
        `- Listings with coordinates: ${withCoordinates}/${result.totalFound} (${Math.round((withCoordinates / result.totalFound) * 100)}%)`
      );
      console.log(
        `- Listings with neighborhoods: ${withNeighborhoods}/${result.totalFound} (${Math.round((withNeighborhoods / result.totalFound) * 100)}%)`
      );

      // Show all listings with enhanced data
      console.log('\n📋 All Listings Summary:');
      result.listings.forEach((listing, index) => {
        console.log(
          `${index + 1}. ${listing.title.substring(0, 50)}... | $${listing.price} | ${listing.bedrooms !== undefined ? listing.bedrooms + 'BR' : '?BR'} | ${listing.neighborhood || 'Unknown'} | Pets: ${listing.pet_friendly !== undefined ? (listing.pet_friendly ? 'Yes' : 'No') : '?'}`
        );
      });
    } else {
      console.log('\nℹ️ No recent listings found. This could be due to:');
      console.log('  - No new listings in the past 60 minutes');
      console.log('  - Craigslist changes to page structure');
      console.log('  - Network connectivity issues');
    }
  } catch (error) {
    console.error('❌ Scraper test failed:', error);
  }
}

testEnhancedScraper().catch(console.error);
