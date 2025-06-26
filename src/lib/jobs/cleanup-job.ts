/**
 * Purpose: Manages data retention and cleanup for privacy compliance and performance
 * Status: ✅ IMPLEMENTED - Complete cleanup system with retention policies
 * Dependencies: Database utilities, SQLite VACUUM operations
 * Retention: Listings (30d), Notifications (90d), Tokens (30d), Inactive alerts (6mo)
 */

import { cleanupOldListings } from '../database/queries/listings';
import { getDatabase, getSQLiteInstance } from '../database/index';
import { schema } from '../database/schema';
import { sql, lte, eq, and } from 'drizzle-orm';

// ================================
// Types
// ================================

export interface CleanupJobResult {
  success: boolean;
  startTime: Date;
  endTime: Date;
  duration: number;
  deletedCounts: {
    listings: number;
    notifications: number;
    expiredTokens: number;
    inactiveAlerts: number;
  };
  databaseOptimized: boolean;
  errors: string[];
}

export interface CleanupJobOptions {
  listingRetentionDays?: number;
  notificationRetentionDays?: number;
  tokenRetentionDays?: number;
  inactiveAlertMonths?: number;
  optimizeDatabase?: boolean;
}

// ================================
// Job Implementation
// ================================

/**
 * Execute cleanup job: clean old data -> optimize database -> report results
 */
