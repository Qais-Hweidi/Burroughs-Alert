/**
 * Notification Job - Processes pending notifications and sends batch emails
 * Status: ✅ IMPLEMENTED - Complete notification processing with batch emails
 * Purpose: Convert notification records into actual email notifications with batching
 * Dependencies: Email service, notification queries, database
 * Features: Batch processing, duplicate prevention, error handling, email formatting
 */

import { getDatabase } from '../database/index';
import { schema } from '../database/schema';
import { eq, and, sql } from 'drizzle-orm';
import { sendListingNotification } from '../notifications/email-service';
import { updateNotificationEmailStatus } from '../database/queries/notifications';
import type { ListingSelect, NotificationSelect } from '../database/schema';
import type { ParsedListing } from '../types/database.types';

// ================================
// Types
// ================================

export interface NotifierJobResult {
  success: boolean;
  startTime: Date;
  endTime: Date;
  duration: number;
  notificationsProcessed: number;
  emailsSent: number;
  emailsFailed: number;
  usersNotified: number;
  errors: string[];
}

export interface NotifierJobOptions {
  maxNotifications?: number;
  batchSize?: number;
  skipEmailSending?: boolean;
}

export interface PendingNotificationData {
  notification: NotificationSelect;
  listing: ListingSelect;
  userEmail: string;
  alertId: number;
}

export interface UserNotificationBatch {
  userEmail: string;
  notifications: PendingNotificationData[];
  listings: ParsedListing[];
}

// ================================
// Job Implementation
// ================================

/**
 * Execute notifier job: get pending notifications -> group by user -> send batch emails -> update status
 */
