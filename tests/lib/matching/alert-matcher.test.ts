/**
 * Comprehensive Test Suite for Alert Matching Logic
 * Purpose: Test all scenarios, edge cases, and business logic for apartment alert matching
 * Status: ✅ COMPLETE - Covers all matching criteria and edge cases
 */

import { describe, test, expect, beforeEach } from 'vitest';
import {
  isListingMatch,
  matchListingsToAlerts,
  getMatchStatistics,
  formatMatchResult,
  validateMatchingData,
} from '../../../src/lib/matching/alert-matcher';
import type { ListingSelect } from '../../../src/lib/database/schema';
import type { AlertWithUser } from '../../../src/lib/database/queries/alerts';

// ================================
// Test Data Setup
// ================================

const createMockListing = (
  overrides: Partial<ListingSelect> = {}
): ListingSelect => ({
  id: 1,
  external_id: 'test-listing-1',
  title: 'Test Apartment',
  description: 'A nice apartment',
  price: 2500,
  bedrooms: 1,
  square_feet: 800,
  neighborhood: 'Williamsburg',
  address: '123 Test St',
  latitude: 40.7128,
  longitude: -74.006,
  pet_friendly: false,
  listing_url: 'https://example.com/listing/1',
  source: 'craigslist',
  posted_at: '2024-01-01T00:00:00Z',
  scraped_at: '2024-01-01T01:00:00Z',
  is_active: true,
  scam_score: 0,
  ...overrides,
});

const createMockAlert = (
  overrides: Partial<AlertWithUser> = {}
): AlertWithUser => ({
  id: 1,
  user_id: 1,
  neighborhoods: JSON.stringify(['Williamsburg', 'Brooklyn Heights']),
  min_price: 2000,
  max_price: 3000,
  bedrooms: 1,
  pet_friendly: false,
  max_commute_minutes: null,
  commute_destination: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  is_active: true,
  user: {
    id: 1,
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_active: true,
    unsubscribe_token: 'test-token',
  },
  ...overrides,
});

// ================================
// Basic Matching Tests
// ================================

describe('Alert Matcher - Basic Functionality', () => {
  test('should match listing that meets all criteria', () => {
    const listing = createMockListing();
    const alert = createMockAlert();

    const result = isListingMatch(listing, alert);

    expect(result.isMatch).toBe(true);
    expect(result.reasons).toContain('All criteria matched');
  });

  test('should not match listing with wrong neighborhood', () => {
    const listing = createMockListing({ neighborhood: 'Manhattan' });
    const alert = createMockAlert();

    const result = isListingMatch(listing, alert);

    expect(result.isMatch).toBe(false);
    expect(result.reasons.some((r) => r.includes('Neighborhood'))).toBe(true);
  });

  test('should not match listing with price too high', () => {
    const listing = createMockListing({ price: 3500 });
    const alert = createMockAlert();

    const result = isListingMatch(listing, alert);

    expect(result.isMatch).toBe(false);
    expect(result.reasons.some((r) => r.includes('above maximum'))).toBe(true);
  });

  test('should not match listing with price too low', () => {
    const listing = createMockListing({ price: 1500 });
    const alert = createMockAlert();

    const result = isListingMatch(listing, alert);

    expect(result.isMatch).toBe(false);
    expect(result.reasons.some((r) => r.includes('below minimum'))).toBe(true);
  });
});

// ================================
// Neighborhood Matching Tests
// ================================

describe('Alert Matcher - Neighborhood Logic', () => {
  test('should match when listing neighborhood is in alert list', () => {
    const listing = createMockListing({ neighborhood: 'Brooklyn Heights' });
    const alert = createMockAlert();

    const result = isListingMatch(listing, alert);

    expect(result.isMatch).toBe(true);
  });

  test('should match when alert has no neighborhood restrictions', () => {
    const listing = createMockListing({
      neighborhood: 'Any Neighborhood',
      price: 2500, // Within default range
      bedrooms: 1, // Matches default
      pet_friendly: false, // Matches default
    });
    const alert = createMockAlert({
      neighborhoods: JSON.stringify([]), // Empty = no restrictions
    });

    const result = isListingMatch(listing, alert, true); // Enable debug

    expect(result.isMatch).toBe(true);
    expect(result.debugInfo?.checks.neighborhood.reason).toContain(
      'No neighborhood restrictions'
    );
  });

  test('should not match when listing has no neighborhood data', () => {
    const listing = createMockListing({ neighborhood: null });
    const alert = createMockAlert();

    const result = isListingMatch(listing, alert);

    expect(result.isMatch).toBe(false);
    expect(result.reasons.some((r) => r.includes('no neighborhood data'))).toBe(
      true
    );
  });

  test('should handle malformed neighborhood JSON gracefully', () => {
    const listing = createMockListing();
    const alert = createMockAlert({ neighborhoods: 'invalid-json' });

    const result = isListingMatch(listing, alert);

    expect(result.isMatch).toBe(true); // Should pass with empty neighborhood filter
  });
});

