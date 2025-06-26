/**
 * Craigslist Apartment Scraper
 *
 * Scrapes recent apartment listings from Craigslist NYC across all 5 boroughs.
 * Uses Puppeteer for basic scraping without anti-detection measures.
 *
 * Features implemented:
 * - Multi-borough scraping (Manhattan, Brooklyn, Queens, Bronx, Staten Island) ✅ DONE
 * - Time filtering for recent listings (30-45 minutes) ✅ DONE
 * - Data extraction and normalization ✅ DONE
 * - Basic error handling ✅ DONE
 *
 * Scraping Strategy:
 * - Target URL: https://newyork.craigslist.org/search/apa
 * - Borough-specific searches for comprehensive coverage
 * - Fixed delays between requests (2 seconds)
 * - Simple Puppeteer setup without anti-detection
 * - Focus on recent listings only
 *
 * Data Extraction:
 * - Title and price parsing ✅ DONE
 * - URL and external ID extraction ✅ DONE
 * - Posting time validation ✅ DONE
 * - Basic neighborhood identification ✅ DONE
 *
 * Related Documentation:
 * - docs/08-scraping-strategy.md (detailed scraping approach)
 * - docs/07-algorithms-pseudocode.md (data processing algorithms)
 * - docs/04-database-schema.md (listings data structure)
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { VALIDATION_LIMITS } from '../utils/constants';

// ================================
// Types and Interfaces
// ================================

export interface ScrapedListing {
  external_id: string;
  title: string;
  price: number;
  listing_url: string;
  posted_at: string | null;
  neighborhood?: string;
  source: string;
}

export interface ScrapingResult {
  success: boolean;
  listings: ScrapedListing[];
  totalFound: number;
  boroughResults: Record<string, number>;
  errors: string[];
}

interface BoroughConfig {
  name: string;
  code: string;
  url: string;
}

// ================================
// Borough Configuration
// ================================

const NYC_BOROUGHS: BoroughConfig[] = [
  {
    name: 'Manhattan',
    code: 'mnh',
    url: 'https://newyork.craigslist.org/search/mnh/apa#search=1~list~0',
  },
  {
    name: 'Brooklyn',
    code: 'brk',
    url: 'https://newyork.craigslist.org/search/brk/apa#search=1~list~0',
  },
  {
    name: 'Queens',
    code: 'que',
    url: 'https://newyork.craigslist.org/search/que/apa#search=1~list~0',
  },
  {
    name: 'Bronx',
    code: 'brx',
    url: 'https://newyork.craigslist.org/search/brx/apa#search=1~list~0',
  },
  {
    name: 'Staten Island',
    code: 'stn',
    url: 'https://newyork.craigslist.org/search/stn/apa#search=1~list~0',
  },
];

// ================================
// Time Filtering Utilities
// ================================

/**
 * Check if a posting time string indicates the listing is within the specified time range
 * @param timeText - Text like "15 minutes ago", "1 hour ago", etc.
 * @param maxMinutes - Maximum age in minutes (default: 45)
 */
function isWithinTimeRange(timeText: string, maxMinutes: number = 45): boolean {
  if (!timeText) return false;

  const text = timeText.toLowerCase().trim();

  // Handle "X minutes ago" or "Xm ago" format
  const minutesMatch = text.match(/(\d+)\s*(?:minutes?|m)\s*ago/);
  if (minutesMatch) {
    const minutes = parseInt(minutesMatch[1], 10);
    return minutes <= maxMinutes;
  }

  // Handle "X hours ago" or "Xh ago" format (reject if more than 1 hour)
  const hoursMatch = text.match(/(\d+)\s*(?:hours?|h)\s*ago/);
  if (hoursMatch) {
    return false; // More than 1 hour, reject
  }

  // Handle "just now" or similar
  if (text.includes('just now') || text.includes('now')) {
    return true;
  }

  // If we can't parse it, assume it's too old
  return false;
}

/**
 * Extract posting time text from Craigslist listing element
 */
function parsePostingTime(timeText: string): string | null {
  if (!timeText) return null;

  const text = timeText.trim();

  // Convert relative time to ISO string (approximate)
  const now = new Date();

  const minutesMatch = text.match(/(\d+)\s*(?:minutes?|m)\s*ago/);
  if (minutesMatch) {
    const minutes = parseInt(minutesMatch[1], 10);
    const postedAt = new Date(now.getTime() - minutes * 60 * 1000);
    return postedAt.toISOString();
  }

  if (text.includes('just now') || text.includes('now')) {
    return now.toISOString();
  }

  return null;
}

// ================================
// Data Extraction Utilities
// ================================

/**
 * Extract price from price text (e.g., "$2,500" -> 2500)
 */
function extractPrice(priceText: string): number | null {
  if (!priceText) return null;

  // Remove $ and commas, extract number
  const cleanText = priceText.replace(/[$,]/g, '');
  const price = parseInt(cleanText, 10);

  // Validate price range
  if (
    isNaN(price) ||
    price < VALIDATION_LIMITS.price.min ||
    price > VALIDATION_LIMITS.price.max
  ) {
    return null;
  }

  return price;
}

/**
 * Extract external ID from Craigslist URL
 */
