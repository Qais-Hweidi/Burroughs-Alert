#!/usr/bin/env node

/**
 * Database Initialization Script
 * Initialize the database and run migrations
 */

import { initializeDatabase, getDatabaseInfo } from '../src/lib/database';
import { runMigrations, getCurrentVersion, validateMigrations } from '../src/lib/database/migrations';
import { logger } from '../src/lib/utils/logger';

async function initDatabase() {
  try {
    logger.info('Starting database initialization...');
    
    // Initialize database connection
    const db = initializeDatabase();
    logger.info('Database connection established');
    
    // Run migrations
    logger.info('Running database migrations...');
    runMigrations(db);
    
    // Validate migrations
    logger.info('Validating migrations...');
    const isValid = validateMigrations(db);
    if (!isValid) {
      logger.warn('Migration validation issues detected');
    } else {
      logger.info('All migrations validated successfully');
    }
    
    // Get current state
    const currentVersion = getCurrentVersion(db);
    const dbInfo = getDatabaseInfo();
    
    logger.info('Database initialization completed successfully');
    logger.info(`Current database version: ${currentVersion}`);
    
    // Display database info
    if (dbInfo.status === 'healthy') {
      logger.info('Database health check:', {
        path: dbInfo.path,
        size: dbInfo.size,
        tables: dbInfo.tables,
        pragmas: dbInfo.pragmas
      });
    } else {
      logger.error('Database health check failed:', { error: dbInfo.error });
    }
    
    process.exit(0);
    
  } catch (error) {
    logger.fatal('Database initialization failed', error as Error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase();
}

export default initDatabase;