/**
 * Alert Matching Logic
 * Purpose: Core business logic for matching apartment listings against user alerts
 * Status: ✅ IMPLEMENTED - Comprehensive matching with edge case handling
 * Dependencies: Database types, utility functions, logging
 */

import type { ListingSelect } from '../database/schema';
import type { AlertWithUser } from '../database/queries/alerts';
import { parseNeighborhoods } from '../database/queries/alerts';

// ================================
// Types
// ================================

export interface MatchResult {
  isMatch: boolean;
  reasons: string[];
  debugInfo?: MatchDebugInfo;
}

export interface MatchDebugInfo {
  listingData: {
    id: number;
    price: number;
    bedrooms: number | null;
    neighborhood: string | null;
    petFriendly: boolean | null;
  };
  alertData: {
    id: number;
    neighborhoods: string[];
    priceRange: { min: number | null; max: number | null };
    bedrooms: number | null;
    petFriendly: boolean | null;
  };
  checks: {
    neighborhood: { passed: boolean; reason: string };
    price: { passed: boolean; reason: string };
    bedrooms: { passed: boolean; reason: string };
    petFriendly: { passed: boolean; reason: string };
  };
}

export interface MatchedPair {
  listing: ListingSelect;
  alert: AlertWithUser;
  matchResult: MatchResult;
}

// ================================
// Core Matching Functions
// ================================

/**
 * Check if a single listing matches a single alert
 */
export function isListingMatch(
  listing: ListingSelect,
  alert: AlertWithUser,
  debug: boolean = false
): MatchResult {
  const reasons: string[] = [];
  const debugInfo: MatchDebugInfo | undefined = debug
    ? {
        listingData: {
          id: listing.id,
          price: listing.price,
          bedrooms: listing.bedrooms,
          neighborhood: listing.neighborhood,
          petFriendly: listing.pet_friendly,
        },
        alertData: {
          id: alert.id,
          neighborhoods: parseNeighborhoods(alert.neighborhoods),
          priceRange: { min: alert.min_price, max: alert.max_price },
          bedrooms: alert.bedrooms,
          petFriendly: alert.pet_friendly,
        },
        checks: {
          neighborhood: { passed: false, reason: '' },
          price: { passed: false, reason: '' },
          bedrooms: { passed: false, reason: '' },
          petFriendly: { passed: false, reason: '' },
        },
      }
    : undefined;

  // Parse alert neighborhoods
  const alertNeighborhoods = parseNeighborhoods(alert.neighborhoods);

  // Check 1: Neighborhood matching
  const neighborhoodCheck = checkNeighborhoodMatch(listing, alertNeighborhoods);
  if (!neighborhoodCheck.passed) {
    reasons.push(neighborhoodCheck.reason);
    if (debugInfo) debugInfo.checks.neighborhood = neighborhoodCheck;
  } else {
    if (debugInfo) debugInfo.checks.neighborhood = neighborhoodCheck;
  }

  // Check 2: Price range matching
  const priceCheck = checkPriceMatch(listing, alert.min_price, alert.max_price);
  if (!priceCheck.passed) {
    reasons.push(priceCheck.reason);
    if (debugInfo) debugInfo.checks.price = priceCheck;
  } else {
    if (debugInfo) debugInfo.checks.price = priceCheck;
  }

  // Check 3: Bedroom matching
  const bedroomCheck = checkBedroomMatch(listing, alert.bedrooms);
  if (!bedroomCheck.passed) {
    reasons.push(bedroomCheck.reason);
    if (debugInfo) debugInfo.checks.bedrooms = bedroomCheck;
  } else {
    if (debugInfo) debugInfo.checks.bedrooms = bedroomCheck;
  }

  // Check 4: Pet-friendly matching
  const petCheck = checkPetFriendlyMatch(listing, alert.pet_friendly);
  if (!petCheck.passed) {
    reasons.push(petCheck.reason);
    if (debugInfo) debugInfo.checks.petFriendly = petCheck;
  } else {
    if (debugInfo) debugInfo.checks.petFriendly = petCheck;
  }

  const isMatch = reasons.length === 0;

  return {
    isMatch,
    reasons: isMatch ? ['All criteria matched'] : reasons,
    debugInfo,
  };
}