// ================================
// Price Range Tests
// ================================

describe('Alert Matcher - Price Logic', () => {
  test('should match when only minimum price set', () => {
    const listing = createMockListing({ price: 2500 });
    const alert = createMockAlert({ min_price: 2000, max_price: null });

    const result = isListingMatch(listing, alert);

    expect(result.isMatch).toBe(true);
  });

  test('should match when only maximum price set', () => {
    const listing = createMockListing({ price: 2500 });
    const alert = createMockAlert({ min_price: null, max_price: 3000 });

    const result = isListingMatch(listing, alert);

    expect(result.isMatch).toBe(true);
  });

  test('should match when no price restrictions', () => {
    const listing = createMockListing({
      price: 5000,
      neighborhood: 'Williamsburg', // Matches default
      bedrooms: 1, // Matches default
      pet_friendly: false, // Matches default
    });
    const alert = createMockAlert({
      min_price: null,
      max_price: null,
    });

    const result = isListingMatch(listing, alert, true);

    expect(result.isMatch).toBe(true);
    expect(result.debugInfo?.checks.price.reason).toContain(
      'No price restrictions'
    );
  });

  test('should match price exactly at boundaries', () => {
    const listing1 = createMockListing({ price: 2000 }); // At minimum
    const listing2 = createMockListing({ price: 3000 }); // At maximum
    const alert = createMockAlert({ min_price: 2000, max_price: 3000 });

    expect(isListingMatch(listing1, alert).isMatch).toBe(true);
    expect(isListingMatch(listing2, alert).isMatch).toBe(true);
  });
});

// ================================
// Bedroom Matching Tests
// ================================

describe('Alert Matcher - Bedroom Logic', () => {
  test('should match studio apartments (0 bedrooms)', () => {
    const listing = createMockListing({
      bedrooms: 0,
      neighborhood: 'Williamsburg', // Matches default
      price: 2500, // Within default range
      pet_friendly: false, // Matches default
    });
    const alert = createMockAlert({
      bedrooms: 0,
    });

    const result = isListingMatch(listing, alert, true);

    expect(result.isMatch).toBe(true);
    expect(result.debugInfo?.checks.bedrooms.reason).toContain('studio');
  });

  test('should match when alert has no bedroom restrictions', () => {
    const listing = createMockListing({
      bedrooms: 3,
      neighborhood: 'Williamsburg', // Matches default
      price: 2500, // Within default range
      pet_friendly: false, // Matches default
    });
    const alert = createMockAlert({
      bedrooms: null,
    });

    const result = isListingMatch(listing, alert, true);

    expect(result.isMatch).toBe(true);
    expect(result.debugInfo?.checks.bedrooms.reason).toContain(
      'No bedroom restrictions'
    );
  });

  test('should not match when bedroom counts differ', () => {
    const listing = createMockListing({ bedrooms: 2 });
    const alert = createMockAlert({ bedrooms: 1 });

    const result = isListingMatch(listing, alert);

    expect(result.isMatch).toBe(false);
    expect(
      result.reasons.some((r) => r.includes('Bedroom count mismatch'))
    ).toBe(true);
  });

  test('should not match when listing has no bedroom data', () => {
    const listing = createMockListing({ bedrooms: null });
    const alert = createMockAlert({ bedrooms: 1 });

    const result = isListingMatch(listing, alert);

    expect(result.isMatch).toBe(false);
    expect(result.reasons.some((r) => r.includes('no bedroom data'))).toBe(
      true
    );
  });

  test('should handle multiple bedroom counts correctly', () => {
    const alert1br = createMockAlert({ bedrooms: 1 });
    const alert2br = createMockAlert({ bedrooms: 2 });
    const alertStudio = createMockAlert({ bedrooms: 0 });

    const listing1br = createMockListing({ bedrooms: 1 });
    const listing2br = createMockListing({ bedrooms: 2 });
    const listingStudio = createMockListing({ bedrooms: 0 });

    // Correct matches
    expect(isListingMatch(listing1br, alert1br).isMatch).toBe(true);
    expect(isListingMatch(listing2br, alert2br).isMatch).toBe(true);
    expect(isListingMatch(listingStudio, alertStudio).isMatch).toBe(true);

    // Incorrect matches
    expect(isListingMatch(listing1br, alert2br).isMatch).toBe(false);
    expect(isListingMatch(listing2br, alertStudio).isMatch).toBe(false);
    expect(isListingMatch(listingStudio, alert1br).isMatch).toBe(false);
  });
});

