#!/usr/bin/env npx tsx

import { config } from 'dotenv';
config({ path: '.env.local' });

import { getDatabase } from '../src/lib/database/index';
import { alerts } from '../src/lib/database/schema';
import { eq } from 'drizzle-orm';

async function fixAlert() {
  const db = getDatabase();

  try {
    // Get the current alert
    const alertResult = await db.select().from(alerts).where(eq(alerts.id, 21));

    if (alertResult.length === 0) {
      console.log('❌ Alert ID 21 not found');
      return;
    }

    const alert = alertResult[0];
    const currentNeighborhoods = JSON.parse(alert.neighborhoods || '[]');

    console.log('Current neighborhoods count:', currentNeighborhoods.length);

    // Add generic borough names if not already present
    const boroughsToAdd = ['Manhattan', 'Brooklyn', 'Bronx'];
    const updatedNeighborhoods = [
      ...new Set([...currentNeighborhoods, ...boroughsToAdd]),
    ];

    console.log('Updated neighborhoods count:', updatedNeighborhoods.length);
    console.log('Added:', boroughsToAdd);

    // Update the alert
    await db
      .update(alerts)
      .set({
        neighborhoods: JSON.stringify(updatedNeighborhoods),
      })
      .where(eq(alerts.id, 21));

    console.log('✅ Alert updated successfully');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

fixAlert();
