/**
 * Application Constants
 * Central location for all constants used throughout the application
 */

import { NYCNeighborhood, NYCBorough } from '../types/database.types';

// ================================
// Application Configuration
// ================================

export const APP_CONFIG = {
  name: 'Burroughs Alert',
  version: '1.0.0',
  description: 'NYC Apartment Alert Service',
  author: 'Burroughs Alert Team',
  url: 'https://burroughsalert.com'
} as const;

// ================================
// API Configuration
// ================================

export const API_CONFIG = {
  baseUrl: '/api',
  version: 'v1',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  maxPayloadSize: '10mb'
} as const;

// ================================
// Database Configuration
// ================================

export const DATABASE_CONFIG = {
  name: 'app.db',
  directory: './data',
  backupRetention: 30, // days
  maintenanceInterval: 24 * 60 * 60 * 1000, // 24 hours
  connectionTimeout: 5000, // 5 seconds
  maxConnections: 1 // SQLite is single-threaded
} as const;

// ================================
// Validation Limits
// ================================

export const VALIDATION_LIMITS = {
  email: {
    minLength: 5,
    maxLength: 255
  },
  price: {
    min: 500,
    max: 20000
  },
  bedrooms: {
    min: 0,
    max: 10
  },
  bathrooms: {
    min: 0,
    max: 20
  },
  squareFeet: {
    min: 50,
    max: 10000
  },
  commute: {
    minMinutes: 1,
    maxMinutes: 120
  },
  neighborhoods: {
    minSelection: 1,
    maxSelection: 5
  },
  images: {
    maxCount: 20
  },
  text: {
    title: 500,
    description: 10000,
    address: 500,
    commuteDestination: 500,
    name: 100,
    source: 50
  },
  unsubscribeToken: 32
} as const;

// ================================
// NYC Geographic Bounds
// ================================

export const NYC_BOUNDS = {
  latitude: {
    min: 40.4,
    max: 40.9
  },
  longitude: {
    min: -74.3,
    max: -73.7
  }
} as const;

// ================================
// NYC Neighborhoods by Borough
// ================================

