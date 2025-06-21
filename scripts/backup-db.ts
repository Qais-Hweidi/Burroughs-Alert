#!/usr/bin/env node

/**
 * Database Backup Script
 * Create and manage database backups
 */

import { getDatabase, createBackup, runMaintenance } from '../src/lib/database';
import { logger } from '../src/lib/utils/logger';
import fs from 'fs';
import path from 'path';

interface BackupOptions {
  output?: string;
  maintain?: boolean;
  cleanup?: boolean;
  compress?: boolean;
  retention?: number;
}

function parseArgs(): BackupOptions {
  const args = process.argv.slice(2);
  const options: BackupOptions = {
    retention: 30 // Keep 30 days of backups by default
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--maintain':
      case '-m':
        options.maintain = true;
        break;
      case '--cleanup':
      case '-c':
        options.cleanup = true;
        break;
      case '--compress':
        options.compress = true;
        break;
      case '--retention':
      case '-r':
        const retention = parseInt(args[++i]);
        if (!isNaN(retention) && retention > 0) {
          options.retention = retention;
        }
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
Database Backup Tool

Usage:
  npm run backup-db [options]

Options:
  --output, -o <path>     Specify backup file path
  --maintain, -m          Run database maintenance before backup
  --cleanup, -c           Clean up old backups based on retention policy
  --compress              Compress backup file (requires gzip)
  --retention, -r <days>  Backup retention period in days (default: 30)
  --help, -h              Show this help message

Examples:
  npm run backup-db                           # Create backup with default name
  npm run backup-db -o /path/to/backup.db     # Create backup at specific path
  npm run backup-db --maintain --cleanup      # Run maintenance and cleanup
  npm run backup-db --compress                # Create compressed backup
`);
}

async function performBackup(options: BackupOptions): Promise<string> {
  try {
    logger.info('Starting database backup...');
    
    // Run maintenance if requested
    if (options.maintain) {
      logger.info('Running database maintenance...');
      const maintenanceResult = runMaintenance();
      logger.info('Maintenance completed:', maintenanceResult);
    }
    
    // Create backup
    const backupPath = createBackup(options.output);
    
    // Compress if requested
    if (options.compress && fs.existsSync(backupPath)) {
      const compressedPath = await compressBackup(backupPath);
      
      // Remove original if compression successful
      if (compressedPath) {
        fs.unlinkSync(backupPath);
        logger.info(`Backup compressed: ${compressedPath}`);
        return compressedPath;
      }
    }
    
    logger.info(`Backup created: ${backupPath}`);
    return backupPath;
    
  } catch (error) {
    logger.error('Backup failed', error as Error);
    throw error;
  }
}

async function compressBackup(backupPath: string): Promise<string | null> {
  try {
    const { execSync } = require('child_process');
    const compressedPath = backupPath + '.gz';
    
    // Use gzip to compress the backup
    execSync(`gzip -c "${backupPath}" > "${compressedPath}"`);
    
    if (fs.existsSync(compressedPath)) {
      const originalSize = fs.statSync(backupPath).size;
      const compressedSize = fs.statSync(compressedPath).size;
      const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
      
      logger.info(`Compression successful: ${compressionRatio}% size reduction`);
      return compressedPath;
    }
    
    return null;
    
  } catch (error) {
    logger.warn('Compression failed, keeping uncompressed backup', { error });
    return null;
  }
}

async function cleanupOldBackups(retentionDays: number): Promise<void> {
  try {
    logger.info(`Cleaning up backups older than ${retentionDays} days...`);
    
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      logger.warn('Data directory does not exist');
      return;
    }
    
    const files = fs.readdirSync(dataDir);
    const backupFiles = files.filter(file => 
      file.startsWith('backup-') && (file.endsWith('.db') || file.endsWith('.db.gz'))
    );
    
    if (backupFiles.length === 0) {
      logger.info('No backup files found');
      return;
    }
    
    const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    let deletedCount = 0;
    
    for (const file of backupFiles) {
      const filePath = path.join(dataDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.ctimeMs < cutoffTime) {
        try {
          fs.unlinkSync(filePath);
          logger.debug(`Deleted old backup: ${file}`);
          deletedCount++;
        } catch (error) {
          logger.warn(`Failed to delete backup file: ${file}`, { error });
        }
      }
    }
    
    logger.info(`Cleanup completed: ${deletedCount} old backup(s) deleted`);
    
  } catch (error) {
    logger.error('Cleanup failed', error as Error);
    throw error;
  }
}

function getBackupInfo(): void {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    
    if (!fs.existsSync(dataDir)) {
      logger.info('No data directory found');
      return;
    }
    
    const files = fs.readdirSync(dataDir);
    const backupFiles = files.filter(file => 
      file.startsWith('backup-') && (file.endsWith('.db') || file.endsWith('.db.gz'))
    );
    
    if (backupFiles.length === 0) {
      logger.info('No backup files found');
      return;
    }
    
    logger.info(`Found ${backupFiles.length} backup file(s):`);
    
    const backupInfo = backupFiles
      .map(file => {
        const filePath = path.join(dataDir, file);
        const stats = fs.statSync(filePath);
        return {
          file,
          size: formatFileSize(stats.size),
          created: stats.ctime.toISOString(),
          age: getAgeString(stats.ctime)
        };
      })
      .sort((a, b) => b.created.localeCompare(a.created));
    
    backupInfo.forEach(info => {
      logger.info(`  ${info.file} - ${info.size} (${info.age} ago)`);
    });
    
    const totalSize = backupInfo.reduce((sum, info) => {
      const filePath = path.join(dataDir, info.file);
      return sum + fs.statSync(filePath).size;
    }, 0);
    
    logger.info(`Total backup size: ${formatFileSize(totalSize)}`);
    
  } catch (error) {
    logger.error('Failed to get backup info', error as Error);
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getAgeString(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
}

async function verifyBackup(backupPath: string): Promise<boolean> {
  try {
    logger.info(`Verifying backup: ${backupPath}`);
    
    if (!fs.existsSync(backupPath)) {
      logger.error('Backup file does not exist');
      return false;
    }
    
    // Basic file size check
    const stats = fs.statSync(backupPath);
    if (stats.size === 0) {
      logger.error('Backup file is empty');
      return false;
    }
    
    // If it's a compressed file, we can't easily verify the SQLite structure
    if (backupPath.endsWith('.gz')) {
      logger.info('Backup verification: File exists and is not empty (compressed)');
      return true;
    }
    
    // For uncompressed SQLite files, we can do a basic integrity check
    try {
      const Database = require('better-sqlite3');
      const testDb = new Database(backupPath, { readonly: true });
      
      // Try to run a simple query
      const result = testDb.prepare('SELECT COUNT(*) FROM sqlite_master').get();
      testDb.close();
      
      logger.info('Backup verification: SQLite database is valid');
      return true;
      
    } catch (error) {
      logger.error('Backup verification failed: Invalid SQLite database', { error });
      return false;
    }
    
  } catch (error) {
    logger.error('Backup verification failed', error as Error);
    return false;
  }
}

async function main() {
  try {
    const options = parseArgs();
    
    // Show current backup info
    getBackupInfo();
    
    // Perform backup
    const backupPath = await performBackup(options);
    
    // Verify backup
    const isValid = await verifyBackup(backupPath);
    if (!isValid) {
      logger.error('Backup verification failed');
      process.exit(1);
    }
    
    // Cleanup old backups if requested
    if (options.cleanup && options.retention) {
      await cleanupOldBackups(options.retention);
    }
    
    logger.info('Backup process completed successfully');
    
    // Show updated backup info
    getBackupInfo();
    
  } catch (error) {
    logger.fatal('Backup process failed', error as Error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export default main;