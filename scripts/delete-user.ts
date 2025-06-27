#!/usr/bin/env npx tsx

import { config } from 'dotenv';
config({ path: '.env.local' });

import { getDatabase } from '../src/lib/database/index';
import { users, alerts, notifications } from '../src/lib/database/schema';
import { eq } from 'drizzle-orm';

async function deleteUser() {
  const db = getDatabase();
  const userEmail = 'hweidiqais@gmail.com';

  try {
    // Find the user
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);

    if (userResults.length === 0) {
      console.log(`❌ User ${userEmail} not found`);
      return;
    }

    const user = userResults[0];
    console.log(`Found user: ${userEmail} (ID: ${user.id})`);

    // Count related data
    const alertCount = await db
      .select()
      .from(alerts)
      .where(eq(alerts.user_id, user.id));
    const notificationCount = await db
      .select()
      .from(notifications)
      .where(eq(notifications.user_id, user.id));

    console.log(`\n📊 User data:`);
    console.log(`   - Alerts: ${alertCount.length}`);
    console.log(`   - Notifications: ${notificationCount.length}`);

    // Delete in order (due to foreign key constraints)
    console.log(`\n🗑️  Deleting user data...`);

    // 1. Delete notifications
    await db.delete(notifications).where(eq(notifications.user_id, user.id));
    console.log(`   ✓ Deleted ${notificationCount.length} notifications`);

    // 2. Delete alerts
    await db.delete(alerts).where(eq(alerts.user_id, user.id));
    console.log(`   ✓ Deleted ${alertCount.length} alerts`);

    // 3. Delete user
    await db.delete(users).where(eq(users.id, user.id));
    console.log(`   ✓ Deleted user ${userEmail}`);

    console.log(
      `\n✅ Successfully deleted user ${userEmail} and all related data`
    );
  } catch (error) {
    console.error('❌ Error deleting user:', error);
  } finally {
    process.exit(0);
  }
}

deleteUser();
