'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';

// Google Places Autocomplete result interface
export interface PlaceResult {
  address: string;
  placeId: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (result: PlaceResult | null) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
}

// Declare Google Maps types
declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Enter location...',
  className = '',
  error,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState(value);

  // Update local input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setLoadError('Google Maps API key not configured');
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already loading
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Wait for existing script to load
      const checkLoaded = () => {
        if (window.google && window.google.maps && window.google.maps.places) {
          setIsLoaded(true);
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    // Global callback function
    window.initGoogleMaps = () => {
      setIsLoaded(true);
    };

    script.onerror = () => {
      setLoadError('Failed to load Google Maps');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup callback
      if ('initGoogleMaps' in window) {
        delete (window as any).initGoogleMaps;
      }
    };
  }, []);

  // Initialize autocomplete when Google Maps is loaded
  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    try {
      // Create autocomplete instance
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ['establishment', 'geocode'], // Include businesses and addresses
          componentRestrictions: { country: 'us' }, // Restrict to US
          fields: [
            'place_id',
            'formatted_address',
            'name',
            'geometry.location',
          ], // Specify required fields
        }
      );

      autocompleteRef.current = autocomplete;

      // Handle place selection
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();

        if (!place || !place.place_id) {
          // Invalid selection
          return;
        }

        // Extract place data
        const result: PlaceResult = {
          address: place.formatted_address || place.name || '',
          placeId: place.place_id,
          coordinates: place.geometry?.location
            ? {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              }
            : undefined,
        };

        // Update local state and parent
        setInputValue(result.address);
        onChange(result);
      });
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
      setLoadError('Failed to initialize autocomplete');
    }
  }, [isLoaded, onChange]);

  // Handle manual input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Send text updates to parent (without place ID for manual typing)
    onChange({ address: newValue, placeId: '' });
  };

  if (loadError) {
    return (
      <div className="space-y-2">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={className}
          disabled={disabled}
        />
        <p className="text-yellow-600 text-sm flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          Places autocomplete unavailable - you can still enter addresses
          manually
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={isLoaded ? placeholder : 'Loading Places...'}
        className={`${className} ${error ? 'border-red-300' : ''}`}
        disabled={disabled || !isLoaded}
      />

      {!isLoaded && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-2 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
};

export default GooglePlacesAutocomplete;
