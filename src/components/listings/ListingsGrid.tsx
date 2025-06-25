'use client';

import React, { useState, useCallback } from 'react';
import { RefreshCw, Home, Search, AlertCircle } from 'lucide-react';
import { ListingsGridProps } from '@/lib/types/listings.types';
import ListingCard from './ListingCard';
import { sortListingsByDate } from '@/lib/utils/listingHelpers';

export default function ListingsGrid({
  listings,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  className = '',
}: ListingsGridProps) {
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  const handleRefresh = useCallback(() => {
    if (onRefresh && !isRefreshing) {
      setLastRefreshTime(new Date());
      onRefresh();
    }
  }, [onRefresh, isRefreshing]);

  // Sort listings by date (newest first)
  const sortedListings = sortListingsByDate(listings, false);

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border-2 border-gray-200 p-4 animate-pulse"
            >
              <div className="space-y-3">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="flex justify-between items-center pt-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!listings || listings.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No listings found
          </h3>
          <p className="text-gray-600 mb-6">
            We couldn't find any apartments matching your criteria. Try
            refreshing to check for new listings.
          </p>
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="
                inline-flex items-center gap-2 px-4 py-2
                bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300
                text-white font-medium rounded-lg
                transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              "
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              {isRefreshing ? 'Refreshing...' : 'Refresh Listings'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with count and refresh button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Home className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            {listings.length} Listing{listings.length !== 1 ? 's' : ''} Found
          </h2>
        </div>

        {onRefresh && (
          <div className="flex items-center gap-3">
            {lastRefreshTime && (
              <span className="text-sm text-gray-500">
                Last updated: {lastRefreshTime.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="
                inline-flex items-center gap-2 px-4 py-2
                bg-white border-2 border-gray-300 hover:border-blue-300 hover:bg-blue-50
                disabled:border-gray-200 disabled:bg-gray-50
                text-gray-700 font-medium rounded-lg
                transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              "
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        )}
      </div>

      {/* Refresh status indicator */}
      {isRefreshing && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
          <span className="text-sm text-blue-700">
            Checking for new listings...
          </span>
        </div>
      )}

      {/* Listings grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedListings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} className="h-full" />
        ))}
      </div>

      {/* Info message */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="font-medium text-gray-900 mb-1">
              About these listings
            </p>
            <ul className="space-y-1">
              <li>
                • Listings are automatically filtered based on your alert
                criteria
              </li>
              <li>• High-risk listings are flagged for your safety</li>
              <li>• Commute times are estimated via public transportation</li>
              <li>• Click "Refresh" to check for newly posted apartments</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
