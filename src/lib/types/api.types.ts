/**
 * API Type Definitions
 * TypeScript interfaces for API requests, responses, and validation
 */

import { ParsedAlert, ParsedListing, User, NYCNeighborhood } from './database.types';

// ================================
// Standard API Response Structure
// ================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: string[] | any;
  timestamp?: string;
}

// ================================
// Alert Management API
// ================================

export interface CreateAlertRequest {
  email: string;
  neighborhoods: string[];
  minPrice?: number;
  maxPrice: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  petFriendly?: boolean;
  maxCommuteMinutes?: number;
  commuteDestination?: string;
}

export interface CreateAlertResponse {
  alertId: number;
  userId: number;
  message: string;
}

export interface GetUserAlertsResponse {
  user: {
    email: string;
    createdAt: string;
  };
  alerts: Array<{
    id: number;
    neighborhoods: string[];
    minPrice: number | null;
    maxPrice: number | null;
    minBedrooms: number | null;
    maxBedrooms: number | null;
    petFriendly: boolean | null;
    maxCommuteMinutes: number | null;
    commuteDestination: string | null;
    isActive: boolean;
    createdAt: string;
  }>;
}

export interface UpdateAlertRequest {
  neighborhoods?: string[];
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  petFriendly?: boolean;
  maxCommuteMinutes?: number;
  commuteDestination?: string;
  isActive?: boolean;
}

// ================================
// Unsubscribe API
// ================================

export interface UnsubscribeByEmailRequest {
  email: string;
}

export interface UnsubscribeResponse {
  message: string;
}

// ================================
// Listings API
// ================================

export interface GetListingsQuery {
  limit?: number;
  page?: number;
  neighborhood?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  petFriendly?: boolean;
  maxScamScore?: number;
}

export interface ListingsSummary {
  id: number;
  title: string;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  neighborhood: string | null;
  address: string | null;
  petFriendly: boolean | null;
  listingUrl: string;
  postedAt: string | null;
  scamScore: number;
}

export interface GetListingsResponse {
  listings: ListingsSummary[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ListingDetails {
  id: number;
  title: string;
  description: string | null;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  neighborhood: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  petFriendly: boolean | null;
  images: string[];
  contactInfo: {
    phone?: string;
    email?: string;
    name?: string;
  } | null;
  listingUrl: string;
  source: string;
  postedAt: string | null;
  scrapedAt: string;
  scamScore: number;
}

export interface GetListingResponse {
  listing: ListingDetails;
}

// ================================
// Health Check API
// ================================

export interface HealthComponentStatus {
  status: 'healthy' | 'degraded' | 'error';
  lastRun?: string;
  lastSuccess?: string;
  recentCount?: number;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  components: {
    database: 'healthy' | 'error';
    scraper: HealthComponentStatus;
    notifications: HealthComponentStatus;
  };
  version: string;
}

// ================================
// Neighborhoods API
// ================================

export interface GetNeighborhoodsResponse {
  neighborhoods: NYCNeighborhood[];
}

// ================================
// Error Codes
// ================================

export type ValidationErrorCode = 
  | 'VALIDATION_ERROR'
  | 'INVALID_EMAIL'
  | 'INVALID_NEIGHBORHOOD'
  | 'PRICE_RANGE_ERROR'
  | 'REQUIRED_FIELD_MISSING';

export type ResourceErrorCode =
  | 'ALERT_NOT_FOUND'
  | 'USER_NOT_FOUND'
  | 'LISTING_NOT_FOUND';

export type ServerErrorCode =
  | 'DATABASE_ERROR'
  | 'EMAIL_SERVICE_ERROR'
  | 'SCRAPING_ERROR'
  | 'INTERNAL_ERROR';

export type RateLimitErrorCode = 'RATE_LIMIT_EXCEEDED';

export type ApiErrorCode = 
  | ValidationErrorCode
  | ResourceErrorCode
  | ServerErrorCode
  | RateLimitErrorCode;

// ================================
// Request Validation Types
// ================================

export interface ValidationContext {
  userAgent?: string;
  ipAddress?: string;
  timestamp: number;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// ================================
// Internal API Types (for services)
// ================================

export interface MatchingRequest {
  alertId: number;
  userId: number;
  alert: ParsedAlert;
}

export interface MatchingResult {
  alertId: number;
  userId: number;
  matches: ParsedListing[];
  totalMatches: number;
}

export interface NotificationRequest {
  userId: number;
  alertId: number;
  listings: ParsedListing[];
  user: User;
  alert: ParsedAlert;
}

export interface NotificationResult {
  sent: boolean;
  recipientEmail: string;
  listingCount: number;
  error?: string;
}

export interface ScrapingRequest {
  neighborhoods?: string[];
  maxPages?: number;
  delay?: number;
}

export interface ScrapingResult {
  success: boolean;
  listingsFound: number;
  listingsAdded: number;
  errors: string[];
  duration: number;
}

// ================================
// Webhook/External API Types
// ================================

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
}

export interface CommuteApiRequest {
  origin: string;
  destination: string;
  mode?: 'transit' | 'driving' | 'walking';
}

export interface CommuteApiResponse {
  duration: number; // in minutes
  distance: number; // in meters
  mode: string;
  routes?: any[];
}

// ================================
// Frontend-specific Types
// ================================

export interface FormValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface FormState<T> {
  data: T;
  errors: FormValidationError[];
  isSubmitting: boolean;
  submitError?: string;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
  data?: any;
}

// ================================
// Admin/Debug Types
// ================================

export interface DebugInfo {
  timestamp: string;
  environment: string;
  version: string;
  database: {
    connected: boolean;
    tables: Record<string, number>;
  };
  services: {
    scraper: HealthComponentStatus;
    emailService: HealthComponentStatus;
    matchingEngine: HealthComponentStatus;
  };
}

export interface AdminStatsResponse {
  users: {
    total: number;
    active: number;
    withAlerts: number;
  };
  alerts: {
    total: number;
    active: number;
    byNeighborhood: Record<string, number>;
  };
  listings: {
    total: number;
    active: number;
    recentlyAdded: number;
    byNeighborhood: Record<string, number>;
  };
  notifications: {
    totalSent: number;
    last24h: number;
    last7days: number;
    deliveryStats: Record<string, number>;
  };
}

// ================================
// Type Guards
// ================================

export function isApiError(response: ApiResponse): response is ApiResponse & { error: ApiError } {
  return !response.success && !!response.error;
}

export function isValidationError(error: ApiError): error is ApiError & { code: ValidationErrorCode } {
  const validationCodes: ValidationErrorCode[] = [
    'VALIDATION_ERROR',
    'INVALID_EMAIL',
    'INVALID_NEIGHBORHOOD',
    'PRICE_RANGE_ERROR',
    'REQUIRED_FIELD_MISSING'
  ];
  return validationCodes.includes(error.code as ValidationErrorCode);
}

export function isResourceNotFoundError(error: ApiError): error is ApiError & { code: ResourceErrorCode } {
  const resourceCodes: ResourceErrorCode[] = [
    'ALERT_NOT_FOUND',
    'USER_NOT_FOUND',
    'LISTING_NOT_FOUND'
  ];
  return resourceCodes.includes(error.code as ResourceErrorCode);
}