export const NYC_NEIGHBORHOODS: NYCNeighborhood[] = [
  // Manhattan
  { name: 'Upper East Side', borough: 'Manhattan', popular: true },
  { name: 'Upper West Side', borough: 'Manhattan', popular: true },
  { name: 'Midtown', borough: 'Manhattan', popular: true },
  { name: 'Lower East Side', borough: 'Manhattan', popular: true },
  { name: 'Greenwich Village', borough: 'Manhattan', popular: true },
  { name: 'SoHo', borough: 'Manhattan', popular: true },
  { name: 'TriBeCa', borough: 'Manhattan', popular: false },
  { name: 'Financial District', borough: 'Manhattan', popular: true },
  { name: 'Chelsea', borough: 'Manhattan', popular: true },
  { name: 'Flatiron', borough: 'Manhattan', popular: false },
  { name: 'Gramercy', borough: 'Manhattan', popular: false },
  { name: 'Murray Hill', borough: 'Manhattan', popular: false },
  { name: 'Kips Bay', borough: 'Manhattan', popular: false },
  { name: 'Tudor City', borough: 'Manhattan', popular: false },
  { name: 'Hell\'s Kitchen', borough: 'Manhattan', popular: true },
  { name: 'Times Square', borough: 'Manhattan', popular: false },
  { name: 'Lincoln Square', borough: 'Manhattan', popular: false },
  { name: 'Yorkville', borough: 'Manhattan', popular: false },
  { name: 'East Harlem', borough: 'Manhattan', popular: false },
  { name: 'Central Harlem', borough: 'Manhattan', popular: false },
  { name: 'West Harlem', borough: 'Manhattan', popular: false },
  { name: 'Washington Heights', borough: 'Manhattan', popular: true },
  { name: 'Inwood', borough: 'Manhattan', popular: false },
  { name: 'Chinatown', borough: 'Manhattan', popular: false },
  { name: 'Little Italy', borough: 'Manhattan', popular: false },
  { name: 'NoLita', borough: 'Manhattan', popular: false },
  { name: 'Bowery', borough: 'Manhattan', popular: false },
  { name: 'East Village', borough: 'Manhattan', popular: true },
  { name: 'West Village', borough: 'Manhattan', popular: true },
  
  // Brooklyn
  { name: 'Williamsburg', borough: 'Brooklyn', popular: true },
  { name: 'DUMBO', borough: 'Brooklyn', popular: true },
  { name: 'Brooklyn Heights', borough: 'Brooklyn', popular: true },
  { name: 'Park Slope', borough: 'Brooklyn', popular: true },
  { name: 'Prospect Heights', borough: 'Brooklyn', popular: true },
  { name: 'Crown Heights', borough: 'Brooklyn', popular: false },
  { name: 'Bedford-Stuyvesant', borough: 'Brooklyn', popular: true },
  { name: 'Fort Greene', borough: 'Brooklyn', popular: false },
  { name: 'Boerum Hill', borough: 'Brooklyn', popular: false },
  { name: 'Carroll Gardens', borough: 'Brooklyn', popular: false },
  { name: 'Red Hook', borough: 'Brooklyn', popular: false },
  { name: 'Gowanus', borough: 'Brooklyn', popular: false },
  { name: 'Sunset Park', borough: 'Brooklyn', popular: false },
  { name: 'Bay Ridge', borough: 'Brooklyn', popular: false },
  { name: 'Bensonhurst', borough: 'Brooklyn', popular: false },
  { name: 'Coney Island', borough: 'Brooklyn', popular: false },
  { name: 'Brighton Beach', borough: 'Brooklyn', popular: false },
  { name: 'Sheepshead Bay', borough: 'Brooklyn', popular: false },
  { name: 'Flatbush', borough: 'Brooklyn', popular: false },
  { name: 'Midwood', borough: 'Brooklyn', popular: false },
  { name: 'Borough Park', borough: 'Brooklyn', popular: false },
  { name: 'Bushwick', borough: 'Brooklyn', popular: true },
  { name: 'East New York', borough: 'Brooklyn', popular: false },
  { name: 'Brownsville', borough: 'Brooklyn', popular: false },
  { name: 'Canarsie', borough: 'Brooklyn', popular: false },
  { name: 'Mill Basin', borough: 'Brooklyn', popular: false },
  { name: 'Marine Park', borough: 'Brooklyn', popular: false },
  { name: 'Gravesend', borough: 'Brooklyn', popular: false },
  
  // Queens
  { name: 'Long Island City', borough: 'Queens', popular: true },
  { name: 'Astoria', borough: 'Queens', popular: true },
  { name: 'Sunnyside', borough: 'Queens', popular: false },
  { name: 'Woodside', borough: 'Queens', popular: false },
  { name: 'Jackson Heights', borough: 'Queens', popular: false },
  { name: 'Elmhurst', borough: 'Queens', popular: false },
  { name: 'Corona', borough: 'Queens', popular: false },
  { name: 'Flushing', borough: 'Queens', popular: false },
  { name: 'Bayside', borough: 'Queens', popular: false },
  { name: 'Whitestone', borough: 'Queens', popular: false },
  { name: 'College Point', borough: 'Queens', popular: false },
  { name: 'Forest Hills', borough: 'Queens', popular: false },
  { name: 'Kew Gardens', borough: 'Queens', popular: false },
  { name: 'Richmond Hill', borough: 'Queens', popular: false },
  { name: 'South Ozone Park', borough: 'Queens', popular: false },
  { name: 'Howard Beach', borough: 'Queens', popular: false },
  { name: 'Rockaway', borough: 'Queens', popular: false },
  { name: 'Far Rockaway', borough: 'Queens', popular: false },
  { name: 'Jamaica', borough: 'Queens', popular: false },
  { name: 'Hollis', borough: 'Queens', popular: false },
  { name: 'Queens Village', borough: 'Queens', popular: false },
  { name: 'Bellerose', borough: 'Queens', popular: false },
  { name: 'Floral Park', borough: 'Queens', popular: false },
  
  // Bronx
  { name: 'South Bronx', borough: 'Bronx', popular: false },
  { name: 'Mott Haven', borough: 'Bronx', popular: false },
  { name: 'Port Morris', borough: 'Bronx', popular: false },
  { name: 'Melrose', borough: 'Bronx', popular: false },
  { name: 'Morrisania', borough: 'Bronx', popular: false },
  { name: 'Hunts Point', borough: 'Bronx', popular: false },
  { name: 'Longwood', borough: 'Bronx', popular: false },
  { name: 'Concourse', borough: 'Bronx', popular: false },
  { name: 'High Bridge', borough: 'Bronx', popular: false },
  { name: 'Morris Heights', borough: 'Bronx', popular: false },
  { name: 'University Heights', borough: 'Bronx', popular: false },
  { name: 'Fordham', borough: 'Bronx', popular: false },
  { name: 'Belmont', borough: 'Bronx', popular: false },
  { name: 'Tremont', borough: 'Bronx', popular: false },
  { name: 'Mount Hope', borough: 'Bronx', popular: false },
  { name: 'Claremont', borough: 'Bronx', popular: false },
  { name: 'Soundview', borough: 'Bronx', popular: false },
  { name: 'Castle Hill', borough: 'Bronx', popular: false },
  { name: 'Parkchester', borough: 'Bronx', popular: false },
  { name: 'Westchester Square', borough: 'Bronx', popular: false },
  { name: 'Throggs Neck', borough: 'Bronx', popular: false },
  { name: 'Country Club', borough: 'Bronx', popular: false },
  { name: 'Pelham Bay', borough: 'Bronx', popular: false },
  { name: 'Williamsbridge', borough: 'Bronx', popular: false },
  { name: 'Norwood', borough: 'Bronx', popular: false },
  { name: 'Bedford Park', borough: 'Bronx', popular: false },
  { name: 'Kingsbridge', borough: 'Bronx', popular: false },
  { name: 'Riverdale', borough: 'Bronx', popular: false },
  { name: 'Spuyten Duyvil', borough: 'Bronx', popular: false },
  
  // Staten Island
  { name: 'St. George', borough: 'Staten Island', popular: false },
  { name: 'Stapleton', borough: 'Staten Island', popular: false },
  { name: 'Clifton', borough: 'Staten Island', popular: false },
  { name: 'Port Richmond', borough: 'Staten Island', popular: false },
  { name: 'West Brighton', borough: 'Staten Island', popular: false },
  { name: 'New Brighton', borough: 'Staten Island', popular: false },
  { name: 'Grasmere', borough: 'Staten Island', popular: false },
  { name: 'Concord', borough: 'Staten Island', popular: false },
  { name: 'Emerson Hill', borough: 'Staten Island', popular: false },
  { name: 'Dongan Hills', borough: 'Staten Island', popular: false },
  { name: 'Midland Beach', borough: 'Staten Island', popular: false },
  { name: 'New Dorp', borough: 'Staten Island', popular: false },
  { name: 'Oakwood', borough: 'Staten Island', popular: false },
  { name: 'Great Kills', borough: 'Staten Island', popular: false },
  { name: 'Eltingville', borough: 'Staten Island', popular: false },
  { name: 'Annadale', borough: 'Staten Island', popular: false },
  { name: 'Huguenot', borough: 'Staten Island', popular: false },
  { name: 'Prince\'s Bay', borough: 'Staten Island', popular: false },
  { name: 'Richmond Valley', borough: 'Staten Island', popular: false },
  { name: 'Tottenville', borough: 'Staten Island', popular: false },
  { name: 'Charleston', borough: 'Staten Island', popular: false },
  { name: 'Rossville', borough: 'Staten Island', popular: false },
  { name: 'Woodrow', borough: 'Staten Island', popular: false }
];

