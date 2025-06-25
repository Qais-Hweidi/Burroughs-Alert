# Burroughs Alert - Scraping Strategy

## Target Site: Craigslist NYC

**Primary URL**: https://newyork.craigslist.org/search/apa#search=2~gallery~0  
**Focus**: Apartments/Housing for Rent in NYC area  
**Update Frequency**: Random intervals 30-45 minutes (safe scraping)

## Craigslist Structure Analysis

### URL Patterns

#### Main Search URLs

```
Base URL: https://newyork.craigslist.org/search/apa#search=2~gallery~0
Manhattan: https://newyork.craigslist.org/search/mnh/apa#search=2~gallery~0
Brooklyn: https://newyork.craigslist.org/search/brk/apa#search=2~gallery~0
Queens: https://newyork.craigslist.org/search/que/apa#search=2~gallery~0
Bronx: https://newyork.craigslist.org/search/brx/apa#search=2~gallery~0
Staten Island: https://newyork.craigslist.org/search/stn/apa#search=2~gallery~0
```

#### Search Parameters

```
?min_price=1000          // Minimum price
&max_price=5000          // Maximum price
&min_bedrooms=1          // Minimum bedrooms
&max_bedrooms=3          // Maximum bedrooms
&pets_cat=1              // Cats OK
&pets_dog=1              // Dogs OK
&postedToday=1           // Posted today only
&sort=date               // Sort by date (newest first)
```

#### Individual Listing URLs

```
Pattern: https://newyork.craigslist.org/{area}/apa/d/{title-slug}/{listing_id}.html
Example: https://newyork.craigslist.org/que/apa/d/springfield-gardens-deluxe-one-bedroom/7859490750.html
Example: https://newyork.craigslist.org/brk/apa/d/brooklyn-no-fee-stunning-2br-1ba-heart/7859479024.html
Example: https://newyork.craigslist.org/brk/apa/d/brooklyn-stunning-bed-bath-corner/7859454129.html
```

### Page Structure

#### Search Results Page

```html
<div class="result-info">
  <a
    href="/que/apa/d/springfield-gardens-deluxe-one-bedroom/7859490750.html"
    class="result-title"
  >
    Deluxe One Bedroom Springfield Gardens
  </a>
  <span class="result-price">$3200</span>
  <span class="result-meta">
    <span class="result-date">Jan 15</span>
    <span class="result-neighborhood">(Upper East Side)</span>
  </span>
</div>
```

#### Individual Listing Page

```html
<section id="postingbody">
    <span class="price">$3200</span>
    <span class="housing">1br / 1ba</span>
    <div class="mapaddress">123 E 86th St</div>

    <div class="postinginfos">
        <p class="attrgroup">
            <span>laundry in bldg</span>
            <span>cats are OK - purrr</span>
            <span>dogs are OK - wooof</span>
        </span>
    </div>

    <section id="postingbody">
        Description text here...
    </section>

    <div class="thumbs">
        <img src="https://images.craigslist.org/abc123_300x300.jpg">
    </div>
</div>
```

## Scraping Implementation

### Technology Stack (Simplified for MVP)

#### Primary Scraper: Basic Puppeteer

```typescript
// Simple Puppeteer setup - no complex anti-detection initially
const puppeteer = require('puppeteer');

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
);
```

#### MVP Strategy: Focus on Getting Data First

- Start with basic Puppeteer configuration
- Add anti-detection features later if needed
- Focus on consistent data extraction
- Simple error handling and retries

### Scraping Algorithm

#### Main Scraping Process