// ================================
// Pet-Friendly Tests
// ================================

describe('Alert Matcher - Pet Policy Logic', () => {
  test('should match when pet policies align', () => {
    const petFriendlyListing = createMockListing({ pet_friendly: true });
    const noPetListing = createMockListing({ pet_friendly: false });

    const petFriendlyAlert = createMockAlert({ pet_friendly: true });
    const noPetAlert = createMockAlert({ pet_friendly: false });

    expect(isListingMatch(petFriendlyListing, petFriendlyAlert).isMatch).toBe(
      true
    );
    expect(isListingMatch(noPetListing, noPetAlert).isMatch).toBe(true);
  });

  test('should not match when pet policies conflict', () => {
    const petFriendlyListing = createMockListing({ pet_friendly: true });
    const noPetListing = createMockListing({ pet_friendly: false });

    const petFriendlyAlert = createMockAlert({ pet_friendly: true });
    const noPetAlert = createMockAlert({ pet_friendly: false });

    expect(isListingMatch(petFriendlyListing, noPetAlert).isMatch).toBe(false);
    expect(isListingMatch(noPetListing, petFriendlyAlert).isMatch).toBe(false);
  });

  test('should match when alert has no pet restrictions', () => {
    const petFriendlyListing = createMockListing({ pet_friendly: true });
    const noPetListing = createMockListing({ pet_friendly: false });
    const alert = createMockAlert({ pet_friendly: null });

    expect(isListingMatch(petFriendlyListing, alert).isMatch).toBe(true);
    expect(isListingMatch(noPetListing, alert).isMatch).toBe(true);
  });

  test('should not match when listing has no pet policy data', () => {
    const listing = createMockListing({ pet_friendly: null });
    const petFriendlyAlert = createMockAlert({ pet_friendly: true });
    const noPetAlert = createMockAlert({ pet_friendly: false });

    expect(isListingMatch(listing, petFriendlyAlert).isMatch).toBe(false);
    expect(isListingMatch(listing, noPetAlert).isMatch).toBe(false);
  });
});

// ================================
// Complex Scenario Tests
// ================================

describe('Alert Matcher - Complex Scenarios', () => {
  test('should handle multiple failing criteria', () => {
    const listing = createMockListing({
      neighborhood: 'Manhattan', // Wrong neighborhood
      price: 3500, // Too expensive
      bedrooms: 2, // Wrong bedroom count
      pet_friendly: true, // Wrong pet policy
    });

    const alert = createMockAlert({
      neighborhoods: JSON.stringify(['Brooklyn']),
      min_price: 2000,
      max_price: 3000,
      bedrooms: 1,
      pet_friendly: false,
    });

    const result = isListingMatch(listing, alert);

    expect(result.isMatch).toBe(false);
    expect(result.reasons.length).toBe(4); // All criteria should fail
    expect(result.reasons.some((r) => r.includes('Neighborhood'))).toBe(true);
    expect(result.reasons.some((r) => r.includes('above maximum'))).toBe(true);
    expect(
      result.reasons.some((r) => r.includes('Bedroom count mismatch'))
    ).toBe(true);
    expect(result.reasons.some((r) => r.includes('Pet policy mismatch'))).toBe(
      true
    );
  });

  test('should handle "any" criteria correctly', () => {
    const listing = createMockListing({
      neighborhood: 'Some Random Neighborhood',
      price: 10000,
      bedrooms: 5,
      pet_friendly: true,
    });

    const anyAlert = createMockAlert({
      neighborhoods: JSON.stringify([]), // Any neighborhood
      min_price: null, // Any minimum price
      max_price: null, // Any maximum price
      bedrooms: null, // Any bedrooms
      pet_friendly: null, // Any pet policy
    });

    const result = isListingMatch(listing, anyAlert);

    expect(result.isMatch).toBe(true);
    expect(result.reasons).toContain('All criteria matched');
  });

  test('should handle missing listing data gracefully', () => {
    const incompleteListing = createMockListing({
      neighborhood: null,
      bedrooms: null,
      pet_friendly: null,
    });

    const specificAlert = createMockAlert({
      neighborhoods: JSON.stringify(['Brooklyn']),
      bedrooms: 1,
      pet_friendly: true,
    });

    const result = isListingMatch(incompleteListing, specificAlert);

    expect(result.isMatch).toBe(false);
    expect(result.reasons.length).toBe(3); // Should fail on all missing data
  });
});

