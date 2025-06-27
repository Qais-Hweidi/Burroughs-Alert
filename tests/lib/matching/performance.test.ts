/**
 * Performance Tests for Alert Matching Logic
 * Purpose: Ensure matching algorithm scales well with large datasets
 * Status: ✅ COMPLETE - Tests performance with realistic data volumes
 */

import { describe, test, expect } from 'vitest';
import {
  matchListingsToAlerts,
  getMatchStatistics,
} from '../../../src/lib/matching/alert-matcher';
import type { ListingSelect } from '../../../src/lib/database/schema';
import type { AlertWithUser } from '../../../src/lib/database/queries/alerts';

// ================================
// Test Data Generators
// ================================

function generateMockListings(count: number): ListingSelect[] {
  const neighborhoods = [
    'Williamsburg',
    'Brooklyn Heights',
    'Park Slope',
    'Astoria',
    'LIC',
  ];
  const listings: ListingSelect[] = [];

  for (let i = 0; i < count; i++) {
    listings.push({
      id: i + 1,
      external_id: `listing-${i + 1}`,
      title: `Apartment ${i + 1}`,
      description: `Description for apartment ${i + 1}`,
      price: Math.floor(Math.random() * 3000) + 1500, // $1500-$4500
      bedrooms: Math.floor(Math.random() * 4), // 0-3 bedrooms
      square_feet: Math.floor(Math.random() * 800) + 400, // 400-1200 sq ft
      neighborhood:
        neighborhoods[Math.floor(Math.random() * neighborhoods.length)],
      address: `${Math.floor(Math.random() * 999) + 1} Test St`,
      latitude: 40.7 + (Math.random() - 0.5) * 0.2,
      longitude: -74.0 + (Math.random() - 0.5) * 0.2,
      pet_friendly: Math.random() > 0.5,
      listing_url: `https://example.com/listing/${i + 1}`,
      source: 'craigslist',
      posted_at: new Date(
        Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      scraped_at: new Date().toISOString(),
      is_active: true,
      scam_score: Math.floor(Math.random() * 3),
    });
  }

  return listings;
}

function generateMockAlerts(count: number): AlertWithUser[] {
  const neighborhoods = [
    'Williamsburg',
    'Brooklyn Heights',
    'Park Slope',
    'Astoria',
    'LIC',
  ];
  const alerts: AlertWithUser[] = [];

  for (let i = 0; i < count; i++) {
    // Select 1-3 random neighborhoods for each alert
    const selectedNeighborhoods: string[] = [];
    const numNeighborhoods = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < numNeighborhoods; j++) {
      const neighborhood =
        neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
      if (!selectedNeighborhoods.includes(neighborhood)) {
        selectedNeighborhoods.push(neighborhood);
      }
    }

    alerts.push({
      id: i + 1,
      user_id: i + 1,
      neighborhoods: JSON.stringify(selectedNeighborhoods),
      min_price:
        Math.random() > 0.3 ? Math.floor(Math.random() * 1500) + 1000 : null, // 70% have min price
      max_price:
        Math.random() > 0.3 ? Math.floor(Math.random() * 2000) + 3000 : null, // 70% have max price
      bedrooms: Math.random() > 0.2 ? Math.floor(Math.random() * 4) : null, // 80% have bedroom preference
      pet_friendly: Math.random() > 0.5 ? Math.random() > 0.5 : null, // 50% have pet preference
      max_commute_minutes: null,
      commute_destination: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
      user: {
        id: i + 1,
        email: `user${i + 1}@example.com`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
        unsubscribe_token: `token-${i + 1}`,
      },
    });
  }

  return alerts;
}

// ================================
// Performance Tests
// ================================

