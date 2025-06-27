#!/usr/bin/env npx tsx

import { config } from 'dotenv';
config({ path: '.env.local' });

import { getDatabase } from '../src/lib/database/index';
import { alerts } from '../src/lib/database/schema';
import { eq } from 'drizzle-orm';

async function fixAlert() {
  const db = getDatabase();

  try {
    // Get current neighborhoods for alert 16
    const alertResults = await db
      .select()
      .from(alerts)
      .where(eq(alerts.id, 16))
      .limit(1);

    if (alertResults.length === 0) {
      console.log('❌ Alert 16 not found');
      return;
    }

    const alert = alertResults[0];
    const currentNeighborhoods = JSON.parse(alert.neighborhoods);

    // Add generic borough names if not already present
    const boroughsToAdd = [
      'Manhattan',
      'Brooklyn',
      'Queens',
      'Bronx',
      'Staten Island',
    ];
    const updatedNeighborhoods = [
      ...new Set([...currentNeighborhoods, ...boroughsToAdd]),
    ];

    // Update the alert
    await db
      .update(alerts)
      .set({ neighborhoods: JSON.stringify(updatedNeighborhoods) })
      .where(eq(alerts.id, 16));

    console.log('✅ Updated alert 16 neighborhoods');
    console.log('Added generic boroughs:', boroughsToAdd);
    console.log('Total neighborhoods:', updatedNeighborhoods.length);
    console.log(
      '\n🎯 Your alert will now match listings that only specify the borough!'
    );
    console.log('Example: A listing in "Brooklyn" will now match your alert.');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

fixAlert();