```typescript
FUNCTION scrapeRecentListings():
    all_listings = []

    // Focus on recent listings only (posted in last 60 minutes with buffer)
    time_filter = "60m"

    // Scrape each NYC area
    areas = ['mnh', 'brk', 'que', 'brx', 'stn']

    FOR area in areas:
        TRY:
            // Only get recent listings to reduce load
            area_listings = scrapeAreaRecent(area, time_filter)
            all_listings.extend(area_listings)
            LOG("Scraped {area_listings.length} recent listings from {area}")

            // Respectful delay between areas (30-60 seconds)
            SLEEP(random(30, 60) seconds)

        CATCH error:
            LOG_ERROR("Failed to scrape {area}: {error}")
            CONTINUE

    // Filter out duplicates and existing listings
    new_listings = filterNewListings(all_listings)

    RETURN new_listings

FUNCTION scrapeAreaRecent(area, time_filter):
    listings = []
    
    // MVP: Start with just first 2 pages to be safe
    MAX_PAGES = 2

    FOR page in 1 to MAX_PAGES:
        search_url = buildRecentSearchUrl(area, page, time_filter)

        TRY:
            page_listings = scrapePage(search_url)

            IF page_listings.length == 0:
                BREAK  // No more listings

            listings.extend(page_listings)

            // Longer delay between pages for safety
            SLEEP(random(10, 20) seconds)

        CATCH error:
            LOG_ERROR("Failed to scrape page {page} for {area}: {error}")
            BREAK

    RETURN listings

FUNCTION scrapePage(url):
    page_listings = []

    // Load page
    page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle2' })

    // Extract listing links
    listing_links = await page.$$eval('.result-row', rows => {
        return rows.map(row => {
            const link = row.querySelector('.result-title');
            const price = row.querySelector('.result-price');
            const date = row.querySelector('.result-date');
            const hood = row.querySelector('.result-neighborhood');

            return {
                url: link?.href,
                title: link?.textContent?.trim(),
                price: price?.textContent?.trim(),
                date: date?.getAttribute('datetime'),
                neighborhood: hood?.textContent?.trim()
            };
        });
    });

    // Process each listing
    FOR link_data in listing_links:
        IF isRecentListing(link_data.date):
            listing_details = await scrapeListingDetails(link_data.url)
            IF listing_details:
                page_listings.append(listing_details)

        // Small delay between listings
        SLEEP(random(0.5, 1.5) seconds)

    await page.close()
    RETURN page_listings
```

#### Individual Listing Scraper

```typescript
FUNCTION scrapeListingDetails(listing_url):
    TRY:
        page = await browser.newPage()
        await page.goto(listing_url, { waitUntil: 'networkidle2' })

        // Check if listing still exists
        const removed = await page.$('.removed');
        IF removed:
            RETURN null

        // Extract listing data
        listing_data = await page.evaluate(() => {
            const price = document.querySelector('.price')?.textContent;
            const housing = document.querySelector('.housing')?.textContent;
            const address = document.querySelector('.mapaddress')?.textContent;
            const body = document.querySelector('#postingbody')?.textContent;
            const attrs = Array.from(document.querySelectorAll('.attrgroup span'))
                                .map(span => span.textContent);

            // Extract bedrooms/bathrooms from housing text
            const housingMatch = housing?.match(/(\d+)br\s*\/\s*(\d+(?:\.\d+)?)ba/);
            const bedrooms = housingMatch ? parseInt(housingMatch[1]) : 0;
            const bathrooms = housingMatch ? parseFloat(housingMatch[2]) : 0;

            // Extract images
            const images = Array.from(document.querySelectorAll('.thumbs img'))
                               .map(img => img.src.replace('_300x300', '_1200x900'));

            // Check pet policy
            const petFriendly = attrs.some(attr =>
                attr.includes('cats are OK') ||
                attr.includes('dogs are OK') ||
                attr.includes('pets OK')
            );

            return {
                price: parseInt(price?.replace(/[$,]/g, '')),
                bedrooms,
                bathrooms,
                address: address?.trim(),
                description: body?.trim(),
                images,
                petFriendly,
                attributes: attrs
            };
        });

        // Extract posting ID from URL
        const posting_id = extractPostingId(listing_url);

        // Combine all data
        const complete_listing = {
            external_id: posting_id,
            title: getPageTitle(page),
            listing_url,
            source: 'craigslist',
            posted_at: extractPostDate(page),
            ...listing_data
        };

        await page.close();
        RETURN complete_listing;

    CATCH error:
        LOG_ERROR("Failed to scrape listing {listing_url}: {error}");
        RETURN null;
```

### Basic Safety Measures (MVP Approach)

#### Simple Request Timing

```typescript
// Conservative delays to avoid being blocked
function getRandomDelay(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Between pages: 10-20 seconds (very conservative)
await sleep(getRandomDelay(10000, 20000));

// Between areas: 30-60 seconds (extra safe)
await sleep(getRandomDelay(30000, 60000));

// Main job runs every 30-45 minutes
const jobInterval = getRandomDelay(30 * 60 * 1000, 45 * 60 * 1000);
```

