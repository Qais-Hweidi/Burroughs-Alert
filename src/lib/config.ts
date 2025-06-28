/**
 * Centralized configuration for environment variables with production defaults
 */

export const config = {
  // Application
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    env: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },

  // Database
  database: {
    url: process.env.DATABASE_URL || 'file:./data/app.db',
  },

  // SMTP Email Configuration
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || process.env.SMTP_USER || '',
    secure: process.env.SMTP_PORT === '465' || process.env.SMTP_SECURE === 'true',
  },

  // Google Maps API
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    cacheTTL: parseInt(process.env.GOOGLE_MAPS_CACHE_TTL || '86400', 10), // 24 hours
  },

  // Background Jobs Configuration
  jobs: {
    enabled: process.env.JOBS_ENABLED !== 'false',
    scraper: {
      interval: parseInt(process.env.JOBS_SCRAPER_INTERVAL || '45', 10), // minutes
      initialDelay: parseInt(process.env.JOBS_SCRAPER_INITIAL_DELAY || '5', 10), // minutes
      timeout: parseInt(process.env.JOBS_SCRAPER_TIMEOUT || '10', 10), // minutes
    },
    healthCheck: {
      interval: parseInt(process.env.JOBS_HEALTH_CHECK_INTERVAL || '5', 10), // minutes
    },
    cleanup: {
      cron: process.env.JOBS_CLEANUP_CRON || '0 2 * * *', // 2 AM daily
      daysToKeep: parseInt(process.env.JOBS_CLEANUP_DAYS || '30', 10),
    },
  },

  // Puppeteer Configuration
  puppeteer: {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    headless: process.env.PUPPETEER_HEADLESS !== 'false',
  },
};

// Validation function to ensure required environment variables are set
export function validateConfig() {
  const errors: string[] = [];

  // Check required SMTP configuration
  if (!config.smtp.host) errors.push('SMTP_HOST is required');
  if (!config.smtp.user) errors.push('SMTP_USER is required');
  if (!config.smtp.pass) errors.push('SMTP_PASS is required');

  // Warn about optional but recommended configurations
  if (!config.googleMaps.apiKey && config.app.isProduction) {
    console.warn('Warning: GOOGLE_MAPS_API_KEY not set - commute time filtering will be disabled');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

// Export typed configuration for use throughout the app
export type AppConfig = typeof config;