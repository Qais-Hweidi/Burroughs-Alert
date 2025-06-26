/**
 * Craigslist Apartment Scraper - Puppeteer-based scraper for NYC listings (all 5 boroughs)
 * Status: ✅ FULLY IMPLEMENTED - Multi-borough scraping, time filtering, data extraction, enhanced mode
 * Dependencies: Puppeteer, Chromium (WSL-compatible: /usr/bin/chromium-browser)
 * Modes: Basic (search results only) or Enhanced (visits individual pages for coordinates/details)
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
  bedrooms?: number;
  pet_friendly?: boolean;
  latitude?: number;
  longitude?: number;
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
 * Extract neighborhood from listing title and location text
 */
function extractNeighborhood(
  title: string,
  locationText: string,
  boroughName: string
): string | undefined {
  if (!title && !locationText) return boroughName;

  const combinedText = `${title} ${locationText}`.toLowerCase();

  // Common NYC neighborhood patterns
  const neighborhoodPatterns = [
    // Manhattan neighborhoods
    /\b(upper east side|ues|upper west side|uws|midtown|times square|financial district|tribeca|soho|nolita|little italy|chinatown|lower east side|les|east village|west village|greenwich village|chelsea|flatiron|gramercy|union square|murray hill|kips bay|turtle bay|sutton place|yorkville|lenox hill|carnegie hill|hamilton heights|washington heights|inwood|harlem|east harlem|spanish harlem)\b/,

    // Brooklyn neighborhoods
    /\b(williamsburg|greenpoint|bushwick|bed stuy|bedford stuyvesant|crown heights|prospect heights|park slope|gowanus|red hook|carroll gardens|cobble hill|boerum hill|fort greene|clinton hill|brooklyn heights|dumbo|sunset park|bay ridge|bensonhurst|coney island|brighton beach|sheepshead bay|marine park|flatbush|east flatbush|flatlands|canarsie|east new york|brownsville|ocean hill)\b/,

    // Queens neighborhoods
    /\b(long island city|lic|astoria|sunnyside|woodside|elmhurst|jackson heights|corona|flushing|forest hills|kew gardens|richmond hill|ozone park|howard beach|rockaway|far rockaway|jamaica|hollis|queens village|bayside|whitestone|college point|fresh meadows)\b/,

    // Bronx neighborhoods
    /\b(mott haven|melrose|morrisania|concourse|high bridge|morris heights|university heights|fordham|belmont|tremont|mount hope|east tremont|west farms|soundview|castle hill|parkchester|unionport|westchester square|throggs neck|co op city|riverdale|kingsbridge|marble hill)\b/,

    // Staten Island neighborhoods
    /\b(st george|stapleton|clifton|port richmond|west brighton|new brighton|livingston|bulls head|chelsea|travis|richmond valley|tottenville|pleasant plains|prince bay|annadale|eltingville|great kills|arden heights|rossville|charleston)\b/,
  ];

  for (const pattern of neighborhoodPatterns) {
    const match = combinedText.match(pattern);
    if (match) {
      return match[1]
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
  }

  // If no specific neighborhood found, return borough
  return boroughName;
}

/**
 * Extract bedroom count from listing title
 */
function extractBedrooms(title: string): number | undefined {
  if (!title) return undefined;

  const text = title.toLowerCase();

  // Common bedroom patterns
  const patterns = [
    /(\d+)\s*(?:br|bed|bedroom)s?/,
    /(\d+)\s*bedroom/,
    /\b(\d+)br\b/,
    /studio/,
    /efficiency/,
  ];

  // Check for studio/efficiency first
  if (text.includes('studio') || text.includes('efficiency')) {
    return 0;
  }

  // Check for numbered bedrooms
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const count = parseInt(match[1], 10);
      if (count >= 0 && count <= 6) {
        // Reasonable range
        return count;
      }
    }
  }

  return undefined;
}

/**
 * Detect if listing is pet-friendly
 */
