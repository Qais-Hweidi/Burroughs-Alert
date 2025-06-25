# Burroughs Alert - Algorithms & Pseudocode (MVP Focus)

**MVP Strategy**: Start with basic filtering algorithms, add advanced features incrementally. Focus on getting core matching working first.

## Core Algorithms

### 1. Listing Matching Algorithm

**Purpose**: Match new listings against user alert criteria

#### Input

- New listing data
- Array of active user alerts

#### Output

- Array of matches (user_id, alert_id, listing_id)

#### Pseudocode

```
FUNCTION matchListingToAlerts(listing, alerts):
    matches = []

    FOR each alert in alerts:
        IF isMatchingListing(listing, alert):
            matches.append({
                userId: alert.user_id,
                alertId: alert.id,
                listingId: listing.id
            })

    RETURN matches

FUNCTION isMatchingListing(listing, alert):
    // Price range check
    IF listing.price < alert.min_price OR listing.price > alert.max_price:
        RETURN false

    // Bedroom count check
    IF alert.min_bedrooms AND listing.bedrooms < alert.min_bedrooms:
        RETURN false
    IF alert.max_bedrooms AND listing.bedrooms > alert.max_bedrooms:
        RETURN false

    // Neighborhood check
    IF alert.neighborhoods NOT contains listing.neighborhood:
        RETURN false

    // Pet policy check
    IF alert.pet_friendly AND NOT listing.pet_friendly:
        RETURN false

    // Basic scam detection (MVP - simple price check)
    IF isObviousScam(listing):
        RETURN false

    // Skip commute calculation for MVP - add later
    // TODO: Implement commute time check in future iteration

    // Already notified check
    IF hasBeenNotified(alert.user_id, alert.id, listing.id):
        RETURN false

    RETURN true
```

#### Implementation Notes

```typescript
// TypeScript implementation structure
interface MatchResult {
  userId: number;
  alertId: number;
  listingId: number;
  matchScore?: number; // Future enhancement
}

async function matchListingToAlerts(
  listing: Listing,
  alerts: Alert[]
): Promise<MatchResult[]> {
  const matches: MatchResult[] = [];

  for (const alert of alerts) {
    if (await isMatchingListing(listing, alert)) {
      matches.push({
        userId: alert.userId,
        alertId: alert.id,
        listingId: listing.id,
      });
    }
  }

  return matches;
}
```

### 2. Scam Detection Algorithm (Enhanced MVP)

**Purpose**: Identify fraudulent listings using LLM-powered analysis

#### Option A: Simple Rule-Based (Fallback)
- Input: Listing data (title, description, price)
- Output: Boolean (true if obviously suspicious)

#### Option B: LLM-Enhanced Detection (Recommended)
- Input: Full listing content
- Output: Scam probability + reasoning
- **API**: Mistral AI (`mistral-small-latest`)

#### Pseudocode

```
// Primary: LLM-Enhanced Scam Detection
FUNCTION detectScamWithLLM(listing):
    prompt = buildScamDetectionPrompt(listing)
    
    TRY:
        // Use Mistral AI API
        response = await callMistralAPI(prompt)
        scam_analysis = parseScamResponse(response)
        
        RETURN {
            isScam: scam_analysis.probability > 0.7,
            confidence: scam_analysis.probability,
            reasoning: scam_analysis.reasoning
        }
    
    CATCH api_error:
        // Fallback to simple detection
        RETURN detectScamSimple(listing)

// Fallback: Simple Rule-Based Detection  
FUNCTION detectScamSimple(listing):
    // Check for extremely low prices (likely scam)
    IF listing.price < 800:  // Unrealistically low for NYC
        RETURN {isScam: true, confidence: 0.9, reasoning: "Price too low"}
    
    // Check for common scam phrases
    scam_phrases = ["wire money", "western union", "send money", "out of country"]
    description_lower = listing.description.toLowerCase()
    
    FOR phrase in scam_phrases:
        IF phrase in description_lower:
            RETURN {isScam: true, confidence: 0.8, reasoning: "Scam phrase detected"}
    
    // Check for excessive caps in title
    caps_count = countUpperCaseChars(listing.title)
    IF caps_count > (listing.title.length * 0.5):
        RETURN {isScam: true, confidence: 0.6, reasoning: "Excessive caps"}
    
    RETURN {isScam: false, confidence: 0.3, reasoning: "Appears legitimate"}
```

