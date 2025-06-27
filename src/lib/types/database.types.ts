/**
 * Database Type Definitions
 * TypeScript interfaces for all database tables and related types
 */

// ================================
// Database Table Types
// ================================

export interface User {
  id: number;
  email: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  unsubscribe_token: string | null;
}

export interface Alert {
  id: number;
  user_id: number;
  neighborhoods: string; // JSON array stored as string
  min_price: number | null;
  max_price: number | null;
  bedrooms: number | null; // Updated field name to match schema
  pet_friendly: boolean | null;
  max_commute_minutes: number | null;
  commute_destination: string | null;
  commute_destination_place_id: string | null;
  commute_destination_lat: number | null;
  commute_destination_lng: number | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Listing {
  id: number;
  external_id: string;
  title: string;
  description: string | null;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  neighborhood: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  pet_friendly: boolean | null;
  images: string | null; // JSON array stored as string
  contact_info: string | null; // JSON object stored as string
  listing_url: string;
  source: string;
  posted_at: string | null;
  scraped_at: string;
  is_active: boolean;
  scam_score: number;
}

export interface Notification {
  id: number;
  user_id: number;
  alert_id: number;
  listing_id: number;
  notification_type: string;
  sent_at: string;
  email_status: string | null;
}

// ================================
// Parsed/Application Types
// ================================

// Alert with parsed neighborhoods array
export interface ParsedAlert extends Omit<Alert, 'neighborhoods'> {
  neighborhoods: string[];
}

// Listing with parsed images and contact info
export interface ParsedListing
  extends Omit<Listing, 'images' | 'contact_info'> {
  images: string[];
  contact_info: ListingContactInfo | null;
}

// Contact information structure
export interface ListingContactInfo {
  phone?: string;
  email?: string;
  name?: string;
}

// ================================
// Input Types (for creation/updates)
// ================================

export interface CreateUserInput {
  email: string;
  unsubscribe_token?: string;
}

export interface UpdateUserInput {
  email?: string;
  is_active?: boolean;
  unsubscribe_token?: string;
}

export interface CreateAlertInput {
  user_id: number;
  neighborhoods: string[]; // Will be JSON.stringify'd
  min_price?: number;
  max_price?: number;
  min_bedrooms?: number;
  max_bedrooms?: number;
  pet_friendly?: boolean;
  max_commute_minutes?: number;
  commute_destination?: string;
}

export interface UpdateAlertInput {
  id: number;
  neighborhoods?: string[];
  min_price?: number;
  max_price?: number;
  min_bedrooms?: number;
  max_bedrooms?: number;
  pet_friendly?: boolean;
  max_commute_minutes?: number;
  commute_destination?: string;
  is_active?: boolean;
}

export interface CreateListingInput {
  external_id: string;
  title: string;
  description?: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  neighborhood?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  pet_friendly?: boolean;
  images?: string[]; // Will be JSON.stringify'd
  contact_info?: ListingContactInfo; // Will be JSON.stringify'd
  listing_url: string;
  source?: string;
  posted_at?: string;
  scam_score?: number;
}

export interface UpdateListingInput {
  id: number;
  title?: string;
  description?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  neighborhood?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  pet_friendly?: boolean;
  images?: string[];
  contact_info?: ListingContactInfo;
  is_active?: boolean;
  scam_score?: number;
}

export interface CreateNotificationInput {
  user_id: number;
  alert_id: number;
  listing_id: number;
  notification_type?: string;
  email_status?: string;
}

export interface UpdateNotificationInput {
  id: number;
  email_status?: string;
}

// ================================
// Query Filter Types
// ================================

export interface UserQueryFilters {
  email?: string;
  is_active?: boolean;
  has_alerts?: boolean;
}

export interface AlertQueryFilters {
  user_id?: number;
  is_active?: boolean;
  neighborhoods?: string[];
  price_range?: {
    min?: number;
    max?: number;
  };
  bedrooms_range?: {
    min?: number;
    max?: number;
  };
  pet_friendly?: boolean;
  has_commute?: boolean;
}

export interface ListingQueryFilters {
  neighborhood?: string;
  neighborhoods?: string[];
  price_range?: {
    min?: number;
    max?: number;
  };
  bedrooms?: number;
  bedrooms_range?: {
    min?: number;
    max?: number;
  };
  pet_friendly?: boolean;
  is_active?: boolean;
  max_scam_score?: number;
  posted_after?: string;
  scraped_after?: string;
  source?: string;
}

export interface NotificationQueryFilters {
  user_id?: number;
  alert_id?: number;
  listing_id?: number;
  notification_type?: string;
  email_status?: string;
  sent_after?: string;
  sent_before?: string;
}

// ================================
// Pagination Types
// ================================

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ================================
// Join/Relationship Types
// ================================

export interface UserWithAlerts extends User {
  alerts: ParsedAlert[];
}

export interface AlertWithUser extends ParsedAlert {
  user: User;
}

export interface AlertWithMatches extends ParsedAlert {
  user: User;
  matchingListings: ParsedListing[];
  totalMatches: number;
}

export interface NotificationWithDetails extends Notification {
  user: User;
  alert: ParsedAlert;
  listing: ParsedListing;
}

// ================================
// Database Operation Result Types
// ================================

export interface DatabaseResult {
  success: boolean;
  changes?: number;
  lastInsertRowid?: number;
  error?: string;
}

export interface CreateResult<T> extends DatabaseResult {
  data?: T;
}

export interface UpdateResult extends DatabaseResult {
  affectedRows: number;
}

export interface DeleteResult extends DatabaseResult {
  deletedCount: number;
}

// ================================
// Database Health/Info Types
// ================================

export interface DatabaseHealth {
  status: 'healthy' | 'error';
  path: string;
  size?: string;
  tables?: {
    users: number;
    activeAlerts: number;
    activeListings: number;
    recentNotifications: number;
  };
  pragmas?: {
    foreignKeys: string | number;
    journalMode: string;
    synchronous: string | number;
  };
  error?: string;
}

export interface MaintenanceResult {
  deletedListings: number;
  deletedNotifications: number;
}

// ================================
// NYC Specific Types
// ================================

export type NYCBorough =
  | 'Manhattan'
  | 'Brooklyn'
  | 'Queens'
  | 'Bronx'
  | 'Staten Island';

export interface NYCNeighborhood {
  name: string;
  borough: NYCBorough;
  popular: boolean;
}

// ================================
// Error Types
// ================================

export interface DatabaseError extends Error {
  code?: string;
  constraint?: string;
  table?: string;
  details?: any;
}

// ================================
// Utility Types
// ================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OmitTimestamps<T> = Omit<T, 'created_at' | 'updated_at'>;

export type WithoutId<T> = Omit<T, 'id'>;

export type DatabaseTables = 'users' | 'alerts' | 'listings' | 'notifications';
