/**
 * Purpose: Background job scheduler for automated apartment listing scraping with randomized intervals (30-45 min)
 * Status: ✅ IMPLEMENTED - Scraper job with database integration
 * Dependencies: Craigslist scraper, database utilities, error handling
 * Key Features: Automated scraping, duplicate handling, error logging, performance tracking
 */

import { scrapeRecentListings } from '../scraping/craigslist-scraper';
import { insertListings } from '../database/queries/listings';
import type { ListingInsertResult } from '../database/queries/listings';

// ================================
// Types
// ================================

export interface ScraperJobResult {
  success: boolean;
  startTime: Date;
  endTime: Date;
  duration: number;
  scrapingResult?: {
    totalFound: number;
    boroughResults: Record<string, number>;
    errors: string[];
  };
  databaseResult?: ListingInsertResult;
  newListingsCount: number;
  errors: string[];
}

export interface ScraperJobOptions {
  maxMinutes?: number;
  enhancedMode?: boolean;
  saveToDatabase?: boolean;
}

// ================================
// Job Implementation
// ================================

/**
 * Execute scraper job with full pipeline: scrape -> save -> report
 */
export async function runScraperJob(
  options: ScraperJobOptions = {}
): Promise<ScraperJobResult> {
  const {
    maxMinutes = 60,
    enhancedMode = true,
    saveToDatabase = true,
  } = options;

  const startTime = new Date();
  const result: ScraperJobResult = {
    success: false,
    startTime,
    endTime: new Date(),
    duration: 0,
    newListingsCount: 0,
    errors: [],
  };

  try {
    console.log(
      `Starting scraper job - maxMinutes: ${maxMinutes}, enhanced: ${enhancedMode}`
    );

    // Step 1: Scrape listings
    const scrapingResult = await scrapeRecentListings(maxMinutes, enhancedMode);
    result.scrapingResult = {
      totalFound: scrapingResult.totalFound,
      boroughResults: scrapingResult.boroughResults,
      errors: scrapingResult.errors,
    };

    if (!scrapingResult.success) {
      result.errors.push('Scraping failed');
      result.errors.push(...scrapingResult.errors);
      return result;
    }

    console.log(
      `Scraping completed: ${scrapingResult.totalFound} listings found`
    );

    // Step 2: Save to database if requested
    if (saveToDatabase && scrapingResult.listings.length > 0) {
      const databaseResult = await insertListings(scrapingResult.listings);
      result.databaseResult = databaseResult;
      result.newListingsCount = databaseResult.newListingsCount;

      if (!databaseResult.success) {
        result.errors.push('Database insertion failed');
        result.errors.push(...databaseResult.errors);
      } else {
        console.log(
          `Database save completed: ${databaseResult.newListingsCount} new listings, ${databaseResult.duplicateCount} duplicates`
        );
      }
    } else {
      result.newListingsCount = scrapingResult.listings.length;
    }

    // Step 3: Determine overall success
    result.success =
      scrapingResult.success && (result.databaseResult?.success ?? true);

    return result;
  } catch (error) {
    result.errors.push(
      `Scraper job failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    console.error('Scraper job error:', error);
    return result;
  } finally {
    result.endTime = new Date();
    result.duration = result.endTime.getTime() - result.startTime.getTime();

    // Log job completion
    const durationMinutes =
      Math.round((result.duration / 1000 / 60) * 100) / 100;
    console.log(
      `Scraper job completed in ${durationMinutes}m - Success: ${result.success}, New listings: ${result.newListingsCount}`
    );

    if (result.errors.length > 0) {
      console.error('Scraper job errors:', result.errors);
    }
  }
}

// ================================
// Utility Functions
// ================================

/**
 * Get job configuration from environment variables
 */
export function getScraperJobConfig() {
  return {
    maxMinutes: parseInt(process.env.SCRAPER_MAX_MINUTES || '60'),
    enhancedMode: process.env.SCRAPER_ENHANCED_MODE !== 'false',
    saveToDatabase: process.env.SCRAPER_SAVE_TO_DB !== 'false',
  };
}

/**
 * Create a formatted job summary for logging
 */
export function formatJobSummary(result: ScraperJobResult): string {
  const duration = Math.round((result.duration / 1000 / 60) * 100) / 100;
  const summary = [
    `Scraper Job Summary:`,
    `  Success: ${result.success}`,
    `  Duration: ${duration} minutes`,
    `  New listings: ${result.newListingsCount}`,
  ];

  if (result.scrapingResult) {
    summary.push(`  Total found: ${result.scrapingResult.totalFound}`);
    summary.push(
      `  Boroughs: ${Object.entries(result.scrapingResult.boroughResults)
        .map(([borough, count]) => `${borough}(${count})`)
        .join(', ')}`
    );
  }

  if (result.databaseResult) {
    summary.push(
      `  Database: ${result.databaseResult.newListingsCount} new, ${result.databaseResult.duplicateCount} duplicates`
    );
  }

  if (result.errors.length > 0) {
    summary.push(`  Errors: ${result.errors.length}`);
    result.errors.forEach((error) => summary.push(`    - ${error}`));
  }

  return summary.join('\n');
}