#### Implementation Notes (Enhanced with LLM)

```typescript
// LLM-Enhanced Scam Detection
async function detectScamWithLLM(listing: Listing): Promise<ScamResult> {
  const prompt = `
Analyze this NYC apartment listing for potential scams. Consider price, description, contact info, and common scam patterns.

Title: ${listing.title}
Price: $${listing.price}/month
Bedrooms: ${listing.bedrooms}
Description: ${listing.description}
Location: ${listing.neighborhood}

Rate scam probability (0-1) and provide reasoning.
Respond in JSON: {"probability": 0.0, "reasoning": "explanation"}
  `;

  try {
    // Mistral AI API
    const response = await mistralClient.chat({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    });

    const analysis = JSON.parse(response.choices[0].message.content);
    
    return {
      isScam: analysis.probability > 0.7,
      confidence: analysis.probability,
      reasoning: analysis.reasoning,
      source: 'llm'
    };
  } catch (error) {
    // Fallback to simple detection
    return detectScamSimple(listing);
  }
}

// Fallback method
function detectScamSimple(listing: Listing): ScamResult {
  if (listing.price < 800) {
    return { isScam: true, confidence: 0.9, reasoning: 'Price too low', source: 'rule' };
  }
  
  const scamPhrases = ['wire money', 'western union', 'send money'];
  if (scamPhrases.some(phrase => listing.description.toLowerCase().includes(phrase))) {
    return { isScam: true, confidence: 0.8, reasoning: 'Scam phrase detected', source: 'rule' };
  }
  
  return { isScam: false, confidence: 0.3, reasoning: 'Appears legitimate', source: 'rule' };
}

interface ScamResult {
  isScam: boolean;
  confidence: number;
  reasoning: string;
  source: 'llm' | 'rule';
}
```

### 3. Additional LLM Integration Opportunities

**Other Uses for Mistral AI:**

#### A. Neighborhood Normalization
```typescript
// Standardize neighborhood names using LLM
async function normalizeNeighborhood(rawLocation: string): Promise<string> {
  const prompt = `
Normalize this NYC location to a standard neighborhood name:
Input: "${rawLocation}"

Return only the standard neighborhood name (e.g., "Upper East Side", "Williamsburg", "Astoria").
If unclear, return the closest valid NYC neighborhood.
  `;
  
  const response = await mistralClient.chat({
    model: 'mistral-small-latest',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
  });
  
  return response.choices[0].message.content.trim();
}
```

#### B. Listing Quality Assessment
```typescript
// Assess overall listing quality and completeness
async function assessListingQuality(listing: Listing): Promise<QualityScore> {
  const prompt = `
Rate this apartment listing quality (0-1) based on completeness, clarity, and legitimacy:

Title: ${listing.title}
Description: ${listing.description}
Images: ${listing.images.length} photos

Consider: description detail, image quality, contact info, overall professionalism.
Respond in JSON: {"score": 0.0, "issues": ["list", "of", "issues"]}
  `;
  // Implementation similar to scam detection
}
```

#### C. Description Enhancement (Future)
- Clean up messy descriptions
- Extract amenities automatically
- Generate standardized summaries

### 4. Future Algorithm Enhancements

**Advanced Scam Detection** (Post-MVP):
- Price anomaly detection with neighborhood averages
- Email/phone pattern analysis  
- Image analysis
- Historical scam pattern learning

**Advanced Matching** (Post-MVP):
- Commute time calculation with Google Maps API
- Match scoring and ranking with LLM reasoning
- Price anomaly detection
- Advanced preference weighting

### 4. Simplified Data Flow (MVP)

**Current Implementation Strategy**:

