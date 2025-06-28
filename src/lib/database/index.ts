/**
 * Database Connection Manager - SQLite with Drizzle ORM singleton for apartment alert system
 * Status: ✅ FULLY IMPLEMENTED - Connection, schema init, health checks, transactions
 * Config: DATABASE_URL (default: file:./data/app.db), WAL mode, foreign keys enabled
 * Features: Auto-schema creation, health monitoring, dev utilities (reset), graceful shutdown
 */

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { sql, eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import { schema } from './schema';
import type { DatabaseHealth } from '../types/database.types';

// ================================
// Environment Configuration
// ================================

const DATABASE_URL = process.env.DATABASE_URL || 'file:./data/app.db';
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_DEVELOPMENT = NODE_ENV === 'development';

// Extract database file path from URL
const getDatabasePath = (url: string): string => {
  if (url.startsWith('file:')) {
    return url.replace('file:', '');
  }
  return url;
};

const DB_PATH = getDatabasePath(DATABASE_URL);

// ================================
// Database Connection Singleton
// ================================

let dbInstance: ReturnType<typeof drizzle> | null = null;
let sqliteInstance: Database.Database | null = null;

/**
 * Initialize SQLite database with optimal settings
 */
const initializeSQLite = (): Database.Database => {
  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const sqlite = new Database(DB_PATH);

  // Configure SQLite for optimal performance and safety
  sqlite.pragma('journal_mode = WAL'); // Enable WAL mode for better concurrency
  sqlite.pragma('foreign_keys = ON'); // Enable foreign key constraints
  sqlite.pragma('synchronous = NORMAL'); // Balance safety and performance
  sqlite.pragma('busy_timeout = 5000'); // 5 second timeout for busy database
  sqlite.pragma('cache_size = 1000'); // Memory optimization

  if (IS_DEVELOPMENT) {
    // Enable query logging in development
    sqlite.pragma('query_only = OFF');
  }

  return sqlite;
};

/**
 * Get or create database connection singleton
 */
export const getDatabase = () => {
  if (!dbInstance || !sqliteInstance) {
    try {
      sqliteInstance = initializeSQLite();
      dbInstance = drizzle(sqliteInstance, { schema });

      // Initialize schema on first connection
      initializeSchema();

      console.log(`Database connected: ${DB_PATH}`);
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw new Error(
        `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  return dbInstance;
};

/**
 * Get raw SQLite instance for direct operations
 */
export const getSQLiteInstance = (): Database.Database => {
  if (!sqliteInstance) {
    getDatabase(); // Initialize if not already done
  }
  return sqliteInstance!;
};

// ================================
// Schema Initialization
// ================================

/**
 * Initialize database schema by creating all tables if they don't exist
 * For MVP, we're using direct SQL schema creation instead of migrations
 */
const initializeSchema = () => {
  try {
    const db = getSQLiteInstance();

    // Check if tables exist
    const tablesExist = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users', 'alerts', 'listings', 'notifications')"
      )
      .all();

    if (tablesExist.length === 0) {
      console.log('Initializing database schema...');

      // Create tables using raw SQL since Drizzle doesn't auto-create tables
      db.exec(`
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL UNIQUE,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          is_active INTEGER DEFAULT 1 NOT NULL,
          unsubscribe_token TEXT UNIQUE
        );

        -- Alerts table
        CREATE TABLE IF NOT EXISTS alerts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          neighborhoods TEXT NOT NULL,
          min_price INTEGER,
          max_price INTEGER,
          bedrooms INTEGER,
          pet_friendly INTEGER,
          max_commute_minutes INTEGER,
          commute_destination TEXT,
          commute_destination_place_id TEXT,
          commute_destination_lat REAL,
          commute_destination_lng REAL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          is_active INTEGER DEFAULT 1 NOT NULL
        );

        -- Listings table
        CREATE TABLE IF NOT EXISTS listings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          external_id TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          description TEXT,
          price INTEGER NOT NULL,
          bedrooms INTEGER,
          square_feet INTEGER,
          neighborhood TEXT,
          address TEXT,
          latitude REAL,
          longitude REAL,
          pet_friendly INTEGER,
          listing_url TEXT NOT NULL,
          source TEXT DEFAULT 'craigslist' NOT NULL,
          posted_at TEXT,
          scraped_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          is_active INTEGER DEFAULT 1 NOT NULL,
          scam_score INTEGER DEFAULT 0 NOT NULL
        );

        -- Notifications table
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          alert_id INTEGER NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
          listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
          notification_type TEXT DEFAULT 'new_listing' NOT NULL,
          sent_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          email_status TEXT DEFAULT 'sent'
        );

        -- Create indexes for performance
        CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users(email);
        CREATE INDEX IF NOT EXISTS users_unsubscribe_token_idx ON users(unsubscribe_token);
        CREATE INDEX IF NOT EXISTS users_active_idx ON users(is_active);

        CREATE INDEX IF NOT EXISTS alerts_user_id_idx ON alerts(user_id);
        CREATE INDEX IF NOT EXISTS alerts_active_idx ON alerts(is_active);
        CREATE INDEX IF NOT EXISTS alerts_price_idx ON alerts(min_price, max_price);
        CREATE INDEX IF NOT EXISTS alerts_bedrooms_idx ON alerts(bedrooms);
        CREATE INDEX IF NOT EXISTS alerts_pet_friendly_idx ON alerts(pet_friendly);
        CREATE INDEX IF NOT EXISTS alerts_commute_idx ON alerts(max_commute_minutes);

        CREATE UNIQUE INDEX IF NOT EXISTS listings_external_id_idx ON listings(external_id);
        CREATE INDEX IF NOT EXISTS listings_price_idx ON listings(price);
        CREATE INDEX IF NOT EXISTS listings_bedrooms_idx ON listings(bedrooms);
        CREATE INDEX IF NOT EXISTS listings_neighborhood_idx ON listings(neighborhood);
        CREATE INDEX IF NOT EXISTS listings_location_idx ON listings(latitude, longitude);
        CREATE INDEX IF NOT EXISTS listings_pet_friendly_idx ON listings(pet_friendly);
        CREATE INDEX IF NOT EXISTS listings_active_idx ON listings(is_active);
        CREATE INDEX IF NOT EXISTS listings_scam_score_idx ON listings(scam_score);
        CREATE INDEX IF NOT EXISTS listings_source_idx ON listings(source);
        CREATE INDEX IF NOT EXISTS listings_posted_at_idx ON listings(posted_at);
        CREATE INDEX IF NOT EXISTS listings_scraped_at_idx ON listings(scraped_at);

        CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
        CREATE INDEX IF NOT EXISTS notifications_alert_id_idx ON notifications(alert_id);
        CREATE INDEX IF NOT EXISTS notifications_listing_id_idx ON notifications(listing_id);
        CREATE INDEX IF NOT EXISTS notifications_sent_at_idx ON notifications(sent_at);
        CREATE INDEX IF NOT EXISTS notifications_type_idx ON notifications(notification_type);
        CREATE INDEX IF NOT EXISTS notifications_email_status_idx ON notifications(email_status);
        CREATE UNIQUE INDEX IF NOT EXISTS notifications_unique_idx ON notifications(user_id, alert_id, listing_id);
      `);

      console.log('Database schema initialized successfully');
    } else {
      console.log('Database schema already exists');
    }
  } catch (error) {
    console.error('Schema initialization error:', error);
    throw error;
  }
};

// ================================
// Health Checking
// ================================

/**
 * Check database health and return status information
 */
export const checkDatabaseHealth = async (): Promise<DatabaseHealth> => {
  try {
    const db = getDatabase();
    const sqlite = getSQLiteInstance();

    // Test database connectivity
    const testQuery = sqlite.prepare('SELECT 1 as test').get() as {
      test: number;
    };

    if (testQuery.test !== 1) {
      throw new Error('Database connection test failed');
    }

    // Get database file size
    const stats = fs.existsSync(DB_PATH) ? fs.statSync(DB_PATH) : null;
    const fileSize = stats
      ? `${(stats.size / 1024 / 1024).toFixed(2)} MB`
      : 'Unknown';

    // Get table counts
    const userCount = db.select().from(schema.users).all().length;
    const activeAlerts = db
      .select()
      .from(schema.alerts)
      .where(eq(schema.alerts.is_active, true))
      .all().length;
    const activeListings = db
      .select()
      .from(schema.listings)
      .where(eq(schema.listings.is_active, true))
      .all().length;

    // Get recent notifications (last 24 hours)
    const recentNotifications = db
      .select()
      .from(schema.notifications)
      .where(sql`sent_at > datetime('now', '-1 day')`)
      .all().length;

    // Get SQLite configuration
    const foreignKeys = sqlite.pragma('foreign_keys', { simple: true }) as
      | string
      | number;
    const journalMode = sqlite.pragma('journal_mode', {
      simple: true,
    }) as string;
    const synchronous = sqlite.pragma('synchronous', { simple: true }) as
      | string
      | number;

    return {
      status: 'healthy',
      path: DB_PATH,
      size: fileSize,
      tables: {
        users: userCount,
        activeAlerts,
        activeListings,
        recentNotifications,
      },
      pragmas: {
        foreignKeys,
        journalMode,
        synchronous,
      },
    };
  } catch (error) {
    return {
      status: 'error',
      path: DB_PATH,
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
};

// ================================
// Transaction Management
// ================================

/**
 * Execute a function within a database transaction
 */
export const withTransaction = async <T>(
  fn: (db: ReturnType<typeof drizzle>) => T | Promise<T>
): Promise<T> => {
  const db = getDatabase();
  const sqlite = getSQLiteInstance();

  return new Promise((resolve, reject) => {
    const transaction = sqlite.transaction(() => {
      try {
        const result = fn(db);
        resolve(result instanceof Promise ? result : Promise.resolve(result));
      } catch (error) {
        reject(error);
      }
    });

    try {
      transaction();
    } catch (error) {
      reject(error);
    }
  });
};

// ================================
// Development Utilities
// ================================

/**
 * Reset database by dropping and recreating all tables
 * Only available in development
 */
export const resetDatabase = async (): Promise<void> => {
  if (!IS_DEVELOPMENT) {
    throw new Error('Database reset is only available in development mode');
  }

  try {
    const sqlite = getSQLiteInstance();

    // Drop all tables
    sqlite.exec(`
      DROP TABLE IF EXISTS notifications;
      DROP TABLE IF EXISTS listings;
      DROP TABLE IF EXISTS alerts;
      DROP TABLE IF EXISTS users;
    `);

    console.log('Database reset completed');

    // Reinitialize schema
    initializeSchema();
  } catch (error) {
    console.error('Database reset failed:', error);
    throw error;
  }
};

// ================================
// Cleanup and Shutdown
// ================================

/**
 * Close database connection gracefully
 */
export const closeDatabase = (): void => {
  if (sqliteInstance) {
    sqliteInstance.close();
    sqliteInstance = null;
    dbInstance = null;
    console.log('Database connection closed');
  }
};

// Handle process shutdown
process.on('SIGINT', closeDatabase);
process.on('SIGTERM', closeDatabase);
process.on('exit', closeDatabase);

// ================================
// Default Export
// ================================

export default getDatabase;
