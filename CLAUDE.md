# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation Policy

**IMPORTANT**: Always update documentation after any critical changes to the project architecture, scope, or implementation approach. This ensures consistent understanding of project decisions and current state.

**CRITICAL RULE**: Never delete files from the `/docs/` folder. Only modify existing documentation files to reflect current project state and decisions.

**MILESTONE DOCUMENTATION RULE**: Always update this CLAUDE.md file after completing each development milestone or significant progress. This maintains accurate project status and prevents information drift.

## Development Environment

- Using Claude Code via WSL terminal on Windows VS Code
- **WSL/Windows File System Note**: Project files are on Windows filesystem, accessed through WSL. Some npm commands may timeout or behave differently due to cross-filesystem operations
- **NPM Command Policy**: Never run `npm run` commands directly. Always ask the user to run them and report the output back
- Choose solutions that are less likely to cause development issues
- Always validate links before using them
- Check environment variable requirements before coding
- Ask for clarification if needed for task scope, critical vs. optional aspects, and specific implementation details

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
npm run build            # Production build
npm start                # Start production server
```

**Note**: Complex database operations, job system, and testing infrastructure have been removed for MVP simplicity.

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

### Database Architecture (Simplified for MVP)

- **Schema Location**: `/src/lib/database/schema.sql.ts`
- **Connection**: SQLite with file path `./data/app.db`
- **Key Tables**: users, alerts, listings, notifications
- **Approach**: Direct schema setup (no migrations system for MVP)

### Background Job System (Simplified for MVP)

**Note**: For local MVP, background jobs will be simplified or manual triggers instead of complex scheduling system.

### API Architecture Pattern (Simplified MVP)

**Location**: `/src/app/api/`
**Essential Routes Only**:

- `/api/alerts` - CRUD for user search criteria
- `/api/listings` - Basic apartment listing data
- `/api/unsubscribe/[token]` - Email unsubscribe handling

### Data Flow Architecture (Simplified MVP)

1. **User Journey**: Landing Page (Email Input) → Alert Creation Form → Confirmation
2. **Background Flow**: Scraper → Basic Scam Detection → Database → Matcher → Direct Email Notification
3. **Simple Flow**: No complex queues, direct processing for MVP

### Scraping System Design

**Technology Stack**: Puppeteer (primary) + Axios/Cheerio (fallback)
**Target**: Craigslist NYC (all 5 boroughs)
**Anti-Detection**: User agent rotation, delays, rate limiting
**Data Processing**: Title cleaning, neighborhood normalization, scam detection

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

### Key Implementation Status (Updated for MVP)

**CRITICAL**: This is a simplified MVP focused on local development only. Current status:

- ✅ Simplified project structure (removed migrations, testing, complex scripts)
- ✅ Database schema and basic Drizzle setup
- ✅ Type definitions and constants
- ✅ Documentation and project structure
- ✅ Complete frontend foundation with professional UI/UX
- ✅ Landing page with full user journey flow and navigation
- ✅ Design system and component library (13 UI components)
- ✅ Comprehensive AlertForm component with all apartment search criteria
- ✅ NYC neighborhoods selection with borough-level controls (unlimited selections)
- ✅ Complete user flow from landing page through alert creation
- ✅ Resolved page layout and white space issues
- ⚠️ Build system has stability issues (memory/SIGBUS errors)
- ❌ API routes and backend integration - **IMMEDIATE PRIORITY**
- ❌ Core business logic implementations (jobs, scraper, matcher) - **HIGH PRIORITY**
- ❌ Commute time calculation system - **BACKEND PRIORITY** (documented in algorithms)

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

## Recent Development Activities

- **Frontend MVP Completion**: Complete functional apartment alert system frontend

  - **Professional UI/UX Implementation**: Production-ready frontend foundation

    - **Landing Page**: Fully implemented with hero section, features, statistics, and working CTAs
    - **User Flow Pages**: Complete journey (landing → create → confirm → success) with proper navigation
    - **Design System**: Professional Tailwind CSS setup with HSL color variables and dark mode support
    - **Component Library**: 13 comprehensive UI components using Radix UI and class-variance-authority
    - **NYC Data Integration**: 254+ neighborhoods across 5 boroughs with comprehensive type definitions

  - **AlertForm Implementation**: Comprehensive apartment search criteria collection

    - **All Required Fields**: Email, neighborhoods, price range, bedrooms, pet-friendly, commute preferences
    - **Advanced Neighborhood Selection**: Borough-level selection with "select all" functionality, unlimited selections
    - **Smart Validation**: Client-side validation using application constants and business rules
    - **Enhanced UX**: Real-time feedback, progress indicators, responsive design
    - **Commute Integration**: Work/study location and maximum commute time collection (backend calculation documented)

  - **Technical Architecture**: Modern Next.js 15 + TypeScript setup

    - **App Router**: Full Next.js 15 implementation with proper routing and navigation
    - **Build Configuration**: TypeScript path aliases, PostCSS, ESLint, and Prettier setup
    - **Type Safety**: Comprehensive TypeScript definitions for NYC-specific business logic
    - **Icon System**: Lucide React icons integrated throughout application
    - **Layout Optimization**: Resolved white space issues and container sizing problems

  - **Development Process Improvements**: Streamlined development workflow
    - **WSL Integration**: Documented npm command policy for WSL/Windows development environment
    - **Documentation Updates**: Comprehensive algorithm documentation for backend implementation
    - **Milestone Tracking**: Implemented systematic progress documentation requirements

- **Architecture Foundation**: Established core system design
  - **Comprehensive Documentation**: Complete system design and implementation strategy in `/docs/`
  - **Commute Calculation Planning**: Detailed Google Maps API integration strategy documented
  - **Technology Stack**: Next.js, Drizzle ORM, SQLite, Puppeteer foundation established
  - **MVP Scope**: Simplified architecture focused on local development and core functionality
