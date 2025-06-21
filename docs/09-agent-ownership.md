# Agent Ownership Map - Burroughs Alert

## Deployment Strategy: 2 Phases, 5 Agents Total

### Phase 1: Foundation & Core Logic (3 Agents)
**Deploy simultaneously - no dependencies between these agents**

### Phase 2: Frontend & Integration (2 Agents)  
**Deploy after Phase 1 completion - depends on foundation**

---

## 🔧 AGENT 1: DATABASE & FOUNDATION
**Role**: Core infrastructure and data layer
**Dependencies**: None (can start immediately)

### Owned Files:
```
src/lib/database/
├── index.ts                    # Database connection setup
├── migrations.ts               # Migration runner
├── schema.sql                  # Initial database schema
└── queries/
    ├── users.ts               # User CRUD operations
    ├── alerts.ts              # Alert CRUD operations
    ├── listings.ts            # Listing CRUD operations
    └── notifications.ts       # Notification CRUD operations

src/lib/types/
├── index.ts                   # Export all types
├── database.types.ts          # Database model interfaces
├── api.types.ts              # API request/response types
├── scraping.types.ts         # Scraping data types
└── notification.types.ts     # Notification types

src/lib/utils/
├── validation.ts             # Input validation functions
├── constants.ts              # App-wide constants
├── logger.ts                 # Structured logging
└── error-handler.ts          # Error handling utilities

scripts/
├── init-db.ts                # Database initialization
├── migrate-db.ts             # Migration runner script
├── seed-data.ts              # Test data seeding
└── backup-db.ts              # Database backup utility

data/
├── app.db                    # SQLite database file
└── migrations/               # SQL migration files
```

### Responsibilities:
1. **Database Schema**: Implement complete SQLite schema from docs
2. **Type Definitions**: All TypeScript interfaces and types
3. **Database Queries**: All CRUD operations with proper error handling
4. **Validation**: Input validation using Zod schemas
5. **Constants**: NYC neighborhoods, error codes, validation rules
6. **Logging**: Structured logging system
7. **Scripts**: Database initialization and management scripts

---

## 🕷️ AGENT 2: SCRAPING & DATA PROCESSING
**Role**: Data acquisition and processing pipeline
**Dependencies**: Database types from Agent 1 (can start with placeholder types)

### Owned Files:
```
src/lib/scraping/
├── index.ts                  # Main scraping orchestrator
├── craigslist-scraper.ts     # Craigslist-specific scraper
├── listing-parser.ts         # Parse and normalize listing data
├── scam-detector.ts          # Scam detection algorithms
└── proxy-manager.ts          # Proxy rotation (future)

src/lib/matching/
├── index.ts                  # Main matching engine
├── match-engine.ts           # Core matching algorithm
├── criteria-validator.ts     # Validate user criteria
└── commute-calculator.ts     # Commute time calculation

src/lib/jobs/
├── index.ts                  # Job orchestrator
├── scraper-job.ts           # Scheduled scraping job
├── matcher-job.ts           # Matching algorithm job
├── notifier-job.ts          # Notification dispatch job
└── cleanup-job.ts           # Database cleanup job

scripts/
├── start-jobs.ts            # Start background jobs
└── scrape-now.ts            # Manual scraping trigger
```

### Responsibilities:
1. **Web Scraping**: Craigslist scraper with anti-detection measures
2. **Data Processing**: Parse, normalize, and clean scraped data
3. **Scam Detection**: Implement scam detection algorithms from docs
4. **Matching Engine**: Core algorithm to match listings with user alerts
5. **Background Jobs**: Cron-based job scheduling system
6. **Commute Calculation**: Basic commute time estimation

---

## 📧 AGENT 3: NOTIFICATIONS & EMAIL
**Role**: Communication and notification delivery
**Dependencies**: Database types from Agent 1 (can start with placeholder types)

### Owned Files:
```
src/lib/notifications/
├── index.ts                 # Main notification service
├── email-service.ts         # Email sending service
├── email-templates.ts       # HTML email templates
└── notification-queue.ts    # Queue management and rate limiting

src/lib/utils/
├── formatting.ts           # Date/price formatting utilities
└── rate-limiter.ts         # Rate limiting for emails

src/components/common/
├── EmailPreview.tsx        # Email preview component (admin)
└── CommuteDisplay.tsx      # Commute time display component
```

### Responsibilities:
1. **Email Service**: Nodemailer integration with Gmail SMTP
2. **Email Templates**: HTML email templates for notifications
3. **Notification Queue**: Queue management with rate limiting
4. **Email Formatting**: Utility functions for formatting data in emails
5. **Rate Limiting**: Prevent spam and respect email service limits
6. **Admin Components**: Email preview and testing components

---

## 🎨 AGENT 4: FRONTEND & UI COMPONENTS
**Role**: User interface and user experience
**Dependencies**: API types from Agent 1, must wait for Phase 1 completion

