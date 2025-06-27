/**
 * Tests for Notifier Job
 * Purpose: Test notification processing logic and email batching
 * Coverage: Job execution, batch processing, error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  runNotifierJob,
  getPendingNotificationStats,
} from '../../../src/lib/jobs/notifier-job';
import * as emailService from '../../../src/lib/notifications/email-service';
import * as notificationQueries from '../../../src/lib/database/queries/notifications';

// Mock the dependencies
vi.mock('../../../src/lib/notifications/email-service');
vi.mock('../../../src/lib/database/queries/notifications');
vi.mock('../../../src/lib/database/index');

// Mock database data
const mockDatabase = {
  select: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  innerJoin: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  get: vi.fn(),
  all: vi.fn(),
};

// Mock the getDatabase function
vi.mock('../../../src/lib/database/index', () => ({
  getDatabase: () => mockDatabase,
}));

// Mock schema
vi.mock('../../../src/lib/database/schema', () => ({
  schema: {
    notifications: {
      id: 'id',
      user_id: 'user_id',
      listing_id: 'listing_id',
      alert_id: 'alert_id',
      email_status: 'email_status',
      sent_at: 'sent_at',
    },
    listings: {
      id: 'id',
      title: 'title',
      price: 'price',
      is_active: 'is_active',
    },
    users: {
      id: 'id',
      email: 'email',
      is_active: 'is_active',
    },
    alerts: {
      id: 'id',
      is_active: 'is_active',
    },
  },
}));

describe('Notifier Job', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock responses
    mockDatabase.select.mockReturnThis();
    mockDatabase.from.mockReturnThis();
    mockDatabase.where.mockReturnThis();
    mockDatabase.innerJoin.mockReturnThis();
    mockDatabase.orderBy.mockReturnThis();
    mockDatabase.limit.mockReturnThis();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('runNotifierJob', () => {
    it('should handle empty pending notifications gracefully', async () => {
      // Mock empty results
      mockDatabase.limit.mockResolvedValue([]);

      const result = await runNotifierJob();

      expect(result.success).toBe(true);
      expect(result.notificationsProcessed).toBe(0);
      expect(result.emailsSent).toBe(0);
      expect(result.usersNotified).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should process notifications and send batch emails', async () => {
      // Mock pending notifications
      const mockNotifications = [
        {
          notification: {
            id: 1,
            user_id: 1,
            listing_id: 1,
            alert_id: 1,
            email_status: 'pending',
          },
          listing: {
            id: 1,
            title: 'Test Apartment 1',
            price: 2000,
            bedrooms: 1,
          },
          userEmail: 'test@example.com',
          alertId: 1,
        },
        {
          notification: {
            id: 2,
            user_id: 1,
            listing_id: 2,
            alert_id: 1,
            email_status: 'pending',
          },
          listing: {
            id: 2,
            title: 'Test Apartment 2',
            price: 2500,
            bedrooms: 2,
          },
          userEmail: 'test@example.com',
          alertId: 1,
        },
        {
          notification: {
            id: 3,
            user_id: 2,
            listing_id: 3,
            alert_id: 2,
            email_status: 'pending',
          },
          listing: {
            id: 3,
            title: 'Test Apartment 3',
            price: 1800,
            bedrooms: 1,
          },
          userEmail: 'test2@example.com',
          alertId: 2,
        },
      ];
      mockDatabase.limit.mockResolvedValue(mockNotifications);

      // Mock successful email sending
      const mockEmailService = vi.mocked(emailService);
      mockEmailService.sendListingNotification.mockResolvedValue({
        success: true,
        messageId: 'test-message-id',
      });

      // Mock notification updates
      const mockNotificationQueries = vi.mocked(notificationQueries);
      mockNotificationQueries.updateNotificationEmailStatus.mockResolvedValue({
        id: 1,
        user_id: 1,
        listing_id: 1,
        alert_id: 1,
        notification_type: 'new_listing',
        email_status: 'sent',
        sent_at: new Date().toISOString(),
      });

      const result = await runNotifierJob();

      expect(result.success).toBe(true);
      expect(result.notificationsProcessed).toBe(3);
      expect(result.emailsSent).toBe(2); // 2 users
      expect(result.usersNotified).toBe(2);
      expect(result.errors).toHaveLength(0);

      // Verify email service was called correctly
      expect(mockEmailService.sendListingNotification).toHaveBeenCalledTimes(2);
      expect(mockEmailService.sendListingNotification).toHaveBeenCalledWith(
        'test@example.com',
        expect.arrayContaining([
          expect.objectContaining({ title: 'Test Apartment 1' }),
          expect.objectContaining({ title: 'Test Apartment 2' }),
        ])
      );
      expect(mockEmailService.sendListingNotification).toHaveBeenCalledWith(
        'test2@example.com',
        expect.arrayContaining([
          expect.objectContaining({ title: 'Test Apartment 3' }),
        ])
      );
    });

    it('should handle email failures gracefully', async () => {
      // Mock pending notifications
      const mockNotifications = [
        {
          notification: {
            id: 1,
            user_id: 1,
            listing_id: 1,
            alert_id: 1,
            email_status: 'pending',
          },
          listing: { id: 1, title: 'Test Apartment', price: 2000, bedrooms: 1 },
          userEmail: 'test@example.com',
          alertId: 1,
        },
      ];
      mockDatabase.limit.mockResolvedValue(mockNotifications);

      // Mock failed email sending
      const mockEmailService = vi.mocked(emailService);
      mockEmailService.sendListingNotification.mockResolvedValue({
        success: false,
        error: 'SMTP connection failed',
      });

      // Mock notification updates
      const mockNotificationQueries = vi.mocked(notificationQueries);
      mockNotificationQueries.updateNotificationEmailStatus.mockResolvedValue({
        id: 1,
        user_id: 1,
        listing_id: 1,
        alert_id: 1,
        notification_type: 'new_listing',
        email_status: 'failed',
        sent_at: new Date().toISOString(),
      });

      const result = await runNotifierJob();

      expect(result.success).toBe(false);
      expect(result.notificationsProcessed).toBe(1);
      expect(result.emailsSent).toBe(0);
      expect(result.emailsFailed).toBe(1);
      expect(result.usersNotified).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('SMTP connection failed');
    });

    it('should skip email sending in test mode', async () => {
      // Mock pending notifications
      const mockNotifications = [
        {
          notification: {
            id: 1,
            user_id: 1,
            listing_id: 1,
            alert_id: 1,
            email_status: 'pending',
          },
          listing: { id: 1, title: 'Test Apartment', price: 2000, bedrooms: 1 },
          userEmail: 'test@example.com',
          alertId: 1,
        },
      ];
      mockDatabase.limit.mockResolvedValue(mockNotifications);

      // Mock notification updates
      const mockNotificationQueries = vi.mocked(notificationQueries);
      mockNotificationQueries.updateNotificationEmailStatus.mockResolvedValue({
        id: 1,
        user_id: 1,
        listing_id: 1,
        alert_id: 1,
        notification_type: 'new_listing',
        email_status: 'sent',
        sent_at: new Date().toISOString(),
      });

      const result = await runNotifierJob({ skipEmailSending: true });

      expect(result.success).toBe(true);
      expect(result.notificationsProcessed).toBe(1);
      expect(result.emailsSent).toBe(1);
      expect(result.usersNotified).toBe(1);
      expect(result.errors).toHaveLength(0);

      // Verify email service was NOT called
      const mockEmailService = vi.mocked(emailService);
      expect(mockEmailService.sendListingNotification).not.toHaveBeenCalled();
    });

    it('should respect maxNotifications limit', async () => {
      // Mock more notifications than the limit
      const mockNotifications = Array.from({ length: 100 }, (_, i) => ({
        notification: {
          id: i + 1,
          user_id: 1,
          listing_id: i + 1,
          alert_id: 1,
          email_status: 'pending',
        },
        listing: {
          id: i + 1,
          title: `Test Apartment ${i + 1}`,
          price: 2000,
          bedrooms: 1,
        },
        userEmail: 'test@example.com',
        alertId: 1,
      }));
      mockDatabase.limit.mockResolvedValue(mockNotifications.slice(0, 50)); // Limit applied

      const result = await runNotifierJob({ maxNotifications: 50 });

      expect(result.notificationsProcessed).toBe(50);
      expect(mockDatabase.limit).toHaveBeenCalledWith(50);
    });
  });

  describe('getPendingNotificationStats', () => {
    it('should return correct pending notification statistics', async () => {
      // Mock statistics query
      mockDatabase.get.mockResolvedValue({
        totalPending: 10,
        usersPending: 3,
        oldestPending: '2024-01-01T10:00:00Z',
        newestPending: '2024-01-01T12:00:00Z',
      });

      const stats = await getPendingNotificationStats();

      expect(stats.totalPending).toBe(10);
      expect(stats.usersPending).toBe(3);
      expect(stats.oldestPending).toEqual(new Date('2024-01-01T10:00:00Z'));
      expect(stats.newestPending).toEqual(new Date('2024-01-01T12:00:00Z'));
    });

    it('should handle empty statistics gracefully', async () => {
      // Mock empty statistics
      mockDatabase.get.mockResolvedValue({
        totalPending: 0,
        usersPending: 0,
        oldestPending: null,
        newestPending: null,
      });

      const stats = await getPendingNotificationStats();

      expect(stats.totalPending).toBe(0);
      expect(stats.usersPending).toBe(0);
      expect(stats.oldestPending).toBeNull();
      expect(stats.newestPending).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockDatabase.get.mockRejectedValue(
        new Error('Database connection failed')
      );

      const stats = await getPendingNotificationStats();

      expect(stats.totalPending).toBe(0);
      expect(stats.usersPending).toBe(0);
      expect(stats.oldestPending).toBeNull();
      expect(stats.newestPending).toBeNull();
    });
  });
});
