/**
 * Database Queries: Notifications
 * Purpose: Type-safe database operations for notification tracking to prevent duplicate emails
 * Status: ✅ IMPLEMENTED - Complete CRUD operations with duplicate prevention
 * Dependencies: Drizzle ORM, SQLite database connection, schema types
 */

import { and, eq, desc, sql } from 'drizzle-orm';
import { getDatabase } from '../index';
import {
  notifications,
  type NotificationSelect,
  type NotificationInsert,
} from '../schema';

// ================================
// Core Notification Functions
// ================================

/**
 * Check if a user has already been notified for a specific alert-listing combination
 * @param userId - The user ID to check
 * @param alertId - The alert ID to check
 * @param listingId - The listing ID to check
 * @returns Promise<boolean> - true if notification already sent, false otherwise
 */
export async function hasUserBeenNotified(
  userId: number,
  alertId: number,
  listingId: number
): Promise<boolean> {
  try {
    const db = getDatabase();

    const existingNotification = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.user_id, userId),
          eq(notifications.alert_id, alertId),
          eq(notifications.listing_id, listingId)
        )
      )
      .limit(1);

    return existingNotification.length > 0;
  } catch (error) {
    console.error('Error checking notification status:', error);
    throw new Error(
      `Failed to check notification status: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Record a new notification in the database
 * @param userId - The user ID who received the notification
 * @param alertId - The alert ID that triggered the notification
 * @param listingId - The listing ID that matched the alert
 * @param notificationType - The type of notification (default: 'new_listing')
 * @param emailStatus - The email delivery status (default: 'sent')
 * @returns Promise<NotificationSelect> - The created notification record
 */
export async function recordNotification(
  userId: number,
  alertId: number,
  listingId: number,
  notificationType: string = 'new_listing',
  emailStatus: string = 'sent'
): Promise<NotificationSelect> {
  try {
    const db = getDatabase();

    const notificationData: NotificationInsert = {
      user_id: userId,
      alert_id: alertId,
      listing_id: listingId,
      notification_type: notificationType,
      email_status: emailStatus,
    };

    const insertedNotifications = await db
      .insert(notifications)
      .values(notificationData)
      .returning();

    if (insertedNotifications.length === 0) {
      throw new Error('Failed to insert notification record');
    }

    return insertedNotifications[0];
  } catch (error) {
    // Handle unique constraint violation (duplicate notification)
    if (
      error instanceof Error &&
      error.message.includes('UNIQUE constraint failed')
    ) {
      console.warn('Attempted to record duplicate notification:', {
        userId,
        alertId,
        listingId,
        notificationType,
      });

      // Return existing notification instead of failing
      const db = getDatabase();
      const existingNotification = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.user_id, userId),
            eq(notifications.alert_id, alertId),
            eq(notifications.listing_id, listingId)
          )
        )
        .limit(1);

      if (existingNotification.length > 0) {
        return existingNotification[0];
      }
    }

    console.error('Error recording notification:', error);
    throw new Error(
      `Failed to record notification: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get notification history for a specific user
 * @param userId - The user ID to get notifications for
 * @param limit - Maximum number of notifications to return (default: 100)
 * @param offset - Number of notifications to skip for pagination (default: 0)
 * @returns Promise<NotificationSelect[]> - Array of notification records
 */
export async function getUserNotifications(
  userId: number,
  limit: number = 100,
  offset: number = 0
): Promise<NotificationSelect[]> {
  try {
    const db = getDatabase();

    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.user_id, userId))
      .orderBy(desc(notifications.sent_at))
      .limit(limit)
      .offset(offset);

    return userNotifications;
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    throw new Error(
      `Failed to fetch user notifications: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ================================
// Advanced Notification Queries
// ================================

/**
 * Get notifications for a specific alert
 * @param alertId - The alert ID to get notifications for
 * @param limit - Maximum number of notifications to return (default: 50)
 * @returns Promise<NotificationSelect[]> - Array of notification records
 */
export async function getNotificationsByAlert(
  alertId: number,
  limit: number = 50
): Promise<NotificationSelect[]> {
  try {
    const db = getDatabase();

    const alertNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.alert_id, alertId))
      .orderBy(desc(notifications.sent_at))
      .limit(limit);

    return alertNotifications;
  } catch (error) {
    console.error('Error fetching alert notifications:', error);
    throw new Error(
      `Failed to fetch alert notifications: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get notifications for a specific listing
 * @param listingId - The listing ID to get notifications for
 * @returns Promise<NotificationSelect[]> - Array of notification records
 */
export async function getNotificationsByListing(
  listingId: number
): Promise<NotificationSelect[]> {
  try {
    const db = getDatabase();

    const listingNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.listing_id, listingId))
      .orderBy(desc(notifications.sent_at));

    return listingNotifications;
  } catch (error) {
    console.error('Error fetching listing notifications:', error);
    throw new Error(
      `Failed to fetch listing notifications: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get notification count for a user
 * @param userId - The user ID to count notifications for
 * @returns Promise<number> - Total number of notifications for the user
 */
export async function getUserNotificationCount(
  userId: number
): Promise<number> {
  try {
    const db = getDatabase();

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(eq(notifications.user_id, userId));

    return countResult[0]?.count || 0;
  } catch (error) {
    console.error('Error counting user notifications:', error);
    throw new Error(
      `Failed to count user notifications: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get recent notifications (last N hours)
 * @param hours - Number of hours to look back (default: 24)
 * @param limit - Maximum number of notifications to return (default: 100)
 * @returns Promise<NotificationSelect[]> - Array of recent notification records
 */
export async function getRecentNotifications(
  hours: number = 24,
  limit: number = 100
): Promise<NotificationSelect[]> {
  try {
    const db = getDatabase();

    const recentNotifications = await db
      .select()
      .from(notifications)
      .where(sql.raw(`sent_at > datetime('now', '-${hours} hours')`))
      .orderBy(desc(notifications.sent_at))
      .limit(limit);

    return recentNotifications;
  } catch (error) {
    console.error('Error fetching recent notifications:', error);
    throw new Error(
      `Failed to fetch recent notifications: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Update notification email status
 * @param notificationId - The notification ID to update
 * @param emailStatus - The new email status ('sent', 'failed', 'bounced', etc.)
 * @returns Promise<NotificationSelect | null> - Updated notification record or null if not found
 */
export async function updateNotificationEmailStatus(
  notificationId: number,
  emailStatus: string
): Promise<NotificationSelect | null> {
  try {
    const db = getDatabase();

    const updatedNotifications = await db
      .update(notifications)
      .set({ email_status: emailStatus })
      .where(eq(notifications.id, notificationId))
      .returning();

    return updatedNotifications[0] || null;
  } catch (error) {
    console.error('Error updating notification email status:', error);
    throw new Error(
      `Failed to update notification email status: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ================================
// Bulk Operations
// ================================

/**
 * Record multiple notifications in a single transaction
 * @param notificationsData - Array of notification data to insert
 * @returns Promise<NotificationSelect[]> - Array of created notification records
 */
export async function recordBulkNotifications(
  notificationsData: NotificationInsert[]
): Promise<NotificationSelect[]> {
  try {
    const db = getDatabase();

    if (notificationsData.length === 0) {
      return [];
    }

    const insertedNotifications = await db
      .insert(notifications)
      .values(notificationsData)
      .returning();

    return insertedNotifications;
  } catch (error) {
    console.error('Error recording bulk notifications:', error);
    throw new Error(
      `Failed to record bulk notifications: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Clean up old notifications (for data retention)
 * @param daysToKeep - Number of days of notifications to keep (default: 30)
 * @returns Promise<number> - Number of notifications deleted
 */
export async function cleanupOldNotifications(
  daysToKeep: number = 30
): Promise<number> {
  try {
    const db = getDatabase();

    const deletedNotifications = await db
      .delete(notifications)
      .where(sql.raw(`sent_at < datetime('now', '-${daysToKeep} days')`))
      .returning({ id: notifications.id });

    const deletedCount = deletedNotifications.length;

    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} old notifications`);
    }

    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up old notifications:', error);
    throw new Error(
      `Failed to cleanup old notifications: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ================================
// Utility Functions
// ================================

/**
 * Check and record notification if not already sent (atomic operation)
 * @param userId - The user ID to notify
 * @param alertId - The alert ID that triggered the notification
 * @param listingId - The listing ID that matched
 * @param notificationType - The type of notification (default: 'new_listing')
 * @param emailStatus - The email delivery status (default: 'sent')
 * @returns Promise<{ wasAlreadyNotified: boolean, notification: NotificationSelect }>
 */
export async function checkAndRecordNotification(
  userId: number,
  alertId: number,
  listingId: number,
  notificationType: string = 'new_listing',
  emailStatus: string = 'sent'
): Promise<{ wasAlreadyNotified: boolean; notification: NotificationSelect }> {
  try {
    // Check if notification already exists
    const alreadyNotified = await hasUserBeenNotified(
      userId,
      alertId,
      listingId
    );

    if (alreadyNotified) {
      // Get existing notification
      const db = getDatabase();
      const existingNotification = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.user_id, userId),
            eq(notifications.alert_id, alertId),
            eq(notifications.listing_id, listingId)
          )
        )
        .limit(1);

      return {
        wasAlreadyNotified: true,
        notification: existingNotification[0],
      };
    }

    // Record new notification
    const newNotification = await recordNotification(
      userId,
      alertId,
      listingId,
      notificationType,
      emailStatus
    );

    return {
      wasAlreadyNotified: false,
      notification: newNotification,
    };
  } catch (error) {
    console.error('Error in checkAndRecordNotification:', error);
    throw new Error(
      `Failed to check and record notification: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ================================
// Type Exports
// ================================

export type { NotificationSelect, NotificationInsert };
