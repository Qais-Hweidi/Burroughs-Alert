#!/usr/bin/env tsx

/**
 * Test the new pet preference logic
 */

import { isListingMatch } from '../src/lib/matching/alert-matcher';
import type { ListingSelect } from '../src/lib/database/schema';
import type { AlertWithUser } from '../src/lib/database/queries/alerts';

// Mock data for testing
const mockUser = {
  id: 999,
  email: 'test@example.com',
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
  is_active: true,
  unsubscribe_token: 'test-token',
};

const mockListing1: ListingSelect = {
  id: 1,
  external_id: 'test1',
  title: 'Pet-friendly apartment',
  description: null,
  price: 3000,
  bedrooms: 1,
  square_feet: null,
  neighborhood: 'Manhattan',
  address: null,
  latitude: null,
  longitude: null,
  pet_friendly: true, // Allows pets
  listing_url: 'http://test.com/1',
  source: 'test',
  posted_at: null,
  scraped_at: '2025-01-01',
  is_active: true,
  scam_score: 0,
};

const mockListing2: ListingSelect = {
  ...mockListing1,
  id: 2,
  pet_friendly: null, // Doesn't mention pets
  title: 'Apartment with no pet policy mentioned',
};

const mockListing3: ListingSelect = {
  ...mockListing1,
  id: 3,
  pet_friendly: false, // Explicitly no pets
  title: 'No pets allowed apartment',
};

async function testPetLogic() {
  console.log('🧪 Testing New Pet Preference Logic\n');

  // Test Case 1: Alert with pet_friendly = null (doesn't matter)
  const alertDoesntMatter: AlertWithUser = {
    id: 1,
    user_id: 999,
    neighborhoods: '["Manhattan"]',
    min_price: 1000,
    max_price: 5000,
    bedrooms: null,
    pet_friendly: null, // Doesn't matter
    max_commute_minutes: null,
    commute_destination: null,
    commute_destination_place_id: null,
    commute_destination_lat: null,
    commute_destination_lng: null,
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
    is_active: true,
    user: mockUser,
  };

  console.log("📋 Test Case 1: Alert pet_friendly = null (doesn't matter)");
  console.log('Should match ALL listings regardless of pet policy\n');

  for (const listing of [mockListing1, mockListing2, mockListing3]) {
    const result = await isListingMatch(listing, alertDoesntMatter, true);
    const petStatus =
      listing.pet_friendly === null
        ? 'not mentioned'
        : listing.pet_friendly
          ? 'allows pets'
          : 'no pets';
    console.log(
      `  Listing ${listing.id} (${petStatus}): ${result.isMatch ? '✅ MATCH' : '❌ NO MATCH'}`
    );
    if (result.debugInfo?.checks.petFriendly) {
      console.log(
        `    Pet check: ${result.debugInfo.checks.petFriendly.reason}`
      );
    }
  }

  // Test Case 2: Alert with pet_friendly = true (must allow pets)
  const alertRequiresPets: AlertWithUser = {
    ...alertDoesntMatter,
    id: 2,
    pet_friendly: true, // Must allow pets
  };

  console.log('\n📋 Test Case 2: Alert pet_friendly = true (must allow pets)');
  console.log(
    'Should match pet-friendly and not-mentioned listings, reject no-pets listings\n'
  );

  for (const listing of [mockListing1, mockListing2, mockListing3]) {
    const result = await isListingMatch(listing, alertRequiresPets, true);
    const petStatus =
      listing.pet_friendly === null
        ? 'not mentioned'
        : listing.pet_friendly
          ? 'allows pets'
          : 'no pets';
    console.log(
      `  Listing ${listing.id} (${petStatus}): ${result.isMatch ? '✅ MATCH' : '❌ NO MATCH'}`
    );
    if (result.debugInfo?.checks.petFriendly) {
      console.log(
        `    Pet check: ${result.debugInfo.checks.petFriendly.reason}`
      );
    }
  }

  console.log('\n🎯 Summary:');
  console.log("- When toggle is OFF (doesn't matter): Match everything");
  console.log(
    '- When toggle is ON (must allow pets): Match pet-friendly + not-mentioned, reject no-pets'
  );
}

testPetLogic().catch(console.error);