function detectPetFriendly(
  title: string,
  description?: string
): boolean | undefined {
  if (!title && !description) return undefined;

  const text = `${title} ${description || ''}`.toLowerCase();

  // Pet-friendly indicators
  const petFriendlyPatterns = [
    /pets? (?:ok|okay|allowed|welcome)/,
    /pet friendly/,
    /pet-friendly/,
    /dogs? (?:ok|okay|allowed|welcome)/,
    /cats? (?:ok|okay|allowed|welcome)/,
    /dogs? are (?:ok|okay|allowed|welcome)/,
    /cats? are (?:ok|okay|allowed|welcome)/,
    /accepts? pets?/,
    /pet deposit/,
    /pet-friendly/,
    /\bpets ok\b/,
    /\bdogs ok\b/,
    /\bcats ok\b/,
  ];

  // Pet-not-allowed indicators
  const noPetPatterns = [
    /no pets?/,
    /pets? not allowed/,
    /no dogs?/,
    /no cats?/,
    /pet-free/,
    /no animals/,
  ];

  // Check for explicit no-pet policies first
  for (const pattern of noPetPatterns) {
    if (text.match(pattern)) {
      return false;
    }
  }

  // Check for pet-friendly indicators
  for (const pattern of petFriendlyPatterns) {
    if (text.match(pattern)) {
      return true;
    }
  }

  // If no explicit mention, return undefined
  return undefined;
}

/**
 * Extract coordinates from listing page (if available)
 */
