/**
 * Test Script: Notification Tracking Functions
 * Purpose: Test the database notification tracking functions to ensure they work correctly
 * Status: Manual testing script for development
 * Usage: npx tsx scripts/manual/test-notifications.ts
 */

import {
  hasUserBeenNotified,
  recordNotification,
  getUserNotifications,
  getNotificationsByAlert,
  getNotificationsByListing,
  getUserNotificationCount,
  getRecentNotifications,
  updateNotificationEmailStatus,
  recordBulkNotifications,
  cleanupOldNotifications,
} from '../../src/lib/database/queries/notifications';
import { getDatabase } from '../../src/lib/database';

async function testNotificationFunctions() {
  console.log('🧪 Testing Notification Tracking Functions\n');

  try {
    // Initialize database connection
    const db = getDatabase();
    console.log('✅ Database connection established');

    // Test data
    const testUserId = 1;
    const testAlertId = 1;
    const testListingId = 1;

    console.log('\n1. Testing hasUserBeenNotified (should be false initially)');
    const hasNotification1 = await hasUserBeenNotified(
      testUserId,
      testAlertId,
      testListingId
    );
    console.log('   Result:', hasNotification1);

    console.log('\n2. Testing recordNotification');
    const newNotification = await recordNotification(
      testUserId,
      testAlertId,
      testListingId,
      'new_listing',
      'sent'
    );
    console.log('   Created notification ID:', newNotification.id);
    console.log('   Notification details:', {
      user_id: newNotification.user_id,
      alert_id: newNotification.alert_id,
      listing_id: newNotification.listing_id,
      notification_type: newNotification.notification_type,
      email_status: newNotification.email_status,
    });

    console.log('\n3. Testing hasUserBeenNotified (should be true now)');
    const hasNotification2 = await hasUserBeenNotified(
      testUserId,
      testAlertId,
      testListingId
    );
    console.log('   Result:', hasNotification2);

    console.log('\n4. Testing duplicate notification prevention');
    try {
      const duplicateNotification = await recordNotification(
        testUserId,
        testAlertId,
        testListingId,
        'new_listing',
        'sent'
      );
      console.log(
        '   Duplicate handling successful, returned existing notification ID:',
        duplicateNotification.id
      );
    } catch (error) {
      console.log(
        '   Duplicate prevention working - error caught:',
        error instanceof Error ? error.message : error
      );
    }

    console.log('\n5. Testing getUserNotifications');
    const userNotifications = await getUserNotifications(testUserId, 10);
    console.log('   User notifications count:', userNotifications.length);
    if (userNotifications.length > 0) {
      console.log('   First notification:', {
        id: userNotifications[0].id,
        alert_id: userNotifications[0].alert_id,
        listing_id: userNotifications[0].listing_id,
        notification_type: userNotifications[0].notification_type,
      });
    }

    console.log('\n6. Testing getNotificationsByAlert');
    const alertNotifications = await getNotificationsByAlert(testAlertId);
    console.log('   Alert notifications count:', alertNotifications.length);

    console.log('\n7. Testing getNotificationsByListing');
    const listingNotifications = await getNotificationsByListing(testListingId);
    console.log('   Listing notifications count:', listingNotifications.length);

    console.log('\n8. Testing getUserNotificationCount');
    const notificationCount = await getUserNotificationCount(testUserId);
    console.log('   Total notifications for user:', notificationCount);

    console.log('\n9. Testing getRecentNotifications');
    const recentNotifications = await getRecentNotifications(24, 10);
    console.log(
      '   Recent notifications (last 24h):',
      recentNotifications.length
    );

    console.log('\n10. Testing updateNotificationEmailStatus');
    if (newNotification.id) {
      const updatedNotification = await updateNotificationEmailStatus(
        newNotification.id,
        'delivered'
      );
      console.log(
        '   Updated notification status:',
        updatedNotification?.email_status
      );
    }

    console.log('\n11. Testing recordBulkNotifications');
    const bulkNotifications = [
      {
        user_id: testUserId,
        alert_id: testAlertId,
        listing_id: 2, // Different listing
        notification_type: 'new_listing',
        email_status: 'sent',
      },
      {
        user_id: testUserId,
        alert_id: testAlertId,
        listing_id: 3, // Different listing
        notification_type: 'new_listing',
        email_status: 'sent',
      },
    ];

    const bulkResult = await recordBulkNotifications(bulkNotifications);
    console.log('   Bulk notifications created:', bulkResult.length);

    console.log('\n12. Testing final counts');
    const finalCount = await getUserNotificationCount(testUserId);
    console.log('   Final notification count for user:', finalCount);

    console.log('\n✅ All notification function tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the tests
testNotificationFunctions()
  .then(() => {
    console.log('\n🎉 Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test script failed:', error);
    process.exit(1);
  });
