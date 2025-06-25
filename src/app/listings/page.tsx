'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, MapPin, DollarSign, Home } from 'lucide-react';
import Link from 'next/link';
import Container from '@/components/layout/Container';
import ListingsGrid from '@/components/listings/ListingsGrid';
import { ListingCardData, ListingsPageState } from '@/lib/types/listings.types';
import { AlertFormData } from '@/components/forms/AlertForm';
import {
  mockListings,
  getFilteredMockListings,
  getNewMockListings,
} from '@/lib/utils/mockListings';
import { formatPrice, formatBedrooms } from '@/lib/utils/listingHelpers';

export default function ListingsPage() {
  const searchParams = useSearchParams();
  const alertId = searchParams?.get('alertId');

  const [state, setState] = useState<ListingsPageState>({
    listings: [],
    isLoading: true,
    isRefreshing: false,
    lastRefresh: null,
    error: null,
  });

  // Mock alert criteria - in real app this would come from API based on alertId
  const [alertCriteria] = useState<AlertFormData>({
    email: 'user@example.com',
    neighborhoods: ['Williamsburg', 'Lower East Side', 'Park Slope'],
    minPrice: 2500,
    maxPrice: 4000,
    bedrooms: 1,
    petFriendly: false,
    commuteDestination: 'Times Square',
    maxCommuteMinutes: 30,
  });

  // Load initial listings
  const loadListings = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setState((prev) => ({ ...prev, isRefreshing: true }));
      } else {
        setState((prev) => ({ ...prev, isLoading: true }));
      }

      try {
        // Simulate API delay
        await new Promise((resolve) =>
          setTimeout(resolve, isRefresh ? 1000 : 1500)
        );

        // Get filtered listings based on alert criteria
        const baseListings = getFilteredMockListings({
          neighborhoods: alertCriteria.neighborhoods,
          minPrice: alertCriteria.minPrice,
          maxPrice: alertCriteria.maxPrice,
          bedrooms: alertCriteria.bedrooms,
          petFriendly: alertCriteria.petFriendly,
          maxCommuteMinutes: alertCriteria.maxCommuteMinutes,
        });

        let finalListings = baseListings;

        // If refreshing, add some new listings at the top
        if (isRefresh) {
          const newListings = getNewMockListings();
          finalListings = [...newListings, ...baseListings];
        }

        setState((prev) => ({
          ...prev,
          listings: finalListings,
          isLoading: false,
          isRefreshing: false,
          lastRefresh: isRefresh ? new Date() : prev.lastRefresh,
          error: null,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          error: 'Failed to load listings. Please try again.',
        }));
      }
    },
    [alertCriteria]
  );

  // Load listings on mount
  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const handleRefresh = useCallback(() => {
    loadListings(true);
  }, [loadListings]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Container>
        <div className="py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link
                href="/alerts/create"
                className="
                  inline-flex items-center gap-2 px-3 py-2
                  text-gray-600 hover:text-gray-900 hover:bg-gray-100
                  rounded-lg transition-colors
                "
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Alert Setup
              </Link>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Available Apartments
            </h1>
            <p className="text-gray-600">
              Listings matching your search criteria
            </p>
          </div>

          {/* Alert criteria summary */}
          <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">
              Your Search Criteria
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Neighborhoods */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">
                    Neighborhoods
                  </div>
                  <div className="text-sm text-gray-600">
                    {alertCriteria.neighborhoods.length} selected
                  </div>
                </div>
              </div>

              {/* Price Range */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">
                    Price Range
                  </div>
                  <div className="text-sm text-gray-600">
                    {alertCriteria.minPrice
                      ? formatPrice(alertCriteria.minPrice)
                      : 'Any'}{' '}
                    -{' '}
                    {alertCriteria.maxPrice
                      ? formatPrice(alertCriteria.maxPrice)
                      : 'Any'}
                  </div>
                </div>
              </div>

              {/* Bedrooms */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Home className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">
                    Bedrooms
                  </div>
                  <div className="text-sm text-gray-600">
                    {alertCriteria.bedrooms !== null
                      ? formatBedrooms(alertCriteria.bedrooms)
                      : 'Any'}
                  </div>
                </div>
              </div>

              {/* Additional filters */}
              <div className="flex flex-col gap-2">
                {alertCriteria.petFriendly && (
                  <div className="text-sm">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 text-pink-700 rounded-full">
                      🐾 Pet Friendly
                    </span>
                  </div>
                )}
                {alertCriteria.maxCommuteMinutes && (
                  <div className="text-sm">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                      🚇 ≤ {alertCriteria.maxCommuteMinutes} min commute
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error state */}
          {state.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{state.error}</p>
            </div>
          )}

          {/* Listings grid */}
          <ListingsGrid
            listings={state.listings}
            isLoading={state.isLoading}
            isRefreshing={state.isRefreshing}
            onRefresh={handleRefresh}
          />
        </div>
      </Container>
    </div>
  );
}
