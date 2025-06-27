'use client';

import React from 'react';
import {
  MapPin,
  Home,
  Clock,
  Heart,
  AlertTriangle,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import { ListingCardProps } from '@/lib/types/listings.types';
import {
  formatListing,
  shouldShowScamWarning,
  shouldShowNewBadge,
  getListingDomain,
} from '@/lib/utils/listingHelpers';

export default function ListingCard({
  listing,
  className = '',
}: ListingCardProps) {
  const formatted = formatListing(listing);
  const showScamWarning = shouldShowScamWarning(listing.scamScore);
  const showNewBadge = shouldShowNewBadge(listing.postedAt);
  const domain = getListingDomain(listing.listingUrl);

  return (
    <div
      className={`
      bg-white rounded-lg border-2 border-gray-200 
      hover:border-blue-300 hover:shadow-lg 
      transition-all duration-200 cursor-pointer
      ${className}
    `}
    >
      {/* Header with badges */}
      <div className="p-4 pb-0">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 line-clamp-2 text-lg leading-tight">
              {listing.title}
            </h3>
          </div>
          <div className="flex flex-col items-end gap-1 ml-2">
            {showNewBadge && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                NEW
              </span>
            )}
            {showScamWarning && (
              <span
                className={`
                px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1
                ${formatted.scamIndicator.color} 
                ${formatted.scamIndicator.bgColor} 
                ${formatted.scamIndicator.borderColor} border
                cursor-help
              `}
                title={
                  formatted.scamIndicator.level === 'high'
                    ? 'High risk - verify carefully'
                    : formatted.scamIndicator.level === 'medium'
                      ? 'Medium risk - check details'
                      : 'Low risk - appears legitimate'
                }
              >
                <AlertTriangle className="w-3 h-3" />
                {formatted.scamIndicator.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="p-4 pt-2">
        {/* Price and bedrooms */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-2xl font-bold text-blue-600">
            {formatted.formattedPrice}
            <span className="text-sm text-gray-500 font-normal">/month</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Home className="w-4 h-4 mr-1" />
            <span className="text-sm font-medium">
              {formatted.formattedBedrooms}
            </span>
          </div>
        </div>

        {/* Location and details grid */}
        <div className="space-y-2 mb-4">
          {/* Neighborhood */}
          {listing.neighborhood && (
            <div className="flex items-center text-gray-700">
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="text-sm font-medium">
                {listing.neighborhood}
              </span>
            </div>
          )}

          {/* Commute time */}
          <div className="flex items-center text-gray-600">
            <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="text-sm">
              Commute:{' '}
              {listing.commuteMinutes
                ? `${listing.commuteMinutes} minutes`
                : 'Not calculated'}
            </span>
          </div>

          {/* Pet friendly */}
          <div className="flex items-center text-gray-600">
            <Heart className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="text-sm">
              Pets:{' '}
              {listing.petFriendly === true
                ? 'Allowed'
                : listing.petFriendly === false
                  ? 'Not allowed'
                  : 'Not mentioned'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          {/* Posted time */}
          <div className="flex items-center text-gray-500 text-sm">
            <Calendar className="w-4 h-4 mr-1" />
            {formatted.relativeTime}
          </div>

          {/* View listing button */}
          <a
            href={listing.listingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-flex items-center gap-1 px-3 py-1.5
              bg-blue-600 hover:bg-blue-700 
              text-white text-sm font-medium 
              rounded-lg transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
            "
            onClick={(e) => e.stopPropagation()}
          >
            View Listing
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Source domain */}
        <div className="mt-2 text-xs text-gray-400">Source: {domain}</div>
      </div>
    </div>
  );
}
