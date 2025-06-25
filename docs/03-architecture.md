# Burroughs Alert - System Architecture

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Browser  │────│   Next.js App   │────│   SQLite DB     │
│                 │    │                 │    │                 │
│ - Landing Page  │    │ - API Routes    │    │ - Users         │
│ - Alert Setup   │    │ - Pages         │    │ - Alerts        │
│ - Notifications │    │ - Components    │    │ - Listings      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                │
                       ┌─────────────────┐
                       │ Background Jobs │
                       │                 │
                       │ - Scraper       │
                       │ - Matcher       │
                       │ - Notifier      │
                       └─────────────────┘
                                │
                                │
                       ┌─────────────────┐
                       │ External APIs   │
                       │                 │
                       │ - Craigslist    │
                       │ - Email SMTP    │
                       │ - Maps API      │
                       └─────────────────┘
```

## Core Components

### 1. Frontend Layer (Next.js App)

**Purpose**: User interface and API endpoints

**Components**:

- **Landing Page**: Marketing page with email signup
- **Alert Setup**: Form to configure apartment criteria
- **Listings View**: Display current matching apartments
- **API Routes**: Backend endpoints for CRUD operations

**Data Flow (Dual System)**:

**A. Immediate Feedback System:**
1. User visits landing page
2. Fills out alert preferences form
3. Form submits to `/api/alerts` endpoint
4. API validates and saves alert to database
5. **API searches existing listings** that match criteria
6. **User redirected to listings view page**
7. **Page displays current matching apartments**
8. User can browse and contact landlords immediately

**B. Ongoing Notification System:**
1. **Alert saved for continuous monitoring**
2. **Background job runs every 30-45 minutes**
3. **Scrapes only new listings** (posted in last 45-60 minutes)
4. **Matches new listings against ALL active alerts**
5. **Sends email notifications** for fresh matches
6. **Users get notified immediately** when new apartments appear

### 2. Database Layer (SQLite)

**Purpose**: Data persistence and querying

**Tables**:

- `users`: Email addresses and preferences
- `alerts`: User-defined search criteria
- `listings`: Scraped apartment data
- `notifications`: Notification history

**Relationships**:

- User has many Alerts (1:N)
- Alert has many Listings matches (N:M via matching logic)
- User has many Notifications (1:N)

### 3. Background Jobs System

**Purpose**: Automated tasks running independently

**Jobs** (Simplified Pipeline):

- **Main Job**: Combined scraper → matcher → notifier pipeline
- **Cleanup Job**: Removes old listings and notifications

**Scheduling**:

- Main Pipeline: Random intervals 30-45 minutes
- Only processes recent listings (last 45-60 minutes with buffer)
- Cleanup: Daily at midnight
- Built-in randomization to avoid detection patterns

### 4. External Services

**Purpose**: Third-party integrations

**Services**:

- **Craigslist**: Source of apartment listings
- **Gmail SMTP**: Email delivery service
- **Google Maps API**: Commute time calculation (optional)

## Data Flow Diagrams

### A. Immediate Feedback Flow

```
User → Alert Form → API Route → [Save Alert + Search Existing] → Listings View Page
                                     ↓
                              Display Current Matches → User Browses & Contacts
```

### B. Ongoing Notification Flow

```
Background Job (Every 30-45 min) → Scrape New Listings → Match Against All Alerts → Email Users
```

### Combined System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Creates  │ → │  Immediate View   │    │ Ongoing Monitor │
│     Alert       │    │ (Current Matches) │    │ (New Matches)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                  ↓                      ↓
                              Browse Now            Email Alerts
```

### Notification Flow

```
New Listing → Match Detection → Email Template → SMTP → User Inbox
```

## Component Interactions

### 1. User Alert Creation

```typescript
// Flow: Frontend → API → Database
POST /api/alerts
{
  email: "user@example.com",
  neighborhoods: ["Manhattan", "Brooklyn"],
  maxPrice: 3000,
  minBedrooms: 1,
  petFriendly: true,
  maxCommute: 30
}
```

### 2. Background Scraping

```typescript
// Flow: Randomized Cron → Combined Pipeline
1. Random delay (30-45 minutes) triggers main job
2. Scraper fetches only recent Craigslist listings
3. Each new listing immediately checked against alerts
4. Matching listings trigger direct email notifications
5. Process completes, schedules next random interval
```

### 3. Matching Algorithm

```typescript
// Flow: New Listing → Match Logic → Notification Queue
1. Check if listing matches user criteria
2. Apply scam detection filters
3. Calculate commute time if needed
4. Queue notification if match found
```

