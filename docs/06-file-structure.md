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
│   └── app.db
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
│   │   ├── globals.css.tsx
│   │   ├── api/
│   │   │   ├── alerts/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── listings/
│   │   │   │   └── route.ts
│   │   │   └── unsubscribe/
│   │   │       ├── route.ts
│   │   │       └── [token]/
│   │   │           └── route.ts
│   │   └── unsubscribe/
│   │       └── [token]/
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
│   │   │   └── UnsubscribeForm.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Container.tsx
│   │   └── listings/
│   │       ├── ListingCard.tsx
│   │       ├── ListingGrid.tsx
│   │       └── ScamBadge.tsx
│   ├── lib/
│   │   ├── database/
│   │   │   ├── index.ts
│   │   │   ├── schema.sql.ts
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
# Note: scripts/ and tests/ folders removed for MVP simplification
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
**`page.tsx`**: Landing page with email input and alert form
**`globals.css.tsx`**: Global styles, Tailwind imports

**API Routes (`src/app/api/`)** (MVP Essential Only):

- `alerts/route.ts`: POST create alert, GET list alerts
- `alerts/[id]/route.ts`: DELETE deactivate alert
- `listings/route.ts`: GET basic listings data
- `unsubscribe/route.ts`: POST unsubscribe by email
- `unsubscribe/[token]/route.ts`: GET unsubscribe by token

**Pages (`src/app/`)** (MVP Minimal):

- `unsubscribe/[token]/page.tsx`: Token-based unsubscribe confirmation

#### `src/components/`

**UI Components (`src/components/ui/`)**:

- shadcn/ui components: Button, Input, Select, Card, etc.
- Consistent design system components

**Form Components (`src/components/forms/`)** (MVP Essential):

- `AlertForm.tsx`: Main alert creation form
- `UnsubscribeForm.tsx`: Email unsubscribe form

**Layout Components (`src/components/layout/`)** (MVP Simplified):

- `Header.tsx`: Simple site header
- `Footer.tsx`: Basic site footer
- `Container.tsx`: Responsive container wrapper

**Listing Components (`src/components/listings/`)** (MVP Core):

- `ListingCard.tsx`: Individual listing display
- `ListingGrid.tsx`: Grid of listing cards
- `ScamBadge.tsx`: Basic scam warning indicator

#### `src/lib/`

**Database (`src/lib/database/`)** (Simplified for MVP):

- `index.ts`: Database connection and setup
- `schema.sql.ts`: Drizzle schema definition (no migrations)
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

### Scripts & Tools (Removed for MVP)

**Note**: Complex scripts and testing infrastructure removed for local MVP development. Focus is on core functionality implementation.

### Data Directory

#### `data/`

- `app.db`: SQLite database file (no migrations for MVP)

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
