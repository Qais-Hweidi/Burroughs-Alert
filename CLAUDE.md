# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation Policy

**IMPORTANT**: Always update documentation after any critical changes to the project architecture, scope, or implementation approach. This ensures consistent understanding of project decisions and current state.

**CRITICAL RULE**: Never delete files from the `/docs/` folder. Only modify existing documentation files to reflect current project state and decisions.

## Development Environment

- Using Claude Code via WSL terminal on Windows VS Code
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

### Key Implementation Status (Updated for MVP)

**CRITICAL**: This is a simplified MVP focused on local development only. Current status:

- ✅ Simplified project structure (removed migrations, testing, complex scripts)
- ✅ Database schema and basic Drizzle setup
- ✅ Type definitions and constants
- ✅ Documentation and project structure
- ❌ Core business logic implementations (jobs, API routes, components) - **NEXT PRIORITY**

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

- **2024-06-21**: Frontend Development and Build Issues Resolution

  - **Initial Setup**: Simplified codebase for fast MVP development
    - **Phase 1**: Removed complex infrastructure: `/scripts/`, `/data/migrations/`, `/tests/`
    - **Phase 2**: Removed non-essential pages and components for fast MVP
    - Simplified user flow: Email Input → Alert Creation → Background Processing → Notification
  - **Build & Runtime Fixes**: Resolved Next.js App Router compatibility issues
    - Fixed client component errors by adding `"use client"` directives to interactive components
    - Resolved `useSearchParams()` build errors by wrapping components in `<Suspense>` boundaries
    - Created missing `postcss.config.js` for Tailwind CSS processing
    - Added custom CSS utilities for layout spacing and typography
  - **Current Status**: Build process working, investigating styling/asset loading issues
  - **Next Priority**: Complete Tailwind CSS setup and implement alert creation form

- **Architecture Foundation**: Established core system design
  - Prepared initial codebase structure for Burroughs-Alert apartment hunting service
  - Documented comprehensive system design and implementation strategy
  - Set up core technologies: Next.js, Drizzle ORM, SQLite, Puppeteer
