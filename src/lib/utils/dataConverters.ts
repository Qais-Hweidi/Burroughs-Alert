/**
 * Data Conversion Utilities
 * Purpose: Convert between database formats and frontend interfaces
 */

import { ListingCardData } from '@/lib/types/listings.types';

// Database listing interface (from API response)
export interface DatabaseListing {
  id: number;
  external_id: string;
  title: string;
  description: string | null;
  price: number;
  bedrooms: number | null;
  square_feet: number | null;
  neighborhood: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  pet_friendly: boolean | null;
  listing_url: string;
  source: string;
  posted_at: string | null;
  scraped_at: string;
  is_active: boolean;
  scam_score: number;
}

// Alert from database/API
export interface DatabaseAlert {
  id: string;
  user_id: number;
  email: string;
  neighborhoods: string[];
  min_price: number | null;
  max_price: number | null;
  bedrooms: number | null;
  pet_friendly: boolean | null;
  max_commute_minutes: number | null;
  commute_destination: string | null;
  is_active: boolean;
  created_at: string;
}

/**
 * Convert database listing to frontend ListingCardData format
 */
export function convertDatabaseListingToCardData(
  dbListing: DatabaseListing
): ListingCardData {
  return {
    id: dbListing.id,
    title: dbListing.title,
    neighborhood: dbListing.neighborhood,
    price: dbListing.price,
    bedrooms: dbListing.bedrooms,
    petFriendly: dbListing.pet_friendly,
    commuteMinutes: null, // TODO: Implement commute calculation
    scamScore: dbListing.scam_score,
    postedAt: dbListing.posted_at,
    listingUrl: dbListing.listing_url,
  };
}

/**
 * Convert alert data to API query parameters for listings endpoint
 */
export function convertAlertToListingsParams(
  alert: DatabaseAlert
): Record<string, string> {
  const params: Record<string, string> = {};

  // Neighborhoods - Skip filtering if all NYC neighborhoods are selected
  // This is a workaround for when users select "all neighborhoods" since
  // scraped data often uses borough names rather than specific neighborhoods
  if (alert.neighborhoods && alert.neighborhoods.length > 0) {
    // If less than 100 neighborhoods selected, use specific filtering
    // If 100+ neighborhoods (essentially all NYC), skip neighborhood filter
    if (alert.neighborhoods.length < 100) {
      params.neighborhoods = alert.neighborhoods.join(',');
    }
    // When all/most neighborhoods are selected, don't add neighborhood filter
    // This allows all listings to pass through regardless of neighborhood value
  }

  // Price range
  if (alert.min_price !== null) {
    params.min_price = alert.min_price.toString();
  }
  if (alert.max_price !== null) {
    params.max_price = alert.max_price.toString();
  }

  // Bedrooms
  if (alert.bedrooms !== null) {
    params.bedrooms = alert.bedrooms.toString();
  }

  // Pet friendly - only filter if user specifically wants pet-friendly apartments
  // Don't filter out apartments if user doesn't care about pets (pet_friendly: false)
  if (alert.pet_friendly === true) {
    params.pet_friendly = 'true';
  }
  // Skip pet_friendly filter when alert.pet_friendly is false or null
  // This allows all apartments (pet-friendly, not pet-friendly, or unknown) to show

  // Default filtering
  params.active_only = 'true';
  params.max_scam_score = '60'; // Filter out high-risk listings
  params.sort_by = 'scraped_at';
  params.sort_order = 'desc';
  params.limit = '50';

  return params;
}
