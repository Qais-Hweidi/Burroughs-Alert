# Burroughs Alert - Tech Stack

## Frontend Framework

### Next.js 14 (App Router)

- **Why**: Full-stack React framework with built-in API routes
- **Features Used**:
  - App Router for modern routing
  - Server Components for performance
  - API Routes for backend endpoints
  - Static generation for landing pages
  - Built-in optimization (images, fonts, etc.)

### TypeScript

- **Why**: Type safety and better developer experience
- **Usage**: Strict mode enabled, interfaces for all data models
- **Benefits**: Catch errors at compile time, better IDE support

## Styling & UI

### Tailwind CSS

- **Why**: Utility-first CSS for rapid development
- **Configuration**: Custom colors for brand, responsive breakpoints
- **Benefits**: Consistent design system, small bundle size

### shadcn/ui

- **Why**: High-quality, accessible React components
- **Components Used**:
  - Forms (input, select, button)
  - Layout (card, container)
  - Feedback (alert, toast)
  - Navigation (tabs, breadcrumb)
- **Benefits**: Consistent UI, accessibility built-in, customizable

## Database

### SQLite

- **Why**: Simple, serverless, perfect for MVP
- **Library**: better-sqlite3 for Node.js
- **Benefits**:
  - Zero configuration
  - ACID transactions
  - Fast for read-heavy workloads
  - Easy backup and migration
  - No separate database server needed

## Data Fetching & Scraping

### Puppeteer

- **Why**: Reliable web scraping with JavaScript execution
- **Usage**: Headless Chrome for Craigslist scraping
- **Benefits**: Handles dynamic content, can bypass basic bot detection

### Axios

- **Why**: HTTP client for API calls
- **Usage**: External API calls (maps, notifications)
- **Benefits**: Request/response interceptors, automatic JSON parsing

## Background Jobs

### node-cron

- **Why**: Simple cron job scheduler for Node.js
- **Usage**: Schedule regular scraping tasks
- **Benefits**: In-process scheduling, no external dependencies

## Email Service

### Nodemailer + Gmail SMTP

- **Why**: Simple email sending for MVP
- **Configuration**: Gmail app passwords for authentication
- **Benefits**: Free tier sufficient for MVP, reliable delivery

## Development Tools

### ESLint + Prettier

- **Why**: Code quality and formatting
- **Configuration**: Standard rules with TypeScript support
- **Benefits**: Consistent code style, catch common errors

## Environment Variables

```bash
# Database
DATABASE_URL=./data/app.db

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=email@gmail.com
SMTP_PASS=


# Scraping
SCRAPING_INTERVAL=300000  # 5 minutes
USER_AGENT=Mozilla/5.0...

# API Keys (if needed)
GOOGLE_MAPS_API_KEY=
```

## Package.json Dependencies

### Production Dependencies

```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "typescript": "^5.0.0",
  "better-sqlite3": "^9.0.0",
  "puppeteer": "^21.0.0",
  "axios": "^1.6.0",
  "nodemailer": "^6.9.0",
  "node-cron": "^3.0.0",
  "tailwindcss": "^3.3.0",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.0.0"
}
```

### Development Dependencies

```json
{
  "@types/node": "^20.0.0",
  "@types/react": "^18.0.0",
  "@types/better-sqlite3": "^7.6.0",
  "@types/nodemailer": "^6.4.0",
  "eslint": "^8.0.0",
  "eslint-config-next": "^14.0.0",
  "prettier": "^3.0.0"
}
```

## Development Workflow

1. **Local Development**: `npm run dev`
2. **Type Checking**: `npm run type-check`
3. **Linting**: `npm run lint`
4. **Building**: `npm run build`
5. **Testing**: `npm run test` (future enhancement)

## File Structure Conventions

- Components: PascalCase (`UserForm.tsx`)
- Pages: kebab-case (`apartment-alerts/page.tsx`)
- Utilities: camelCase (`parseListingData.ts`)
- Constants: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)
- Types: PascalCase with `.types.ts` suffix (`User.types.ts`)
