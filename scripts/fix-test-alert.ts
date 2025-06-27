/**
 * Fix test alert to use valid neighborhoods
 */

import { config } from 'dotenv';
import { getDatabase } from '../src/lib/database';
import { alerts } from '../src/lib/database/schema';
import { eq } from 'drizzle-orm';

// Load environment variables
config({ path: '.env.local' });

async function fixTestAlert() {
  console.log('🔧 Fixing test alert neighborhoods...');

  const db = getDatabase();

  try {
    // Update alert 1 to use valid neighborhoods
    const updated = await db
      .update(alerts)
      .set({
        neighborhoods: JSON.stringify([
          'Williamsburg',
          'Park Slope',
          'Lower East Side',
        ]),
        updated_at: new Date().toISOString(),
      })
      .where(eq(alerts.id, 1))
      .returning();

    if (updated.length > 0) {
      console.log('✅ Updated alert 1 with valid neighborhoods:');
      console.log('   📍 Williamsburg, Park Slope, Lower East Side');
      console.log('\n🌐 Now test the frontend at:');
      console.log('   http://localhost:3000/listings?alertId=1');
    } else {
      console.log('❌ No alert found to update');
    }
  } catch (error) {
    console.error('❌ Error fixing alert:', error);
    throw error;
  }
}

fixTestAlert();
