'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, MapPin, DollarSign, Home } from 'lucide-react';
import Link from 'next/link';
import Container from '@/components/layout/Container';
import ListingsGrid from '@/components/listings/ListingsGrid';
import { ListingCardData, ListingsPageState } from '@/lib/types/listings.types';
import { AlertFormData } from '@/components/forms/AlertForm';
import { formatPrice, formatBedrooms } from '@/lib/utils/listingHelpers';
import {
  DatabaseAlert,
  DatabaseListing,
  convertDatabaseListingToCardData,
  convertAlertToListingsParams,
} from '@/lib/utils/dataConverters';

function ListingsContent() {
  const searchParams = useSearchParams();
  const alertId = searchParams?.get('alertId');

  const [state, setState] = useState<ListingsPageState>({
    listings: [],
    isLoading: true,
    isRefreshing: false,
    lastRefresh: null,
    error: null,
  });

  // Simple refresh status
  const [refreshStatus, setRefreshStatus] = useState<string>('');

  // Real alert criteria loaded from API
  const [alertCriteria, setAlertCriteria] = useState<AlertFormData | null>(
    null
  );
  const [alertError, setAlertError] = useState<string | null>(null);

  // Load alert data from API
  const loadAlert = useCallback(async () => {
    if (!alertId) {
      setAlertError('No alert ID provided');
      return;
    }

    try {
      const response = await fetch(`/api/alerts/${alertId}`);
      if (!response.ok) {
        throw new Error('Failed to load alert');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to load alert');
      }

      const alert: DatabaseAlert = data.alert;
      // Store the full alert data for later use
      setAlertCriteria({
        email: alert.email,
        neighborhoods: alert.neighborhoods,
        minPrice: alert.min_price,
        maxPrice: alert.max_price,
        bedrooms: alert.bedrooms,
        petFriendly: alert.pet_friendly || false,
        commuteDestination: alert.commute_destination || '',
        maxCommuteMinutes: alert.max_commute_minutes,
        // Store coordinates in the correct format for AlertFormData
        commuteDestinationCoordinates:
          alert.commute_destination_lat && alert.commute_destination_lng
            ? {
                lat: alert.commute_destination_lat,
                lng: alert.commute_destination_lng,
              }
            : null,
      });
      setAlertError(null);
    } catch (error) {
      console.error('Error loading alert:', error);
      setAlertError('Failed to load alert criteria');
    }
  }, [alertId]);

  // Load listings from API based on alert criteria
  const loadListings = useCallback(
    async (isRefresh = false) => {
      if (!alertCriteria) return;

      if (!isRefresh) {
        setState((prev) => ({ ...prev, isLoading: true }));
      }

      try {
        // Convert alert criteria to API parameters
        const alertData: DatabaseAlert = {
          id: alertId || '',
          user_id: 0,
          email: alertCriteria.email,
          neighborhoods: alertCriteria.neighborhoods,
          min_price: alertCriteria.minPrice,
          max_price: alertCriteria.maxPrice,
          bedrooms: alertCriteria.bedrooms,
          pet_friendly: alertCriteria.petFriendly,
          max_commute_minutes: alertCriteria.maxCommuteMinutes,
          commute_destination: alertCriteria.commuteDestination,
          commute_destination_lat:
            alertCriteria.commuteDestinationCoordinates?.lat || null,
          commute_destination_lng:
            alertCriteria.commuteDestinationCoordinates?.lng || null,
          is_active: true,
          created_at: '',
        };

        const apiParams = convertAlertToListingsParams(alertData);
        const queryString = new URLSearchParams(apiParams).toString();

        const response = await fetch(`/api/listings?${queryString}`);
        if (!response.ok) {
          throw new Error('Failed to load listings');
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to load listings');
        }

        // Convert database listings to frontend format
        const convertedListings = data.listings.map(
          (dbListing: DatabaseListing) =>
            convertDatabaseListingToCardData(dbListing)
        );

        setState((prev) => ({
          ...prev,
          listings: convertedListings,
          isLoading: false,
          isRefreshing: isRefresh ? false : prev.isRefreshing,
          lastRefresh: isRefresh ? new Date() : prev.lastRefresh,
          error: null,
        }));
      } catch (error) {
        console.error('Error loading listings:', error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isRefreshing: isRefresh ? false : prev.isRefreshing,
          error: 'Failed to load listings. Please try again.',
        }));
      }
    },
    [alertCriteria, alertId]
  );

  // Load alert on mount, then load listings when alert is ready
  useEffect(() => {
    loadAlert();
  }, [loadAlert]);

  useEffect(() => {
    if (alertCriteria) {
      loadListings();
    }
  }, [alertCriteria, loadListings]);

  const handleRefresh = useCallback(async () => {
    if (!alertCriteria) return;

    setState((prev) => ({ ...prev, isRefreshing: true }));
    setRefreshStatus(
      'Checking for new listings - this could take up to 3 minutes...'
    );

    try {
      // Step 1: Trigger scraper job to get fresh listings
      setRefreshStatus(
        'Scanning Craigslist for new apartments - this could take up to 3 minutes...'
      );

      // Create a timeout promise
      const timeoutPromise = new Promise(
        (_, reject) =>
          setTimeout(() => reject(new Error('Scraper timeout')), 180000) // 3 minute timeout
      );

      const scraperPromise = fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'trigger',
          jobType: 'scraper',
        }),
      });

      try {
        const scraperResponse = await Promise.race([
          scraperPromise,
          timeoutPromise,
        ]);

        if (scraperResponse.ok) {
          setRefreshStatus('Found new listings! Loading results...');
        } else {
          setRefreshStatus('Loading existing listings...');
        }
      } catch (error) {
        setRefreshStatus('Loading existing listings...');
      }

      // Step 2: Load listings with fresh data
      await loadListings(true);
      setRefreshStatus('');
    } catch (error) {
      console.error('Error during refresh:', error);
      setRefreshStatus('');
      // Fallback to just loading existing listings
      await loadListings(true);
    }
  }, [alertCriteria, loadListings]);

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
          {alertCriteria && (
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
          )}

          {/* Error states */}
          {alertError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{alertError}</p>
            </div>
          )}
          {state.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{state.error}</p>
            </div>
          )}

          {/* Listings grid */}
          {alertCriteria ? (
            <ListingsGrid
              listings={state.listings}
              isLoading={state.isLoading}
              isRefreshing={state.isRefreshing}
              onRefresh={handleRefresh}
              refreshStatus={refreshStatus}
              alertId={alertId || undefined}
            />
          ) : (
            !alertError && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading alert criteria...</p>
              </div>
            )
          )}
        </div>
      </Container>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading listings...</p>
          </div>
        </div>
      }
    >
      <ListingsContent />
    </Suspense>
  );
}
