/**
 * Check Database Content
 * Purpose: Check what data exists in the database tables
 */

import { getDatabase } from '../../src/lib/database/index';
import { users, alerts, listings } from '../../src/lib/database/schema';

async function checkDatabaseContent() {
  console.log('🔍 Checking Database Content\n');

  try {
    const db = getDatabase();

    const userRecords = await db.select().from(users).all();
    const alertRecords = await db.select().from(alerts).all();
    const listingRecords = await db.select().from(listings).all();

    console.log('Users table:');
    console.log(`  Count: ${userRecords.length}`);
    if (userRecords.length > 0) {
      console.log('  Sample:', userRecords[0]);
    }

    console.log('\nAlerts table:');
    console.log(`  Count: ${alertRecords.length}`);
    if (alertRecords.length > 0) {
      console.log('  Sample:', alertRecords[0]);
    }

    console.log('\nListings table:');
    console.log(`  Count: ${listingRecords.length}`);
    if (listingRecords.length > 0) {
      console.log('  Sample:', listingRecords[0]);
    }

    if (
      userRecords.length === 0 ||
      alertRecords.length === 0 ||
      listingRecords.length === 0
    ) {
      console.log(
        '\n⚠️  Some tables are empty. Foreign key constraints will fail.'
      );
      console.log('   Consider creating sample data for testing.');
    }
  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
}

checkDatabaseContent()
  .then(() => {
    console.log('\n✅ Database check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Database check failed:', error);
    process.exit(1);
  });
