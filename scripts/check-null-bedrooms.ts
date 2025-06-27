#!/usr/bin/env npx tsx

import { config } from 'dotenv';
config({ path: '.env.local' });

import { getDatabase } from '../src/lib/database/index';
import { sql } from 'drizzle-orm';

async function checkNullBedrooms() {
  const db = getDatabase();

  try {
    const result = await db.execute(
      sql`SELECT COUNT(*) as count FROM listings WHERE bedrooms IS NULL`
    );
    const nullCount = result.rows[0]?.count || 0;

    const zeroResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM listings WHERE bedrooms = 0`
    );
    const zeroCount = zeroResult.rows[0]?.count || 0;

    console.log('📊 Bedroom statistics:');
    console.log(`   - Listings with NULL bedrooms: ${nullCount}`);
    console.log(`   - Listings with 0 bedrooms (studios): ${zeroCount}`);

    if (nullCount > 0) {
      console.log('\n🔍 Sample NULL bedroom listings:');
      const samples = await db.execute(
        sql`SELECT id, title, bedrooms FROM listings WHERE bedrooms IS NULL LIMIT 3`
      );
      samples.rows.forEach((row, i) => {
        console.log(
          `   ${i + 1}. ID: ${row.id}, Title: ${row.title}, Bedrooms: ${row.bedrooms}`
        );
      });
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkNullBedrooms();
