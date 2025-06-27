# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation Policy

**IMPORTANT**: Always update documentation after any critical changes to the project architecture, scope, or implementation approach. This ensures consistent understanding of project decisions and current state.

**CRITICAL RULE**: Never delete files from the `/docs/` folder. Only modify existing documentation files to reflect current project state and decisions.

**MILESTONE DOCUMENTATION RULE**: Always update this CLAUDE.md file after completing each development milestone or significant progress. This maintains accurate project status and prevents information drift.

**FILE HEADER DOCUMENTATION RULE**: Each implementation file contains detailed header documentation describing features to implement, business logic requirements, and TODO items. When making changes to any file:

## Development Environment

- Using Claude Code via WSL Ubuntu 22.04.5 LTS terminal on Windows VS Code
- **Native WSL Environment**: Project files are now fully on WSL Ubuntu filesystem for optimal performance and compatibility
- **Environment Variables Policy**:
  - `.env.local` file exists but is not visible to Claude Code (gitignored for security)
  - Always ensure `.env.example` contains the same keys as `.env.local` for documentation
  - When adding new environment variables, update `.env.example` with placeholder values
  - Never assume `.env.local` contents - always reference `.env.example` for available variables
- Choose solutions that are less likely to cause development issues
- Always validate links before using them
- Check environment variable requirements before coding
- Ask for clarification if needed for task scope, critical vs. optional aspects, and specific implementation details
- **New Guideline**: If needed, ask for clarifying questions and followup questions if it seems too vague and not clear or the instructions could be interpreted in many ways, in order to make the instructions clearer
- **Security Guideline**: Strictly not allowed to access or use any tools no matter what to access/read/write using bash or any tool for sensitive files like .env or .env.local

## Debugging Strategy

When facing development issues that aren't easily resolved:

### 1. Systematic Debugging Approach

- **Isolate the problem**: Use minimal test cases to verify individual components work
- **Check browser dev tools**: Network tab, Console, and Elements tabs provide crucial debugging information
- **Verify the build process**: Always ensure builds succeed before investigating runtime issues
- **Clear caches and restart**: Many issues resolve with fresh builds and server restarts

### 2. Information Gathering

- **Collect specific outputs**: Terminal logs, browser console errors, network requests
- **Test incrementally**: Make small changes and test each step rather than large modifications
- **Use temporary debugging**: Add temporary logs, styles, or console statements to isolate issues
- **Check configuration files**: Verify config files are present and properly formatted

### 3. Collaboration Approach

- **Provide clear instructions**: If automated capabilities failed, ask for user assistant to run commands or provide outputs.
- **Ask for specific feedback**: Request exact outputs, error messages, and observed behaviors
- **Document solutions**: Update documentation with debugging approaches that work

## Essential Commands

### Development Workflow (Simplified for Local MVP)

```bash
npm run dev              # Start Next.js development server
npm run type-check       # Run TypeScript validation
npm run lint             # Run ESLint checks
npm run format           # Format code with Prettier
npm run build            # Production build
npm start                # Start production server
```

**Note**: Complex database operations, job system, and testing infrastructure have been removed for MVP simplicity.

### Testing & Validation

```bash
npm run lint             # ESLint validation
npm run type-check       # TypeScript compilation check
npm run format           # Code formatting with Prettier
```

**IMPORTANT**: Run `npm run format` immediately after making code changes to maintain consistent formatting.

## Code Standards & Conventions

### Naming Conventions

**Files & Directories:**

- **kebab-case**: directories (`components/`, `lib/`), utility files (`next.config.js`)
- **PascalCase**: React components (`AlertForm.tsx`, `Header.tsx`)
- **lowercase**: UI components (`button.tsx`, `input.tsx`)

**JavaScript/TypeScript:**

- **camelCase**: functions (`handleSubmit`, `validateForm`), variables (`formData`, `isSubmitting`)
- **PascalCase**: components (`AlertForm`), types/interfaces (`User`, `Alert`, `ApiResponse`)
- **SCREAMING_SNAKE_CASE**: constants (`NYC_NEIGHBORHOODS`, `APP_CONFIG`, `ERROR_CODES`)

**Database:**

- **snake_case**: column names (`user_id`, `created_at`, `pet_friendly`)
- **camelCase**: API interfaces (`minPrice`, `maxPrice`, `createdAt`)

**API Routes:**

