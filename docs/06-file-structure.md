# Burroughs Alert - Complete File Structure

## Current Project Structure (MVP Focus)

**Note**: This reflects the current implementation state. Backend components (database, API routes, jobs) will be added as development progresses.

```
burroughs-alert/
├── README.md
├── package.json
├── package-lock.json
├── next.config.js
├── postcss.config.js          # NEW: PostCSS configuration
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.tsbuildinfo       # NEW: TypeScript build cache
├── next-env.d.ts              # NEW: Next.js environment types
├── .env.local
├── .env.example
├── .gitignore
├── .eslintrc.json
├── prettier.config.js
├── CLAUDE.md
├── docs/
│   ├── 01-project-overview.md
│   ├── 02-tech-stack.md
│   ├── 03-architecture.md
│   ├── 04-database-schema.md
│   ├── 05-api-design.md
│   ├── 06-file-structure.md
│   ├── 07-algorithms-pseudocode.md
│   ├── 08-scraping-strategy.md
│   └── 09-agent-ownership.md
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── images/
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx             # Landing page
    │   ├── not-found.tsx        # 404 page
    │   ├── globals.css          # Fixed: was globals.css.tsx
    │   ├── alerts/              # NEW: Alert creation flow
    │   │   └── create/
    │   │       └── page.tsx
    │   ├── confirm/             # NEW: Confirmation page
    │   │   └── page.tsx
    │   ├── success/             # NEW: Success page
    │   │   └── page.tsx
    │   └── listings/            # NEW: Listings view page
    │       └── page.tsx
    ├── components/
    │   ├── ui/
    │   │   ├── button.tsx
    │   │   ├── input.tsx
    │   │   ├── select.tsx
    │   │   ├── checkbox.tsx
    │   │   ├── card.tsx
    │   │   ├── alert.tsx
    │   │   ├── badge.tsx
    │   │   ├── spinner.tsx
    │   │   ├── toast.tsx
    │   │   ├── form.tsx          # NEW: Form components
    │   │   ├── label.tsx         # NEW: Label component
    │   │   ├── switch.tsx        # NEW: Switch component
    │   │   ├── textarea.tsx      # NEW: Textarea component
    │   │   └── index.ts          # NEW: Component exports
    │   ├── forms/
    │   │   └── AlertForm.tsx     # Core form component
    │   ├── layout/
    │   │   ├── Header.tsx
    │   │   ├── Footer.tsx
    │   │   └── Container.tsx
    │   └── listings/
    │       ├── ListingCard.tsx
    │       └── ListingsGrid.tsx  # Fixed: was ListingGrid.tsx
    └── lib/
        ├── types/
        │   ├── index.ts          # Currently empty
        │   ├── database.types.ts
        │   ├── api.types.ts
        │   ├── listings.types.ts # NEW: Listings-specific types
        │   ├── scraping.types.ts
        │   └── notification.types.ts
        └── utils/
            ├── cn.ts             # NEW: Tailwind class utility
            ├── constants.ts
            ├── formatting.ts
            ├── index.ts          # NEW: Utility exports
            ├── listingHelpers.ts # NEW: Listing utilities
            └── mockListings.ts   # NEW: Mock data for development

# Backend Implementation Plan (To Be Added):
# ├── data/                     # SQLite database storage
# │   └── app.db
# ├── tests/                    # Basic testing (essential functionality)
# │   ├── api/                  # API route tests (alerts, listings, health)
# │   ├── lib/                  # Unit tests (database, matching, utils)
# │   └── setup.ts              # Test configuration
# ├── src/app/api/              # API routes
# │   ├── alerts/route.ts
# │   ├── listings/search/route.ts
# │   └── health/route.ts
# ├── src/lib/database/         # Database layer
# │   ├── schema.ts
# │   └── queries/
# ├── src/lib/scraping/         # Scraping system
# │   ├── craigslist-scraper.ts
# │   └── scam-detector.ts      # Mistral AI integration
# ├── src/lib/jobs/             # Background jobs
# │   └── scraper-job.ts
# └── src/lib/notifications/    # Email system
#     └── email-service.ts
# Note: Basic testing infrastructure will be added with backend implementation
```

## Current Implementation Overview

### Frontend MVP Status: ✅ Complete

**User Journey Flow**: Fully implemented user experience from landing page through alert creation to listings view.

**Modern Tech Stack**: Next.js 15, React 18, TypeScript, Tailwind CSS, Radix UI components.