export async function runCleanupJob(
  options: CleanupJobOptions = {}
): Promise<CleanupJobResult> {
  const {
    listingRetentionDays = 30,
    notificationRetentionDays = 90,
    tokenRetentionDays = 30,
    inactiveAlertMonths = 6,
    optimizeDatabase = true,
  } = options;

  const startTime = new Date();
  const result: CleanupJobResult = {
    success: false,
    startTime,
    endTime: new Date(),
    duration: 0,
    deletedCounts: {
      listings: 0,
      notifications: 0,
      expiredTokens: 0,
      inactiveAlerts: 0,
    },
    databaseOptimized: false,
    errors: [],
  };

  try {
    console.log(
      `Starting cleanup job - Listings: ${listingRetentionDays}d, Notifications: ${notificationRetentionDays}d, Tokens: ${tokenRetentionDays}d, Alerts: ${inactiveAlertMonths}mo`
    );

    // Step 1: Clean old listings
    try {
      const listingCleanup = await cleanupOldListings(listingRetentionDays);
      result.deletedCounts.listings = listingCleanup.deletedCount;
      if (listingCleanup.errors.length > 0) {
        result.errors.push(...listingCleanup.errors);
      }
      console.log(
        `Listings cleanup completed: ${result.deletedCounts.listings} deleted`
      );
    } catch (error) {
      result.errors.push(
        `Listing cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Step 2: Clean old notifications
    try {
      result.deletedCounts.notifications = await cleanupOldNotifications(
        notificationRetentionDays
      );
      console.log(
        `Notifications cleanup completed: ${result.deletedCounts.notifications} deleted`
      );
    } catch (error) {
      result.errors.push(
        `Notification cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Step 3: Clean expired tokens
    try {
      result.deletedCounts.expiredTokens =
        await cleanupExpiredTokens(tokenRetentionDays);
      console.log(
        `Token cleanup completed: ${result.deletedCounts.expiredTokens} cleaned`
      );
    } catch (error) {
      result.errors.push(
        `Token cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Step 4: Clean inactive alerts
    try {
      result.deletedCounts.inactiveAlerts =
        await cleanupInactiveAlerts(inactiveAlertMonths);
      console.log(
        `Inactive alerts cleanup completed: ${result.deletedCounts.inactiveAlerts} deleted`
      );
    } catch (error) {
      result.errors.push(
        `Inactive alert cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Step 5: Optimize database
    if (optimizeDatabase) {
      try {
        await optimizeDatabasePerformance();
        result.databaseOptimized = true;
        console.log('Database optimization completed');
      } catch (error) {
        result.errors.push(
          `Database optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    result.success = result.errors.length === 0;
    return result;
  } catch (error) {
    result.errors.push(
      `Cleanup job failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    console.error('Cleanup job error:', error);
    return result;
  } finally {
    result.endTime = new Date();
    result.duration = result.endTime.getTime() - result.startTime.getTime();

    // Log job completion
    const durationSeconds = Math.round((result.duration / 1000) * 100) / 100;
    const totalDeleted = Object.values(result.deletedCounts).reduce(
      (sum, count) => sum + count,
      0
    );
    console.log(
      `Cleanup job completed in ${durationSeconds}s - Success: ${result.success}, Total deleted: ${totalDeleted}`
    );

    if (result.errors.length > 0) {
      console.error('Cleanup job errors:', result.errors);
    }
  }
}

// ================================
// Cleanup Functions
// ================================

/**
 * Clean old notifications
 */
async function cleanupOldNotifications(retentionDays: number): Promise<number> {
  const db = getDatabase();

  // Count before deletion for reporting
  const countBefore = await db
    .select({ count: sql`count(*)` })
    .from(schema.notifications)
    .where(sql`sent_at <= datetime('now', '-' || ${retentionDays} || ' days')`)
    .get();

  // Delete old notifications
  await db
    .delete(schema.notifications)
    .where(sql`sent_at <= datetime('now', '-' || ${retentionDays} || ' days')`);

  return (countBefore?.count as number) || 0;
}

/**
 * Clean expired unsubscribe tokens
 */
async function cleanupExpiredTokens(retentionDays: number): Promise<number> {
  const db = getDatabase();

  // Count users with expired tokens
  const countBefore = await db
    .select({ count: sql`count(*)` })
    .from(schema.users)
    .where(
      and(
        sql`unsubscribe_token IS NOT NULL`,
        sql`updated_at <= datetime('now', '-' || ${retentionDays} || ' days')`
      )
    )
    .get();

  // Clear expired tokens (set to NULL)
  await db
    .update(schema.users)
    .set({ unsubscribe_token: null })
    .where(
      and(
        sql`unsubscribe_token IS NOT NULL`,
        sql`updated_at <= datetime('now', '-' || ${retentionDays} || ' days')`
      )
    );

  return (countBefore?.count as number) || 0;
}

/**
 * Clean inactive alerts
 */
async function cleanupInactiveAlerts(inactiveMonths: number): Promise<number> {
  const db = getDatabase();

  // Count inactive alerts
  const countBefore = await db
    .select({ count: sql`count(*)` })
    .from(schema.alerts)
    .where(
      and(
        eq(schema.alerts.is_active, false),
        sql`updated_at <= datetime('now', '-' || ${inactiveMonths} || ' months')`
      )
    )
    .get();

  // Delete inactive alerts
  await db
    .delete(schema.alerts)
    .where(
      and(
        eq(schema.alerts.is_active, false),
        sql`updated_at <= datetime('now', '-' || ${inactiveMonths} || ' months')`
      )
    );

  return (countBefore?.count as number) || 0;
}

/**
 * Optimize database performance
 */
async function optimizeDatabasePerformance(): Promise<void> {
  const sqlite = getSQLiteInstance();

  // Run VACUUM to reclaim space and optimize file structure
  sqlite.exec('VACUUM;');

  // Analyze tables for query optimization
  sqlite.exec('ANALYZE;');

  // Update table statistics
  sqlite.exec('PRAGMA optimize;');
}

// ================================
// Utility Functions
// ================================

/**
 * Get cleanup job configuration from environment variables
 */
export function getCleanupJobConfig(): CleanupJobOptions {
  return {
    listingRetentionDays: parseInt(
      process.env.CLEANUP_LISTING_RETENTION_DAYS || '30'
    ),
    notificationRetentionDays: parseInt(
      process.env.CLEANUP_NOTIFICATION_RETENTION_DAYS || '90'
    ),
    tokenRetentionDays: parseInt(
      process.env.CLEANUP_TOKEN_RETENTION_DAYS || '30'
    ),
    inactiveAlertMonths: parseInt(
      process.env.CLEANUP_INACTIVE_ALERT_MONTHS || '6'
    ),
    optimizeDatabase: process.env.CLEANUP_OPTIMIZE_DATABASE !== 'false',
  };
}

/**
 * Create a formatted job summary for logging
 */
export function formatJobSummary(result: CleanupJobResult): string {
  const duration = Math.round((result.duration / 1000) * 100) / 100;
  const totalDeleted = Object.values(result.deletedCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  const summary = [
    `Cleanup Job Summary:`,
    `  Success: ${result.success}`,
    `  Duration: ${duration} seconds`,
    `  Total deleted: ${totalDeleted}`,
    `  Breakdown:`,
    `    - Listings: ${result.deletedCounts.listings}`,
    `    - Notifications: ${result.deletedCounts.notifications}`,
    `    - Expired tokens: ${result.deletedCounts.expiredTokens}`,
    `    - Inactive alerts: ${result.deletedCounts.inactiveAlerts}`,
    `  Database optimized: ${result.databaseOptimized}`,
  ];

  if (result.errors.length > 0) {
    summary.push(`  Errors: ${result.errors.length}`);
    result.errors.forEach((error) => summary.push(`    - ${error}`));
  }

  return summary.join('\n');
}

/**
 * Get database size and statistics for monitoring
 */
export async function getDatabaseStats(): Promise<{
  totalSize: string;
  tableCounts: Record<string, number>;
  indexCount: number;
}> {
  try {
    const db = getDatabase();
    const sqlite = getSQLiteInstance();

    // Get database file size
    const sizeResult = sqlite
      .prepare(
        'SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()'
      )
      .get() as { size: number };
    const totalSize = `${(sizeResult.size / 1024 / 1024).toFixed(2)} MB`;

    // Get table counts
    const userCount =
      ((
        await db
          .select({ count: sql`count(*)` })
          .from(schema.users)
          .get()
      )?.count as number) || 0;
    const alertCount =
      ((
        await db
          .select({ count: sql`count(*)` })
          .from(schema.alerts)
          .get()
      )?.count as number) || 0;
    const listingCount =
      ((
        await db
          .select({ count: sql`count(*)` })
          .from(schema.listings)
          .get()
      )?.count as number) || 0;
    const notificationCount =
      ((
        await db
          .select({ count: sql`count(*)` })
          .from(schema.notifications)
          .get()
      )?.count as number) || 0;

    // Get index count
    const indexResult = sqlite
      .prepare(
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'"
      )
      .get() as { count: number };
    const indexCount = indexResult.count;

    return {
      totalSize,
      tableCounts: {
        users: userCount,
        alerts: alertCount,
        listings: listingCount,
        notifications: notificationCount,
      },
      indexCount,
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return {
      totalSize: 'Unknown',
      tableCounts: { users: 0, alerts: 0, listings: 0, notifications: 0 },
      indexCount: 0,
    };
  }
}
