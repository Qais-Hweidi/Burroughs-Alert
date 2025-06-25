/**
 * Frontend Listings Page Type Definitions
 * Types specifically for the listings view page and components
 */

import { ParsedListing } from './database.types';

// ================================
// Listing Card Display Types
// ================================

export interface ListingCardData {
  id: number;
  title: string;
  neighborhood: string | null;
  price: number;
  bedrooms: number | null;
  petFriendly: boolean | null;
  commuteMinutes: number | null;
  scamScore: number;
  postedAt: string | null;
  listingUrl: string;
}

// ================================
// Listings Page Props & State
// ================================

export interface ListingsPageProps {
  searchParams?: {
    alertId?: string;
  };
}

export interface ListingsPageState {
  listings: ListingCardData[];
  isLoading: boolean;
  isRefreshing: boolean;
  lastRefresh: Date | null;
  error: string | null;
}

// ================================
// Component Props
// ================================

export interface ListingCardProps {
  listing: ListingCardData;
  className?: string;
}

export interface ListingsGridProps {
  listings: ListingCardData[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  className?: string;
}

// ================================
// Scam Indicator Types
// ================================

export type ScamRiskLevel = 'low' | 'medium' | 'high';

export interface ScamIndicator {
  level: ScamRiskLevel;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

// ================================
// Time Display Types
// ================================

export interface TimeDisplayOptions {
  format: 'relative' | 'absolute';
  showTime?: boolean;
}

// ================================
// Utility Types
// ================================

export interface ListingFilters {
  alertCriteria: {
    neighborhoods: string[];
    minPrice: number | null;
    maxPrice: number | null;
    bedrooms: number | null;
    petFriendly: boolean;
    maxCommuteMinutes: number | null;
  };
}

export interface RefreshOptions {
  showNewListingsFirst?: boolean;
  highlightNew?: boolean;
}

// ================================
// API Response Types (for future use)
// ================================

export interface ListingsResponse {
  listings: ListingCardData[];
  total: number;
  newCount: number;
  lastUpdated: string;
}

// ================================
// Helper Functions Return Types
// ================================

export interface FormattedListing extends ListingCardData {
  formattedPrice: string;
  formattedBedrooms: string;
  relativeTime: string;
  scamIndicator: ScamIndicator;
}