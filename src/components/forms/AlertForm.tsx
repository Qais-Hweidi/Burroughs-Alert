'use client';

import React, { useState, useMemo } from 'react';
import {
  Mail,
  MapPin,
  DollarSign,
  Home,
  Heart,
  Clock,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  VALIDATION_LIMITS,
  NYC_NEIGHBORHOODS,
  getPopularNeighborhoods,
} from '@/lib/utils/constants';
import { NYCBorough } from '@/lib/types/database.types';
import GooglePlacesAutocomplete, {
  PlaceResult,
} from './GooglePlacesAutocomplete';

// Form data interface
export interface AlertFormData {
  email: string;
  neighborhoods: string[];
  minPrice: number | null;
  maxPrice: number | null;
  bedrooms: number | null;
  petFriendly: boolean;
  commuteDestination: string | null;
  maxCommuteMinutes: number | null;
  // Enhanced commute data from Places API
  commuteDestinationPlaceId?: string | null;
  commuteDestinationCoordinates?: { lat: number; lng: number } | null;
}

// Form validation errors interface
interface FormErrors {
  email?: string;
  neighborhoods?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  petFriendly?: string;
  commuteDestination?: string;
  maxCommuteMinutes?: string;
  general?: string;
}

// Component props interface
export interface AlertFormProps {
  onSuccess: (data: AlertFormData, alertId?: number) => void;
  initialData?: Partial<AlertFormData>;
  className?: string;
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Bedroom options for select dropdown
const BEDROOM_OPTIONS = Array.from({ length: 11 }, (_, i) => ({
  value: i.toString(),
  label: i === 0 ? 'Studio' : i === 1 ? '1 bedroom' : `${i} bedrooms`,
}));

export default function AlertForm({
  onSuccess,
  initialData,
  className,
}: AlertFormProps) {
  // Form state
  const [formData, setFormData] = useState<AlertFormData>({
    email: initialData?.email || '',
    neighborhoods: initialData?.neighborhoods || [],
    minPrice: initialData?.minPrice || null,
    maxPrice: initialData?.maxPrice || null,
    bedrooms: initialData?.bedrooms || null,
    petFriendly: initialData?.petFriendly || false,
    commuteDestination: initialData?.commuteDestination || null,
    maxCommuteMinutes: initialData?.maxCommuteMinutes || null,
    commuteDestinationPlaceId: initialData?.commuteDestinationPlaceId || null,
    commuteDestinationCoordinates:
      initialData?.commuteDestinationCoordinates || null,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Group neighborhoods by borough and sort popular ones first
  const neighborhoodsByBorough = useMemo(() => {
    const boroughs: NYCBorough[] = [
      'Manhattan',
      'Brooklyn',
      'Queens',
      'Bronx',
      'Staten Island',
    ];
    const popularNeighborhoods = getPopularNeighborhoods().map((n) => n.name);

    return boroughs.map((borough) => {
      const neighborhoods = NYC_NEIGHBORHOODS.filter(
        (n) => n.borough === borough
      ).sort((a, b) => {
        const aIsPopular = popularNeighborhoods.includes(a.name);
        const bIsPopular = popularNeighborhoods.includes(b.name);

        if (aIsPopular && !bIsPopular) return -1;
        if (!aIsPopular && bIsPopular) return 1;

        return a.name.localeCompare(b.name);
      });

      return { borough, neighborhoods };
    });
  }, []);

  // Validation function
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.neighborhoods.length === 0) {
      newErrors.neighborhoods = 'Please select at least one neighborhood';
    }

    if (formData.minPrice !== null && formData.maxPrice !== null) {
      if (formData.maxPrice <= formData.minPrice) {
        newErrors.maxPrice = 'Maximum price must be greater than minimum price';
      }
    }

    if (formData.maxCommuteMinutes !== null && formData.maxCommuteMinutes > 0) {
      if (!formData.commuteDestination || !formData.commuteDestination.trim()) {
        newErrors.commuteDestination =
          'Please specify your work location when setting a commute time';
      }
    }

    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Call real API to create alert
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          neighborhoods: formData.neighborhoods,
          min_price: formData.minPrice,
          max_price: formData.maxPrice,
          bedrooms: formData.bedrooms,
          pet_friendly: formData.petFriendly,
          max_commute_minutes: formData.maxCommuteMinutes,
          commute_destination: formData.commuteDestination,
          commute_destination_place_id: formData.commuteDestinationPlaceId,
          commute_destination_coordinates:
            formData.commuteDestinationCoordinates,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create alert');
      }

      const data = await response.json();
      onSuccess(formData, data.alert.id);
    } catch (error) {
      setErrors({
        general:
          'An error occurred while creating your alert. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof AlertFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle neighborhood selection
  const handleNeighborhoodToggle = (neighborhood: string) => {
    const isSelected = formData.neighborhoods.includes(neighborhood);
    if (isSelected) {
      handleInputChange(
        'neighborhoods',
        formData.neighborhoods.filter((n) => n !== neighborhood)
      );
    } else {
      handleInputChange('neighborhoods', [
        ...formData.neighborhoods,
        neighborhood,
      ]);
    }
  };

  // Handle borough selection
  const handleBoroughToggle = (borough: NYCBorough) => {
    const boroughNeighborhoods = NYC_NEIGHBORHOODS.filter(
      (n) => n.borough === borough
    ).map((n) => n.name);

    const allBoroughSelected = boroughNeighborhoods.every((name) =>
      formData.neighborhoods.includes(name)
    );

    if (allBoroughSelected) {
      const newNeighborhoods = formData.neighborhoods.filter(
        (name) => !boroughNeighborhoods.includes(name)
      );
      handleInputChange('neighborhoods', newNeighborhoods);
    } else {
      const newNeighborhoods = [
        ...new Set([...formData.neighborhoods, ...boroughNeighborhoods]),
      ];
      handleInputChange('neighborhoods', newNeighborhoods);
    }
  };

  // Handle Google Places selection
  const handlePlaceSelect = (placeResult: PlaceResult | null) => {
    if (placeResult) {
      setFormData((prev) => ({
        ...prev,
        commuteDestination: placeResult.address,
        commuteDestinationPlaceId: placeResult.placeId || null,
        commuteDestinationCoordinates: placeResult.coordinates || null,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        commuteDestination: null,
        commuteDestinationPlaceId: null,
        commuteDestinationCoordinates: null,
      }));
    }

    // Clear commute destination error if it exists
    if (errors.commuteDestination) {
      setErrors((prev) => ({ ...prev, commuteDestination: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {/* Email Section */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3">
            <Mail className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Email Address</h3>
        </div>
        <input
          type="email"
          placeholder="Enter your email address"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            errors.email ? 'border-red-300' : 'border-gray-200'
          }`}
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-2 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.email}
          </p>
        )}
      </div>

      {/* Neighborhoods Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              NYC Neighborhoods
            </h3>
          </div>
          <span className="text-sm text-gray-500">
            {formData.neighborhoods.length} selected
          </span>
        </div>

        {errors.neighborhoods && (
          <p className="text-red-500 text-sm mb-4 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.neighborhoods}
          </p>
        )}

        <div className="max-h-80 overflow-y-auto border-2 border-gray-200 rounded-lg p-4 space-y-4">
          {neighborhoodsByBorough.map(({ borough, neighborhoods }) => {
            const boroughNeighborhoods = neighborhoods.map((n) => n.name);
            const selectedCount = boroughNeighborhoods.filter((name) =>
              formData.neighborhoods.includes(name)
            ).length;
            const allSelected = selectedCount === boroughNeighborhoods.length;
            const someSelected = selectedCount > 0;

            return (
              <div key={borough} className="space-y-2">
                <div className="flex items-center p-2 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id={`borough-${borough}`}
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected && !allSelected;
                    }}
                    onChange={() => handleBoroughToggle(borough)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`borough-${borough}`}
                    className="ml-2 font-medium text-gray-900 cursor-pointer"
                  >
                    {borough} ({neighborhoods.length} neighborhoods)
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2 ml-6">
                  {neighborhoods.map((neighborhood) => {
                    const isSelected = formData.neighborhoods.includes(
                      neighborhood.name
                    );
                    return (
                      <label
                        key={neighborhood.name}
                        className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            handleNeighborhoodToggle(neighborhood.name)
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {neighborhood.name}
                          {neighborhood.popular && (
                            <span className="ml-1 text-xs text-blue-600">
                              ★
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Price Range Section */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mr-3">
            <DollarSign className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Price Range</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Price
            </label>
            <input
              type="number"
              placeholder="$500"
              value={formData.minPrice || ''}
              onChange={(e) =>
                handleInputChange(
                  'minPrice',
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Price
            </label>
            <input
              type="number"
              placeholder="$5000"
              value={formData.maxPrice || ''}
              onChange={(e) =>
                handleInputChange(
                  'maxPrice',
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.maxPrice ? 'border-red-300' : 'border-gray-200'
              }`}
            />
            {errors.maxPrice && (
              <p className="text-red-500 text-sm mt-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.maxPrice}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bedrooms Section */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mr-3">
            <Home className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Number of Bedrooms
          </h3>
        </div>
        <select
          value={formData.bedrooms?.toString() || 'any'}
          onChange={(e) =>
            handleInputChange(
              'bedrooms',
              e.target.value === 'any' ? null : parseInt(e.target.value)
            )
          }
          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        >
          <option value="any">Any number of bedrooms</option>
          {BEDROOM_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Pet Friendly Section */}
      <div className="mb-8">
        <div className="flex items-center p-4 bg-pink-50 rounded-lg">
          <div className="w-8 h-8 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center mr-3">
            <Heart className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              Pet Friendly
            </h3>
            <p className="text-sm text-gray-600">
              Only show listings that allow pets
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.petFriendly}
              onChange={(e) =>
                handleInputChange('petFriendly', e.target.checked)
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Commute Preferences Section */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mr-3">
            <Clock className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Commute Preferences
          </h3>
          <span className="ml-2 text-sm text-gray-500">(Optional)</span>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work/Study Location
            </label>
            <GooglePlacesAutocomplete
              value={formData.commuteDestination || ''}
              onChange={handlePlaceSelect}
              placeholder="e.g., Times Square, Manhattan or Columbia University"
              className="w-full px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors border-gray-200"
              error={errors.commuteDestination}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Commute Time (minutes)
            </label>
            <input
              type="number"
              placeholder="45"
              min="5"
              max="180"
              value={formData.maxCommuteMinutes || ''}
              onChange={(e) =>
                handleInputChange(
                  'maxCommuteMinutes',
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* General Error */}
      {errors.general && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-red-700 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            {errors.general}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors flex items-center justify-center"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Creating Alert...
          </>
        ) : (
          <>
            <Check className="w-5 h-5 mr-2" />
            Create My Alert
          </>
        )}
      </button>

      {/* Form Information */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">What happens next?</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>
            • We'll email you when apartments matching your criteria are found
          </li>
          <li>• You can unsubscribe at any time</li>
          <li>• We only send relevant apartment alerts, no spam</li>
        </ul>
      </div>
    </form>
  );
}
