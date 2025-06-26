# Job System Integration with Next.js

This document explains how the background job system is integrated with the Next.js application.

## Overview

The job system automatically starts when the Next.js app starts in production, but can be controlled for development use cases. The integration is designed to be:

- **Non-intrusive**: Doesn't interfere with development workflow
- **Environment-aware**: Different behavior for development vs production
- **Graceful**: Handles errors and shutdown properly
- **Controllable**: Can be enabled/disabled via environment variables

## Architecture

```
Next.js App Startup
       ↓
   AppInitializer Component (in RootLayout)
       ↓
   initializeApp() function
       ↓
   Conditionally start Job System
       ↓
   Register graceful shutdown handlers
```

## Files Created/Modified

### Core Integration Files

1. **`/src/lib/app-init.ts`** - Main application initialization logic
2. **`/src/components/app-initializer.tsx`** - React component that triggers initialization
3. **`/src/app/layout.tsx`** - Root layout updated to include AppInitializer

### API Routes

4. **`/src/app/api/system/status/route.ts`** - System health monitoring endpoint
5. **`/src/app/api/system/jobs/route.ts`** - Job system control endpoint

### Development Tools

6. **`/scripts/manage-jobs.ts`** - CLI script for development job management
7. **`/package.json`** - Updated with job management npm scripts

### Configuration

8. **`/.env.example`** - Updated with job system startup control variables

## Environment Variables

### Job System Control

```bash
# Completely disable job system (all environments)
DISABLE_BACKGROUND_JOBS=true

# Enable job system in development (normally disabled)
ENABLE_BACKGROUND_JOBS_DEV=true
```

### Environment-Specific Behavior

| Environment   | Default Behavior                | Override                                    |
| ------------- | ------------------------------- | ------------------------------------------- |
| `production`  | Job system starts automatically | `DISABLE_BACKGROUND_JOBS=true` to disable   |
| `development` | Job system disabled             | `ENABLE_BACKGROUND_JOBS_DEV=true` to enable |
| `test`        | Always disabled                 | Cannot be overridden                        |

## Usage

### Development Workflow

#### Option 1: Use npm scripts (recommended)

```bash
# Check system status
npm run jobs:status
npm run jobs:health

# Control job system
npm run jobs:start
npm run jobs:stop

# Trigger individual jobs
npm run jobs:scraper
npm run jobs:matcher
npm run jobs:cleanup
```

#### Option 2: Use CLI script directly

```bash
npx tsx scripts/manage-jobs.ts status
npx tsx scripts/manage-jobs.ts start
npx tsx scripts/manage-jobs.ts trigger scraper
```

#### Option 3: Use API endpoints

```bash
# Get system status
curl http://localhost:3000/api/system/status

# Get job system status
curl http://localhost:3000/api/system/jobs

# Start job system
curl -X POST http://localhost:3000/api/system/jobs \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'

# Trigger scraper job
curl -X POST http://localhost:3000/api/system/jobs \
  -H "Content-Type: application/json" \
  -d '{"action": "trigger", "job": "scraper"}'
```

### Production Deployment

1. **Automatic startup**: Job system starts automatically when the app starts
2. **Graceful shutdown**: Handles SIGINT, SIGTERM, and SIGUSR2 signals
3. **Health monitoring**: Use `/api/system/status` to monitor system health
4. **Manual control**: Use API endpoints for manual job control if needed

## Key Features

### Singleton Pattern

- `initializeApp()` is safe to call multiple times
- Prevents duplicate job system instances
- Handles concurrent initialization attempts

### Graceful Shutdown

- Registers signal handlers for SIGINT, SIGTERM, SIGUSR2
- Properly stops job system before process exit
- Handles uncaught exceptions and unhandled rejections

### Error Handling

- Non-blocking: App continues even if job system fails to start
- Comprehensive logging for debugging
- Graceful degradation in production

### Development Safety

- Job system disabled by default in development
- Environment checks prevent accidental production behavior
- Easy to enable for development testing

## Troubleshooting

### Job System Won't Start

1. Check environment variables:

   ```bash
   npm run jobs:health
   ```

2. Verify required environment variables are set:
   - `DATABASE_URL`
   - `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` (for email notifications)

3. Check logs for specific error messages

### Development Testing

To test job system in development:

1. Set environment variable:

   ```bash
   echo "ENABLE_BACKGROUND_JOBS_DEV=true" >> .env.local
   ```

2. Restart the Next.js development server:

   ```bash
   npm run dev
   ```

3. Verify job system started:
   ```bash
   npm run jobs:status
   ```

### Production Issues

1. Check system health:

   ```bash
   curl https://your-domain.com/api/system/status
   ```

2. Check job system status:

   ```bash
   curl https://your-domain.com/api/system/jobs
   ```

3. Review application logs for startup messages

## Security Considerations

- API endpoints don't require authentication (consider adding auth for production)
- Job system control should be restricted to authorized users in production
- Environment variables contain sensitive information (keep `.env.local` secure)

## Future Enhancements

- [ ] Add authentication to system control endpoints
- [ ] Add job system metrics and monitoring
- [ ] Implement job queue visualization
- [ ] Add job retry logic and dead letter queues
- [ ] Create job system dashboard UI
