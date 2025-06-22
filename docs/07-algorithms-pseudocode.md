# Burroughs Alert - Algorithms & Pseudocode

**Note for MVP**: These algorithms represent the full vision. For MVP, we'll implement simplified versions focusing on core functionality first.

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
    
    // Scam score check
    IF listing.scam_score > 0.5:  // High scam probability
        RETURN false
    
    // Commute time check (if specified)
    IF alert.max_commute_minutes:
        commute_time = calculateCommute(listing.address, alert.commute_destination)
        IF commute_time > alert.max_commute_minutes:
            RETURN false
    
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
        listingId: listing.id
      });
    }
  }
  
  return matches;
}
```

### 2. Scam Detection Algorithm

**Purpose**: Identify potentially fraudulent listings

#### Input
- Listing data (title, description, price, contact info)

#### Output
- Scam score (0.0 to 1.0, higher = more suspicious)

#### Pseudocode
```
FUNCTION calculateScamScore(listing):
    score = 0.0
    factors = []
    
    // Price anomaly detection
    price_factor = checkPriceAnomaly(listing)
    score += price_factor * 0.3
    IF price_factor > 0:
        factors.append("suspicious_price")
    
    // Description analysis
    description_factor = analyzeDescription(listing.description)
    score += description_factor * 0.25
    IF description_factor > 0:
        factors.append("suspicious_description")
    
    // Contact information analysis
    contact_factor = analyzeContactInfo(listing.contact_info)
    score += contact_factor * 0.2
    IF contact_factor > 0:
        factors.append("suspicious_contact")
    
    // Title analysis
    title_factor = analyzeTitle(listing.title)
    score += title_factor * 0.15
    IF title_factor > 0:
        factors.append("suspicious_title")
    
    // Image analysis (basic)
    image_factor = analyzeImages(listing.images)
    score += image_factor * 0.1
    IF image_factor > 0:
        factors.append("suspicious_images")
    
    RETURN min(score, 1.0), factors

FUNCTION checkPriceAnomaly(listing):
    // Get average price for neighborhood and bedroom count
    avg_price = getAveragePrice(listing.neighborhood, listing.bedrooms)
    
    IF avg_price == 0:  // No historical data
        RETURN 0.0
    
    price_ratio = listing.price / avg_price
    
    // Too cheap (likely scam)
    IF price_ratio < 0.5:
        RETURN 0.8
    IF price_ratio < 0.7:
        RETURN 0.4
    
    // Too expensive (possible but suspicious)
    IF price_ratio > 3.0:
        RETURN 0.3
    
    RETURN 0.0

FUNCTION analyzeDescription(description):
    score = 0.0
    text = description.toLowerCase()
    
    // Suspicious phrases
    scam_phrases = [
        "wire money", "western union", "cashier check",
        "out of country", "work overseas", "travel a lot",
        "send money", "advance payment", "deposit immediately"
    ]
    
    FOR phrase in scam_phrases:
        IF phrase in text:
            score += 0.3
    
    // Grammar/spelling issues (basic check)
    IF hasExcessiveSpellingErrors(text):
        score += 0.2
    
    // Excessive urgency
    urgency_words = ["urgent", "must go", "leaving today", "immediate"]
    urgency_count = countWords(text, urgency_words)
    IF urgency_count >= 2:
        score += 0.3
    
    RETURN min(score, 1.0)

FUNCTION analyzeContactInfo(contact_info):
    score = 0.0
    
    // Email analysis
    IF contact_info.email:
        email = contact_info.email.toLowerCase()
        
        // Suspicious email patterns
        IF contains(email, numbers_only_username):
            score += 0.3
        IF contains(email, temporary_email_domains):
            score += 0.5
        IF contains(email, "noreply") OR contains(email, "donotreply"):
            score += 0.4
    
    // Phone analysis
    IF contact_info.phone:
        phone = normalizePhone(contact_info.phone)
        
        // Invalid phone formats
        IF NOT isValidPhoneFormat(phone):
            score += 0.3
        
        // Known scam phone patterns
        IF isKnownScamPhone(phone):
            score += 0.8
    
    RETURN min(score, 1.0)
```

#### Implementation Notes
```typescript
// Scam detection service
interface ScamAnalysis {
  score: number;
  factors: string[];
  confidence: 'low' | 'medium' | 'high';
}

class ScamDetector {
  private suspiciousPhrases: string[];
  private temporaryEmailDomains: string[];
  
  async analyzeListings(listing: Listing): Promise<ScamAnalysis> {
    const score = await this.calculateScamScore(listing);
    const factors = this.getScamFactors(listing);
    const confidence = this.getConfidenceLevel(score, factors);
    
    return { score, factors, confidence };
  }
}
```

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
```

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
```

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
- **Matching Algorithm**: O(n*m) where n=listings, m=alerts
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