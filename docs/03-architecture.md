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
- **Dashboard**: View active alerts and matches (future)
- **API Routes**: Backend endpoints for CRUD operations

**Data Flow**:
1. User visits landing page
2. Fills out alert preferences form
3. Form submits to `/api/alerts` endpoint
4. API validates and saves to database
5. User receives confirmation

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

**Jobs**:
- **Scraper Job**: Fetches new listings from Craigslist
- **Matcher Job**: Compares listings against user alerts
- **Notifier Job**: Sends email notifications for matches
- **Cleanup Job**: Removes old listings and notifications

**Scheduling**: 
- Scraper: Every 5 minutes
- Matcher: Every 2 minutes (after scraper)
- Notifier: Immediately when matches found
- Cleanup: Daily at midnight

### 4. External Services

**Purpose**: Third-party integrations

**Services**:
- **Craigslist**: Source of apartment listings
- **Gmail SMTP**: Email delivery service
- **Google Maps API**: Commute time calculation (optional)

## Data Flow Diagrams

### User Registration Flow
```
User → Landing Page → Alert Form → API Route → Database → Confirmation Email
```

### Listing Processing Flow
```
Craigslist → Scraper → Database → Matcher → Notifications → Users
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
// Flow: Cron → Scraper → Database → Matcher → Notifier
1. Scraper fetches Craigslist listings
2. Scraper saves to listings table
3. Matcher runs against active alerts
4. Notifier sends emails for matches
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

### Background Job Performance
- **Concurrent Processing**: Parallel job execution
- **Queue Management**: Priority-based job scheduling
- **Resource Limits**: Prevent memory/CPU exhaustion
- **Incremental Updates**: Only process changed data