- **kebab-case**: paths (`/api/alerts`, `/alerts/create`)
- **camelCase**: JavaScript functions (`createAlert`, `getUserAlerts`)

**CSS/Styling:**

- **kebab-case**: CSS classes, custom properties (`--primary`, `section-spacing`)
- **camelCase**: Tailwind config properties (`borderRadius`, `keyframes`)

### Conventional Commits

Use semantic commit messages with consistent formatting:

**Format:** `<type>: <description>`

**Types:**

- `feat:` - New features
- `fix:` - Bug fixes
- `chore:` - Maintenance tasks
- `docs:` - Documentation updates
- `refactor:` - Code refactoring
- `test:` - Adding/updating tests
- `ci:` - CI/CD pipeline changes
- `perf:` - Performance improvements
- `style:` - Code formatting/style changes
- `build:` - Build system changes

**Examples:**

- `feat: add commute time filtering to alert form`
- `fix: resolve neighborhood selection validation bug`
- `chore: update dependencies and run format`
- `docs: add naming conventions to CLAUDE.md`

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

### Database Architecture (Simplified for MVP)

- **Schema Location**: `/src/lib/database/schema.sql.ts`
- **Connection**: SQLite with file path `./data/app.db`
- **Key Tables**: users, alerts, listings, notifications
- **Approach**: Direct schema setup (no migrations system for MVP)

### Background Job System ✅ COMPLETE

**Implementation**: Complete automated job system with sequential pipeline execution

**Job Pipeline**:

1. **Scraper Job** (30-45min intervals) - Fetch new Craigslist listings
2. **Matcher Job** (triggered after scraper) - Match listings against user alerts
3. **Notifier Job** (triggered after matcher) - Send batch emails for matches
4. **Cleanup Job** (daily) - Remove old data and maintain database health
5. **Health Check** (5min intervals) - Monitor system status

**Features**: Error handling, graceful shutdown, monitoring, manual triggers

### API Architecture Pattern (Simplified MVP)

**Location**: `/src/app/api/`
**Essential Routes Only**:

- `/api/alerts` - CRUD for user search criteria
- `/api/listings` - Backend apartment listing operations (scraper input, matching queries)
- `/api/unsubscribe/[token]` - Email unsubscribe handling

**Note**: Users cannot search/browse listings directly - the system only supports alert creation and email notifications.

### Data Flow Architecture ✅ COMPLETE

1. **User Journey**: Landing Page (Email Input) → Alert Creation Form → Confirmation
2. **Background Flow**: Scraper → Database → Matcher → Notification Records → Notifier → Email Delivery
3. **Pipeline**: Automated sequential processing with error handling and monitoring

### Scraping System ✅ DONE

**Technology**: Puppeteer scraping Craigslist NYC (all 5 boroughs)
**Data Extracted**: Neighborhoods, bedrooms, prices, coordinates, pet policies
**Modes**: Basic (search results) vs Enhanced (individual pages) - Enhanced default

### Notification System ✅ COMPLETE

**Email Service**: Nodemailer with Gmail SMTP integration
**Batch Processing**: Groups multiple listings per user into single emails
**Duplicate Prevention**: Database tracking prevents sending same listing twice
**Error Handling**: Failed emails marked for retry, graceful degradation
**Status Tracking**: All notifications tracked with delivery status
**Features**: HTML-formatted emails with unsubscribe links, delivery monitoring

### Commute Time Calculation System Design

**Frontend Implementation**: Complete - collects both work/study destination and maximum acceptable commute time
**Backend Implementation Plan**:

**Step 1: Geocoding Work Location**

- Use Google Geocoding API to convert user's work location to lat/lng coordinates
- API Call: `https://maps.googleapis.com/maps/api/geocode/json?address={work_location},NYC&key={API_KEY}`
- Handle various input formats: "Times Square", "Columbia University", "123 Main St, Manhattan"
- Store coordinates in user alert record for reuse

**Step 2: Commute Time Calculation**

- For each apartment listing, use Google Maps Distance Matrix API
- Calculate public transit time from apartment address to work coordinates
- API Call: `https://maps.googleapis.com/maps/api/distancematrix/json?origins={apt_lat},{apt_lng}&destinations={work_lat},{work_lng}&mode=transit&key={API_KEY}`
- Cache results to minimize API calls for same apartment-to-destination pairs

