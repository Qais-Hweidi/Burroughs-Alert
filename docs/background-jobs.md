# Background Job System

This document describes the background job system for the Burroughs Alert application, which automates apartment listing scraping, matching, and maintenance tasks.

## Overview

The job system consists of three main components:

1. **Scraper Job** - Scrapes Craigslist for new apartment listings
2. **Matcher Job** - Matches new listings against user alerts
3. **Cleanup Job** - Maintains database health by removing old data

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Scraper Job   │───▶│   Matcher Job   │───▶│   Email Send    │
│                 │    │                 │    │                 │
│ • Scrape CL     │    │ • Find matches  │    │ • Send alerts   │
│ • Save to DB    │    │ • Create notif. │    │ • Track status  │
│ • Detect dupes  │    │ • Prevent dupes │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                                             ▲
          │            ┌─────────────────┐              │
          └───────────▶│   Cleanup Job   │──────────────┘
                       │                 │
                       │ • Old listings  │
                       │ • Old notifs    │
                       │ • Expired tokens│
                       │ • DB optimize   │
                       └─────────────────┘
```

## Configuration

### Environment Variables

```bash
# Core Job Settings
SCRAPING_INTERVAL=1800000          # 30 minutes in milliseconds
CLEANUP_INTERVAL=86400000          # 24 hours in milliseconds
HEALTH_CHECK_INTERVAL=300000       # 5 minutes in milliseconds

# Job Control
ENABLE_HEALTH_CHECKS=true
ENABLE_AUTO_CLEANUP=true
DISABLE_BACKGROUND_JOBS=false      # Set to true to disable all jobs

# Scraper Configuration
SCRAPER_MAX_MINUTES=60             # How far back to look for listings
SCRAPER_ENHANCED_MODE=true         # Enable enhanced data extraction
SCRAPER_SAVE_TO_DB=true           # Save scraped listings to database

# Matcher Configuration
MATCHER_MAX_HOURS=1               # Look for new listings in last N hours
MATCHER_GENERATE_NOTIFICATIONS=true

# Cleanup Configuration
CLEANUP_LISTING_RETENTION_DAYS=30
CLEANUP_NOTIFICATION_RETENTION_DAYS=90
CLEANUP_TOKEN_RETENTION_DAYS=30
CLEANUP_INACTIVE_ALERT_MONTHS=6
CLEANUP_OPTIMIZE_DATABASE=true

# Logging
LOG_LEVEL=info                    # debug, info, warn, error
```

## Usage

### 1. Integration with Next.js App

Add to your app startup (e.g., in `src/app/layout.tsx` or a startup script):

```typescript
import { autoStartBackgroundJobs } from '@/lib/jobs/startup';

// Start jobs when app initializes
autoStartBackgroundJobs();
```

### 2. Manual Job Control

#### CLI Commands

```bash
# Test individual jobs
npx tsx scripts/run-jobs.ts scraper        # Run scraper once
npx tsx scripts/run-jobs.ts matcher        # Run matcher once
npx tsx scripts/run-jobs.ts cleanup        # Run cleanup once

# System management
npx tsx scripts/run-jobs.ts system-start   # Start continuous job system
npx tsx scripts/run-jobs.ts system-status  # Check system health

# Test all components
npx tsx scripts/test-jobs.ts               # Comprehensive test
```

#### API Endpoints

```bash
# Get system status
GET /api/jobs

# Start job system
POST /api/jobs
{
  "action": "start"
}

# Stop job system
POST /api/jobs
{
  "action": "stop"
}

# Trigger individual job
POST /api/jobs
{
  "action": "trigger",
  "jobType": "scraper"  # or "matcher" or "cleanup"
}
```

#### Programmatic Control

```typescript
import { startJobSystem, getJobSystem } from '@/lib/jobs';

// Start the job system
const system = await startJobSystem();

// Trigger individual jobs
await system.runScraperNow();
await system.runMatcherNow();
await system.runCleanupNow();

// Get status
const status = system.getStatus();
console.log(`Running: ${status.isRunning}, Jobs run: ${status.totalJobsRun}`);

