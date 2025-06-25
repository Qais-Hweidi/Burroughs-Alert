# Burroughs Alert - Tech Stack

## Frontend Framework

### Next.js 15 (App Router)

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

### Radix UI + Custom Components

- **Why**: Headless, accessible React components with full customization
- **Components Used**:
  - Forms (select, checkbox, switch)
  - Layout (slot)
  - Feedback (alert-dialog, toast)
  - All styled with Tailwind CSS
- **Benefits**: Full control over styling, accessibility built-in, modern patterns

## Database

### SQLite + Drizzle ORM

- **Why**: Simple, serverless, perfect for MVP with type safety
- **Library**: better-sqlite3 for Node.js + Drizzle ORM
- **Storage**: Local file at `./data/app.db`
- **Benefits**:
  - Zero configuration
  - ACID transactions
  - Fast for read-heavy workloads
  - Easy backup and migration
  - No separate database server needed
  - Type-safe queries with Drizzle ORM

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

### node-cron (Simplified)

- **Why**: Simple cron job scheduler for Node.js
- **Usage**: Schedule regular scraping tasks with safe, randomized intervals
- **Schedule**: 
  - Random intervals between 30-45 minutes
  - Only scrape recent listings (posted in last 45-60 minutes with buffer)
  - Automatic delays to avoid detection patterns
- **Benefits**: In-process scheduling, no external dependencies, respectful rate limiting, randomized timing

## Email Service

### Nodemailer + Gmail SMTP

- **Why**: Simple email sending for MVP
- **Configuration**: Gmail app passwords for authentication
- **Benefits**: Free tier sufficient for MVP, reliable delivery

## AI/LLM Integration

### Mistral AI

- **Why**: Enhanced scam detection and content analysis
- **Model**: `mistral-small-latest` for cost-effective reasoning
- **Primary Use**: Intelligent scam detection with structured JSON responses  
- **Secondary Uses**: Neighborhood normalization, content quality assessment
- **Benefits**: Excellent at structured analysis, reliable JSON parsing, cost-effective

## Development Tools

### ESLint + Prettier

- **Why**: Code quality and formatting
- **Configuration**: Standard rules with TypeScript support
- **Benefits**: Consistent code style, catch common errors

## Testing Framework

### Vitest (Basic Backend Testing)

- **Why**: Fast, modern testing framework with excellent TypeScript support
- **Scope**: Essential backend functionality only (API routes, database, business logic)
- **Approach**: Mock external services (Mistral AI, email, scraping)
- **Benefits**: TypeScript native, fast execution, easy setup with current stack

## Environment Variables

```bash
# Database
DATABASE_URL=./data/app.db

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=email@gmail.com
SMTP_PASS=your_app_password

# Scraping (Simplified)
SCRAPING_ENABLED=true
USER_AGENT=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36

# LLM API
MISTRAL_API_KEY=your_mistral_api_key

# API Keys (Optional)
GOOGLE_MAPS_API_KEY=your_api_key_here
```

## Package.json Dependencies

### Production Dependencies

```json
{
  "next": "^15.3.4",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "typescript": "^5.6.3",
  "better-sqlite3": "^9.0.0",
  "drizzle-orm": "^0.44.2",
  "puppeteer": "^24.10.2",
  "axios": "^1.7.9",
  "nodemailer": "^6.9.16",
  "node-cron": "^3.0.3",
  "tailwindcss": "^3.4.17",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.6.0",
  "@radix-ui/react-select": "^2.1.4",
  "@radix-ui/react-checkbox": "^1.1.4",
  "@radix-ui/react-switch": "^1.2.5",
  "lucide-react": "^0.518.0",
  "zod": "^3.24.1",
  "@mistralai/mistralai": "^1.0.0"
}
```

### Development Dependencies

```json
{
  "@types/node": "^20.17.12",
  "@types/react": "^18.3.17",
  "@types/react-dom": "^18.3.5",
  "@types/better-sqlite3": "^7.6.0",
  "@types/nodemailer": "^6.4.17",
  "drizzle-kit": "^0.31.1",
  "eslint": "^9.18.0",
  "eslint-config-next": "^15.3.4",
  "prettier": "^3.4.2",
  "autoprefixer": "^10.4.20",
  "postcss": "^8.5.2",
  "tsx": "^4.20.3",
  "vitest": "^2.0.0"
}
```

## Development Workflow

1. **Local Development**: `npm run dev`
2. **Type Checking**: `npm run type-check`
3. **Linting**: `npm run lint`
4. **Testing**: `npm run test`
5. **Test Watch Mode**: `npm run test:watch`
6. **Building**: `npm run build`

## File Structure Conventions

- Components: PascalCase (`UserForm.tsx`)
- Pages: kebab-case (`apartment-alerts/page.tsx`)
- Utilities: camelCase (`parseListingData.ts`)
- Constants: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)
- Types: PascalCase with `.types.ts` suffix (`User.types.ts`)