**Step 3: Filtering Logic**

- During matching process, exclude apartments where commute time > user's maximum acceptable time
- Only apply commute filtering if user provided both destination and time limit
- Fall back gracefully if API is unavailable (include all apartments, note in email)

**Required Environment Variables**:

- `GOOGLE_MAPS_API_KEY` - For both geocoding and distance matrix calculations
- `GOOGLE_MAPS_CACHE_TTL` - Cache duration for commute calculations (default: 24 hours)

**Cost Considerations**:

- Geocoding: ~$5 per 1000 requests
- Distance Matrix: ~$10 per 1000 requests
- Implement caching and rate limiting to minimize costs

### Current Status

- ✅ Frontend UI/UX with full user journey (Next.js + TypeScript)
- ✅ Database infrastructure (SQLite + Drizzle ORM)
- ✅ **Complete Craigslist Scraper** (Puppeteer, all NYC boroughs)
- ✅ Component library and form validation
- ✅ **Complete Background Job System** (Scraper → Matcher → Notifier → Cleanup)
- ✅ **Alert Matching Logic** (Price, bedrooms, neighborhoods, pets)
- ✅ **Email Notification System** (Batch emails, duplicate prevention, error handling)
- ✅ **Database Query Layer** (Listings, matching, notifications, cleanup)
- ❌ Commute time integration - **NEXT PRIORITY**

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
PUPPETEER_EXECUTABLE_PATH="..."      # Browser path (auto-detected in WSL)
```

## NYC-Specific Implementation Notes

- **Neighborhoods**: Predefined list of NYC neighborhoods in constants
- **Geographic Scope**: All 5 boroughs (Manhattan, Brooklyn, Queens, Bronx, Staten Island)
- **Data Sources**: Craigslist NYC apartment listings
- **Commute Integration**: Optional Google Maps integration for work commute estimates

## Database Strategy (Simplified for MVP)

**Pattern**: Direct schema setup for local development

1. Schema defined in `/src/lib/database/schema.sql.ts`
2. Database initialized directly from schema (no migrations)
3. Schema changes applied by recreating database if needed

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

## Recent Major Milestones

- ✅ **Frontend Foundation**: Complete UI/UX with Next.js 15, TypeScript, component library, user flows
- ✅ **Database Infrastructure**: SQLite + Drizzle ORM with schema, API endpoints, health monitoring
- ✅ **Complete Scraping System**: Puppeteer-based Craigslist scraper for all NYC boroughs with rich data extraction
- ✅ **Background Job System**: Complete automation with scraper, matcher, and cleanup jobs
- ✅ **Alert Matching Engine**: Smart matching of listings to user criteria with duplicate prevention
- ✅ **Database Operations Layer**: Full CRUD operations for listings, alerts, and notifications
- ✅ **Testing & Validation**: Comprehensive test suites and manual testing scripts

## Job System Usage

### Background Jobs (Automated)

```bash
# Start the complete job system (runs continuously)
npx tsx scripts/run-jobs.ts system-start

# Check system status and health
npx tsx scripts/run-jobs.ts system-status
```

### Manual Job Execution (Testing/Debug)

```bash
# Individual jobs
npx tsx scripts/run-jobs.ts scraper        # Run scraper once
npx tsx scripts/run-jobs.ts matcher        # Run matcher once
npx tsx scripts/run-jobs.ts cleanup        # Run cleanup once

# Test all components
npx tsx scripts/test-jobs.ts               # Comprehensive test

# Legacy scraper (direct)
npx tsx scripts/manual/run-scraper.ts --time 60        # Enhanced mode (default)
npx tsx scripts/manual/run-scraper.ts --basic          # Basic mode (faster)
npx tsx scripts/manual/run-scraper.ts --save           # Save to database
```

### API Control

```bash
# Get system status
curl http://localhost:3000/api/jobs

# Start/stop job system
curl -X POST http://localhost:3000/api/jobs -H "Content-Type: application/json" -d '{"action": "start"}'
curl -X POST http://localhost:3000/api/jobs -H "Content-Type: application/json" -d '{"action": "stop"}'

# Trigger individual jobs
curl -X POST http://localhost:3000/api/jobs -H "Content-Type: application/json" -d '{"action": "trigger", "jobType": "scraper"}'
```

## Recent Updates

- Added tests in the tests folder to improve code coverage and reliability