// Stop system
await system.stop();
```

## Job Details

### Scraper Job

**Purpose**: Scrape Craigslist for new apartment listings

**Features**:

- Scrapes all 5 NYC boroughs
- Time-based filtering (only recent listings)
- Enhanced mode for detailed data extraction
- Duplicate detection and prevention
- Automatic database saving

**Execution**:

- Runs every 30 minutes (configurable)
- Randomized interval (±25%) to avoid detection
- Automatically triggers matcher job when new listings found

**Output**:

```typescript
{
  success: boolean;
  newListingsCount: number;
  totalFound: number;
  boroughResults: Record<string, number>;
  errors: string[];
}
```

### Matcher Job

**Purpose**: Match new listings against user alerts and generate notifications

**Features**:

- Configurable time window for "new" listings
- Comprehensive filtering (price, bedrooms, neighborhood, pets)
- Duplicate notification prevention
- Batch processing for efficiency

**Execution**:

- Triggered automatically after scraper finds new listings
- Can be run manually via API or CLI
- Looks at listings from last 1 hour by default

**Matching Logic**:

1. Get recent listings (within time window)
2. Get active user alerts
3. Apply filters: neighborhoods, price range, bedrooms, pet-friendly
4. Check for existing notifications (prevent duplicates)
5. Generate notification records

### Cleanup Job

**Purpose**: Maintain database health and comply with data retention policies

**Features**:

- Configurable retention periods
- Database optimization (VACUUM, ANALYZE)
- Safe deletion with error handling
- Detailed reporting

**Execution**:

- Runs daily (configurable)
- Can be run manually for maintenance

**Cleanup Operations**:

1. **Old Listings** (30 days) - Remove outdated apartment listings
2. **Old Notifications** (90 days) - Clean notification history
3. **Expired Tokens** (30 days) - Remove old unsubscribe tokens
4. **Inactive Alerts** (6 months) - Delete disabled alerts
5. **Database Optimization** - VACUUM and ANALYZE for performance

## Monitoring and Health Checks

### Health Check Job

**Purpose**: Monitor system health and detect issues

**Features**:

- Database connectivity tests
- Table count monitoring
- Performance metrics
- Error detection

**Execution**:

- Runs every 5 minutes
- Logs health status
- Alerts on failures

### Status Monitoring

Check job system status:

```bash
# CLI
npx tsx scripts/run-jobs.ts system-status

# API
GET /api/jobs
```

**Status Information**:

- Job system running state
- Last execution times for each job
- Total jobs executed
- Recent errors
- Database health metrics

### Error Handling

**Error Types**:

- **Recoverable**: Temporary network issues, API rate limits
- **Permanent**: Configuration errors, database corruption
- **Warnings**: Partial failures, performance issues

**Error Response**:

- All errors are logged with timestamps
- System continues running after recoverable errors
- Failed jobs are retried on next scheduled run
- Manual intervention required for permanent errors

## Development and Testing

### Local Development

1. **Disable Jobs**: Set `DISABLE_BACKGROUND_JOBS=true` to prevent automatic startup
2. **Manual Testing**: Use CLI scripts to test individual components
3. **Test Mode**: Use test scripts with safe defaults

### Testing Jobs

```bash
# Test all components
npx tsx scripts/test-jobs.ts

# Test individual jobs with safe settings
npx tsx scripts/run-jobs.ts scraper  # Short time window, no DB save
npx tsx scripts/run-jobs.ts matcher  # No notification generation
npx tsx scripts/run-jobs.ts cleanup  # No optimization
```

### Debugging

**Common Issues**:

1. **Database Locks**: Multiple job instances or manual queries
   - Solution: Ensure single job system instance
2. **Scraping Failures**: Network issues or site changes
   - Solution: Check error logs, verify site accessibility
3. **Memory Usage**: Large dataset processing
   - Solution: Increase cleanup frequency, optimize queries

**Debug Logging**:

```bash
LOG_LEVEL=debug npm run dev
```

## Performance Considerations

### Resource Usage

- **CPU**: Moderate during scraping, low during idle
- **Memory**: 50-100MB typical, 200MB+ during heavy scraping
- **Network**: Periodic bursts during scraping
- **Disk I/O**: Database writes during scraping and cleanup

### Optimization

1. **Scraping Frequency**: Balance freshness vs. resource usage
2. **Enhanced Mode**: More data but slower scraping
3. **Cleanup Frequency**: More frequent = less space, more CPU
4. **Database Optimization**: Regular VACUUM improves performance

### Scaling

For high-volume deployments:

1. **Multiple Instances**: Coordinate via database locks
2. **External Queue**: Replace setInterval with proper job queue
3. **Caching**: Cache geocoding and commute calculations
4. **Database**: Consider PostgreSQL for better concurrency

## Security Considerations

1. **Rate Limiting**: Randomized intervals prevent scraping detection
2. **Data Retention**: Automatic cleanup for privacy compliance
3. **Error Exposure**: Logs sanitized to prevent information leakage
4. **API Access**: Job control APIs should be behind authentication

## Troubleshooting

### Job System Won't Start

1. Check environment variables
2. Verify database connectivity
3. Ensure no other instances running
4. Check for permission issues

### Scraper Failing

1. Test network connectivity to Craigslist
2. Verify Puppeteer browser installation
3. Check for IP blocking or rate limiting
4. Review error logs for specific failures

### No Matches Found

1. Verify user alerts exist and are active
2. Check if new listings exist in database
3. Review matching criteria (too restrictive?)
4. Ensure matcher job running after scraper

### Performance Issues

1. Monitor database size and growth
2. Check cleanup job execution
3. Review scraping frequency
4. Consider database optimization

---

For additional support, check the logs and error messages, or refer to the individual job implementation files in `src/lib/jobs/`.