```typescript
// Main processing pipeline (simplified)
async function processNewListings() {
  // 1. Get recent listings from scraper
  const recentListings = await scraper.getRecentListings();
  
  // 2. For each listing, check against all active alerts
  for (const listing of recentListings) {
    // Skip obvious scams
    if (isObviousScam(listing)) continue;
    
    // Find matching alerts
    const matchingAlerts = await findMatchingAlerts(listing);
    
    // Send notifications for matches
    if (matchingAlerts.length > 0) {
      await sendNotifications(listing, matchingAlerts);
    }
  }
}

// Simple matching function
async function findMatchingAlerts(listing: Listing): Promise<Alert[]> {
  const activeAlerts = await getActiveAlerts();
  
  return activeAlerts.filter(alert => {
    // Basic filtering only
    return (
      listing.price >= alert.minPrice &&
      listing.price <= alert.maxPrice &&
      listing.bedrooms >= alert.minBedrooms &&
      alert.neighborhoods.includes(listing.neighborhood) &&
      (!alert.petFriendly || listing.petFriendly)
    );
  });
}
```

**Benefits of This Approach**:
- Simple to implement and debug
- Fast processing
- Easy to extend later
- Reliable core functionality

## Removed Complex Sections (For Future Development)

The following algorithms were removed from MVP scope:

- **Advanced Scam Detection**: Complex scoring algorithms, contact info analysis, image analysis
- **Commute Time Calculation**: Google Maps API integration (documented separately)
- **Notification Queue Management**: Complex queuing and rate limiting
- **Match Scoring**: Weighted scoring and ranking systems
- **Price Anomaly Detection**: Neighborhood-based price analysis

These will be implemented in future iterations once the basic system is working reliably.

### 3. Commute Calculation Algorithm

**Purpose**: Calculate accurate public transit time from apartment listing to user's work/study location

**Frontend Status**: ✅ Complete - Collects work destination and maximum commute time
**Backend Status**: ❌ Not implemented - Requires Google Maps API integration

#### Implementation Strategy: Google Maps API

**Step 1: Geocoding Work Location**

```
FUNCTION geocodeWorkLocation(work_destination):
    // Convert user input to coordinates
    api_url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        address: work_destination + ", NYC",
        key: GOOGLE_MAPS_API_KEY
    }

    response = makeApiCall(api_url, params)

    IF response.status == "OK":
        location = response.results[0].geometry.location
        RETURN {lat: location.lat, lng: location.lng}
    ELSE:
        THROW GeocodeError("Could not geocode work location")
```

**Step 2: Commute Time Calculation**

```
FUNCTION calculateCommute(apartment_address, work_coords, max_commute_minutes):
    // Try cache first
    cache_key = generateCacheKey(apartment_address, work_coords)
    cached_result = getFromCache(cache_key)
    IF cached_result:
        RETURN cached_result

    // Use Google Maps Distance Matrix API
    api_url = "https://maps.googleapis.com/maps/api/distancematrix/json"
    params = {
        origins: apartment_address,
        destinations: work_coords.lat + "," + work_coords.lng,
        mode: "transit",
        transit_mode: "subway|bus",
        departure_time: getCurrentRushHourTime(),
        key: GOOGLE_MAPS_API_KEY
    }

    TRY:
        response = makeApiCall(api_url, params)

        IF response.status == "OK":
            element = response.rows[0].elements[0]

            IF element.status == "OK":
                commute_seconds = element.duration.value
                commute_minutes = commute_seconds / 60

                // Cache result for 24 hours
                cacheResult(cache_key, commute_minutes, "24h")

                RETURN commute_minutes
            ELSE:
                // No transit route found
                RETURN null
        ELSE:
            THROW ApiError("Google Maps API error")

    CATCH api_error:
        LOG_WARNING("Commute calculation failed for " + apartment_address)
        RETURN null // Don't filter if calculation fails
```

**Step 3: Filtering Logic Integration**