/**
 * Match multiple listings against multiple alerts
 */
export function matchListingsToAlerts(
  listings: ListingSelect[],
  alerts: AlertWithUser[],
  options: {
    debug?: boolean;
    maxMatchesPerAlert?: number;
    includeNonMatches?: boolean;
  } = {}
): MatchedPair[] {
  const {
    debug = false,
    maxMatchesPerAlert,
    includeNonMatches = false,
  } = options;
  const matches: MatchedPair[] = [];
  const alertMatchCounts = new Map<number, number>();

  for (const listing of listings) {
    for (const alert of alerts) {
      // Check if we've hit the max matches for this alert
      if (maxMatchesPerAlert) {
        const currentCount = alertMatchCounts.get(alert.id) || 0;
        if (currentCount >= maxMatchesPerAlert) {
          continue;
        }
      }

      const matchResult = isListingMatch(listing, alert, debug);

      if (matchResult.isMatch) {
        matches.push({ listing, alert, matchResult });
        alertMatchCounts.set(
          alert.id,
          (alertMatchCounts.get(alert.id) || 0) + 1
        );
      } else if (includeNonMatches) {
        matches.push({ listing, alert, matchResult });
      }
    }
  }

  return matches;
}

// ================================
// Individual Check Functions
// ================================

/**
 * Check if listing neighborhood matches alert criteria
 */
function checkNeighborhoodMatch(
  listing: ListingSelect,
  alertNeighborhoods: string[]
): { passed: boolean; reason: string } {
  // If alert has no neighborhood restrictions, always match
  if (!alertNeighborhoods.length) {
    return { passed: true, reason: 'No neighborhood restrictions' };
  }

  // If listing has no neighborhood data, fail the match
  if (!listing.neighborhood) {
    return {
      passed: false,
      reason: `Listing has no neighborhood data, but alert requires one of: ${alertNeighborhoods.join(', ')}`,
    };
  }

  // Check if listing neighborhood is in alert's allowed neighborhoods
  if (alertNeighborhoods.includes(listing.neighborhood)) {
    return {
      passed: true,
      reason: `Neighborhood '${listing.neighborhood}' matches alert criteria`,
    };
  }

  return {
    passed: false,
    reason: `Neighborhood '${listing.neighborhood}' not in allowed list: ${alertNeighborhoods.join(', ')}`,
  };
}

/**
 * Check if listing price falls within alert price range
 */
function checkPriceMatch(
  listing: ListingSelect,
  minPrice: number | null,
  maxPrice: number | null
): { passed: boolean; reason: string } {
  // If no price restrictions, always match
  if (minPrice === null && maxPrice === null) {
    return { passed: true, reason: 'No price restrictions' };
  }

  // Check minimum price
  if (minPrice !== null && listing.price < minPrice) {
    return {
      passed: false,
      reason: `Price $${listing.price} is below minimum $${minPrice}`,
    };
  }

  // Check maximum price
  if (maxPrice !== null && listing.price > maxPrice) {
    return {
      passed: false,
      reason: `Price $${listing.price} is above maximum $${maxPrice}`,
    };
  }

  // Build success reason
  let reason = `Price $${listing.price} is within range`;
  if (minPrice !== null && maxPrice !== null) {
    reason += ` ($${minPrice} - $${maxPrice})`;
  } else if (minPrice !== null) {
    reason += ` (≥ $${minPrice})`;
  } else if (maxPrice !== null) {
    reason += ` (≤ $${maxPrice})`;
  }

  return { passed: true, reason };
}

/**
 * Check if listing bedroom count matches alert criteria
 */
