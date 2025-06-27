/**
 * Test script to simulate the exact frontend flow for coordinates
 */

async function testFrontendFlow() {
  console.log('Simulating frontend flow for alert 24...\n');

  // Step 1: Frontend loads alert data
  console.log('Step 1: Loading alert data from API...');
  const alertResponse = await fetch('http://localhost:3000/api/alerts/24');
  const alertApiData = await alertResponse.json();

  if (!alertApiData.success) {
    console.error('Failed to load alert:', alertApiData.message);
    return;
  }

  const alert = alertApiData.alert;
  console.log('✅ Alert loaded successfully');
  console.log(`  commute_destination_lat: ${alert.commute_destination_lat}`);
  console.log(`  commute_destination_lng: ${alert.commute_destination_lng}`);
  console.log();

  // Step 2: Frontend converts to AlertFormData format (simulating the state setter)
  console.log('Step 2: Converting to AlertFormData format...');
  const alertCriteria = {
    email: alert.email,
    neighborhoods: alert.neighborhoods,
    minPrice: alert.min_price,
    maxPrice: alert.max_price,
    bedrooms: alert.bedrooms,
    petFriendly: alert.pet_friendly || false,
    commuteDestination: alert.commute_destination || '',
    maxCommuteMinutes: alert.max_commute_minutes,
    commuteDestinationCoordinates:
      alert.commute_destination_lat && alert.commute_destination_lng
        ? {
            lat: alert.commute_destination_lat,
            lng: alert.commute_destination_lng,
          }
        : null,
  };

  console.log('✅ AlertFormData created with coordinates:');
  console.log(
    `  commuteDestinationCoordinates: ${JSON.stringify(alertCriteria.commuteDestinationCoordinates)}`
  );
  console.log();

  // Step 3: Frontend converts to DatabaseAlert format
  console.log('Step 3: Converting to DatabaseAlert format...');
  const alertData = {
    id: '24',
    user_id: 0,
    email: alertCriteria.email,
    neighborhoods: alertCriteria.neighborhoods,
    min_price: alertCriteria.minPrice,
    max_price: alertCriteria.maxPrice,
    bedrooms: alertCriteria.bedrooms,
    pet_friendly: alertCriteria.petFriendly,
    max_commute_minutes: alertCriteria.maxCommuteMinutes,
    commute_destination: alertCriteria.commuteDestination,
    commute_destination_lat:
      alertCriteria.commuteDestinationCoordinates?.lat || null,
    commute_destination_lng:
      alertCriteria.commuteDestinationCoordinates?.lng || null,
    is_active: true,
    created_at: '',
  };

  console.log('✅ DatabaseAlert created with:');
  console.log(
    `  commute_destination_lat: ${alertData.commute_destination_lat}`
  );
  console.log(
    `  commute_destination_lng: ${alertData.commute_destination_lng}`
  );
  console.log();

  // Step 4: Convert to API parameters
  console.log('Step 4: Converting to API parameters...');
  const { convertAlertToListingsParams } = await import(
    '../src/lib/utils/dataConverters'
  );
  const apiParams = convertAlertToListingsParams(alertData);

  console.log('✅ API parameters include:');
  console.log(`  work_lat: ${apiParams.work_lat || 'NOT INCLUDED'}`);
  console.log(`  work_lng: ${apiParams.work_lng || 'NOT INCLUDED'}`);
  console.log();

  // Step 5: Make listings API call
  console.log('Step 5: Calling listings API...');
  const queryString = new URLSearchParams(apiParams).toString();
  console.log(`Query string: ...${queryString.substring(0, 100)}...`);
  console.log(`Contains work_lat: ${queryString.includes('work_lat')}`);
  console.log(`Contains work_lng: ${queryString.includes('work_lng')}`);

  const listingsResponse = await fetch(
    `http://localhost:3000/api/listings?${queryString}`
  );
  const listingsData = await listingsResponse.json();

  if (listingsData.success) {
    console.log(
      `\n✅ Listings API returned ${listingsData.listings.length} listings`
    );
  } else {
    console.log('\n❌ Listings API failed:', listingsData.message);
  }
}

testFrontendFlow().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
