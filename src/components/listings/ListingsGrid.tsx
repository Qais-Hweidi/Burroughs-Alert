'use client';

import React, { useState, useCallback } from 'react';
import { RefreshCw, Home, Search, AlertCircle, UserMinus } from 'lucide-react';
import { ListingsGridProps } from '@/lib/types/listings.types';
import ListingCard from './ListingCard';
import { sortListingsByDate } from '@/lib/utils/listingHelpers';

export default function ListingsGrid({
  listings,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  onUnsubscribe,
  refreshStatus = '',
  className = '',
  alertId,
}: ListingsGridProps) {
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [showUnsubscribeConfirm, setShowUnsubscribeConfirm] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);

  const handleRefresh = useCallback(() => {
    if (onRefresh && !isRefreshing) {
      setLastRefreshTime(new Date());
      onRefresh();
    }
  }, [onRefresh, isRefreshing]);

  const handleUnsubscribe = useCallback(async () => {
    if (!alertId || isUnsubscribing) return;

    setIsUnsubscribing(true);

    try {
      const response = await fetch(`/api/alerts/${alertId}/unsubscribe`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        alert(
          'You have been successfully unsubscribed. You will be redirected to the homepage.'
        );
        // Redirect to homepage after successful unsubscribe
        window.location.href = '/';
      } else {
        alert(`Unsubscribe failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
      alert('An error occurred while unsubscribing. Please try again.');
    } finally {
      setIsUnsubscribing(false);
      setShowUnsubscribeConfirm(false);
    }
  }, [alertId, isUnsubscribing]);

  const handleUnsubscribeClick = useCallback(() => {
    setShowUnsubscribeConfirm(true);
  }, []);

  const handleCancelUnsubscribe = useCallback(() => {
    setShowUnsubscribeConfirm(false);
  }, []);

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
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {listings.length} Listing{listings.length !== 1 ? 's' : ''} Found
            </h2>
          </div>
          <p className="text-sm text-gray-500">
            Showing newest 50 matches - subscribe for more
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastRefreshTime && (
            <span className="text-sm text-gray-500">
              Last updated: {lastRefreshTime.toLocaleTimeString()}
            </span>
          )}

          {onRefresh && (
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
          )}

          {alertId && (
            <button
              onClick={handleUnsubscribeClick}
              disabled={isUnsubscribing}
              className="
                inline-flex items-center gap-2 px-4 py-2
                bg-white border-2 border-red-300 hover:border-red-400 hover:bg-red-50
                disabled:border-gray-200 disabled:bg-gray-50
                text-red-700 font-medium rounded-lg
                transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
              "
            >
              <UserMinus className="w-4 h-4" />
              {isUnsubscribing ? 'Unsubscribing...' : 'Unsubscribe'}
            </button>
          )}
        </div>
      </div>

      {/* Refresh status indicator */}
      {isRefreshing && (
        <div className="flex flex-col gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
            <span className="text-sm font-medium text-blue-700">
              {refreshStatus || 'Refreshing listings...'}
            </span>
          </div>
        </div>
      )}

      {/* Unsubscribe confirmation modal */}
      {showUnsubscribeConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <UserMinus className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirm Unsubscribe
                </h3>
                <p className="text-sm text-gray-600">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to unsubscribe from all apartment alerts?
              </p>
              <p className="text-sm text-gray-600">
                This will permanently delete your account and all your alert
                preferences. You will stop receiving email notifications
                immediately.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelUnsubscribe}
                disabled={isUnsubscribing}
                className="
                  px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200
                  disabled:bg-gray-50 disabled:text-gray-400
                  rounded-lg font-medium transition-colors
                "
              >
                Cancel
              </button>
              <button
                onClick={handleUnsubscribe}
                disabled={isUnsubscribing}
                className="
                  px-4 py-2 bg-red-600 hover:bg-red-700 text-white
                  disabled:bg-red-300
                  rounded-lg font-medium transition-colors
                  inline-flex items-center gap-2
                "
              >
                {isUnsubscribing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Unsubscribing...
                  </>
                ) : (
                  <>
                    <UserMinus className="w-4 h-4" />
                    Yes, Unsubscribe
                  </>
                )}
              </button>
            </div>
          </div>
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