function extractCoordinates(mapUrl?: string): {
  latitude?: number;
  longitude?: number;
} {
  if (!mapUrl) return {};

  // Try to extract lat/lng from map URLs
  const patterns = [
    /lat=([^&]+).*lng=([^&]+)/,
    /ll=([^,]+),([^&]+)/,
    /@([^,]+),([^,]+)/,
    /q=([^,]+),([^&]+)/,
  ];

  for (const pattern of patterns) {
    const match = mapUrl.match(pattern);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);

      // Validate NYC area coordinates
      if (lat >= 40.4 && lat <= 40.9 && lng >= -74.3 && lng <= -73.7) {
        return { latitude: lat, longitude: lng };
      }
    }
  }

  return {};
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
        extracted: 0,
      };

      listingElements.forEach((element, index) => {
        try {
          // Extract basic information using updated selectors
          const titleElement = element.querySelector('.posting-title .label');
          const priceElement = element.querySelector('.priceinfo');
          const timeElement = element.querySelector(
            '.meta span[title*="2024"], .meta span[title*="2025"]'
          );
          const linkElement = element.querySelector('.cl-app-anchor');

          // Extract additional information for enhanced data
          const locationElement = element.querySelector('.meta');
          const housingElement = element.querySelector('.housing');
          const mapElement = element.querySelector('a[href*="maps.google"]');

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
                innerHTML: element.innerHTML.substring(0, 200),
              });
            }
            return;
          }

          const title = titleElement.textContent?.trim() || '';
          const priceText = priceElement.textContent?.trim() || '';
          const timeText = timeElement?.textContent?.trim() || '';
          const url = (linkElement as HTMLAnchorElement).href;
          const locationText = locationElement?.textContent?.trim() || '';
          const housingText = housingElement?.textContent?.trim() || '';
          const mapUrl = mapElement
            ? (mapElement as HTMLAnchorElement).href
            : undefined;

          debugInfo.extracted++;
          extractedListings.push({
            title,
            priceText,
            url,
            timeText,
            locationText,
            housingText,
            mapUrl,
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
      if (
        listing.timeText &&
        !isWithinTimeRange(listing.timeText, maxMinutes)
      ) {
        continue; // Skip old listings
      }

      const price = extractPrice(listing.priceText);
      if (!price) continue; // Skip listings without valid price

      // Extract enhanced data
      const bedrooms = extractBedrooms(listing.title);
      const petFriendly = detectPetFriendly(listing.title, listing.housingText);
      const coordinates = extractCoordinates(listing.mapUrl);
      const neighborhood = extractNeighborhood(
        listing.title,
        listing.locationText,
        borough.name
      );

      const scrapedListing: ScrapedListing = {
        external_id: extractExternalId(listing.url),
        title: listing.title,
        price,
        listing_url: listing.url,
        posted_at: parsePostingTime(listing.timeText),
        neighborhood,
        bedrooms,
        pet_friendly: petFriendly,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
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
 * Enhanced data extraction from individual listing page
 */
async function scrapeIndividualListing(
  page: Page,
  listing: ScrapedListing
): Promise<ScrapedListing> {
  try {
    console.log(`  └─ Visiting individual page for: ${listing.external_id}`);

    await page.goto(listing.listing_url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Extract enhanced data from individual page
    const enhancedData = await page.evaluate(() => {
      // Extract coordinates from map
      const mapElement = document.querySelector(
        '#map[data-latitude][data-longitude]'
      );
      const latitude = mapElement
        ? parseFloat(mapElement.getAttribute('data-latitude') || '0')
        : undefined;
      const longitude = mapElement
        ? parseFloat(mapElement.getAttribute('data-longitude') || '0')
        : undefined;

      // Extract full description text
      const descriptionElement = document.querySelector(
        '#postingbody, .postingbody, .userbody'
      );
      const fullDescription = descriptionElement
        ? descriptionElement.textContent?.trim() || ''
        : '';

      // Extract housing attributes (pets, amenities)
      const housingAttrs = document.querySelector(
        '.mapAndAttrs .attrgroup:last-child'
      );
      const housingText = housingAttrs
        ? housingAttrs.textContent?.trim() || ''
        : '';

      // Also extract from all attribute groups to catch pet policies
      const allAttrGroups = Array.from(
        document.querySelectorAll('.mapAndAttrs .attrgroup')
      );
      const allAttributesText = allAttrGroups
        .map((group) => group.textContent?.trim() || '')
        .join(' ');

      return {
        latitude: latitude && !isNaN(latitude) ? latitude : undefined,
        longitude: longitude && !isNaN(longitude) ? longitude : undefined,
        fullDescription,
        housingText,
        allAttributesText,
      };
    });

    // Enhanced pet-friendly detection with full description and attributes
    const combinedText = `${listing.title} ${enhancedData.fullDescription} ${enhancedData.housingText} ${enhancedData.allAttributesText}`;
    const petFriendly = detectPetFriendly(listing.title, combinedText);

    // Validate coordinates are in NYC area
    const coordinates =
      enhancedData.latitude &&
      enhancedData.longitude &&
      enhancedData.latitude >= 40.4 &&
      enhancedData.latitude <= 40.9 &&
      enhancedData.longitude >= -74.3 &&
      enhancedData.longitude <= -73.7
        ? { latitude: enhancedData.latitude, longitude: enhancedData.longitude }
        : {};

    return {
      ...listing,
      pet_friendly: petFriendly,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    };
  } catch (error) {
    console.warn(
      `    ⚠️  Failed to scrape individual page for ${listing.external_id}:`,
      error
    );
    return listing; // Return original listing if individual scraping fails
  }
}

/**
 * Main function to scrape recent listings from all NYC boroughs
 */
export async function scrapeRecentListings(
  maxMinutes: number = 45,
  enhancedMode: boolean = true
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
        '--disable-gpu',
      ],
      executablePath:
        process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
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

    // Enhanced mode: visit individual listing pages for additional data
    if (enhancedMode && result.listings.length > 0) {
      console.log(
        `\n🔍 Enhanced mode: Visiting ${result.listings.length} individual pages for detailed data...`
      );

      const enhancedListings: ScrapedListing[] = [];
      for (let i = 0; i < result.listings.length; i++) {
        const listing = result.listings[i];
        console.log(
          `  📄 Processing ${i + 1}/${result.listings.length}: ${listing.title.substring(0, 50)}...`
        );

        try {
          const enhancedListing = await scrapeIndividualListing(page, listing);
          enhancedListings.push(enhancedListing);

          // Add delay between individual page visits to be respectful
          await new Promise((resolve) => setTimeout(resolve, 1500));
        } catch (error) {
          console.warn(
            `    ⚠️  Skipping ${listing.external_id} due to error:`,
            error
          );
          enhancedListings.push(listing); // Keep original if enhancement fails
        }
      }

      result.listings = enhancedListings;
      console.log(`✅ Enhanced scraping completed with individual page data.`);
    }

    result.totalFound = result.listings.length;
    result.success = result.totalFound > 0 || result.errors.length === 0;

    const mode = enhancedMode ? 'Enhanced' : 'Basic';
    console.log(
      `${mode} scraping completed. Found ${result.totalFound} recent listings total.`
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

export {
  NYC_BOROUGHS,
  isWithinTimeRange,
  extractPrice,
  extractExternalId,
  extractBedrooms,
  detectPetFriendly,
  extractCoordinates,
};