## Scalability Considerations

### Current Architecture (MVP)

- **Concurrent Users**: 100-500
- **Listings Processed**: 1000-5000/day
- **Notifications Sent**: 50-200/day
- **Database Size**: <100MB

### Scaling Bottlenecks

1. **Scraping Rate Limits**: Single-threaded Puppeteer
2. **Database Locks**: SQLite write bottlenecks
3. **Memory Usage**: In-process background jobs
4. **Email Limits**: Gmail SMTP rate limits

### Future Scaling Solutions

1. **Multiple Scrapers**: Distributed scraping with Redis queue
2. **Database Migration**: PostgreSQL for better concurrency
3. **Background Jobs**: Separate worker processes or containers
4. **Email Service**: Dedicated email service (SendGrid, Mailgun)

## Security Architecture

### Data Protection

- **No Passwords**: Email-only authentication reduces risk
- **Input Validation**: All user inputs sanitized
- **SQL Injection**: Parameterized queries only
- **XSS Protection**: Next.js built-in sanitization

### Scraping Protection

- **Rate Limiting**: Respect robots.txt and implement delays
- **User Agent Rotation**: Avoid detection
- **Proxy Rotation**: Distribute IP addresses (future)
- **Error Handling**: Graceful failure without data loss

### Privacy Compliance

- **Minimal Data Collection**: Only necessary information
- **Email Unsubscribe**: Easy opt-out mechanism
- **Data Retention**: Automatic cleanup of old data
- **No Tracking**: No analytics or user tracking

## Error Handling & Monitoring

### Error Types

1. **Scraping Errors**: Site changes, blocking, network issues
2. **Database Errors**: Corruption, disk space, locks
3. **Email Errors**: SMTP failures, invalid addresses
4. **Matching Errors**: Algorithm bugs, data corruption

### Monitoring Strategy

1. **Logging**: Structured logs for all operations
2. **Health Checks**: API endpoints for system status
3. **Alerts**: Email notifications for critical failures
4. **Metrics**: Track success rates and performance

### Testing Strategy (Basic)

1. **API Testing**: Ensure endpoints work correctly (create alerts, search listings)
2. **Database Testing**: Verify CRUD operations and data integrity
3. **Business Logic Testing**: Test matching algorithm and scam detection
4. **Mocked Services**: External services (Mistral AI, email, scraping) are mocked
5. **Focus**: Essential functionality only, skip complex integration scenarios

### Recovery Procedures

1. **Graceful Degradation**: Continue operation with reduced functionality
2. **Automatic Retry**: Exponential backoff for transient failures
3. **Manual Intervention**: Clear escalation procedures
4. **Data Backup**: Regular SQLite database backups

## Performance Optimization

### Frontend Performance

- **Static Generation**: Pre-build landing pages
- **Code Splitting**: Load only necessary JavaScript
- **Image Optimization**: Next.js automatic optimization
- **Caching**: Appropriate cache headers

### Backend Performance

- **Database Indexing**: Optimize query performance
- **Connection Pooling**: Reuse database connections
- **Memory Management**: Efficient data structures
- **Batch Processing**: Group operations where possible

### Background Job Performance (Simplified)

- **Single Pipeline**: One job handles scrape → match → notify
- **Recent Data Only**: Process only listings from last 4-6 hours
- **Randomized Timing**: 30-45 minute intervals to avoid patterns
- **Resource Efficient**: No complex queues, direct processing
- **Respectful Scraping**: Built-in delays and rate limiting

## Simplified Background Job Implementation

### Job Scheduler Design

```typescript
class SimpleJobScheduler {
  private isRunning = false;
  
  start() {
    // Initial run after random delay
    this.scheduleNextRun();
  }
  
  private scheduleNextRun() {
    // Random interval: 30-45 minutes (1800000-2700000 ms)
    const delay = 30 * 60 * 1000 + Math.random() * 15 * 60 * 1000;
    
    setTimeout(async () => {
      if (!this.isRunning) {
        await this.runMainPipeline();
      }
      this.scheduleNextRun(); // Schedule next run
    }, delay);
  }
  
  private async runMainPipeline() {
    this.isRunning = true;
    try {
      // 1. Scrape recent listings only
      const recentListings = await scraper.getRecentListings();
      
      // 2. For each listing, immediately check matches and notify
      for (const listing of recentListings) {
        const matches = await matcher.findMatches(listing);
        if (matches.length > 0) {
          await notifier.sendNotifications(matches);
        }
      }
    } finally {
      this.isRunning = false;
    }
  }
}
```
