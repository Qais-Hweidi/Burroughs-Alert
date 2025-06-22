'use client';

import React, { useState, useMemo } from 'react';
import { 
  Input, 
  Button, 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  CheckboxWithLabel
} from '@/components/ui';
import { Label } from '@/components/ui/label';
import { VALIDATION_LIMITS, NYC_NEIGHBORHOODS, getPopularNeighborhoods } from '@/lib/utils/constants';
import { NYCBorough, CreateAlertInput } from '@/lib/types/database.types';

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
  onSuccess: (data: AlertFormData) => void;
  initialData?: Partial<AlertFormData>;
  className?: string;
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Bedroom options for select dropdown
const BEDROOM_OPTIONS = Array.from({ length: 11 }, (_, i) => ({
  value: i.toString(),
  label: i === 0 ? 'Studio' : i === 1 ? '1 bedroom' : `${i} bedrooms`
}));

export default function AlertForm({ onSuccess, initialData, className }: AlertFormProps) {
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
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group neighborhoods by borough and sort popular ones first
  const neighborhoodsByBorough = useMemo(() => {
    const boroughs: NYCBorough[] = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];
    const popularNeighborhoods = getPopularNeighborhoods().map(n => n.name);

    return boroughs.map(borough => {
      const neighborhoods = NYC_NEIGHBORHOODS
        .filter(n => n.borough === borough)
        .sort((a, b) => {
          // Popular neighborhoods first
          const aIsPopular = popularNeighborhoods.includes(a.name);
          const bIsPopular = popularNeighborhoods.includes(b.name);
          
          if (aIsPopular && !bIsPopular) return -1;
          if (!aIsPopular && bIsPopular) return 1;
          
          // Then alphabetical
          return a.name.localeCompare(b.name);
        });

      return { borough, neighborhoods };
    });
  }, []);

  // Validation function
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (formData.email.length < VALIDATION_LIMITS.email.minLength) {
      newErrors.email = `Email must be at least ${VALIDATION_LIMITS.email.minLength} characters`;
    } else if (formData.email.length > VALIDATION_LIMITS.email.maxLength) {
      newErrors.email = `Email must be no more than ${VALIDATION_LIMITS.email.maxLength} characters`;
    }

    // Neighborhoods validation
    if (formData.neighborhoods.length === 0) {
      newErrors.neighborhoods = 'Please select at least one neighborhood';
    }

    // Price validation
    if (formData.minPrice !== null) {
      if (formData.minPrice < VALIDATION_LIMITS.price.min) {
        newErrors.minPrice = `Minimum price must be at least $${VALIDATION_LIMITS.price.min}`;
      }
    }

    if (formData.maxPrice !== null) {
      if (formData.maxPrice > VALIDATION_LIMITS.price.max) {
        newErrors.maxPrice = `Maximum price must be no more than $${VALIDATION_LIMITS.price.max}`;
      }
    }

    if (formData.minPrice !== null && formData.maxPrice !== null) {
      if (formData.maxPrice <= formData.minPrice) {
        newErrors.maxPrice = 'Maximum price must be greater than minimum price';
      }
    }

    // Commute validation
    if (formData.commuteDestination !== null && formData.commuteDestination.trim()) {
      if (formData.commuteDestination.trim().length < 3) {
        newErrors.commuteDestination = 'Commute destination must be at least 3 characters';
      } else if (formData.commuteDestination.length > 100) {
        newErrors.commuteDestination = 'Commute destination must be no more than 100 characters';
      }
    }

    if (formData.maxCommuteMinutes !== null) {
      if (formData.maxCommuteMinutes < 0) {
        newErrors.maxCommuteMinutes = 'Commute time cannot be negative';
      } else if (formData.maxCommuteMinutes > 180) {
        newErrors.maxCommuteMinutes = 'Commute time cannot exceed 180 minutes';
      }
    }

    // If commute time is specified but no destination, require destination
    if (formData.maxCommuteMinutes !== null && formData.maxCommuteMinutes > 0) {
      if (!formData.commuteDestination || !formData.commuteDestination.trim()) {
        newErrors.commuteDestination = 'Please specify your work/study location when setting a commute time';
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
      // Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Call success callback
      onSuccess(formData);
    } catch (error) {
      setErrors({ general: 'An error occurred while creating your alert. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof AlertFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle neighborhood selection
  const handleNeighborhoodToggle = (neighborhood: string) => {
    const isSelected = formData.neighborhoods.includes(neighborhood);
    
    if (isSelected) {
      handleInputChange('neighborhoods', formData.neighborhoods.filter(n => n !== neighborhood));
    } else {
      handleInputChange('neighborhoods', [...formData.neighborhoods, neighborhood]);
    }
  };

  // Handle borough selection
  const handleBoroughToggle = (borough: NYCBorough) => {
    const boroughNeighborhoods = NYC_NEIGHBORHOODS
      .filter(n => n.borough === borough)
      .map(n => n.name);
    
    const allBoroughSelected = boroughNeighborhoods.every(name => 
      formData.neighborhoods.includes(name)
    );
    
    if (allBoroughSelected) {
      // Deselect all neighborhoods in this borough
      const newNeighborhoods = formData.neighborhoods.filter(name => 
        !boroughNeighborhoods.includes(name)
      );
      handleInputChange('neighborhoods', newNeighborhoods);
    } else {
      // Select all neighborhoods in this borough
      const newNeighborhoods = [...new Set([...formData.neighborhoods, ...boroughNeighborhoods])];
      handleInputChange('neighborhoods', newNeighborhoods);
    }
  };

  // Get borough selection state
  const getBoroughState = (borough: NYCBorough) => {
    const boroughNeighborhoods = NYC_NEIGHBORHOODS
      .filter(n => n.borough === borough)
      .map(n => n.name);
    
    const selectedCount = boroughNeighborhoods.filter(name => 
      formData.neighborhoods.includes(name)
    ).length;
    
    if (selectedCount === 0) {
      return { checked: false, indeterminate: false };
    } else if (selectedCount === boroughNeighborhoods.length) {
      return { checked: true, indeterminate: false };
    } else {
      return { checked: false, indeterminate: true };
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className || 'space-y-4'}>
      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          type="email"
          placeholder="your.email@example.com"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          error={errors.email}
          required
        />
      </div>

      {/* Neighborhoods Selection */}
      <div className="space-y-2">
        <div>
          <Label>NYC Neighborhoods * ({formData.neighborhoods.length} selected)</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Select the neighborhoods where you&apos;d like to find apartments. Use borough checkboxes to select all neighborhoods in a borough.
          </p>
        </div>
        
        {errors.neighborhoods && (
          <p className="text-sm text-destructive" role="alert">
            {errors.neighborhoods}
          </p>
        )}

        <div 
          className="space-y-3 max-h-64 overflow-y-auto border rounded-lg p-3" 
          style={{
            transform: 'translateZ(0)', // Force GPU layer
            willChange: 'scroll-position', // Optimize for scrolling
            contain: 'layout style', // Isolate layout without size constraint
            WebkitOverflowScrolling: 'touch' // Smooth scrolling
          }}
        >
          {neighborhoodsByBorough.map(({ borough, neighborhoods }) => {
            const boroughState = getBoroughState(borough);
            
            return (
              <div key={borough} className="space-y-1.5">
                <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                  <CheckboxWithLabel
                    id={`borough-${borough}`}
                    label={`${borough} (${neighborhoods.length} neighborhoods)`}
                    description="Select All"
                    checked={boroughState.checked}
                    indeterminate={boroughState.indeterminate}
                    onCheckedChange={() => handleBoroughToggle(borough)}
                    className="font-semibold text-base"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 ml-6">
                  {neighborhoods.map((neighborhood) => {
                    const isSelected = formData.neighborhoods.includes(neighborhood.name);
                    
                    return (
                      <CheckboxWithLabel
                        key={neighborhood.name}
                        id={`neighborhood-${neighborhood.name}`}
                        label={neighborhood.name}
                        description={neighborhood.popular ? 'Popular' : undefined}
                        checked={isSelected}
                        onCheckedChange={() => handleNeighborhoodToggle(neighborhood.name)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minPrice">Minimum Price</Label>
          <Input
            id="minPrice"
            type="number"
            placeholder="$500"
            min={VALIDATION_LIMITS.price.min}
            max={VALIDATION_LIMITS.price.max}
            value={formData.minPrice || ''}
            onChange={(e) => handleInputChange('minPrice', e.target.value ? parseInt(e.target.value) : null)}
            error={errors.minPrice}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="maxPrice">Maximum Price</Label>
          <Input
            id="maxPrice"
            type="number"
            placeholder="$5000"
            min={VALIDATION_LIMITS.price.min}
            max={VALIDATION_LIMITS.price.max}
            value={formData.maxPrice || ''}
            onChange={(e) => handleInputChange('maxPrice', e.target.value ? parseInt(e.target.value) : null)}
            error={errors.maxPrice}
          />
        </div>
      </div>

      {/* Number of Bedrooms */}
      <div className="space-y-2">
        <Label htmlFor="bedrooms">Number of Bedrooms</Label>
        <Select 
          value={formData.bedrooms?.toString() || 'any'} 
          onValueChange={(value) => handleInputChange('bedrooms', value === 'any' ? null : parseInt(value))}
        >
          <SelectTrigger id="bedrooms">
            <SelectValue placeholder="Any number of bedrooms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any number of bedrooms</SelectItem>
            {BEDROOM_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pet Friendly */}
      <div className="space-y-2">
        <CheckboxWithLabel
          id="petFriendly"
          label="Pet Friendly"
          description="Only show listings that allow pets"
          checked={formData.petFriendly}
          onCheckedChange={(checked) => handleInputChange('petFriendly', checked)}
        />
      </div>

      {/* Commute Information */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">Commute Preferences (optional)</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Help us filter apartments based on your daily commute to work or school. We'll estimate travel times using public transit.
          </p>
        </div>

        {/* Work/Study Location */}
        <div className="space-y-2">
          <Label htmlFor="commuteDestination">Work/Study Location</Label>
          <Input
            id="commuteDestination"
            type="text"
            placeholder="e.g., Times Square, Manhattan or Columbia University"
            value={formData.commuteDestination || ''}
            onChange={(e) => handleInputChange('commuteDestination', e.target.value || null)}
            error={errors.commuteDestination}
          />
          <p className="text-sm text-muted-foreground">
            Enter your workplace address, company name, or general area (e.g., "Financial District", "Google NYC", "NYU")
          </p>
        </div>

        {/* Maximum Commute Time */}
        <div className="space-y-2">
          <Label htmlFor="maxCommuteMinutes">Maximum Commute Time (minutes)</Label>
          <Input
            id="maxCommuteMinutes"
            type="number"
            placeholder="45"
            min="5"
            max="180"
            value={formData.maxCommuteMinutes || ''}
            onChange={(e) => handleInputChange('maxCommuteMinutes', e.target.value ? parseInt(e.target.value) : null)}
            error={errors.maxCommuteMinutes}
          />
          <p className="text-sm text-muted-foreground">
            Maximum acceptable commute time by public transit. We'll only show apartments within this travel time from your work/study location.
          </p>
        </div>
      </div>

      {/* General Error */}
      {errors.general && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive" role="alert">
            {errors.general}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            Creating Alert...
          </>
        ) : (
          'Create Alert'
        )}
      </Button>

      {/* Form Information */}
      <div className="text-sm text-muted-foreground space-y-0.5 mt-3">
        <p>• We&apos;ll email you when new apartments matching your criteria are found</p>
        <p>• You can unsubscribe at any time</p>
        <p>• We only send relevant apartment alerts, no spam</p>
      </div>
    </form>
  );
}