#!/usr/bin/env node

/**
 * Database Migration Script
 * Run database migrations
 */

import { getDatabase } from '../src/lib/database';
import { 
  runMigrations, 
  getCurrentVersion, 
  validateMigrations,
  getMigrationHistory,
  rollbackTo,
  resetDatabase
} from '../src/lib/database/migrations';
import { logger } from '../src/lib/utils/logger';

interface MigrationOptions {
  command: 'up' | 'down' | 'status' | 'validate' | 'reset';
  version?: number;
  force?: boolean;
}

function parseArgs(): MigrationOptions {
  const args = process.argv.slice(2);
  const options: MigrationOptions = { command: 'up' };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case 'up':
      case 'migrate':
        options.command = 'up';
        break;
      case 'down':
      case 'rollback':
        options.command = 'down';
        const nextArg = args[i + 1];
        if (nextArg && !isNaN(parseInt(nextArg))) {
          options.version = parseInt(nextArg);
          i++; // Skip the next argument as it's the version
        } else {
          logger.error('Rollback command requires a version number');\n          process.exit(1);
        }
        break;
      case 'status':
      case 'history':
        options.command = 'status';
        break;
      case 'validate':
        options.command = 'validate';
        break;
      case 'reset':
        options.command = 'reset';
        break;
      case '--force':
        options.force = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
    }
  }
  
  return options;
}

function showHelp() {
  console.log(`
Database Migration Tool

Usage:
  npm run db:migrate [command] [options]

Commands:
  up, migrate           Run pending migrations (default)
  down, rollback <ver>  Rollback to specific version
  status, history       Show migration history
  validate              Validate applied migrations
  reset                 Reset database and rerun all migrations

Options:
  --force              Force operation (use with caution)
  --help, -h           Show this help message

Examples:
  npm run db:migrate                    # Run pending migrations
  npm run db:migrate down 0             # Rollback all migrations
  npm run db:migrate status             # Show migration status
  npm run db:migrate validate           # Validate migrations
  npm run db:migrate reset              # Reset database
`);
}

async function runMigrationCommand(options: MigrationOptions) {
  try {
    const db = getDatabase();
    
    switch (options.command) {
      case 'up':
        logger.info('Running database migrations...');
        runMigrations(db);
        logger.info(`Migration completed. Current version: ${getCurrentVersion(db)}`);
        break;
        
      case 'down':
        if (options.version === undefined) {
          logger.error('Rollback requires a target version');
          process.exit(1);
        }
        
        if (!options.force) {
          logger.warn('Rollback will remove data. Use --force to confirm.');
          process.exit(1);
        }
        
        logger.info(`Rolling back to version ${options.version}...`);
        rollbackTo(options.version, db);
        logger.info(`Rollback completed. Current version: ${getCurrentVersion(db)}`);
        break;
        
      case 'status':
        const currentVersion = getCurrentVersion(db);
        const history = getMigrationHistory(db);
        
        logger.info(`Current database version: ${currentVersion}`);
        logger.info('Migration history:');
        
        if (history.length === 0) {
          logger.info('  No migrations applied');
        } else {
          history.forEach(migration => {
            logger.info(`  v${migration.version}: ${migration.name} (${migration.applied_at})`);
          });
        }
        break;
        
      case 'validate':
        logger.info('Validating migrations...');
        const isValid = validateMigrations(db);
        
        if (isValid) {
          logger.info('All migrations are valid');
        } else {
          logger.error('Migration validation failed');
          process.exit(1);
        }
        break;
        
      case 'reset':
        if (!options.force) {
          logger.warn('Reset will destroy all data. Use --force to confirm.');
          process.exit(1);
        }
        
        logger.warn('Resetting database...');
        resetDatabase(db);
        logger.info(`Reset completed. Current version: ${getCurrentVersion(db)}`);
        break;
        
      default:
        logger.error(`Unknown command: ${options.command}`);
        showHelp();
        process.exit(1);
    }
    
  } catch (error) {
    logger.fatal('Migration command failed', error as Error);
    process.exit(1);
  }
}

async function main() {
  const options = parseArgs();
  await runMigrationCommand(options);
}

// Run if called directly
if (require.main === module) {
  main();
}

export default main;