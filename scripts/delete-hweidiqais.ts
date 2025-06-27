#!/usr/bin/env npx tsx

import { config } from 'dotenv';
config({ path: '.env.local' });

import { getDatabase } from '../src/lib/database/index';
import { users, alerts, notifications } from '../src/lib/database/schema';
import { eq } from 'drizzle-orm';

async function deleteUser() {
  const db = getDatabase();
  const email = 'hweidiqais@gmail.com';

  try {
    // Find the user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user.length === 0) {
      console.log(`❌ User ${email} not found`);
      return;
    }

    const userId = user[0].id;
    console.log(`Found user ${email} with ID: ${userId}`);

    // Delete notifications
    const deletedNotifications = await db
      .delete(notifications)
      .where(eq(notifications.user_id, userId))
      .returning();
    console.log(`✅ Deleted ${deletedNotifications.length} notifications`);

    // Delete alerts
    const deletedAlerts = await db
      .delete(alerts)
      .where(eq(alerts.user_id, userId))
      .returning();
    console.log(`✅ Deleted ${deletedAlerts.length} alerts`);

    // Delete user
    const deletedUser = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning();
    console.log(`✅ Deleted user ${deletedUser[0].email}`);

    console.log('\n✅ Successfully removed all data for', email);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

deleteUser();
