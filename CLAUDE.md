# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Environment
* Using Claude Code via WSL terminal on Windows VS Code
* Choose solutions that are less likely to cause development issues
* Always validate links before using them
* Check environment variable requirements before coding

## Essential Commands

### Database Operations
```bash
npm run db:init          # Initialize database and run migrations
npm run db:generate      # Generate new migrations with Drizzle Kit
npm run db:migrate       # Apply migrations to database
npm run db:seed          # Seed database with sample data
```

### Development Workflow
```bash
npm run dev              # Start Next.js development server
npm run jobs:start       # Start background job system (separate terminal)
npm run type-check       # Run TypeScript validation
npm run lint             # Run ESLint checks
npm run build            # Production build
```

### Testing & Validation
```bash
npm run lint             # ESLint validation
npm run type-check       # TypeScript compilation check
```

## High-Level Architecture

### Core System Design
Burroughs-Alert is an **apartment hunting notification service** for NYC with a modular, event-driven architecture:

```
Frontend (Next.js) ↔ API Routes ↔ SQLite Database
                        ↓
               Background Job System
                        ↓
           [Scraper → Matcher → Notifier → Cleanup]
                        ↓
              External Services (SMTP, Maps)
```

### Database Architecture (Drizzle ORM + LibSQL)
**IMPORTANT**: This project recently migrated from better-sqlite3 to Drizzle ORM + @libsql/client due to compilation issues.

- **Schema Location**: `/src/lib/database/schema.sql.ts`
- **Connection**: SQLite with file path `./data/app.db`
- **Key Tables**: users, alerts, listings, notifications
- **Configuration**: `drizzle.config.ts` defines schema path and migration output

### Background Job System
**Critical Pattern**: All background jobs run independently and must be resilient to failures.

**Job Schedule** (defined in `/src/lib/jobs/`):
- **Scraper**: Every 15 minutes - scrapes Craigslist NYC
- **Matcher**: Every 5 minutes - matches new listings against user alerts
- **Notifier**: Every 10 minutes - sends email notifications
- **Cleanup**: Daily at 2 AM - removes old data

### API Architecture Pattern
**Location**: `/src/app/api/`
**Key Routes**:
- `/api/alerts` - CRUD for user search criteria
- `/api/listings` - Apartment listing data
- `/api/unsubscribe/[token]` - Email unsubscribe handling
- `/api/health` - System monitoring

### Data Flow Architecture
1. **User Journey**: Landing → Alert Form → Email Confirmation → Background Monitoring
2. **Listing Flow**: Craigslist → Scraper → Database → Matcher → Email Queue → Users
3. **Notification Flow**: Match Found → Email Template → SMTP → Delivery Tracking

### Scraping System Design
**Technology Stack**: Puppeteer (primary) + Axios/Cheerio (fallback)
**Target**: Craigslist NYC (all 5 boroughs)
**Anti-Detection**: User agent rotation, delays, rate limiting
**Data Processing**: Title cleaning, neighborhood normalization, scam detection

### Key Implementation Status
**CRITICAL**: Most implementation files are currently empty/incomplete. The codebase has excellent architectural planning with:
- ✅ Database schema and Drizzle configuration
- ✅ Type definitions and constants
- ✅ Documentation and project structure
- ❌ Core business logic implementations (jobs, API routes, components)

## Environment Variables Required

### Essential Configuration
```bash
DATABASE_URL="file:./data/app.db"     # SQLite database path
SMTP_HOST="smtp.gmail.com"           # Email server
SMTP_USER="your-email@gmail.com"     # SMTP authentication
SMTP_PASS="your-app-password"        # SMTP password
```

### Optional Services
```bash
GOOGLE_MAPS_API_KEY="..."            # For commute calculations
SCRAPING_INTERVAL="15"               # Minutes between scrapes
```

## NYC-Specific Implementation Notes
- **Neighborhoods**: Predefined list of NYC neighborhoods in constants
- **Geographic Scope**: All 5 boroughs (Manhattan, Brooklyn, Queens, Bronx, Staten Island)
- **Data Sources**: Craigslist NYC apartment listings
- **Commute Integration**: Optional Google Maps integration for work commute estimates

## Database Migration Strategy
**Pattern**: Use Drizzle Kit for schema changes
1. Modify schema in `/src/lib/database/schema.sql.ts`
2. Run `npm run db:generate` to create migration
3. Run `npm run db:migrate` to apply changes
4. Migrations stored in `/data/migrations/`

## Error Handling Architecture
- **Structured Logging**: Different log levels throughout system
- **Circuit Breaker**: For external service calls (scraping, email)
- **Graceful Degradation**: Non-critical failures don't stop core functionality
- **Database Constraints**: Foreign keys and uniqueness constraints prevent bad data

## Security & Privacy Considerations
- **Minimal Data Collection**: Email-only authentication, no passwords
- **SQL Injection Prevention**: Parameterized queries with Drizzle ORM
- **Automatic Cleanup**: Privacy compliance through data retention policies
- **Unsubscribe Tokens**: Secure unsubscribe mechanism