/**
 * Quick scraper for testing - basic mode only
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function quickScrape() {
  console.log('🚀 Running Quick Scrape (Basic Mode)...\n');

  try {
    const { runScraperJob } = await import('../src/lib/jobs/scraper-job');

    console.log('Starting scraper with basic mode (fast)...');
    const result = await runScraperJob({
      maxMinutes: 60, // 1 hour
      enhancedMode: false, // Basic mode = no individual page visits
      saveToDatabase: true,
    });

    if (result.success) {
      console.log(`✅ Quick scrape completed!`);
      console.log(
        `   📊 Total found: ${result.scrapingResult?.totalFound || 0} listings`
      );
      console.log(`   💾 New in database: ${result.newListingsCount} listings`);
      console.log(`   ⏱️  Duration: ${Math.round(result.duration / 1000)}s`);

      if (result.scrapingResult?.boroughResults) {
        console.log('\n📍 By borough:');
        Object.entries(result.scrapingResult.boroughResults).forEach(
          ([borough, count]) => {
            console.log(`   ${borough}: ${count} listings`);
          }
        );
      }
    } else {
      console.log('❌ Quick scrape failed');
      console.log(`Errors: ${result.errors.join(', ')}`);
    }
  } catch (error) {
    console.error('❌ Error during quick scrape:', error);
    throw error;
  }
}

quickScrape();