// ================================
// Error Codes
// ================================

export const ERROR_CODES = {
  // Validation Errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_NEIGHBORHOOD: 'INVALID_NEIGHBORHOOD',
  PRICE_RANGE_ERROR: 'PRICE_RANGE_ERROR',
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
  
  // Resource Errors (404)
  ALERT_NOT_FOUND: 'ALERT_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  LISTING_NOT_FOUND: 'LISTING_NOT_FOUND',
  
  // Server Errors (500)
  DATABASE_ERROR: 'DATABASE_ERROR',
  EMAIL_SERVICE_ERROR: 'EMAIL_SERVICE_ERROR',
  SCRAPING_ERROR: 'SCRAPING_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  
  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
} as const;

// ================================
// HTTP Status Codes
// ================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
} as const;

// ================================
// Email Configuration
// ================================

export const EMAIL_CONFIG = {
  from: {
    name: 'Burroughs Alert',
    address: 'noreply@burroughsalert.com'
  },
  templates: {
    alert: 'apartment-alert',
    welcome: 'welcome',
    unsubscribe: 'unsubscribe-confirmation'
  },
  limits: {
    dailyPerUser: 10,
    hourlyPerUser: 3,
    maxListingsPerEmail: 10
  }
} as const;

// ================================
// Scraping Configuration
// ================================

