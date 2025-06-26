/**
 * Notification Usage Example
 * Purpose: Demonstrate how to use the notification tracking functions in practice
 * Status: Example script for developers
 * Usage: npx tsx scripts/manual/notification-usage-example.ts
 */

import {
  hasUserBeenNotified,
  recordNotification,
  checkAndRecordNotification,
  getUserNotifications,
  updateNotificationEmailStatus,
} from '../../src/lib/database/queries/notifications';

/**
 * Example: Basic notification flow for apartment listing alerts
 * This simulates the flow when a new apartment listing matches a user's alert
 */
async function demonstrateBasicNotificationFlow() {
  console.log('📧 Basic Notification Flow Example\n');

  // Example scenario: User 1 has Alert 1, and Listing 2 matches their criteria
  const userId = 1;
  const alertId = 1;
  const listingId = 2;

  try {
    // Step 1: Check if user has already been notified about this listing
    console.log('1. Checking if user has been notified...');
    const alreadyNotified = await hasUserBeenNotified(
      userId,
      alertId,
      listingId
    );
    console.log(`   Already notified: ${alreadyNotified}`);

    if (!alreadyNotified) {
      console.log('2. User not yet notified - recording notification...');

      // Step 2: Record the notification (this would happen BEFORE sending email)
      const notification = await recordNotification(
        userId,
        alertId,
        listingId,
        'new_listing',
        'pending' // Start with pending status
      );

      console.log(`   Notification recorded with ID: ${notification.id}`);

      // Step 3: Send email (simulated)
      console.log('3. Sending email notification...');
      const emailSent = await simulateEmailSending(userId, listingId);

      // Step 4: Update notification status based on email result
      if (emailSent) {
        await updateNotificationEmailStatus(notification.id!, 'sent');
        console.log('   Email sent successfully - status updated to "sent"');
      } else {
        await updateNotificationEmailStatus(notification.id!, 'failed');
        console.log('   Email failed - status updated to "failed"');
      }
    } else {
      console.log('2. User already notified - skipping duplicate notification');
    }

    // Step 5: Show user's notification history
    console.log('\n4. Current notification history:');
    const userNotifications = await getUserNotifications(userId, 5);
    userNotifications.forEach((notif, index) => {
      console.log(
        `   ${index + 1}. Alert ${notif.alert_id} → Listing ${notif.listing_id} (${notif.email_status})`
      );
    });
  } catch (error) {
    console.error('❌ Error in notification flow:', error);
  }
}

/**
 * Example: Using the convenient checkAndRecordNotification function
 * This shows the recommended approach for most use cases
 */
async function demonstrateConvenientFlow() {
  console.log('\n🚀 Convenient Notification Flow Example\n');

  const userId = 1;
  const alertId = 1;
  const listingId = 3;

  try {
    console.log('1. Using checkAndRecordNotification for atomic operation...');

    // This function combines the check and record steps into one atomic operation
    const result = await checkAndRecordNotification(
      userId,
      alertId,
      listingId,
      'new_listing',
      'pending'
    );

    if (result.wasAlreadyNotified) {
      console.log(
        `   User already notified (notification ID: ${result.notification.id})`
      );
    } else {
      console.log(
        `   New notification recorded (ID: ${result.notification.id})`
      );

      // Simulate email sending
      console.log('2. Sending email...');
      const emailSent = await simulateEmailSending(userId, listingId);

      // Update status
      const finalStatus = emailSent ? 'sent' : 'failed';
      await updateNotificationEmailStatus(result.notification.id!, finalStatus);
      console.log(`   Email status updated to: ${finalStatus}`);
    }
  } catch (error) {
    console.error('❌ Error in convenient flow:', error);
  }
}

/**
 * Example: Bulk notification processing
 * This shows how to handle multiple listings that match a user's alert
 */
async function demonstrateBulkNotificationFlow() {
  console.log('\n📋 Bulk Notification Flow Example\n');

  const userId = 1;
  const alertId = 1;
  const newListings = [2, 3, 4]; // Multiple new listings (using existing listing IDs)

  try {
    console.log(
      `Processing ${newListings.length} new listings for user ${userId}...`
    );

    const notificationsToSend = [];

    for (const listingId of newListings) {
      console.log(`\n  Checking listing ${listingId}:`);

      const result = await checkAndRecordNotification(
        userId,
        alertId,
        listingId,
        'new_listing',
        'pending'
      );

      if (result.wasAlreadyNotified) {
        console.log(`    ⏭️ Already notified (ID: ${result.notification.id})`);
      } else {
        console.log(
          `    ✅ New notification recorded (ID: ${result.notification.id})`
        );
        notificationsToSend.push({
          notificationId: result.notification.id!,
          listingId: listingId,
        });
      }
    }

    if (notificationsToSend.length > 0) {
      console.log(
        `\n  Sending bulk email with ${notificationsToSend.length} listings...`
      );

      // Simulate sending one email with multiple listings
      const emailSent = await simulateBulkEmailSending(
        userId,
        notificationsToSend.map((n) => n.listingId)
      );

      // Update all notification statuses
      const finalStatus = emailSent ? 'sent' : 'failed';
      for (const notif of notificationsToSend) {
        await updateNotificationEmailStatus(notif.notificationId, finalStatus);
      }

      console.log(`  All notification statuses updated to: ${finalStatus}`);
    } else {
      console.log('\n  No new notifications to send');
    }
  } catch (error) {
    console.error('❌ Error in bulk flow:', error);
  }
}

/**
 * Simulate email sending (replace with actual email service)
 */
async function simulateEmailSending(
  userId: number,
  listingId: number
): Promise<boolean> {
  // Simulate email sending delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Simulate 90% success rate
  return Math.random() > 0.1;
}

/**
 * Simulate bulk email sending (replace with actual email service)
 */
async function simulateBulkEmailSending(
  userId: number,
  listingIds: number[]
): Promise<boolean> {
  // Simulate email sending delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Simulate 90% success rate
  return Math.random() > 0.1;
}

/**
 * Run all examples
 */
async function runExamples() {
  console.log('🎯 Notification Tracking Usage Examples\n');
  console.log('='.repeat(50));

  try {
    await demonstrateBasicNotificationFlow();
    console.log('\n' + '='.repeat(50));

    await demonstrateConvenientFlow();
    console.log('\n' + '='.repeat(50));

    await demonstrateBulkNotificationFlow();
    console.log('\n' + '='.repeat(50));

    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('\n💥 Example execution failed:', error);
  }
}

// Run the examples
runExamples()
  .then(() => {
    console.log('\n🎉 Usage examples completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Usage examples failed:', error);
    process.exit(1);
  });