```
FUNCTION isMatchingListing(listing, alert):
    // ... existing price, bedroom, neighborhood checks ...

    // Commute time check (only if both fields provided)
    IF alert.commute_destination AND alert.max_commute_minutes:
        // Get work coordinates (cached from alert creation)
        work_coords = getWorkCoordinates(alert.commute_destination)

        IF work_coords:
            commute_time = calculateCommute(
                listing.address,
                work_coords,
                alert.max_commute_minutes
            )

            // If calculation successful and exceeds limit, exclude
            IF commute_time AND commute_time > alert.max_commute_minutes:
                RETURN false

            // If calculation failed, include listing (graceful degradation)
            // Better to show too many than miss good apartments

    RETURN true
```

FUNCTION estimateByDistance(origin, destination):
distance_miles = calculateDistance(origin, destination)

    // NYC average: 15 mph including stops
    estimated_time = (distance_miles / 15) * 60

    // Manhattan penalty (slower traffic)
    IF isInManhattan(origin) OR isInManhattan(destination):
        estimated_time *= 1.5

    RETURN estimated_time

FUNCTION calculateSubwayTime(origin, dest, timeOfDay):
// Find nearest subway stations
origin_station = findNearestSubwayStation(origin)
dest_station = findNearestSubwayStation(dest)

    // Walking time to/from stations
    walk_to_station = walkingTime(origin, origin_station)
    walk_from_station = walkingTime(dest_station, dest)

    // Subway travel time
    subway_travel = getSubwayTravelTime(origin_station, dest_station)

    // Rush hour delays
    IF timeOfDay == "rush_hour":
        subway_travel *= 1.4

    total_time = walk_to_station + subway_travel + walk_from_station
    RETURN total_time

````

#### Implementation Notes
```typescript
// Commute calculator service with Google Maps API
interface WorkLocation {
  address: string;
  coordinates: { lat: number; lng: number };
  geocoded_at: Date;
}

interface CommuteResult {
  duration_minutes: number | null;
  status: 'success' | 'no_route' | 'api_error';
  cached: boolean;
}

class CommuteCalculator {
  private cache: Map<string, number>;
  private googleMapsApiKey: string;

  async geocodeWorkLocation(address: string): Promise<WorkLocation> {
    // Convert work location to coordinates using Google Geocoding API
    // Cache results to avoid repeated geocoding
  }

  async calculateCommute(
    apartmentAddress: string,
    workCoordinates: { lat: number; lng: number },
    maxCommuteMinutes: number
  ): Promise<CommuteResult> {
    // Use Google Maps Distance Matrix API for accurate transit times
    // Include caching and graceful error handling
  }

  private generateCacheKey(origin: string, destination: string): string {
    // Create consistent cache keys for apartment-to-work pairs
  }
}
````

#### Required Environment Variables

```bash
# Google Maps API Configuration
GOOGLE_MAPS_API_KEY="your_api_key_here"
GOOGLE_MAPS_CACHE_TTL="86400"  # 24 hours in seconds

# API Rate Limiting
COMMUTE_CALC_RATE_LIMIT="1000"  # requests per day
COMMUTE_CALC_BATCH_SIZE="25"    # batch size for bulk calculations
```

#### Cost Management Strategy

- **Geocoding API**: ~$5 per 1000 requests (cache work locations)
- **Distance Matrix API**: ~$10 per 1000 requests (cache apartment-to-work pairs)
- **Caching**: 24-hour cache reduces API calls by ~90%
- **Graceful Degradation**: Include apartments if API fails rather than exclude
- **Batch Processing**: Calculate commutes for multiple apartments in single API call

### 4. Notification Queue Algorithm

**Purpose**: Manage and process notification sending

#### Input

- Array of notification requests
- Rate limiting constraints

#### Output

- Processed notifications with status

#### Pseudocode

```
FUNCTION processNotificationQueue():
    WHILE true:
        // Get pending notifications
        notifications = getPendingNotifications(limit = 50)

        IF notifications.length == 0:
            SLEEP(30_seconds)
            CONTINUE

        // Process in batches to respect rate limits
        FOR batch in chunks(notifications, batch_size = 10):
            processed = []

            FOR notification in batch:
                TRY:
                    // Check rate limits
                    IF canSendNotification(notification.user_id):
                        result = sendEmailNotification(notification)
                        processed.append({
                            id: notification.id,
                            status: result.status,
                            sent_at: NOW()
                        })
                    ELSE:
                        // Delay notification
                        scheduleForLater(notification, delay = "1_hour")

                CATCH error:
                    processed.append({
                        id: notification.id,
                        status: "failed",
                        error: error.message,
                        retry_at: NOW() + "15_minutes"
                    })

            // Update notification statuses
            updateNotificationStatuses(processed)

            // Rate limiting delay between batches
            SLEEP(2_seconds)

