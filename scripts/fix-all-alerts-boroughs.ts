#!/usr/bin/env npx tsx

import { config } from 'dotenv';
config({ path: '.env.local' });

import { getDatabase } from '../src/lib/database/index';
import { alerts } from '../src/lib/database/schema';
import { eq } from 'drizzle-orm';

// Define neighborhood mappings
const queensNeighborhoods = [
  'Astoria',
  'Long Island City',
  'Sunnyside',
  'Woodside',
  'Jackson Heights',
  'Elmhurst',
  'Corona',
  'Forest Hills',
  'Rego Park',
  'Kew Gardens',
  'Flushing',
  'Whitestone',
  'College Point',
  'Bayside',
  'Douglaston',
  'Little Neck',
  'Jamaica',
  'Hollis',
  'Queens Village',
  'Cambria Heights',
  'Laurelton',
  'Rosedale',
  'Springfield Gardens',
  'Howard Beach',
  'Ozone Park',
  'Richmond Hill',
  'Woodhaven',
  'Ridgewood',
  'Glendale',
  'Middle Village',
  'Maspeth',
  'Fresh Meadows',
  'Briarwood',
  'Bellerose',
  'Kew Gardens Hills',
  'Pomonok',
  'Electchester',
  'Glen Oaks',
  'Floral Park',
  'New Hyde Park',
  'Far Rockaway',
  'Rockaway Beach',
  'Rockaway Park',
  'Breezy Point',
  'Belle Harbor',
  'Neponsit',
  'Arverne',
  'Edgemere',
];

const statenIslandNeighborhoods = [
  'St. George',
  'Tompkinsville',
  'Stapleton',
  'Clifton',
  'Concord',
  'Fort Wadsworth',
  'Rosebank',
  'Shore Acres',
  'Arrochar',
  'Grasmere',
  'South Beach',
  'Old Town',
  'Dongan Hills',
  'Grant City',
  'New Dorp',
  'Oakwood',
  'Midland Beach',
  'Bay Terrace',
  'Great Kills',
  'Eltingville',
  'Annadale',
  'Arden Heights',
  'Huguenot',
  "Prince's Bay",
  'Pleasant Plains',
  'Richmond Valley',
  'Tottenville',
  'Charleston',
  'Rossville',
  'Woodrow',
  'Travis',
  'Egbertville',
  'Heartland Village',
  'Chelsea',
  'Bloomfield',
  'Bulls Head',
  'New Brighton',
  'West Brighton',
  'Port Richmond',
  'Mariners Harbor',
  'Elm Park',
  'Graniteville',
  'Port Ivory',
  'Howland Hook',
  'Arlington',
  'Westerleigh',
  'Castleton Corners',
  'New Springville',
  'Willowbrook',
  'Lighthouse Hill',
  'Todt Hill',
  'Emerson Hill',
  'Grymes Hill',
  'Silver Lake',
];

async function fixAllAlerts() {
  const db = getDatabase();

  try {
    // Get all active alerts
    const allAlerts = await db
      .select()
      .from(alerts)
      .where(eq(alerts.is_active, true));

    console.log(`Found ${allAlerts.length} active alerts to check`);

    let updatedCount = 0;

    for (const alert of allAlerts) {
      const currentNeighborhoods = JSON.parse(alert.neighborhoods || '[]');
      const updatedNeighborhoods = [...currentNeighborhoods];
      let hasChanges = false;

      // Check for Queens neighborhoods
      if (
        currentNeighborhoods.some((n) => queensNeighborhoods.includes(n)) &&
        !currentNeighborhoods.includes('Queens')
      ) {
        updatedNeighborhoods.push('Queens');
        hasChanges = true;
      }

      // Check for Staten Island neighborhoods
      if (
        currentNeighborhoods.some((n) =>
          statenIslandNeighborhoods.includes(n)
        ) &&
        !currentNeighborhoods.includes('Staten Island')
      ) {
        updatedNeighborhoods.push('Staten Island');
        hasChanges = true;
      }

      if (hasChanges) {
        await db
          .update(alerts)
          .set({
            neighborhoods: JSON.stringify(updatedNeighborhoods),
          })
          .where(eq(alerts.id, alert.id));

        updatedCount++;
        console.log(
          `✅ Updated alert ${alert.id} - added missing borough names`
        );
      }
    }

    console.log(
      `\n📊 Summary: Updated ${updatedCount} alerts with missing borough names`
    );
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

fixAllAlerts();