function checkBedroomMatch(
  listing: ListingSelect,
  alertBedrooms: number | null
): { passed: boolean; reason: string } {
  // If alert doesn't specify bedroom requirement, always match
  if (alertBedrooms === null) {
    return { passed: true, reason: 'No bedroom restrictions' };
  }

  // Treat null bedrooms as studios (0 bedrooms)
  const normalizedListingBedrooms =
    listing.bedrooms === null ? 0 : listing.bedrooms;

  // Exact match required
  if (normalizedListingBedrooms === alertBedrooms) {
    const bedroomLabel =
      alertBedrooms === 0
        ? 'studio'
        : `${alertBedrooms} bedroom${alertBedrooms !== 1 ? 's' : ''}`;
    return { passed: true, reason: `Bedroom count matches: ${bedroomLabel}` };
  }

  return {
    passed: false,
    reason: `Bedroom count mismatch: listing has ${normalizedListingBedrooms === 0 ? 'studio' : `${normalizedListingBedrooms} bedroom${normalizedListingBedrooms !== 1 ? 's' : ''}`}, alert wants ${alertBedrooms === 0 ? 'studio' : `${alertBedrooms} bedroom${alertBedrooms !== 1 ? 's' : ''}`}`,
  };
}

/**
 * Check if listing pet policy matches alert criteria
 */
function checkPetFriendlyMatch(
  listing: ListingSelect,
  alertPetFriendly: boolean | null
): { passed: boolean; reason: string } {
  // If alert doesn't specify pet requirement, always match
  if (alertPetFriendly === null) {
    return { passed: true, reason: 'No pet policy restrictions' };
  }

  // If listing has no pet policy data, be cautious
  if (listing.pet_friendly === null) {
    return {
      passed: false,
      reason: `Listing has no pet policy data, but alert requires ${alertPetFriendly ? 'pet-friendly' : 'no pets allowed'}`,
    };
  }

  // Check if pet policies match
  if (listing.pet_friendly === alertPetFriendly) {
    return {
      passed: true,
      reason: `Pet policy matches: ${alertPetFriendly ? 'pet-friendly' : 'no pets allowed'}`,
    };
  }

  return {
    passed: false,
    reason: `Pet policy mismatch: listing is ${listing.pet_friendly ? 'pet-friendly' : 'no pets allowed'}, alert wants ${alertPetFriendly ? 'pet-friendly' : 'no pets allowed'}`,
  };
}

// ================================
// Utility Functions
// ================================

/**
 * Get match statistics for debugging/monitoring
 */
export function getMatchStatistics(matches: MatchedPair[]): {
  totalListings: number;
  totalAlerts: number;
  matchCount: number;
  matchRate: number;
  reasonCounts: Record<string, number>;
} {
  const totalMatches = matches.filter((m) => m.matchResult.isMatch).length;
  const reasonCounts: Record<string, number> = {};

  matches.forEach((match) => {
    match.matchResult.reasons.forEach((reason) => {
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });
  });

  return {
    totalListings: new Set(matches.map((m) => m.listing.id)).size,
    totalAlerts: new Set(matches.map((m) => m.alert.id)).size,
    matchCount: totalMatches,
    matchRate: matches.length > 0 ? totalMatches / matches.length : 0,
    reasonCounts,
  };
}

/**
 * Format match result for logging
 */
export function formatMatchResult(
  listing: ListingSelect,
  alert: AlertWithUser,
  result: MatchResult
): string {
  const status = result.isMatch ? '✅ MATCH' : '❌ NO MATCH';
  const listingInfo = `Listing ${listing.id}: $${listing.price}, ${listing.bedrooms === 0 ? 'studio' : `${listing.bedrooms}br`}, ${listing.neighborhood || 'no location'}`;
  const alertInfo = `Alert ${alert.id} (${alert.user.email})`;
  const reasons = result.reasons.join('; ');

  return `${status} - ${listingInfo} vs ${alertInfo} - ${reasons}`;
}

/**
 * Validate that listing and alert data are complete enough for matching
 */
export function validateMatchingData(
  listing: ListingSelect,
  alert: AlertWithUser
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Listing validation
  if (!listing.price || listing.price <= 0) {
    errors.push('Listing missing valid price');
  }
  if (!listing.external_id) {
    errors.push('Listing missing external ID');
  }

  // Alert validation
  try {
    const neighborhoods = parseNeighborhoods(alert.neighborhoods);
    if (neighborhoods.length === 0) {
      errors.push('Alert has no valid neighborhoods');
    }
  } catch {
    errors.push('Alert has invalid neighborhoods data');
  }

  if (!alert.user.email) {
    errors.push('Alert has no associated user email');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
