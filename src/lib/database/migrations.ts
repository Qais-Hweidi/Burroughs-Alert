/**
 * Database Migration System
 * Handles database schema migrations and version tracking
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { getDatabase } from './index';
import { fullSchema } from './schema.sql';
import { dbLogger, createTimer, logDatabaseOperation } from '../utils/logger';

// ================================
// Migration Types
// ================================

export interface Migration {
  version: number;
  name: string;
  up: string;
  down?: string;
  timestamp: string;
}

export interface MigrationRecord {
  version: number;
  name: string;
  applied_at: string;
  checksum: string;
}

// ================================
// Migration Management
// ================================

/**
 * Create migrations table if it doesn't exist
 */
function createMigrationsTable(db: Database.Database): void {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      checksum VARCHAR(64) NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_migrations_version ON _migrations(version);
    CREATE INDEX IF NOT EXISTS idx_migrations_applied_at ON _migrations(applied_at);
  `;
  
  db.exec(createTableSQL);
}

/**
 * Get current database version
 */
export function getCurrentVersion(db?: Database.Database): number {
  const database = db || getDatabase();
  
  try {
    createMigrationsTable(database);
    
    const result = database
      .prepare('SELECT MAX(version) as version FROM _migrations')
      .get() as { version: number | null };
    
    return result.version || 0;
  } catch (error) {
    dbLogger.warn('Could not get current version, assuming version 0', { error });
    return 0;
  }
}

/**
 * Record a migration as applied
 */
function recordMigration(
  db: Database.Database,
  migration: Migration,
  checksum: string
): void {
  const stmt = db.prepare(`
    INSERT INTO _migrations (version, name, checksum)
    VALUES (?, ?, ?)
  `);
  
  stmt.run(migration.version, migration.name, checksum);
}

/**
 * Check if migration was already applied
 */
function isMigrationApplied(
  db: Database.Database,
  version: number
): boolean {
  const result = db
    .prepare('SELECT 1 FROM _migrations WHERE version = ?')
    .get(version);
  
  return result !== undefined;
}

/**
 * Generate checksum for migration content
 */
function generateChecksum(content: string): string {
  // Simple hash function for migration content validation
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

// ================================
// Built-in Migrations
// ================================

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    timestamp: '2024-01-01T00:00:00Z',
    up: fullSchema,
    down: `
      DROP TABLE IF EXISTS notifications;
      DROP TABLE IF EXISTS listings;
      DROP TABLE IF EXISTS alerts;
      DROP TABLE IF EXISTS users;
    `
  }
];

// ================================
// Migration Execution
// ================================

/**
 * Run all pending migrations
 */
export function runMigrations(db?: Database.Database): void {
  const timer = createTimer();
  const database = db || getDatabase();
  
  try {
    dbLogger.info('Starting database migrations...');
    
    createMigrationsTable(database);
    const currentVersion = getCurrentVersion(database);
    
    dbLogger.info(`Current database version: ${currentVersion}`);
    
    // Get pending migrations
    const pendingMigrations = MIGRATIONS.filter(m => m.version > currentVersion);
    
    if (pendingMigrations.length === 0) {
      dbLogger.info('No pending migrations');
      return;
    }
    
    dbLogger.info(`Found ${pendingMigrations.length} pending migrations`);
    
    // Run migrations in transaction
    const transaction = database.transaction(() => {
      for (const migration of pendingMigrations) {
        if (isMigrationApplied(database, migration.version)) {
          dbLogger.warn(`Migration ${migration.version} already applied, skipping`);
          continue;
        }
        
        dbLogger.info(`Applying migration ${migration.version}: ${migration.name}`);
        
        try {
          // Execute migration
          database.exec(migration.up);
          
          // Record migration
          const checksum = generateChecksum(migration.up);
          recordMigration(database, migration, checksum);
          
          dbLogger.info(`Migration ${migration.version} applied successfully`);
          
        } catch (error) {
          dbLogger.error(`Migration ${migration.version} failed`, error as Error);
          throw error;
        }
      }
    });
    
    transaction();
    
    logDatabaseOperation('MIGRATE', '_migrations', true, timer());
    dbLogger.info(`All migrations completed successfully. New version: ${getCurrentVersion(database)}`);
    
  } catch (error) {
    logDatabaseOperation('MIGRATE', '_migrations', false, timer(), error as any);
    dbLogger.error('Migration failed', error as Error);
    throw error;
  }
}

/**
 * Rollback to a specific version
 */
export function rollbackTo(targetVersion: number, db?: Database.Database): void {
  const timer = createTimer();
  const database = db || getDatabase();
  
  try {
    const currentVersion = getCurrentVersion(database);
    
    if (targetVersion >= currentVersion) {
      dbLogger.warn(`Target version ${targetVersion} is not lower than current version ${currentVersion}`);
      return;
    }
    
    dbLogger.info(`Rolling back from version ${currentVersion} to ${targetVersion}`);
    
    // Get migrations to rollback (in reverse order)
    const migrationsToRollback = MIGRATIONS
      .filter(m => m.version > targetVersion && m.version <= currentVersion)
      .sort((a, b) => b.version - a.version);
    
    if (migrationsToRollback.length === 0) {
      dbLogger.warn('No migrations to rollback');
      return;
    }
    
    // Run rollbacks in transaction
    const transaction = database.transaction(() => {
      for (const migration of migrationsToRollback) {
        dbLogger.info(`Rolling back migration ${migration.version}: ${migration.name}`);
        
        if (migration.down) {
          try {
            database.exec(migration.down);
            
            // Remove migration record
            database
              .prepare('DELETE FROM _migrations WHERE version = ?')
              .run(migration.version);
            
            dbLogger.info(`Migration ${migration.version} rolled back successfully`);
            
          } catch (error) {
            dbLogger.error(`Rollback of migration ${migration.version} failed`, error as Error);
            throw error;
          }
        } else {
          dbLogger.warn(`Migration ${migration.version} has no rollback script`);
        }
      }
    });
    
    transaction();
    
    logDatabaseOperation('ROLLBACK', '_migrations', true, timer());
    dbLogger.info(`Rollback completed successfully. New version: ${getCurrentVersion(database)}`);
    
  } catch (error) {
    logDatabaseOperation('ROLLBACK', '_migrations', false, timer(), error as any);
    dbLogger.error('Rollback failed', error as Error);
    throw error;
  }
}

/**
 * Get migration history
 */
export function getMigrationHistory(db?: Database.Database): MigrationRecord[] {
  const database = db || getDatabase();
  
  try {
    createMigrationsTable(database);
    
    const results = database
      .prepare('SELECT * FROM _migrations ORDER BY version ASC')
      .all() as MigrationRecord[];
    
    return results;
    
  } catch (error) {
    dbLogger.error('Failed to get migration history', error as Error);
    return [];
  }
}

/**
 * Validate migration integrity
 */
export function validateMigrations(db?: Database.Database): boolean {
  const database = db || getDatabase();
  
  try {
    const history = getMigrationHistory(database);
    let isValid = true;
    
    for (const record of history) {
      const migration = MIGRATIONS.find(m => m.version === record.version);
      
      if (!migration) {
        dbLogger.warn(`Migration ${record.version} found in database but not in code`);
        isValid = false;
        continue;
      }
      
      const expectedChecksum = generateChecksum(migration.up);
      if (record.checksum !== expectedChecksum) {
        dbLogger.warn(`Migration ${record.version} checksum mismatch`, {
          expected: expectedChecksum,
          actual: record.checksum
        });
        isValid = false;
      }
    }
    
    return isValid;
    
  } catch (error) {
    dbLogger.error('Migration validation failed', error as Error);
    return false;
  }
}

// ================================
// File-based Migrations (for future use)
// ================================

/**
 * Load migrations from files
 */
export function loadMigrationsFromFiles(migrationsDir: string): Migration[] {
  if (!fs.existsSync(migrationsDir)) {
    dbLogger.warn(`Migrations directory does not exist: ${migrationsDir}`);
    return [];
  }
  
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  const migrations: Migration[] = [];
  
  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract version from filename (e.g., "001_initial_schema.sql")
    const match = file.match(/^(\d+)_(.+)\.sql$/);
    if (!match) {
      dbLogger.warn(`Invalid migration filename: ${file}`);
      continue;
    }
    
    const version = parseInt(match[1], 10);
    const name = match[2];
    
    // Split up and down migrations if separated by "-- DOWN"
    const parts = content.split(/^-- DOWN$/m);
    const up = parts[0].trim();
    const down = parts[1]?.trim();
    
    migrations.push({
      version,
      name,
      up,
      down,
      timestamp: fs.statSync(filePath).ctime.toISOString()
    });
  }
  
  return migrations.sort((a, b) => a.version - b.version);
}

/**
 * Create a new migration file
 */
export function createMigrationFile(
  name: string,
  migrationsDir: string = path.join(process.cwd(), 'data', 'migrations')
): string {
  // Ensure migrations directory exists
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }
  
  // Get next version number
  const existingMigrations = loadMigrationsFromFiles(migrationsDir);
  const nextVersion = existingMigrations.length > 0 
    ? Math.max(...existingMigrations.map(m => m.version)) + 1 
    : 1;
  
  // Create filename
  const filename = `${nextVersion.toString().padStart(3, '0')}_${name.replace(/\s+/g, '_').toLowerCase()}.sql`;
  const filepath = path.join(migrationsDir, filename);
  
  // Create migration template
  const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

-- Add your migration SQL here


-- DOWN
-- Add rollback SQL here (optional)

`;
  
  fs.writeFileSync(filepath, template);
  
  dbLogger.info(`Created migration file: ${filepath}`);
  return filepath;
}

// ================================
// Database Reset
// ================================

/**
 * Reset database to initial state
 */
export function resetDatabase(db?: Database.Database): void {
  const timer = createTimer();
  const database = db || getDatabase();
  
  try {
    dbLogger.warn('Resetting database to initial state...');
    
    // Drop all tables
    const dropTablesSQL = `
      DROP TABLE IF EXISTS notifications;
      DROP TABLE IF EXISTS listings;
      DROP TABLE IF EXISTS alerts;
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS _migrations;
    `;
    
    database.exec(dropTablesSQL);
    
    // Run migrations from scratch
    runMigrations(database);
    
    logDatabaseOperation('RESET', 'database', true, timer());
    dbLogger.info('Database reset completed successfully');
    
  } catch (error) {
    logDatabaseOperation('RESET', 'database', false, timer(), error as any);
    dbLogger.error('Database reset failed', error as Error);
    throw error;
  }
}