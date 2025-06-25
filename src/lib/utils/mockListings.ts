/**
 * Mock Listing Data for Development
 * Sample apartment listings for testing the listings page
 */

import { ListingCardData } from '@/lib/types/listings.types';

export const mockListings: ListingCardData[] = [
  {
    id: 1,
    title: "Spacious 1BR in Heart of Williamsburg",
    neighborhood: "Williamsburg",
    price: 3200,
    bedrooms: 1,
    petFriendly: true,
    commuteMinutes: 25,
    scamScore: 1.2,
    postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    listingUrl: "https://newyork.craigslist.org/sample1"
  },
  {
    id: 2,
    title: "Bright Studio - Lower East Side - Available Now!",
    neighborhood: "Lower East Side",
    price: 2800,
    bedrooms: 0,
    petFriendly: false,
    commuteMinutes: 15,
    scamScore: 0.8,
    postedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    listingUrl: "https://newyork.craigslist.org/sample2"
  },
  {
    id: 3,
    title: "2BR/2BA Luxury Apt - Doorman Building - Murray Hill",
    neighborhood: "Murray Hill",
    price: 4500,
    bedrooms: 2,
    petFriendly: true,
    commuteMinutes: 8,
    scamScore: 0.3,
    postedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    listingUrl: "https://newyork.craigslist.org/sample3"
  },
  {
    id: 4,
    title: "Amazing Deal!! 3BR in Astoria - MUST SEE",
    neighborhood: "Astoria",
    price: 2200,
    bedrooms: 3,
    petFriendly: null,
    commuteMinutes: 35,
    scamScore: 7.5, // High scam score
    postedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    listingUrl: "https://newyork.craigslist.org/sample4"
  },
  {
    id: 5,
    title: "Charming 1BR in Park Slope with Garden Access",
    neighborhood: "Park Slope",
    price: 3800,
    bedrooms: 1,
    petFriendly: true,
    commuteMinutes: 22,
    scamScore: 1.8,
    postedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    listingUrl: "https://newyork.craigslist.org/sample5"
  },
  {
    id: 6,
    title: "Modern Studio in Financial District - High Floor",
    neighborhood: "Financial District",
    price: 3100,
    bedrooms: 0,
    petFriendly: false,
    commuteMinutes: null, // No commute time available
    scamScore: 2.1,
    postedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
    listingUrl: "https://newyork.craigslist.org/sample6"
  },
  {
    id: 7,
    title: "Cozy 2BR in Greenpoint - Pet Friendly Building",
    neighborhood: "Greenpoint",
    price: 3600,
    bedrooms: 2,
    petFriendly: true,
    commuteMinutes: 28,
    scamScore: 1.5,
    postedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    listingUrl: "https://newyork.craigslist.org/sample7"
  },
  {
    id: 8,
    title: "INCREDIBLE DEAL 4BR Manhattan only $1500!!! ACT FAST!!!",
    neighborhood: "Upper East Side",
    price: 1500,
    bedrooms: 4,
    petFriendly: null,
    commuteMinutes: 12,
    scamScore: 9.8, // Very high scam score
    postedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    listingUrl: "https://newyork.craigslist.org/sample8"
  },
  {
    id: 9,
    title: "1BR in Hell's Kitchen - Near Theater District",
    neighborhood: "Hell's Kitchen",
    price: 3400,
    bedrooms: 1,
    petFriendly: false,
    commuteMinutes: 18,
    scamScore: 2.8,
    postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    listingUrl: "https://newyork.craigslist.org/sample9"
  },
  {
    id: 10,
    title: "Spacious 2BR in Long Island City - Manhattan Views",
    neighborhood: "Long Island City",
    price: 3900,
    bedrooms: 2,
    petFriendly: true,
    commuteMinutes: 20,
    scamScore: 0.9,
    postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    listingUrl: "https://newyork.craigslist.org/sample10"
  }
];

// Function to get filtered mock listings based on alert criteria
export function getFilteredMockListings(filters?: {
  neighborhoods?: string[];
  minPrice?: number | null;
  maxPrice?: number | null;
  bedrooms?: number | null;
  petFriendly?: boolean;
  maxCommuteMinutes?: number | null;
}): ListingCardData[] {
  if (!filters) return mockListings;

  return mockListings.filter(listing => {
    // Neighborhood filter
    if (filters.neighborhoods && filters.neighborhoods.length > 0) {
      if (!listing.neighborhood || !filters.neighborhoods.includes(listing.neighborhood)) {
        return false;
      }
    }

    // Price filters
    if (filters.minPrice && listing.price < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice && listing.price > filters.maxPrice) {
      return false;
    }

    // Bedroom filter
    if (filters.bedrooms !== null && filters.bedrooms !== undefined) {
      if (listing.bedrooms !== filters.bedrooms) {
        return false;
      }
    }

    // Pet friendly filter
    if (filters.petFriendly && !listing.petFriendly) {
      return false;
    }

    // Commute time filter
    if (filters.maxCommuteMinutes && listing.commuteMinutes) {
      if (listing.commuteMinutes > filters.maxCommuteMinutes) {
        return false;
      }
    }

    return true;
  });
}

// Function to simulate new listings (for refresh functionality)
export function getNewMockListings(): ListingCardData[] {
  const newListings: ListingCardData[] = [
    {
      id: 101,
      title: "Just Listed! 1BR in SoHo - Hardwood Floors",
      neighborhood: "SoHo",
      price: 4200,
      bedrooms: 1,
      petFriendly: false,
      commuteMinutes: 12,
      scamScore: 1.1,
      postedAt: new Date().toISOString(), // Just posted
      listingUrl: "https://newyork.craigslist.org/new1"
    },
    {
      id: 102,
      title: "NEW: Studio in East Village - Available Immediately",
      neighborhood: "East Village",
      price: 2900,
      bedrooms: 0,
      petFriendly: true,
      commuteMinutes: 20,
      scamScore: 1.6,
      postedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      listingUrl: "https://newyork.craigslist.org/new2"
    }
  ];

  return newListings;
}