#### Basic Browser Configuration

```typescript
// Simple, reliable setup
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

// Standard user agent (no rotation initially)
await page.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
);
```

#### Future Enhancements (Add Later If Needed)

- User agent rotation
- Advanced browser stealth
- Proxy rotation
- More sophisticated timing patterns

**MVP Strategy**: Start simple, add complexity only if blocked

### Data Processing Pipeline

#### Data Normalization

```typescript
FUNCTION normalizeListingData(raw_data):
    normalized = {
        external_id: raw_data.posting_id,
        title: cleanTitle(raw_data.title),
        description: cleanDescription(raw_data.description),
        price: parseInt(raw_data.price) || 0,
        bedrooms: parseInt(raw_data.bedrooms) || 0,
        bathrooms: parseFloat(raw_data.bathrooms) || 0,
        neighborhood: normalizeNeighborhood(raw_data.neighborhood),
        address: cleanAddress(raw_data.address),
        pet_friendly: raw_data.petFriendly || false,
        images: filterValidImages(raw_data.images),
        listing_url: raw_data.url,
        source: 'craigslist',
        posted_at: parseDate(raw_data.posted_at),
        scraped_at: NOW()
    }

    // Add scam score calculation
    normalized.scam_score = calculateScamScore(normalized)

    RETURN normalized

FUNCTION cleanTitle(title):
    // Remove excessive punctuation and caps
    cleaned = title.replace(/[!]{2,}/g, '!');
    cleaned = cleaned.replace(/[A-Z]{5,}/g, match =>
        match.charAt(0) + match.slice(1).toLowerCase()
    );
    RETURN cleaned.trim();

FUNCTION normalizeNeighborhood(neighborhood):
    // Standardize neighborhood names
    neighborhood_map = {
        'UES': 'Upper East Side',
        'UWS': 'Upper West Side',
        'LES': 'Lower East Side',
        'NoLita': 'Nolita',
        'SOHO': 'SoHo',
        'TRIBECA': 'Tribeca'
    };

    cleaned = neighborhood.replace(/[()]/g, '').trim();
    RETURN neighborhood_map[cleaned] || cleaned;
```

### Error Handling & Recovery

#### Robust Error Handling

```typescript
class ScrapingError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean
  ) {
    super(message);
  }
}

async function robustScrape(url: string, maxRetries: number = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await scrapeListingDetails(url);
    } catch (error) {
      if (error instanceof ScrapingError && !error.retryable) {
        throw error; // Don't retry non-retryable errors
      }

      if (attempt === maxRetries) {
        throw error; // Last attempt failed
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await sleep(delay);
    }
  }
}
```

#### Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > 300000) {
        // 5 minutes
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= 5) {
      // Open after 5 failures
      this.state = 'open';
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = 'closed';
  }
}
```

### Performance Monitoring

#### Scraping Metrics

```typescript
interface ScrapingMetrics {
  total_listings_found: number;
  new_listings_added: number;
  failed_requests: number;
  average_response_time: number;
  success_rate: number;
  last_successful_scrape: Date;
}

function trackScrapingMetrics(results: ScrapingResult[]): ScrapingMetrics {
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  return {
    total_listings_found: results.length,
    new_listings_added: successful.length,
    failed_requests: failed.length,
    average_response_time: calculateAverageTime(successful),
    success_rate: successful.length / results.length,
    last_successful_scrape: new Date(),
  };
}
```

## Compliance & Ethics

### Respectful Scraping Practices

1. **Rate Limiting**: Never exceed 1 request per second
2. **robots.txt**: Check and respect robots.txt directives
3. **Terms of Service**: Regular review of Craigslist ToS
4. **Data Usage**: Only use data for legitimate apartment matching
5. **No Republishing**: Never republish scraped content

### Legal Considerations

1. **Fair Use**: Data used for legitimate consumer service
2. **No Commercial Redistribution**: Data not resold or redistributed
3. **User Privacy**: No collection of personal information
4. **Data Retention**: Automatic cleanup of old listings
5. **Compliance**: Regular legal review of scraping practices

### Backup Strategy

1. **Multiple Data Sources**: Plan for additional listing sites
2. **Manual Fallback**: Admin interface for manual listing entry
3. **Partner APIs**: Investigate official real estate APIs
4. **User Submissions**: Allow users to submit listings manually
