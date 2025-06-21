# Burroughs Alert - Complete File Structure

## Project Root Structure

```
burroughs-alert/
├── README.md
├── package.json
├── package-lock.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── .env.local
├── .env.example
├── .gitignore
├── .eslintrc.json
├── prettier.config.js
├── CLAUDE.md
├── data/
│   ├── app.db
│   └── migrations/
├── docs/
│   ├── 01-project-overview.md
│   ├── 02-tech-stack.md
│   ├── 03-architecture.md
│   ├── 04-database-schema.md
│   ├── 05-api-design.md
│   ├── 06-file-structure.md
│   ├── 07-algorithms-pseudocode.md
│   └── 08-scraping-strategy.md
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── images/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── loading.tsx
│   │   ├── not-found.tsx
│   │   ├── error.tsx
│   │   ├── api/
│   │   │   ├── alerts/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── unsubscribe/
│   │   │   │   ├── route.ts
│   │   │   │   └── [token]/
│   │   │   │       └── route.ts
│   │   │   ├── listings/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── neighborhoods/
│   │   │   │   └── route.ts
│   │   │   └── health/
│   │   │       └── route.ts
│   │   ├── alerts/
│   │   │   └── page.tsx
│   │   ├── unsubscribe/
│   │   │   ├── page.tsx
│   │   │   └── [token]/
│   │   │       └── page.tsx
│   │   └── admin/
│   │       ├── page.tsx
│   │       └── listings/
│   │           └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── card.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── spinner.tsx
│   │   │   └── toast.tsx
│   │   ├── forms/
│   │   │   ├── AlertForm.tsx
│   │   │   ├── UnsubscribeForm.tsx
│   │   │   └── ContactForm.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── Container.tsx
│   │   ├── listings/
│   │   │   ├── ListingCard.tsx
│   │   │   ├── ListingGrid.tsx
│   │   │   ├── ListingFilters.tsx
│   │   │   └── ScamBadge.tsx
│   │   └── common/
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── EmailPreview.tsx
│   │       └── CommuteDisplay.tsx
│   ├── lib/
│   │   ├── database/
│   │   │   ├── index.ts
│   │   │   ├── migrations.ts
│   │   │   ├── schema.sql
│   │   │   └── queries/
│   │   │       ├── users.ts
│   │   │       ├── alerts.ts
│   │   │       ├── listings.ts
│   │   │       └── notifications.ts
│   │   ├── scraping/
│   │   │   ├── index.ts
│   │   │   ├── craigslist-scraper.ts
│   │   │   ├── listing-parser.ts
│   │   │   ├── scam-detector.ts
│   │   │   └── proxy-manager.ts
│   │   ├── matching/
│   │   │   ├── index.ts
│   │   │   ├── match-engine.ts
│   │   │   ├── criteria-validator.ts
│   │   │   └── commute-calculator.ts
│   │   ├── notifications/
│   │   │   ├── index.ts
│   │   │   ├── email-service.ts
│   │   │   ├── email-templates.ts
│   │   │   └── notification-queue.ts
│   │   ├── jobs/
│   │   │   ├── index.ts
│   │   │   ├── scraper-job.ts
│   │   │   ├── matcher-job.ts
│   │   │   ├── notifier-job.ts
│   │   │   └── cleanup-job.ts
│   │   ├── utils/
│   │   │   ├── validation.ts
│   │   │   ├── formatting.ts
│   │   │   ├── constants.ts
│   │   │   ├── logger.ts
│   │   │   ├── rate-limiter.ts
│   │   │   └── error-handler.ts
│   │   └── types/
│   │       ├── index.ts
│   │       ├── database.types.ts
│   │       ├── api.types.ts
│   │       ├── scraping.types.ts
│   │       └── notification.types.ts
│   └── styles/
│       └── components.css
├── scripts/
│   ├── init-db.ts
│   ├── migrate-db.ts
│   ├── seed-data.ts
│   ├── start-jobs.ts
│   └── backup-db.ts
└── tests/
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

## File Descriptions

### Configuration Files

#### `package.json`
- Dependencies and scripts
- Next.js, TypeScript, Tailwind, database libraries

#### `next.config.js`
- Next.js configuration
- Environment variables, build settings

#### `tailwind.config.js`
- Tailwind CSS configuration
- Custom colors, fonts, spacing

#### `tsconfig.json`
- TypeScript configuration
- Strict mode, path aliases

#### `.env.local` & `.env.example`
- Environment variables
- Database URL, email credentials, API keys

### Source Code Structure

#### `src/app/` (Next.js App Router)

**`layout.tsx`**: Root layout with metadata, providers
**`page.tsx`**: Landing page with hero section and alert form
**`globals.css`**: Global styles, Tailwind imports
**`loading.tsx`**: Global loading UI
**`not-found.tsx`**: 404 error page
**`error.tsx`**: Error boundary page

**API Routes (`src/app/api/`)**:
- `alerts/route.ts`: POST create alert, GET list alerts
- `alerts/[id]/route.ts`: DELETE deactivate alert
- `unsubscribe/route.ts`: POST unsubscribe by email
- `unsubscribe/[token]/route.ts`: GET unsubscribe by token
- `listings/route.ts`: GET list listings (admin)
- `listings/[id]/route.ts`: GET single listing details
- `neighborhoods/route.ts`: GET NYC neighborhoods list
- `health/route.ts`: GET system health status

**Pages (`src/app/`)**:
- `alerts/page.tsx`: Alert management dashboard
- `unsubscribe/page.tsx`: Unsubscribe form
- `unsubscribe/[token]/page.tsx`: Token-based unsubscribe
- `admin/page.tsx`: Admin dashboard
- `admin/listings/page.tsx`: Listings management

#### `src/components/`

**UI Components (`src/components/ui/`)**:
- shadcn/ui components: Button, Input, Select, Card, etc.
- Consistent design system components

**Form Components (`src/components/forms/`)**:
- `AlertForm.tsx`: Main alert creation form
- `UnsubscribeForm.tsx`: Email unsubscribe form
- `ContactForm.tsx`: Contact/support form

**Layout Components (`src/components/layout/`)**:
- `Header.tsx`: Site header with navigation
- `Footer.tsx`: Site footer with links
- `Container.tsx`: Responsive container wrapper

**Listing Components (`src/components/listings/`)**:
- `ListingCard.tsx`: Individual listing display
- `ListingGrid.tsx`: Grid of listing cards
- `ScamBadge.tsx`: Scam warning indicator

#### `src/lib/`

**Database (`src/lib/database/`)**:
- `index.ts`: Database connection and setup
- `migrations.ts`: Migration runner
- `schema.sql`: Initial database schema
- `queries/`: Organized database queries by entity

**Scraping (`src/lib/scraping/`)**:
- `craigslist-scraper.ts`: Craigslist-specific scraper
- `listing-parser.ts`: Parse listing data
- `scam-detector.ts`: Detect suspicious listings
- `proxy-manager.ts`: Manage scraping proxies

**Matching (`src/lib/matching/`)**:
- `match-engine.ts`: Core matching algorithm
- `criteria-validator.ts`: Validate user criteria
- `commute-calculator.ts`: Calculate commute times

**Notifications (`src/lib/notifications/`)**:
- `email-service.ts`: Email sending service
- `email-templates.ts`: HTML email templates
- `notification-queue.ts`: Queue management

**Background Jobs (`src/lib/jobs/`)**:
- `scraper-job.ts`: Scheduled scraping job
- `matcher-job.ts`: Matching algorithm job
- `notifier-job.ts`: Notification sending job
- `cleanup-job.ts`: Database cleanup job

**Utilities (`src/lib/utils/`)**:
- `validation.ts`: Input validation functions
- `constants.ts`: App-wide constants
- `logger.ts`: Structured logging
- `error-handler.ts`: Error handling utilities

**Types (`src/lib/types/`)**:
- TypeScript interfaces and types
- Database models, API contracts

### Scripts & Tools

#### `scripts/`
- `init-db.ts`: Initialize database and schema
- `migrate-db.ts`: Run database migrations
- `seed-data.ts`: Seed test data
- `start-jobs.ts`: Start background job processes
- `backup-db.ts`: Database backup utility

#### `tests/`
- Unit tests for API routes
- Component tests for React components
- Integration tests for services
- Test utilities and setup

### Data Directory

#### `data/`
- `app.db`: SQLite database file
- `migrations/`: SQL migration files

### Public Assets

#### `public/`
- Static assets: favicon, logo, images
- Served directly by Next.js

## File Naming Conventions

### Components
- **PascalCase**: `AlertForm.tsx`, `ListingCard.tsx`
- **Descriptive**: Name describes component purpose

### Pages
- **kebab-case**: `apartment-alerts/page.tsx`
- **Follows URL structure**: Matches route paths

### Utilities & Libraries
- **camelCase**: `parseListingData.ts`, `validateInput.ts`
- **Descriptive**: Function-focused naming

### Types
- **PascalCase with suffix**: `User.types.ts`, `Api.types.ts`
- **Grouped by domain**: Related types in same file

### Constants
- **UPPER_SNAKE_CASE**: `API_ENDPOINTS.ts`, `ERROR_CODES.ts`
- **Descriptive**: Clear constant purpose

## Import Path Aliases

```typescript
// tsconfig.json paths
{
  "baseUrl": ".",
  "paths": {
    "@/*": ["./src/*"],
    "@/components/*": ["./src/components/*"],
    "@/lib/*": ["./src/lib/*"],
    "@/types/*": ["./src/lib/types/*"],
    "@/utils/*": ["./src/lib/utils/*"]
  }
}
```

## File Size Guidelines

- **Components**: <200 lines per file
- **API Routes**: <150 lines per file
- **Utility Functions**: <100 lines per file
- **Type Definitions**: <50 interfaces per file
- **Test Files**: <300 lines per file

## Code Organization Principles

1. **Single Responsibility**: Each file has one clear purpose
2. **Domain Grouping**: Related functionality grouped together
3. **Dependency Direction**: Higher-level modules import lower-level
4. **Clear Interfaces**: Well-defined boundaries between modules
5. **Testability**: Structure supports easy unit testing