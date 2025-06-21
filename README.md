# Burroughs Alert

A renter-focused notification service for New York City apartment hunting. Get instant alerts when apartments matching your criteria become available.

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your email credentials
   ```

3. **Initialize database**:
   ```bash
   npm run db:init
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Start background jobs** (in separate terminal):
   ```bash
   npm run jobs:start
   ```

## Features

- **Smart Matching**: Set your criteria once, get notified instantly
- **Scam Detection**: Built-in protection against suspicious listings
- **NYC Focused**: Optimized for New York City rental market
- **Email Notifications**: Instant alerts when matches are found

## Documentation

See the `docs/` folder for comprehensive documentation:
- [Project Overview](./docs/01-project-overview.md)
- [Tech Stack](./docs/02-tech-stack.md)
- [Architecture](./docs/03-architecture.md)
- [Database Schema](./docs/04-database-schema.md)
- [API Design](./docs/05-api-design.md)
- [File Structure](./docs/06-file-structure.md)
- [Algorithms](./docs/07-algorithms-pseudocode.md)
- [Scraping Strategy](./docs/08-scraping-strategy.md)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks
- `npm run db:init` - Initialize database
- `npm run db:migrate` - Run database migrations
- `npm run jobs:start` - Start background scraping jobs

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, SQLite, better-sqlite3
- **Scraping**: Puppeteer, Axios
- **Email**: Nodemailer + Gmail SMTP
- **Jobs**: node-cron

## License

MIT