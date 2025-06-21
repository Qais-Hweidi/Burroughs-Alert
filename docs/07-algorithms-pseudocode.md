# Burroughs Alert - Algorithms & Pseudocode

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

**Purpose**: Estimate travel time from listing to work location

#### Input
- Origin address (listing)
- Destination address (work/school)
- Time of day (rush hour consideration)

#### Output
- Estimated commute time in minutes

#### Pseudocode
```
FUNCTION calculateCommute(origin, destination, timeOfDay = "rush_hour"):
    // Try cache first
    cache_key = generateCacheKey(origin, destination, timeOfDay)
    cached_result = getFromCache(cache_key)
    IF cached_result:
        RETURN cached_result
    
    // Use external API (Google Maps/Transit)
    commute_time = 0
    
    TRY:
        // Get coordinates
        origin_coords = geocodeAddress(origin)
        dest_coords = geocodeAddress(destination)
        
        // Calculate public transit time
        transit_time = getTransitTime(origin_coords, dest_coords, timeOfDay)
        
        // Calculate walking + subway time (NYC specific)
        subway_time = calculateSubwayTime(origin_coords, dest_coords, timeOfDay)
        
        // Use the shorter time
        commute_time = min(transit_time, subway_time)
        
        // Add buffer for NYC delays
        commute_time *= 1.2
        
        // Cache result for 24 hours
        cacheResult(cache_key, commute_time, "24h")
        
    CATCH api_error:
        // Fallback to distance-based estimation
        commute_time = estimateByDistance(origin, destination)
    
    RETURN round(commute_time)

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
// Commute calculator service
interface CommuteOptions {
  time: 'rush_hour' | 'off_peak';
  modes: ('transit' | 'walking' | 'driving')[];
}

class CommuteCalculator {
  private cache: Map<string, number>;
  private googleMapsApiKey: string;
  
  async calculateCommute(
    origin: string,
    destination: string,
    options: CommuteOptions = { time: 'rush_hour', modes: ['transit'] }
  ): Promise<number> {
    // Implementation with caching and fallbacks
  }
}
```

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

### 5. Data Flow Orchestration

**Purpose**: Coordinate the complete flow from scraping to notification

#### Main Process Flow
```
FUNCTION runMainDataFlow():
    WHILE true:
        TRY:
            // Step 1: Scrape new listings
            new_listings = scrapeListings()
            IF new_listings.length > 0:
                LOG("Found {new_listings.length} new listings")
            
            // Step 2: Process each new listing
            FOR listing in new_listings:
                // Calculate scam score
                listing.scam_score = calculateScamScore(listing)
                
                // Save to database
                saved_listing = saveListings(listing)
                
                // Find matching alerts
                active_alerts = getActiveAlerts()
                matches = matchListingToAlerts(saved_listing, active_alerts)
                
                // Queue notifications
                FOR match in matches:
                    queueNotification({
                        user_id: match.userId,
                        alert_id: match.alertId,
                        listing_id: match.listingId,
                        priority: determinePriority(saved_listing, match)
                    })
            
            // Step 3: Process notification queue
            processNotificationQueue()
            
            // Step 4: Cleanup old data
            IF isTimeForCleanup():
                cleanupOldData()
            
            LOG("Data flow cycle completed")
            SLEEP(5_minutes)  // Wait before next cycle
            
        CATCH error:
            LOG_ERROR("Data flow error: {error}")
            SLEEP(1_minute)  // Brief pause before retry

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