export const SCRAPING_CONFIG = {
  craigslist: {
    baseUrl: 'https://newyork.craigslist.org',
    searchPath: '/search/apa',
    delay: {
      min: 2000, // 2 seconds
      max: 5000  // 5 seconds
    },
    maxPages: 5,
    timeout: 30000, // 30 seconds
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  intervals: {
    production: 15 * 60 * 1000, // 15 minutes
    development: 5 * 60 * 1000,  // 5 minutes
    testing: 60 * 1000          // 1 minute
  },
  retries: {
    maxAttempts: 3,
    backoffMultiplier: 2,
    initialDelay: 1000
  }
} as const;

// ================================
// Rate Limiting Configuration
// ================================

export const RATE_LIMITS = {
  api: {
    window: 15 * 60 * 1000, // 15 minutes
    max: 100 // requests per window
  },
  alerts: {
    window: 60 * 60 * 1000, // 1 hour  
    max: 5 // alert creations per hour
  },
  listings: {
    window: 60 * 1000, // 1 minute
    max: 50 // listing requests per minute
  }
} as const;

// ================================
// Job Configuration
// ================================

export const JOB_CONFIG = {
  scraper: {
    cron: '*/15 * * * *', // Every 15 minutes
    timeout: 10 * 60 * 1000 // 10 minutes
  },
  matcher: {
    cron: '*/5 * * * *', // Every 5 minutes
    timeout: 5 * 60 * 1000 // 5 minutes
  },
  notifier: {
    cron: '*/10 * * * *', // Every 10 minutes
    timeout: 10 * 60 * 1000 // 10 minutes
  },
  cleanup: {
    cron: '0 2 * * *', // Daily at 2 AM
    timeout: 30 * 60 * 1000 // 30 minutes
  }
} as const;

// ================================
// Helper Functions
// ================================

export function getPopularNeighborhoods(): NYCNeighborhood[] {
  return NYC_NEIGHBORHOODS.filter(n => n.popular);
}

export function getNeighborhoodsByBorough(borough: NYCBorough): NYCNeighborhood[] {
  return NYC_NEIGHBORHOODS.filter(n => n.borough === borough);
}

export function getNeighborhoodNames(): string[] {
  return NYC_NEIGHBORHOODS.map(n => n.name);
}

export function isValidNeighborhood(name: string): boolean {
  return NYC_NEIGHBORHOODS.some(n => n.name === name);
}

export function getBoroughForNeighborhood(name: string): NYCBorough | null {
  const neighborhood = NYC_NEIGHBORHOODS.find(n => n.name === name);
  return neighborhood ? neighborhood.borough : null;
}