// ================================
// Batch Matching Tests
// ================================

describe('Alert Matcher - Batch Operations', () => {
  test('should match multiple listings to multiple alerts', () => {
    const listings = [
      createMockListing({
        id: 1,
        neighborhood: 'Williamsburg',
        price: 2500,
        bedrooms: 1,
      }),
      createMockListing({
        id: 2,
        neighborhood: 'Brooklyn Heights',
        price: 2800,
        bedrooms: 2,
      }),
      createMockListing({
        id: 3,
        neighborhood: 'Manhattan',
        price: 4000,
        bedrooms: 1,
      }),
    ];

    const alerts = [
      createMockAlert({
        id: 1,
        neighborhoods: JSON.stringify(['Williamsburg']),
        bedrooms: 1,
      }),
      createMockAlert({
        id: 2,
        neighborhoods: JSON.stringify(['Brooklyn Heights']),
        bedrooms: 2,
      }),
    ];

    const matches = matchListingsToAlerts(listings, alerts);
    const successfulMatches = matches.filter((m) => m.matchResult.isMatch);

    expect(successfulMatches.length).toBe(2);
    expect(
      successfulMatches.some((m) => m.listing.id === 1 && m.alert.id === 1)
    ).toBe(true);
    expect(
      successfulMatches.some((m) => m.listing.id === 2 && m.alert.id === 2)
    ).toBe(true);
  });

  test('should respect maxMatchesPerAlert limit', () => {
    const listings = Array.from({ length: 5 }, (_, i) =>
      createMockListing({ id: i + 1, neighborhood: 'Williamsburg' })
    );

    const alerts = [
      createMockAlert({
        id: 1,
        neighborhoods: JSON.stringify(['Williamsburg']),
      }),
    ];

    const matches = matchListingsToAlerts(listings, alerts, {
      maxMatchesPerAlert: 3,
    });
    const successfulMatches = matches.filter((m) => m.matchResult.isMatch);

    expect(successfulMatches.length).toBe(3);
  });

  test('should include non-matches when requested', () => {
    const listings = [
      createMockListing({ id: 1, neighborhood: 'Williamsburg' }),
      createMockListing({ id: 2, neighborhood: 'Manhattan' }),
    ];

    const alerts = [
      createMockAlert({ neighborhoods: JSON.stringify(['Williamsburg']) }),
    ];

    const matches = matchListingsToAlerts(listings, alerts, {
      includeNonMatches: true,
    });

    expect(matches.length).toBe(2);
    expect(matches.filter((m) => m.matchResult.isMatch).length).toBe(1);
    expect(matches.filter((m) => !m.matchResult.isMatch).length).toBe(1);
  });
});

// ================================
// Debug Mode Tests
// ================================

