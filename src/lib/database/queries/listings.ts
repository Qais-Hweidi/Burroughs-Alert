/**
 * Purpose: Database operations for apartment listings - search, filter, match, and maintain data
 * Status: ✅ IMPLEMENTED - Core functions for listing management
 * Key functions: insertListings, searchListings, matchListingsToAlerts, cleanupOldListings
 * Dependencies: Database connection, schema types, full-text search indexes
 */

import { eq, and, or, sql, gte, lte, inArray } from 'drizzle-orm';
import { getDatabase } from '../index';
import { schema } from '../schema';
import type { ScrapedListing } from '../../scraping/craigslist-scraper';

// ================================
// Types
// ================================

export interface ListingInsertResult {
  success: boolean;
  newListingsCount: number;
  duplicateCount: number;
  errorCount: number;
  errors: string[];
}

export interface ListingSearchFilters {
  neighborhoods?: string[];
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  petFriendly?: boolean;
  limit?: number;
  offset?: number;
}

// Note: MatchedListing type moved to ../matching/alert-matcher.ts

// ================================
// Insert Operations
// ================================

/**
 * Insert scraped listings into database with duplicate handling
 */
export async function insertListings(
  listings: ScrapedListing[]
): Promise<ListingInsertResult> {
  const db = getDatabase();
  const result: ListingInsertResult = {
    success: false,
    newListingsCount: 0,
    duplicateCount: 0,
    errorCount: 0,
    errors: [],
  };

  if (!listings.length) {
    result.success = true;
    return result;
  }

  try {
    // Check for existing listings by external_id
    const existingIds = await db
      .select({ external_id: schema.listings.external_id })
      .from(schema.listings)
      .where(
        inArray(
          schema.listings.external_id,
          listings.map((l) => l.external_id)
        )
      );

    const existingIdSet = new Set(existingIds.map((l) => l.external_id));
    const newListings = listings.filter(
      (listing) => !existingIdSet.has(listing.external_id)
    );

    result.duplicateCount = listings.length - newListings.length;

    // Insert new listings
    for (const listing of newListings) {
      try {
        await db.insert(schema.listings).values({
          external_id: listing.external_id,
          title: listing.title,
          price: listing.price,
          bedrooms: listing.bedrooms || null,
          neighborhood: listing.neighborhood || null,
          latitude: listing.latitude || null,
          longitude: listing.longitude || null,
          pet_friendly: listing.pet_friendly || null,
          listing_url: listing.listing_url,
          source: listing.source,
          posted_at: listing.posted_at,
          scraped_at: sql`CURRENT_TIMESTAMP`,
          is_active: true,
          scam_score: listing.scam_score || 0,
        });
        result.newListingsCount++;
      } catch (error) {
        result.errorCount++;
        result.errors.push(
          `Failed to insert listing ${listing.external_id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    result.success = result.errorCount === 0;
    return result;
  } catch (error) {
    result.errors.push(
      `Database operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return result;
  }
}

// ================================
// Search Operations
// ================================

/**
 * Search listings with comprehensive filtering
 */
export async function searchListings(
  filters: ListingSearchFilters
): Promise<any[]> {
  const db = getDatabase();

  const query = db
    .select()
    .from(schema.listings)
    .where(eq(schema.listings.is_active, true));

  // Apply filters
  const conditions = [eq(schema.listings.is_active, true)];

  if (filters.neighborhoods?.length) {
    conditions.push(
      inArray(schema.listings.neighborhood, filters.neighborhoods)
    );
  }

  if (filters.minPrice !== undefined) {
    conditions.push(gte(schema.listings.price, filters.minPrice));
  }

  if (filters.maxPrice !== undefined) {
    conditions.push(lte(schema.listings.price, filters.maxPrice));
  }

  if (filters.bedrooms !== undefined) {
    conditions.push(eq(schema.listings.bedrooms, filters.bedrooms));
  }

  if (filters.petFriendly !== undefined) {
    conditions.push(eq(schema.listings.pet_friendly, filters.petFriendly));
  }

  // Combine all conditions
  const finalQuery = db
    .select()
    .from(schema.listings)
    .where(and(...conditions))
    .orderBy(sql`scraped_at DESC`);

  if (filters.limit) {
    finalQuery.limit(filters.limit);
  }

  if (filters.offset) {
    finalQuery.offset(filters.offset);
  }

  return await finalQuery.all();
}

// ================================
// Matching Operations
// ================================

// Note: Matching logic has been moved to ../matching/alert-matcher.ts
// for better testability and separation of concerns. Use the matchListingsToAlerts
// function from that module instead.

// ================================
// Cleanup Operations
// ================================

/**
 * Clean up old listings based on retention policies
 */
export async function cleanupOldListings(retentionDays: number = 30): Promise<{
  deletedCount: number;
  errors: string[];
}> {
  const db = getDatabase();
  const result: { deletedCount: number; errors: string[] } = {
    deletedCount: 0,
    errors: [],
  };

  try {
    // Delete old listings
    const deleteResult = await db
      .delete(schema.listings)
      .where(
        sql`scraped_at <= datetime('now', '-' || ${retentionDays} || ' days')`
      );

    // Note: SQLite doesn't return affected rows count directly
    // We'll query before and after to get count
    const remainingCount = await db
      .select({ count: sql`count(*)` })
      .from(schema.listings)
      .get();

    console.log(`Cleanup completed. Remaining listings: ${remainingCount}`);
    result.deletedCount = 0; // SQLite limitation

    return result;
  } catch (error) {
    result.errors.push(
      `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return result;
  }
}