FUNCTION canSendNotification(user_id):
    // Check daily/hourly limits per user
    daily_count = getNotificationCount(user_id, "24h")
    hourly_count = getNotificationCount(user_id, "1h")

    IF daily_count >= 20:  // Max 20 per day
        RETURN false
    IF hourly_count >= 5:  // Max 5 per hour
        RETURN false

    RETURN true

FUNCTION sendEmailNotification(notification):
    // Render email template
    email_html = renderEmailTemplate(notification)

    // Send via email service
    result = emailService.send({
        to: notification.user_email,
        subject: generateSubject(notification),
        html: email_html,
        text: generateTextVersion(email_html)
    })

    RETURN result
```

#### Implementation Notes

```typescript
// Notification queue manager
interface NotificationRequest {
  id: number;
  userId: number;
  alertId: number;
  listingId: number;
  userEmail: string;
  priority: 'high' | 'normal' | 'low';
  scheduledFor?: Date;
}

class NotificationQueue {
  private queue: NotificationRequest[];
  private processing: boolean;
  private rateLimiter: Map<number, number[]>; // userId -> timestamps

  async processQueue(): Promise<void> {
    // Background processing with rate limiting
  }

  private async canSendToUser(userId: number): Promise<boolean> {
    // Check rate limits for user
  }
}
```

### 5. Data Flow Orchestration (Simplified for MVP)

**Purpose**: Coordinate the complete flow from scraping to notification

**MVP Note**: For local development, this will be simplified to manual triggers or basic scheduling instead of complex orchestration.

#### Main Process Flow

```
FUNCTION runMainDataFlow():
    // MVP: Simplified version - can be triggered manually or on simple schedule
    TRY:
        // Step 1: Scrape new listings (basic version)
        new_listings = scrapeListings()

        // Step 2: Process listings (simplified)
        FOR listing in new_listings:
            // Basic scam detection
            listing.scam_score = calculateBasicScamScore(listing)

            // Save to database
            saved_listing = saveListings(listing)

            // Simple matching
            matches = matchListingToAlerts(saved_listing)

            // Direct notification (no complex queue)
            FOR match in matches:
                sendDirectNotification(match)

        LOG("MVP data flow completed")

    CATCH error:
        LOG_ERROR("Data flow error: {error}")

FUNCTION determinePriority(listing, match):
    // High priority for great deals
    IF listing.price < getAveragePrice(listing.neighborhood) * 0.8:
        RETURN "high"

    // High priority for exact matches
    IF isExactMatch(listing, match.alert):
        RETURN "high"

    RETURN "normal"
```

## Algorithm Performance Considerations

### Time Complexity

- **Matching Algorithm**: O(n\*m) where n=listings, m=alerts
- **Scam Detection**: O(1) per listing (constant time checks)
- **Commute Calculation**: O(1) with caching, O(api_time) without

### Space Complexity

- **In-memory Caching**: Bounded by cache size limits
- **Database Queries**: Optimized with proper indexing
- **Notification Queue**: Bounded by queue size limits

### Optimization Strategies

1. **Database Indexing**: Proper indexes on frequently queried fields
2. **Caching**: Cache expensive operations (commute calculations)
3. **Batch Processing**: Process notifications in batches
4. **Rate Limiting**: Prevent overwhelming external services
5. **Background Jobs**: Separate processes for heavy operations

### Error Handling

1. **Graceful Degradation**: Continue operation with reduced functionality
2. **Retry Logic**: Exponential backoff for transient failures
3. **Circuit Breakers**: Prevent cascading failures
4. **Dead Letter Queues**: Handle permanently failed notifications
5. **Monitoring**: Track success rates and performance metrics