export async function runNotifierJob(
  options: NotifierJobOptions = {}
): Promise<NotifierJobResult> {
  const {
    maxNotifications = 1000,
    batchSize = 50,
    skipEmailSending = false,
  } = options;

  const startTime = new Date();
  const result: NotifierJobResult = {
    success: false,
    startTime,
    endTime: new Date(),
    duration: 0,
    notificationsProcessed: 0,
    emailsSent: 0,
    emailsFailed: 0,
    usersNotified: 0,
    errors: [],
  };

  try {
    console.log(
      `Starting notifier job - processing up to ${maxNotifications} pending notifications`
    );

    // Step 1: Get pending notifications with listing and user data
    const pendingNotifications =
      await getPendingNotifications(maxNotifications);

    console.log(`Found ${pendingNotifications.length} pending notifications`);

    if (pendingNotifications.length === 0) {
      console.log('No pending notifications to process');
      result.success = true;
      return result;
    }

    result.notificationsProcessed = pendingNotifications.length;

    // Step 2: Group notifications by user for batch emails
    const userBatches = groupNotificationsByUser(pendingNotifications);
    console.log(
      `Notifications grouped into ${userBatches.length} user batches`
    );

    // Step 3: Process each user batch
    for (const userBatch of userBatches) {
      try {
        console.log(
          `Processing batch for ${userBatch.userEmail}: ${userBatch.listings.length} listings`
        );

        if (!skipEmailSending) {
          // Send batch email
          const emailResult = await sendListingNotification(
            userBatch.userEmail,
            userBatch.listings
          );

          if (emailResult.success) {
            result.emailsSent++;
            result.usersNotified++;
            console.log(
              `✅ Email sent successfully to ${userBatch.userEmail} (${userBatch.listings.length} listings)`
            );

            // Update all notification statuses to 'sent'
            await updateNotificationStatuses(
              userBatch.notifications.map((n) => n.notification.id),
              'sent'
            );
          } else {
            result.emailsFailed++;
            console.error(
              `❌ Email failed for ${userBatch.userEmail}: ${emailResult.error}`
            );

            // Update notification statuses to 'failed'
            await updateNotificationStatuses(
              userBatch.notifications.map((n) => n.notification.id),
              'failed'
            );

            result.errors.push(
              `Email failed for ${userBatch.userEmail}: ${emailResult.error}`
            );
          }
        } else {
          // Skip email sending but update status to 'sent' for testing
          console.log(
            `📧 [SKIP] Would send email to ${userBatch.userEmail} with ${userBatch.listings.length} listings`
          );
          result.emailsSent++;
          result.usersNotified++;

          await updateNotificationStatuses(
            userBatch.notifications.map((n) => n.notification.id),
            'sent'
          );
        }

        // Small delay between batches to avoid overwhelming email service
        if (!skipEmailSending) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        result.emailsFailed++;
        const errorMsg = `Failed to process batch for ${userBatch.userEmail}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);

        // Update notification statuses to 'failed'
        try {
          await updateNotificationStatuses(
            userBatch.notifications.map((n) => n.notification.id),
            'failed'
          );
        } catch (updateError) {
          console.error(
            'Failed to update notification statuses after error:',
            updateError
          );
        }
      }
    }

    result.success = result.errors.length === 0;
    return result;
  } catch (error) {
    result.errors.push(
      `Notifier job failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    console.error('Notifier job error:', error);
    return result;
  } finally {
    result.endTime = new Date();
    result.duration = result.endTime.getTime() - result.startTime.getTime();

    // Log job completion
    const durationSeconds = Math.round((result.duration / 1000) * 100) / 100;
    console.log(
      `Notifier job completed in ${durationSeconds}s - Success: ${result.success}`
    );
    console.log(
      `  📧 Emails sent: ${result.emailsSent}/${result.emailsSent + result.emailsFailed}`
    );
    console.log(`  👥 Users notified: ${result.usersNotified}`);
    console.log(
      `  📋 Notifications processed: ${result.notificationsProcessed}`
    );

    if (result.errors.length > 0) {
      console.error('Notifier job errors:', result.errors);
    }
  }
}

// ================================
// Helper Functions
// ================================

/**
 * Get pending notifications with associated listing and user data
 */
async function getPendingNotifications(
  maxNotifications: number
): Promise<PendingNotificationData[]> {
  const db = getDatabase();

  try {
    // Join notifications with listings, alerts, and users to get all needed data
    const results = await db
      .select({
        notification: schema.notifications,
        listing: schema.listings,
        userEmail: schema.users.email,
        alertId: schema.alerts.id,
      })
      .from(schema.notifications)
      .innerJoin(
        schema.listings,
        eq(schema.notifications.listing_id, schema.listings.id)
      )
      .innerJoin(
        schema.alerts,
        eq(schema.notifications.alert_id, schema.alerts.id)
      )
      .innerJoin(
        schema.users,
        eq(schema.notifications.user_id, schema.users.id)
      )
      .where(
        and(
          eq(schema.notifications.email_status, 'pending'),
          eq(schema.users.is_active, true),
          eq(schema.alerts.is_active, true),
          eq(schema.listings.is_active, true)
        )
      )
      .orderBy(sql`${schema.notifications.sent_at} ASC`)
      .limit(maxNotifications);

    return results.map((row) => ({
      notification: row.notification,
      listing: row.listing,
      userEmail: row.userEmail,
      alertId: row.alertId,
    }));
  } catch (error) {
    console.error('Error getting pending notifications:', error);
    return [];
  }
}

/**
 * Convert ListingSelect to ParsedListing for email compatibility
 */
function convertToParsedListing(listing: ListingSelect): ParsedListing {
  return {
    ...listing,
    // Add missing ParsedListing fields with default values
    images: [], // No images in database yet
    contact_info: null, // Contact info not stored
    bathrooms: null, // Bathrooms not tracked yet
  };
}

/**
 * Group notifications by user for batch email processing
 */
function groupNotificationsByUser(
  notifications: PendingNotificationData[]
): UserNotificationBatch[] {
  const userMap = new Map<string, PendingNotificationData[]>();

  // Group by user email
  for (const notification of notifications) {
    const userEmail = notification.userEmail;
    if (!userMap.has(userEmail)) {
      userMap.set(userEmail, []);
    }
    userMap.get(userEmail)!.push(notification);
  }

  // Convert to batch format
  return Array.from(userMap.entries()).map(([userEmail, notifications]) => ({
    userEmail,
    notifications,
    listings: notifications.map((n) => convertToParsedListing(n.listing)),
  }));
}

/**
 * Update notification statuses in bulk
 */
async function updateNotificationStatuses(
  notificationIds: number[],
  emailStatus: string
): Promise<void> {
  const db = getDatabase();

  try {
    for (const id of notificationIds) {
      await updateNotificationEmailStatus(id, emailStatus);
    }
  } catch (error) {
    console.error('Error updating notification statuses:', error);
    throw error;
  }
}

// ================================
// Statistics and Monitoring
// ================================

/**
 * Get pending notification statistics
 */
export async function getPendingNotificationStats(): Promise<{
  totalPending: number;
  usersPending: number;
  oldestPending: Date | null;
  newestPending: Date | null;
}> {
  const db = getDatabase();

  try {
    const stats = await db
      .select({
        totalPending: sql<number>`count(*)`,
        usersPending: sql<number>`count(distinct user_id)`,
        oldestPending: sql<string>`min(sent_at)`,
        newestPending: sql<string>`max(sent_at)`,
      })
      .from(schema.notifications)
      .where(eq(schema.notifications.email_status, 'pending'))
      .get();

    return {
      totalPending: stats?.totalPending || 0,
      usersPending: stats?.usersPending || 0,
      oldestPending: stats?.oldestPending
        ? new Date(stats.oldestPending)
        : null,
      newestPending: stats?.newestPending
        ? new Date(stats.newestPending)
        : null,
    };
  } catch (error) {
    console.error('Error getting pending notification stats:', error);
    return {
      totalPending: 0,
      usersPending: 0,
      oldestPending: null,
      newestPending: null,
    };
  }
}

/**
 * Get notification success rate statistics
 */
export async function getNotificationSuccessStats(hours: number = 24): Promise<{
  totalSent: number;
  totalFailed: number;
  successRate: number;
  avgProcessingTime: number;
}> {
  const db = getDatabase();

  try {
    const results = await db
      .select({
        emailStatus: schema.notifications.email_status,
        sentAt: schema.notifications.sent_at,
      })
      .from(schema.notifications)
      .where(sql`sent_at >= datetime('now', '-${hours} hours')`)
      .all();

    const totalSent = results.filter((r) => r.emailStatus === 'sent').length;
    const totalFailed = results.filter(
      (r) => r.emailStatus === 'failed'
    ).length;
    const total = totalSent + totalFailed;
    const successRate = total > 0 ? totalSent / total : 0;

    return {
      totalSent,
      totalFailed,
      successRate,
      avgProcessingTime: 0, // TODO: Calculate if needed
    };
  } catch (error) {
    console.error('Error getting notification success stats:', error);
    return {
      totalSent: 0,
      totalFailed: 0,
      successRate: 0,
      avgProcessingTime: 0,
    };
  }
}

// ================================
// Utility Functions
// ================================

/**
 * Get job configuration from environment variables
 */
export function getNotifierJobConfig(): NotifierJobOptions {
  return {
    maxNotifications: parseInt(
      process.env.NOTIFIER_MAX_NOTIFICATIONS || '1000'
    ),
    batchSize: parseInt(process.env.NOTIFIER_BATCH_SIZE || '50'),
    skipEmailSending: process.env.NOTIFIER_SKIP_EMAIL_SENDING === 'true',
  };
}

/**
 * Create a formatted job summary for logging
 */
export function formatJobSummary(result: NotifierJobResult): string {
  const duration = Math.round((result.duration / 1000) * 100) / 100;
  const successRate =
    result.emailsSent + result.emailsFailed > 0
      ? Math.round(
          (result.emailsSent / (result.emailsSent + result.emailsFailed)) * 100
        )
      : 0;

  const summary = [
    `Notifier Job Summary:`,
    `  Success: ${result.success}`,
    `  Duration: ${duration} seconds`,
    `  Notifications processed: ${result.notificationsProcessed}`,
    `  Emails sent: ${result.emailsSent}`,
    `  Emails failed: ${result.emailsFailed}`,
    `  Users notified: ${result.usersNotified}`,
    `  Success rate: ${successRate}%`,
  ];

  if (result.errors.length > 0) {
    summary.push(`  Errors: ${result.errors.length}`);
    result.errors.forEach((error) => summary.push(`    - ${error}`));
  }

  return summary.join('\n');
}

/**
 * Clean up old failed notifications (retry mechanism)
 */
export async function retryFailedNotifications(
  maxRetries: number = 3,
  olderThanHours: number = 1
): Promise<number> {
  const db = getDatabase();

  try {
    // Get failed notifications that are older than the specified time
    const failedNotifications = await db
      .select()
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.email_status, 'failed'),
          sql`sent_at < datetime('now', '-${olderThanHours} hours')`
        )
      )
      .limit(100); // Limit retries to prevent overwhelming the system

    let retriedCount = 0;

    for (const notification of failedNotifications) {
      // Reset to pending for retry
      await updateNotificationEmailStatus(notification.id, 'pending');
      retriedCount++;
    }

    if (retriedCount > 0) {
      console.log(`Reset ${retriedCount} failed notifications for retry`);
    }

    return retriedCount;
  } catch (error) {
    console.error('Error retrying failed notifications:', error);
    return 0;
  }
}
