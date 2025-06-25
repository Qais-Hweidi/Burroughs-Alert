/**
 * Listing Helper Utilities
 * Utility functions for formatting and processing listing data
 */

import { 
  ListingCardData, 
  ScamIndicator, 
  ScamRiskLevel,
  FormattedListing 
} from '@/lib/types/listings.types';

// ================================
// Price Formatting
// ================================

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// ================================
// Bedroom Formatting
// ================================

export function formatBedrooms(bedrooms: number | null): string {
  if (bedrooms === null || bedrooms === undefined) return 'N/A';
  if (bedrooms === 0) return 'Studio';
  if (bedrooms === 1) return '1 Bedroom';
  return `${bedrooms} Bedrooms`;
}

// ================================
// Time Formatting
// ================================

export function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Unknown';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
}

export function formatAbsoluteTime(dateString: string | null): string {
  if (!dateString) return 'Unknown';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// ================================
// Commute Time Formatting
// ================================

export function formatCommuteTime(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return 'N/A';
  
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

// ================================
// Scam Detection
// ================================

export function getScamRiskLevel(scamScore: number): ScamRiskLevel {
  if (scamScore >= 7) return 'high';
  if (scamScore >= 4) return 'medium';
  return 'low';
}

export function getScamIndicator(scamScore: number): ScamIndicator {
  const level = getScamRiskLevel(scamScore);
  
  const indicators: Record<ScamRiskLevel, ScamIndicator> = {
    low: {
      level: 'low',
      label: 'Verified',
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    medium: {
      level: 'medium',
      label: 'Caution',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    high: {
      level: 'high',
      label: 'High Risk',
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  };
  
  return indicators[level];
}

// ================================
// Listing Processing
// ================================

export function formatListing(listing: ListingCardData): FormattedListing {
  return {
    ...listing,
    formattedPrice: formatPrice(listing.price),
    formattedBedrooms: formatBedrooms(listing.bedrooms),
    relativeTime: formatRelativeTime(listing.postedAt),
    scamIndicator: getScamIndicator(listing.scamScore)
  };
}

export function formatListings(listings: ListingCardData[]): FormattedListing[] {
  return listings.map(formatListing);
}

// ================================
// Sorting Utilities
// ================================

export function sortListingsByDate(listings: ListingCardData[], ascending = false): ListingCardData[] {
  return [...listings].sort((a, b) => {
    const dateA = a.postedAt ? new Date(a.postedAt).getTime() : 0;
    const dateB = b.postedAt ? new Date(b.postedAt).getTime() : 0;
    
    return ascending ? dateA - dateB : dateB - dateA;
  });
}

export function sortListingsByPrice(listings: ListingCardData[], ascending = true): ListingCardData[] {
  return [...listings].sort((a, b) => {
    return ascending ? a.price - b.price : b.price - a.price;
  });
}

export function sortListingsByScamScore(listings: ListingCardData[], ascending = true): ListingCardData[] {
  return [...listings].sort((a, b) => {
    return ascending ? a.scamScore - b.scamScore : b.scamScore - a.scamScore;
  });
}


// ================================
// URL Utilities
// ================================

export function getListingDomain(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch {
    return 'Unknown';
  }
}

// ================================
// Badge Utilities
// ================================

export function shouldShowScamWarning(scamScore: number): boolean {
  return scamScore >= 4;
}

export function shouldShowNewBadge(postedAt: string | null): boolean {
  if (!postedAt) return false;
  
  const posted = new Date(postedAt);
  const now = new Date();
  const diffInHours = (now.getTime() - posted.getTime()) / (1000 * 60 * 60);
  
  return diffInHours <= 2; // Show "NEW" badge for listings posted within 2 hours
}