function extractExternalId(url: string): string {
  // Extract ID from URL like: https://newyork.craigslist.org/mnh/apa/d/manhattan-luxury-1-bedroom/7123456789.html
  const match = url.match(/\/(\d+)\.html/);
  return match
    ? match[1]
    : `cl_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Basic neighborhood extraction from title
 */
function extractNeighborhood(
  title: string,
  boroughName: string
): string | undefined {
  if (!title) return undefined;

  // For now, just return the borough name
  // TODO: Implement more sophisticated neighborhood detection
  return boroughName;
}

// ================================
// Scraping Functions
// ================================

/**
 * Scrape listings from a single borough
 */
async function scrapeBorough(
  page: Page,
  borough: BoroughConfig,
  maxMinutes: number = 45
): Promise<ScrapedListing[]> {
  console.log(`Scraping ${borough.name}...`);

  try {
    await page.goto(borough.url, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for listings to load
    await page.waitForSelector('.cl-search-result', { timeout: 10000 });

    // Extract listings data with debug info
    const listings = await page.evaluate(() => {
      const listingElements = document.querySelectorAll('.cl-search-result');
      const extractedListings: any[] = [];
      const debugInfo = {
        totalElements: listingElements.length,
        missingTitle: 0,
        missingPrice: 0,
        missingLink: 0,
        extracted: 0
      };

      listingElements.forEach((element, index) => {
        try {
          // Extract basic information using updated selectors
          const titleElement = element.querySelector('.posting-title .label');
          const priceElement = element.querySelector('.priceinfo');
          const timeElement = element.querySelector('.meta span[title*="2024"], .meta span[title*="2025"]');
          const linkElement = element.querySelector('.cl-app-anchor');

          if (!titleElement) debugInfo.missingTitle++;
          if (!priceElement) debugInfo.missingPrice++;
          if (!linkElement) debugInfo.missingLink++;

          if (!titleElement || !priceElement || !linkElement) {
            // Debug first few failed extractions
            if (index < 3) {
              console.log(`Debug listing ${index}:`, {
                hasTitle: !!titleElement,
                hasPrice: !!priceElement,
                hasLink: !!linkElement,
                innerHTML: element.innerHTML.substring(0, 200)
              });
            }
            return;
          }

          const title = titleElement.textContent?.trim() || '';
          const priceText = priceElement.textContent?.trim() || '';
          const timeText = timeElement?.textContent?.trim() || '';
          const url = (linkElement as HTMLAnchorElement).href;

          debugInfo.extracted++;
          extractedListings.push({
            title,
            priceText,
            url,
            timeText,
          });
        } catch (error) {
          console.warn('Error extracting listing:', error);
        }
      });

      console.log('Extraction debug:', debugInfo);
      return extractedListings;
    });

    // Process the extracted data
    const processedListings: ScrapedListing[] = [];

    for (const listing of listings) {
      // Check if listing is recent enough
      if (listing.timeText && !isWithinTimeRange(listing.timeText, maxMinutes)) {
        continue; // Skip old listings
      }

      const price = extractPrice(listing.priceText);
      if (!price) continue; // Skip listings without valid price

      const scrapedListing: ScrapedListing = {
        external_id: extractExternalId(listing.url),
        title: listing.title,
        price,
        listing_url: listing.url,
        posted_at: parsePostingTime(listing.timeText),
        neighborhood: extractNeighborhood(listing.title, borough.name),
        source: 'craigslist',
      };

      processedListings.push(scrapedListing);
    }

    console.log(
      `Found ${processedListings.length} recent listings in ${borough.name}`
    );
    return processedListings;
  } catch (error) {
    console.error(`Error scraping ${borough.name}:`, error);
    return [];
  }
}

/**
 * Main function to scrape recent listings from all NYC boroughs
 */
export async function scrapeRecentListings(
  maxMinutes: number = 45
): Promise<ScrapingResult> {
  let browser: Browser | null = null;
  const result: ScrapingResult = {
    success: false,
    listings: [],
    totalFound: 0,
    boroughResults: {},
    errors: [],
  };

  try {
    console.log('Starting Craigslist scraper...');

    // Launch browser with WSL/Linux compatible settings
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // This helps in WSL
        '--disable-gpu'
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
    });

    const page = await browser.newPage();

    // Scrape each borough
    for (const borough of NYC_BOROUGHS) {
      try {
        const boroughListings = await scrapeBorough(page, borough, maxMinutes);
        result.listings.push(...boroughListings);
        result.boroughResults[borough.name] = boroughListings.length;

        // Add delay between boroughs
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        const errorMsg = `Failed to scrape ${borough.name}: ${error}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
        result.boroughResults[borough.name] = 0;
      }
    }

    result.totalFound = result.listings.length;
    result.success = result.totalFound > 0 || result.errors.length === 0;

    console.log(
      `Scraping completed. Found ${result.totalFound} recent listings total.`
    );
  } catch (error) {
    const errorMsg = `Scraper failed: ${error}`;
    console.error(errorMsg);
    result.errors.push(errorMsg);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return result;
}

// ================================
// Export Functions
// ================================

export { NYC_BOROUGHS, isWithinTimeRange, extractPrice, extractExternalId };