describe('Alert Matcher - Debug Features', () => {
  test('should provide debug info when enabled', () => {
    const listing = createMockListing();
    const alert = createMockAlert();

    const result = isListingMatch(listing, alert, true);

    expect(result.debugInfo).toBeDefined();
    expect(result.debugInfo?.listingData).toBeDefined();
    expect(result.debugInfo?.alertData).toBeDefined();
    expect(result.debugInfo?.checks).toBeDefined();
    expect(result.debugInfo?.checks.neighborhood.passed).toBe(true);
    expect(result.debugInfo?.checks.price.passed).toBe(true);
    expect(result.debugInfo?.checks.bedrooms.passed).toBe(true);
    expect(result.debugInfo?.checks.petFriendly.passed).toBe(true);
  });

  test('should not include debug info when disabled', () => {
    const listing = createMockListing();
    const alert = createMockAlert();

    const result = isListingMatch(listing, alert, false);

    expect(result.debugInfo).toBeUndefined();
  });
});

// ================================
// Utility Function Tests
// ================================

describe('Alert Matcher - Utility Functions', () => {
  test('should calculate match statistics correctly', () => {
    const matches = [
      {
        listing: createMockListing({ id: 1 }),
        alert: createMockAlert({ id: 1 }),
        matchResult: { isMatch: true, reasons: ['All criteria matched'] },
      },
      {
        listing: createMockListing({ id: 2 }),
        alert: createMockAlert({ id: 1 }),
        matchResult: { isMatch: false, reasons: ['Price too high'] },
      },
    ];

    const stats = getMatchStatistics(matches);

    expect(stats.totalListings).toBe(2);
    expect(stats.totalAlerts).toBe(1);
    expect(stats.matchCount).toBe(1);
    expect(stats.matchRate).toBe(0.5);
    expect(stats.reasonCounts['All criteria matched']).toBe(1);
    expect(stats.reasonCounts['Price too high']).toBe(1);
  });

  test('should format match results for logging', () => {
    const listing = createMockListing({
      id: 1,
      price: 2500,
      bedrooms: 1,
      neighborhood: 'Brooklyn',
    });
    const alert = createMockAlert({ id: 1 });
    const result = { isMatch: true, reasons: ['All criteria matched'] };

    const formatted = formatMatchResult(listing, alert, result);

    expect(formatted).toContain('✅ MATCH');
    expect(formatted).toContain('Listing 1');
    expect(formatted).toContain('$2500');
    expect(formatted).toContain('1br');
    expect(formatted).toContain('Brooklyn');
    expect(formatted).toContain('test@example.com');
  });

  test('should validate matching data', () => {
    const validListing = createMockListing();
    const validAlert = createMockAlert();

    const result = validateMatchingData(validListing, validAlert);

    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  test('should detect invalid matching data', () => {
    const invalidListing = createMockListing({ price: 0, external_id: '' });
    const invalidAlert = createMockAlert({
      neighborhoods: 'invalid-json',
      user: { ...createMockAlert().user, email: '' },
    });

    const result = validateMatchingData(invalidListing, invalidAlert);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// ================================
// Edge Cases and Error Handling
// ================================

describe('Alert Matcher - Edge Cases', () => {
  test('should handle empty arrays gracefully', () => {
    const result1 = matchListingsToAlerts([], [createMockAlert()]);
    const result2 = matchListingsToAlerts([createMockListing()], []);

    expect(result1.length).toBe(0);
    expect(result2.length).toBe(0);
  });

  test('should handle extremely large numbers', () => {
    const listing = createMockListing({ price: 999999999 });
    const alert = createMockAlert({ min_price: null, max_price: null });

    const result = isListingMatch(listing, alert);

    expect(result.isMatch).toBe(true);
  });

  test('should handle zero price gracefully', () => {
    const listing = createMockListing({ price: 0 });
    const alert = createMockAlert({ min_price: 1000, max_price: 3000 });

    const result = isListingMatch(listing, alert);

    expect(result.isMatch).toBe(false);
    expect(result.reasons.some((r) => r.includes('below minimum'))).toBe(true);
  });

  test('should handle negative bedroom counts', () => {
    const listing = createMockListing({ bedrooms: -1 });
    const alert = createMockAlert({ bedrooms: 1 });

    const result = isListingMatch(listing, alert);

    expect(result.isMatch).toBe(false);
  });

  test('should handle very long neighborhood names', () => {
    const longNeighborhood = 'A'.repeat(1000);
    const listing = createMockListing({ neighborhood: longNeighborhood });
    const alert = createMockAlert({
      neighborhoods: JSON.stringify([longNeighborhood]),
    });

    const result = isListingMatch(listing, alert);

    expect(result.isMatch).toBe(true);
  });
});