**Professional UI/UX**: 13 reusable UI components, responsive design, comprehensive form validation.

### Backend MVP Status: ❌ Not Implemented

Backend components will be added in this order:

1. Database setup (SQLite + Drizzle ORM)
2. API routes for alert management
3. Scraping system with Mistral AI
4. Background job scheduler
5. Email notification system

## File Descriptions

### Configuration Files (Current)

#### `package.json`

- Next.js 15, React 18, TypeScript 5.6
- Radix UI components, Tailwind CSS, Lucide icons
- Drizzle ORM, better-sqlite3, Mistral AI
- ESLint, Prettier, PostCSS

#### `next.config.js`

- Basic Next.js 15 configuration
- TypeScript path aliases

#### `postcss.config.js` (NEW)

- PostCSS configuration for Tailwind CSS
- Autoprefixer integration

#### `tailwind.config.js`

- HSL color variables for theming
- Dark mode support configuration
- Custom animations and component styling

#### `tsconfig.json`

- Strict TypeScript configuration
- Path aliases for clean imports
- Next.js 15 App Router support

### Current Frontend Implementation

#### `src/app/` (Next.js 15 App Router)

**`layout.tsx`**: Root layout with Inter font, metadata, responsive design
**`page.tsx`**: Landing page with hero, features, statistics, CTA
**`globals.css`**: Tailwind base styles, HSL color variables, dark mode support
**`not-found.tsx`**: Custom 404 page

**User Flow Pages**:

- `alerts/create/page.tsx`: Comprehensive alert creation form
- `confirm/page.tsx`: Alert confirmation page
- `success/page.tsx`: Success state page
- `listings/page.tsx`: Listings view with current matches

#### `src/components/` (13 UI Components)

**UI Components (`components/ui/`)**:

- Modern design system with Radix UI primitives
- Consistent styling with class-variance-authority
- TypeScript interfaces for all props
- Responsive and accessible components

**Form Components (`components/forms/`)**:

- `AlertForm.tsx`: Complex form with NYC neighborhood selection, validation, multi-step flow

**Layout Components (`components/layout/`)**:

- Responsive header, footer, container components
- Consistent spacing and branding

**Listing Components (`components/listings/`)**:

- `ListingCard.tsx`: Individual apartment listing display
- `ListingsGrid.tsx`: Grid layout for multiple listings

#### `src/lib/` (Utilities & Types)

**Current Utilities (`lib/utils/`)**:

- `cn.ts`: Tailwind class merging utility
- `constants.ts`: NYC neighborhoods, form validation rules
- `formatting.ts`: Date, price, text formatting helpers
- `listingHelpers.ts`: Listing data manipulation
- `mockListings.ts`: Development mock data

**Type Definitions (`lib/types/`)**:

- Comprehensive TypeScript interfaces
- Database schema types
- API request/response types
- Listing and form data types

### Planned Backend Implementation

#### Database Layer (To Be Added)

- SQLite with Drizzle ORM
- Schema in `lib/database/schema.ts`
- Query helpers in `lib/database/queries/`

#### API Routes (To Be Added)

- `app/api/alerts/route.ts`: Alert CRUD with dual system
- `app/api/listings/search/route.ts`: Immediate listings search
- `app/api/health/route.ts`: System health monitoring

#### Scraping System (To Be Added)

- `lib/scraping/craigslist-scraper.ts`: Basic Puppeteer scraper
- `lib/scraping/scam-detector.ts`: Mistral AI integration
- Safe scraping intervals (30-45 minutes)

#### Background Jobs (To Be Added)

- `lib/jobs/scraper-job.ts`: Randomized job scheduler
- Direct processing pipeline (scrape → match → notify)

#### Email System (To Be Added)

- `lib/notifications/email-service.ts`: Nodemailer + Gmail SMTP
- Notification templates and delivery

## Development Status Summary

### ✅ Completed (Frontend MVP)

- Complete user experience flow
- Professional UI component library
- Responsive design system
- Form validation and state management
- TypeScript integration
- Modern development tooling

### 🔄 Next Phase (Backend Implementation)

- Database schema and connection
- API route development
- Scraping system with AI
- Background job scheduling
- Email notification system
- **Basic testing** (API routes, database ops, core logic)

This structure reflects the current "frontend-first" MVP approach while providing a clear roadmap for backend implementation.
