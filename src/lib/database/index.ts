/**
 * Database Connection and Initialization
 * Using better-sqlite3 for SQLite database operations
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fullSchema } from './schema.sql';

let db: Database.Database | null = null;

// Database configuration
const DATABASE_PATH = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'app.db');
const DATABASE_DIR = path.dirname(DATABASE_PATH);

/**
 * Initialize database connection
 */
export function initializeDatabase(): Database.Database {
  try {
    // Ensure data directory exists
    if (!fs.existsSync(DATABASE_DIR)) {
      fs.mkdirSync(DATABASE_DIR, { recursive: true });
    }

    // Create database connection
    db = new Database(DATABASE_PATH);
    
    // Enable foreign key constraints
    db.pragma('foreign_keys = ON');
    
    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');
    
    // Set synchronous mode for better performance
    db.pragma('synchronous = NORMAL');
    
    // Create tables if they don't exist
    db.exec(fullSchema);
    
    console.log(`Database initialized at: ${DATABASE_PATH}`);
    return db;
    
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get database connection (create if doesn't exist)
 */
export function getDatabase(): Database.Database {
  if (!db) {
    db = initializeDatabase();
  }
  return db;
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  if (db) {
    try {
      db.close();
      db = null;
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }
}

/**
 * Check if database is connected
 */
export function isDatabaseConnected(): boolean {
  try {
    if (!db) return false;
    // Test connection with a simple query
    db.prepare('SELECT 1').get();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get database info and health status
 */
export function getDatabaseInfo() {
  const database = getDatabase();
  
  try {
    // Get table counts
    const userCount = database.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const alertCount = database.prepare('SELECT COUNT(*) as count FROM alerts WHERE is_active = 1').get() as { count: number };
    const listingCount = database.prepare('SELECT COUNT(*) as count FROM listings WHERE is_active = 1').get() as { count: number };
    const notificationCount = database.prepare('SELECT COUNT(*) as count FROM notifications WHERE sent_at > datetime("now", "-7 days")').get() as { count: number };
    
    // Get database file size
    const stats = fs.statSync(DATABASE_PATH);
    const fileSizeKB = Math.round(stats.size / 1024);
    
    return {
      status: 'healthy' as const,
      path: DATABASE_PATH,
      size: `${fileSizeKB} KB`,
      tables: {
        users: userCount.count,
        activeAlerts: alertCount.count,
        activeListings: listingCount.count,
        recentNotifications: notificationCount.count
      },
      pragmas: {
        foreignKeys: database.pragma('foreign_keys', { simple: true }),
        journalMode: database.pragma('journal_mode', { simple: true }),
        synchronous: database.pragma('synchronous', { simple: true })
      }
    };
  } catch (error) {
    return {
      status: 'error' as const,
      error: error instanceof Error ? error.message : 'Unknown error',
      path: DATABASE_PATH
    };
  }
}

/**
 * Run database maintenance tasks
 */
export function runMaintenance() {
  const database = getDatabase();
  
  try {
    console.log('Running database maintenance...');
    
    // Remove old listings (older than 30 days)
    const cleanupListings = database.prepare(`
      DELETE FROM listings 
      WHERE scraped_at < datetime('now', '-30 days')
    `);
    const deletedListings = cleanupListings.run();
    
    // Remove old notifications (older than 90 days)  
    const cleanupNotifications = database.prepare(`
      DELETE FROM notifications 
      WHERE sent_at < datetime('now', '-90 days')
    `);
    const deletedNotifications = cleanupNotifications.run();
    
    // Vacuum and analyze database
    database.exec('VACUUM');
    database.exec('ANALYZE');
    
    console.log(`Maintenance complete: Removed ${deletedListings.changes} old listings, ${deletedNotifications.changes} old notifications`);
    
    return {
      deletedListings: deletedListings.changes,
      deletedNotifications: deletedNotifications.changes
    };
  } catch (error) {
    console.error('Database maintenance failed:', error);
    throw error;
  }
}

/**
 * Create database backup
 */
export function createBackup(backupPath?: string): string {
  const database = getDatabase();
  
  if (!backupPath) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    backupPath = path.join(DATABASE_DIR, `backup-${timestamp}.db`);
  }
  
  try {
    database.backup(backupPath);
    console.log(`Database backup created: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error('Backup creation failed:', error);
    throw error;
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down database connection...');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down database connection...');
  closeDatabase();
  process.exit(0);
});

export default getDatabase;