/**
 * Test script to verify coordinate data flow from alert API to listings API
 */

import { getDatabase } from '../src/lib/database';
import { alerts } from '../src/lib/database/schema';
import { eq } from 'drizzle-orm';

async function testCoordinateFlow() {
  console.log('Testing coordinate data flow...\n');

  const db = getDatabase();

  // Get alert 24 specifically
  const alertId = 24;
  const [alertWithCoords] = await db
    .select()
    .from(alerts)
    .where(eq(alerts.id, alertId))
    .limit(1);

  if (!alertWithCoords) {
    console.log(`Alert ${alertId} not found`);
    process.exit(0);
  }

  console.log(`Found alert ${alertWithCoords.id} with coordinates:`);
  console.log(`  Destination: ${alertWithCoords.commute_destination}`);
  console.log(`  Lat: ${alertWithCoords.commute_destination_lat}`);
  console.log(`  Lng: ${alertWithCoords.commute_destination_lng}`);
  console.log();

  // Test alert API endpoint
  console.log('Testing /api/alerts/{id} endpoint...');
  const alertResponse = await fetch(
    `http://localhost:3000/api/alerts/${alertWithCoords.id}`
  );
  const alertData = await alertResponse.json();

  if (alertData.success) {
    console.log('✅ Alert API response includes:');
    console.log(
      `  commute_destination_lat: ${alertData.alert.commute_destination_lat}`
    );
    console.log(
      `  commute_destination_lng: ${alertData.alert.commute_destination_lng}`
    );
  } else {
    console.log('❌ Alert API failed:', alertData.message);
  }
  console.log();

  // Import the conversion function
  const { convertAlertToListingsParams } = await import(
    '../src/lib/utils/dataConverters'
  );

  // Test conversion
  console.log('Testing convertAlertToListingsParams...');
  const params = convertAlertToListingsParams({
    id: alertWithCoords.id.toString(),
    user_id: alertWithCoords.user_id,
    email: alertWithCoords.email || '',
    neighborhoods: JSON.parse(alertWithCoords.neighborhoods),
    min_price: alertWithCoords.min_price,
    max_price: alertWithCoords.max_price,
    bedrooms: alertWithCoords.bedrooms,
    pet_friendly: alertWithCoords.pet_friendly,
    max_commute_minutes: alertWithCoords.max_commute_minutes,
    commute_destination: alertWithCoords.commute_destination,
    commute_destination_lat: alertWithCoords.commute_destination_lat,
    commute_destination_lng: alertWithCoords.commute_destination_lng,
    is_active: alertWithCoords.is_active,
    created_at: alertWithCoords.created_at.toString(),
  });

  console.log('Converted parameters:');
  console.log(`  work_lat: ${params.work_lat || 'NOT INCLUDED'}`);
  console.log(`  work_lng: ${params.work_lng || 'NOT INCLUDED'}`);
  console.log();

  // Test listings API
  console.log('Testing /api/listings endpoint...');
  const queryString = new URLSearchParams(params).toString();
  console.log(
    `Query string includes work coordinates: ${queryString.includes('work_lat')}`
  );

  process.exit(0);
}

testCoordinateFlow().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
