#!/usr/bin/env npx tsx

import { config } from 'dotenv';
config({ path: '.env.local' });

import { getDatabase } from '../src/lib/database/index';
import { listings } from '../src/lib/database/schema';
import { sql } from 'drizzle-orm';

async function checkQueensTitles() {
  const db = getDatabase();
  
  try {
    const result = await db
      .select({
        id: listings.id,
        title: listings.title,
        neighborhood: listings.neighborhood,
        price: listings.price,
        bedrooms: listings.bedrooms,
        pet_friendly: listings.pet_friendly,
      })
      .from(listings)
      .where(sql`neighborhood = 'Queens' AND is_active = true`)
      .orderBy(sql`scraped_at DESC`)
      .limit(10);
    
    console.log('🏘️  Recent Queens listings:');
    console.log('========================\n');
    
    result.forEach((row, i) => {
      console.log(`${i+1}. ID: ${row.id}`);
      console.log(`   Title: "${row.title}"`);
      console.log(`   Title length: ${row.title.length} chars`);
      console.log(`   Price: $${row.price}`);
      console.log(`   Bedrooms: ${row.bedrooms}`);
      console.log(`   Pet Friendly: ${row.pet_friendly}`);
      
      // Check for truncation patterns
      if (row.title.endsWith('...') || row.title.endsWith('!') && !row.title.includes(' ')) {
        console.log('   ⚠️  Title appears truncated');
      }
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkQueensTitles();