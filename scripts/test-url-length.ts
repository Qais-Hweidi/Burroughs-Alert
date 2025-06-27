#!/usr/bin/env npx tsx

import { config } from 'dotenv';
config({ path: '.env.local' });

import { getDatabase } from '../src/lib/database/index';
import { alerts } from '../src/lib/database/schema';
import { eq } from 'drizzle-orm';

async function testURLLength() {
  const db = getDatabase();
  
  try {
    // Get alert 21
    const result = await db
      .select()
      .from(alerts)
      .where(eq(alerts.id, 21));
    
    const alert = result[0];
    const neighborhoods = JSON.parse(alert.neighborhoods || '[]');
    
    console.log('📋 Alert has', neighborhoods.length, 'neighborhoods');
    
    // Build query string
    const params = new URLSearchParams({
      neighborhoods: neighborhoods.join(','),
      min_price: alert.min_price.toString(),
      max_price: alert.max_price.toString(),
      pet_friendly: alert.pet_friendly.toString(),
      active_only: 'true',
      sort_by: 'scraped_at',
      sort_order: 'desc'
    });
    
    const queryString = params.toString();
    const fullURL = `http://localhost:3000/api/listings?${queryString}`;
    
    console.log('\n📏 URL Length Analysis:');
    console.log('   Query string length:', queryString.length, 'characters');
    console.log('   Full URL length:', fullURL.length, 'characters');
    
    // URL length limits
    console.log('\n⚠️  URL Length Limits:');
    console.log('   Chrome/Firefox/Safari: ~2,048 characters');
    console.log('   Node.js default: 8,192 characters');
    
    if (fullURL.length > 2048) {
      console.log('\n❌ URL exceeds browser limits!');
      console.log('   This will cause issues in the browser');
    }
    
    // Show first part of neighborhoods param
    const neighborhoodsParam = params.get('neighborhoods') || '';
    console.log('\n🏘️  Neighborhoods parameter preview:');
    console.log('   First 200 chars:', neighborhoodsParam.substring(0, 200) + '...');
    console.log('   Last 100 chars: ...', neighborhoodsParam.substring(neighborhoodsParam.length - 100));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

testURLLength();