### Owned Files:
```
src/app/
├── layout.tsx              # Root layout with metadata
├── page.tsx                # Landing page with alert form
├── globals.css             # Global styles and CSS variables
├── loading.tsx             # Global loading UI
├── not-found.tsx           # 404 error page
├── error.tsx               # Error boundary page
├── alerts/
│   └── page.tsx           # Alert management dashboard
├── unsubscribe/
│   ├── page.tsx           # Unsubscribe form
│   └── [token]/
│       └── page.tsx       # Token-based unsubscribe
└── admin/
    ├── page.tsx           # Admin dashboard
    └── listings/
        └── page.tsx       # Listings management

src/components/
├── ui/                    # shadcn/ui components
│   ├── button.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── checkbox.tsx
│   ├── card.tsx
│   ├── alert.tsx
│   ├── badge.tsx
│   ├── spinner.tsx
│   └── toast.tsx
├── forms/
│   ├── AlertForm.tsx      # Main alert creation form
│   ├── UnsubscribeForm.tsx # Email unsubscribe form
│   └── ContactForm.tsx    # Contact/support form
├── layout/
│   ├── Header.tsx         # Site header with navigation
│   ├── Footer.tsx         # Site footer with links
│   ├── Navigation.tsx     # Navigation components
│   └── Container.tsx      # Responsive container wrapper
├── listings/
│   ├── ListingCard.tsx    # Individual listing display
│   ├── ListingGrid.tsx    # Grid of listing cards
│   ├── ListingFilters.tsx # Listing filter controls
│   └── ScamBadge.tsx      # Scam warning indicator
└── common/
    ├── LoadingSpinner.tsx # Loading spinner component
    └── ErrorBoundary.tsx  # Error boundary wrapper

src/styles/
└── components.css         # Additional component styles
```

### Responsibilities:
1. **Next.js Pages**: All user-facing pages and layouts
2. **UI Components**: Complete shadcn/ui component implementation
3. **Forms**: Alert creation, unsubscribe, and contact forms
4. **Layout Components**: Header, footer, navigation, containers
5. **Listing Components**: Display and filter listing data
6. **Responsive Design**: Mobile-first responsive layouts
7. **Accessibility**: ARIA labels and keyboard navigation

---

## 🔌 AGENT 5: API & INTEGRATION
**Role**: API endpoints and system integration
**Dependencies**: All Phase 1 agents (database, scraping, notifications)

### Owned Files:
```
src/app/api/
├── alerts/
│   ├── route.ts           # POST create alert, GET list alerts
│   └── [id]/
│       └── route.ts       # DELETE deactivate alert
├── unsubscribe/
│   ├── route.ts           # POST unsubscribe by email
│   └── [token]/
│       └── route.ts       # GET unsubscribe by token
├── listings/
│   ├── route.ts           # GET list listings (admin)
│   └── [id]/
│       └── route.ts       # GET single listing details
├── neighborhoods/
│   └── route.ts           # GET NYC neighborhoods list
└── health/
    └── route.ts           # GET system health status

tests/                     # All test files
├── api/
│   ├── alerts.test.ts
│   ├── listings.test.ts
│   └── health.test.ts
├── lib/
│   ├── scraping.test.ts
│   ├── matching.test.ts
│   └── notifications.test.ts
├── components/
│   ├── AlertForm.test.tsx
│   └── ListingCard.test.tsx
├── utils/
│   ├── validation.test.ts
│   └── formatting.test.ts
└── setup/
    ├── test-db.ts
    └── test-utils.ts
```

### Responsibilities:
1. **API Endpoints**: All REST API routes from API design docs
2. **Request/Response Handling**: Proper HTTP status codes and error handling
3. **Input Validation**: Validate all API inputs using Zod schemas
4. **Rate Limiting**: API rate limiting and security measures
5. **Integration Testing**: Connect all system components
6. **Test Suite**: Comprehensive test coverage for all components
7. **Health Monitoring**: System health and status endpoints

---

## Deployment Timeline

### Phase 1 (Parallel - 0 conflicts) ⏱️ ~2 hours
**Agents 1, 2, 3 can work simultaneously**
- Agent 1: Database & Foundation → Creates types and database layer
- Agent 2: Scraping & Data Processing → Uses placeholder types initially
- Agent 3: Notifications & Email → Uses placeholder types initially

### Phase 2 (Sequential - depends on Phase 1) ⏱️ ~1.5 hours  
**Agents 4, 5 work after Phase 1 completes**
- Agent 4: Frontend & UI Components → Uses real types from Agent 1
- Agent 5: API & Integration → Integrates all Phase 1 components

### Integration & Testing ⏱️ ~30 minutes
- System integration testing
- End-to-end workflow validation
- Bug fixes and refinements

## File Overlap Prevention

### Shared Dependencies:
- **Agent 1** creates the types that Agents 2 & 3 need
- **Agents 2 & 3** start with placeholder types, then update when Agent 1 completes
- **Agent 4** waits for Agent 1's types before starting
- **Agent 5** waits for all Phase 1 agents before starting

### No File Conflicts:
- Each agent owns completely separate file trees
- No shared file editing between agents
- Clear boundaries prevent merge conflicts
- Progressive integration ensures compatibility