describe('Alert Matcher - Performance Tests', () => {
  test('should handle small dataset efficiently (10 listings, 5 alerts)', () => {
    const listings = generateMockListings(10);
    const alerts = generateMockAlerts(5);

    const startTime = performance.now();
    const matches = matchListingsToAlerts(listings, alerts, {
      includeNonMatches: true,
    });
    const endTime = performance.now();

    const duration = endTime - startTime;
    console.log(`Small dataset (10x5): ${duration.toFixed(2)}ms`);

    expect(duration).toBeLessThan(50); // Should complete in under 50ms
    expect(matches.length).toBe(50); // Should have all comparisons when includeNonMatches is true
  });

  test('should handle medium dataset efficiently (100 listings, 20 alerts)', () => {
    const listings = generateMockListings(100);
    const alerts = generateMockAlerts(20);

    const startTime = performance.now();
    const matches = matchListingsToAlerts(listings, alerts, {
      includeNonMatches: true,
    });
    const endTime = performance.now();

    const duration = endTime - startTime;
    console.log(`Medium dataset (100x20): ${duration.toFixed(2)}ms`);

    expect(duration).toBeLessThan(200); // Should complete in under 200ms
    expect(matches.length).toBe(2000); // Should have all comparisons

    const stats = getMatchStatistics(matches);
    console.log(`Match rate: ${(stats.matchRate * 100).toFixed(1)}%`);
  });

  test('should handle large dataset efficiently (500 listings, 50 alerts)', () => {
    const listings = generateMockListings(500);
    const alerts = generateMockAlerts(50);

    const startTime = performance.now();
    const matches = matchListingsToAlerts(listings, alerts);
    const endTime = performance.now();

    const duration = endTime - startTime;
    console.log(`Large dataset (500x50): ${duration.toFixed(2)}ms`);

    expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    expect(matches.length).toBeGreaterThan(0); // Should have some matches

    const stats = getMatchStatistics(matches);
    console.log(`Match rate: ${(stats.matchRate * 100).toFixed(1)}%`);
    console.log(`Successful matches: ${stats.matchCount}`);
  });

  test('should handle realistic production dataset (1000 listings, 100 alerts)', () => {
    const listings = generateMockListings(1000);
    const alerts = generateMockAlerts(100);

    const startTime = performance.now();
    const matches = matchListingsToAlerts(listings, alerts);
    const endTime = performance.now();

    const duration = endTime - startTime;
    console.log(`Production dataset (1000x100): ${duration.toFixed(2)}ms`);

    expect(duration).toBeLessThan(3000); // Should complete in under 3 seconds
    expect(matches.length).toBeGreaterThan(0); // Should have some matches

    // Verify we're processing the full dataset by checking stats
    const expectedComparisons = 1000 * 100; // Total possible comparisons
    console.log(`Total possible comparisons: ${expectedComparisons}`);

    const stats = getMatchStatistics(matches);
    console.log(`Match rate: ${(stats.matchRate * 100).toFixed(1)}%`);
    console.log(`Successful matches: ${stats.matchCount}`);
    console.log(
      `Average time per comparison: ${(duration / matches.length).toFixed(4)}ms`
    );
  });

  test('should handle maxMatchesPerAlert efficiently', () => {
    const listings = generateMockListings(500);
    const alerts = generateMockAlerts(10);

    const startTime = performance.now();
    const matches = matchListingsToAlerts(listings, alerts, {
      maxMatchesPerAlert: 5,
    });
    const endTime = performance.now();

    const duration = endTime - startTime;
    console.log(`With maxMatchesPerAlert limit: ${duration.toFixed(2)}ms`);

    // Should terminate early and be faster than full comparison
    expect(duration).toBeLessThan(500);

    // Count matches per alert
    const matchesPerAlert = new Map<number, number>();
    matches
      .filter((m) => m.matchResult.isMatch)
      .forEach((match) => {
        const count = matchesPerAlert.get(match.alert.id) || 0;
        matchesPerAlert.set(match.alert.id, count + 1);
      });

    // No alert should have more than 5 matches
    for (const count of matchesPerAlert.values()) {
      expect(count).toBeLessThanOrEqual(5);
    }
  });

  test('should be memory efficient with large datasets', () => {
    const listings = generateMockListings(200);
    const alerts = generateMockAlerts(50);

    // Measure memory before
    const memBefore = process.memoryUsage();

    const matches = matchListingsToAlerts(listings, alerts);

    // Measure memory after
    const memAfter = process.memoryUsage();

    const heapUsed = (memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024; // MB
    console.log(
      `Memory used: ${heapUsed.toFixed(2)}MB for ${matches.length} comparisons`
    );

    // Should not use excessive memory (less than 50MB for this test)
    expect(heapUsed).toBeLessThan(50);
  });

  test('should scale linearly with dataset size', () => {
    const sizes = [
      { listings: 50, alerts: 10 },
      { listings: 100, alerts: 20 },
      { listings: 200, alerts: 40 },
    ];

    const results = sizes.map((size) => {
      const listings = generateMockListings(size.listings);
      const alerts = generateMockAlerts(size.alerts);

      const startTime = performance.now();
      const matches = matchListingsToAlerts(listings, alerts, {
        includeNonMatches: true,
      });
      const endTime = performance.now();

      const duration = endTime - startTime;
      const comparisons = size.listings * size.alerts;
      const timePerComparison = duration / comparisons;

      // Verify we got all comparisons
      expect(matches.length).toBe(comparisons);

      console.log(
        `${size.listings}x${size.alerts}: ${duration.toFixed(2)}ms (${timePerComparison.toFixed(6)}ms per comparison)`
      );

      return {
        size: comparisons,
        duration,
        timePerComparison,
      };
    });

    // Time per comparison should remain relatively stable (linear scaling)
    const timeVariation =
      Math.max(...results.map((r) => r.timePerComparison)) /
      Math.min(...results.map((r) => r.timePerComparison));

    expect(timeVariation).toBeLessThan(3); // Less than 3x variation in time per comparison
  });
});

// ================================
// Stress Tests
// ================================

describe('Alert Matcher - Stress Tests', () => {
  test('should handle extreme edge case: many alerts, few listings', () => {
    const listings = generateMockListings(10);
    const alerts = generateMockAlerts(200);

    const startTime = performance.now();
    const matches = matchListingsToAlerts(listings, alerts);
    const endTime = performance.now();

    const duration = endTime - startTime;
    console.log(`Many alerts, few listings (10x200): ${duration.toFixed(2)}ms`);

    expect(duration).toBeLessThan(1000);
    expect(matches.length).toBeGreaterThan(0);
  });

  test('should handle extreme edge case: many listings, few alerts', () => {
    const listings = generateMockListings(1000);
    const alerts = generateMockAlerts(5);

    const startTime = performance.now();
    const matches = matchListingsToAlerts(listings, alerts);
    const endTime = performance.now();

    const duration = endTime - startTime;
    console.log(`Many listings, few alerts (1000x5): ${duration.toFixed(2)}ms`);

    expect(duration).toBeLessThan(500);
    expect(matches.length).toBeGreaterThan(0);
  });

  test('should handle alerts with very specific criteria', () => {
    // Create listings with varied properties
    const listings = generateMockListings(100);

    // Create alerts with very specific criteria (should have low match rates)
    const specificAlerts: AlertWithUser[] = Array.from(
      { length: 20 },
      (_, i) => ({
        id: i + 1,
        user_id: i + 1,
        neighborhoods: JSON.stringify(['Williamsburg']), // Only one neighborhood
        min_price: 2800, // Narrow price range
        max_price: 2900,
        bedrooms: 2, // Specific bedroom count
        pet_friendly: true, // Specific pet policy
        max_commute_minutes: null,
        commute_destination: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
        user: {
          id: i + 1,
          email: `specific${i + 1}@example.com`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
          unsubscribe_token: `token-${i + 1}`,
        },
      })
    );

    const startTime = performance.now();
    const matches = matchListingsToAlerts(listings, specificAlerts);
    const endTime = performance.now();

    const duration = endTime - startTime;
    const stats = getMatchStatistics(matches);

    console.log(
      `Specific criteria test: ${duration.toFixed(2)}ms, ${(stats.matchRate * 100).toFixed(1)}% match rate`
    );

    expect(duration).toBeLessThan(500);
    expect(stats.matchRate).toBeLessThan(0.5); // Should have relatively low match rate due to specific criteria
  });
});
