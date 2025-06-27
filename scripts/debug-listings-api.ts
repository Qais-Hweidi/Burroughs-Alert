#!/usr/bin/env npx tsx

import { config } from 'dotenv';
config({ path: '.env.local' });

async function debugListingsAPI() {
  const alertId = 21;
  
  console.log('🔍 Testing listings API for alert ID:', alertId);
  
  try {
    // First, let's check what the alert looks like
    const alertResponse = await fetch(`http://localhost:3000/api/alerts/${alertId}`);
    if (!alertResponse.ok) {
      console.error('❌ Failed to fetch alert:', alertResponse.status, alertResponse.statusText);
      const errorText = await alertResponse.text();
      console.error('Error body:', errorText);
      return;
    }
    
    const alertData = await alertResponse.json();
    const alert = alertData.alert;
    console.log('✅ Alert loaded successfully');
    console.log('   Neighborhoods count:', JSON.parse(alert.neighborhoods).length);
    console.log('   Price range:', alert.min_price, '-', alert.max_price);
    console.log('   Pet friendly:', alert.pet_friendly);
    
    // Build the query params like the frontend does
    const apiParams = new URLSearchParams({
      neighborhoods: JSON.parse(alert.neighborhoods).join(','),
      min_price: alert.min_price.toString(),
      max_price: alert.max_price.toString(),
      pet_friendly: alert.pet_friendly.toString(),
      active_only: 'true',
      sort_by: 'scraped_at',
      sort_order: 'desc'
    });
    
    const queryString = apiParams.toString();
    console.log('\n📋 Query string length:', queryString.length);
    console.log('First 200 chars:', queryString.substring(0, 200) + '...');
    
    // Try to fetch listings
    console.log('\n🔄 Fetching listings...');
    const listingsResponse = await fetch(`http://localhost:3000/api/listings?${queryString}`);
    
    console.log('Response status:', listingsResponse.status, listingsResponse.statusText);
    console.log('Response headers:', Object.fromEntries(listingsResponse.headers.entries()));
    
    if (!listingsResponse.ok) {
      const errorBody = await listingsResponse.text();
      console.error('❌ Error response body:', errorBody);
    } else {
      const data = await listingsResponse.json();
      console.log('✅ Success! Found', data.listings?.length || 0, 'listings');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugListingsAPI();