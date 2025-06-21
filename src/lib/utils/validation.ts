/**
 * Validation Schemas using Zod
 * Input validation for API requests and database operations
 */

import { z } from 'zod';

// ================================
// NYC Neighborhoods List (for validation)
// ================================

const NYC_NEIGHBORHOODS = [
  // Manhattan
  'Upper East Side', 'Upper West Side', 'Midtown', 'Lower East Side', 'Greenwich Village',
  'SoHo', 'TriBeCa', 'Financial District', 'Chelsea', 'Flatiron', 'Gramercy', 'Murray Hill',
  'Kips Bay', 'Tudor City', 'Hell\'s Kitchen', 'Times Square', 'Lincoln Square', 'Yorkville',
  'East Harlem', 'Central Harlem', 'West Harlem', 'Washington Heights', 'Inwood',
  'Chinatown', 'Little Italy', 'NoLita', 'Bowery', 'East Village', 'West Village',
  
  // Brooklyn
  'Williamsburg', 'DUMBO', 'Brooklyn Heights', 'Park Slope', 'Prospect Heights',
  'Crown Heights', 'Bedford-Stuyvesant', 'Fort Greene', 'Boerum Hill', 'Carroll Gardens',
  'Red Hook', 'Gowanus', 'Sunset Park', 'Bay Ridge', 'Bensonhurst', 'Coney Island',
  'Brighton Beach', 'Sheepshead Bay', 'Flatbush', 'Midwood', 'Borough Park', 'Bushwick',
  'East New York', 'Brownsville', 'Canarsie', 'Mill Basin', 'Marine Park', 'Gravesend',
  
  // Queens
  'Long Island City', 'Astoria', 'Sunnyside', 'Woodside', 'Jackson Heights', 'Elmhurst',
  'Corona', 'Flushing', 'Bayside', 'Whitestone', 'College Point', 'Forest Hills',
  'Kew Gardens', 'Richmond Hill', 'South Ozone Park', 'Howard Beach', 'Rockaway',
  'Far Rockaway', 'Jamaica', 'Hollis', 'Queens Village', 'Bellerose', 'Floral Park',
  
  // Bronx
  'South Bronx', 'Mott Haven', 'Port Morris', 'Melrose', 'Morrisania', 'Hunts Point',
  'Longwood', 'Concourse', 'High Bridge', 'Morris Heights', 'University Heights',
  'Fordham', 'Belmont', 'Tremont', 'Mount Hope', 'Claremont', 'Soundview', 'Castle Hill',
  'Parkchester', 'Westchester Square', 'Throggs Neck', 'Country Club', 'Pelham Bay',
  'Williamsbridge', 'Norwood', 'Bedford Park', 'Kingsbridge', 'Riverdale', 'Spuyten Duyvil',
  
  // Staten Island
  'St. George', 'Stapleton', 'Clifton', 'Port Richmond', 'West Brighton', 'New Brighton',
  'Grasmere', 'Concord', 'Emerson Hill', 'Dongan Hills', 'Midland Beach', 'New Dorp',
  'Oakwood', 'Great Kills', 'Eltingville', 'Annadale', 'Huguenot', 'Prince\'s Bay',
  'Richmond Valley', 'Tottenville', 'Charleston', 'Rossville', 'Woodrow'
] as const;

// ================================
// Base Validation Schemas
// ================================

export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must be less than 255 characters');

export const neighborhoodsSchema = z
  .array(z.enum(NYC_NEIGHBORHOODS as [string, ...string[]]))
  .min(1, 'At least one neighborhood is required')
  .max(5, 'Maximum 5 neighborhoods allowed');

export const priceSchema = z
  .number()
  .int('Price must be a whole number')
  .min(500, 'Minimum price is $500')
  .max(20000, 'Maximum price is $20,000');

export const bedroomsSchema = z
  .number()
  .int('Bedrooms must be a whole number')
  .min(0, 'Minimum bedrooms is 0')
  .max(10, 'Maximum bedrooms is 10');

export const commuteMinutesSchema = z
  .number()
  .int('Commute time must be a whole number')
  .min(1, 'Minimum commute time is 1 minute')
  .max(120, 'Maximum commute time is 120 minutes');

// ================================
// Alert Validation Schemas
// ================================

export const createAlertSchema = z.object({
  email: emailSchema,
  neighborhoods: neighborhoodsSchema,
  minPrice: priceSchema.optional(),
  maxPrice: priceSchema,
  minBedrooms: bedroomsSchema.optional(),
  maxBedrooms: bedroomsSchema.optional(),
  petFriendly: z.boolean().optional(),
  maxCommuteMinutes: commuteMinutesSchema.optional(),
  commuteDestination: z
    .string()
    .max(500, 'Commute destination must be less than 500 characters')
    .optional()
}).refine(
  data => !data.minPrice || data.minPrice <= data.maxPrice,
  {
    message: 'Minimum price must be less than or equal to maximum price',
    path: ['minPrice']
  }
).refine(
  data => !data.minBedrooms || !data.maxBedrooms || data.minBedrooms <= data.maxBedrooms,
  {
    message: 'Minimum bedrooms must be less than or equal to maximum bedrooms',
    path: ['minBedrooms']
  }
).refine(
  data => !data.maxCommuteMinutes || data.commuteDestination,
  {
    message: 'Commute destination is required when max commute time is specified',
    path: ['commuteDestination']
  }
);

export const updateAlertSchema = z.object({
  neighborhoods: neighborhoodsSchema.optional(),
  minPrice: priceSchema.optional(),
  maxPrice: priceSchema.optional(),
  minBedrooms: bedroomsSchema.optional(),
  maxBedrooms: bedroomsSchema.optional(),
  petFriendly: z.boolean().optional(),
  maxCommuteMinutes: commuteMinutesSchema.optional(),
  commuteDestination: z
    .string()
    .max(500, 'Commute destination must be less than 500 characters')
    .optional(),
  isActive: z.boolean().optional()
}).refine(
  data => !data.minPrice || !data.maxPrice || data.minPrice <= data.maxPrice,
  {
    message: 'Minimum price must be less than or equal to maximum price',
    path: ['minPrice']
  }
).refine(
  data => !data.minBedrooms || !data.maxBedrooms || data.minBedrooms <= data.maxBedrooms,
  {
    message: 'Minimum bedrooms must be less than or equal to maximum bedrooms',
    path: ['minBedrooms']
  }
);

// ================================
// User Validation Schemas
// ================================

export const createUserSchema = z.object({
  email: emailSchema,
  unsubscribeToken: z
    .string()
    .length(32, 'Unsubscribe token must be 32 characters')
    .optional()
});

export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  isActive: z.boolean().optional(),
  unsubscribeToken: z
    .string()
    .length(32, 'Unsubscribe token must be 32 characters')
    .optional()
});

// ================================
// Listing Validation Schemas
// ================================

export const contactInfoSchema = z.object({
  phone: z.string().optional(),
  email: emailSchema.optional(),
  name: z.string().max(100, 'Name must be less than 100 characters').optional()
});

export const createListingSchema = z.object({
  externalId: z
    .string()
    .min(1, 'External ID is required')
    .max(255, 'External ID must be less than 255 characters'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(500, 'Title must be less than 500 characters'),
  description: z
    .string()
    .max(10000, 'Description must be less than 10,000 characters')
    .optional(),
  price: priceSchema,
  bedrooms: bedroomsSchema.optional(),
  bathrooms: z
    .number()
    .min(0, 'Minimum bathrooms is 0')
    .max(20, 'Maximum bathrooms is 20')
    .optional(),
  squareFeet: z
    .number()
    .int('Square feet must be a whole number')
    .min(50, 'Minimum square feet is 50')
    .max(10000, 'Maximum square feet is 10,000')
    .optional(),
  neighborhood: z
    .enum(NYC_NEIGHBORHOODS as [string, ...string[]])
    .optional(),
  address: z
    .string()
    .max(500, 'Address must be less than 500 characters')
    .optional(),
  latitude: z
    .number()
    .min(40.4, 'Latitude must be within NYC bounds')
    .max(40.9, 'Latitude must be within NYC bounds')
    .optional(),
  longitude: z
    .number()
    .min(-74.3, 'Longitude must be within NYC bounds')
    .max(-73.7, 'Longitude must be within NYC bounds')
    .optional(),
  petFriendly: z.boolean().optional(),
  images: z
    .array(z.string().url('Invalid image URL'))
    .max(20, 'Maximum 20 images allowed')
    .optional(),
  contactInfo: contactInfoSchema.optional(),
  listingUrl: z
    .string()
    .url('Invalid listing URL')
    .max(1000, 'Listing URL must be less than 1,000 characters'),
  source: z
    .string()
    .max(50, 'Source must be less than 50 characters')
    .default('craigslist'),
  postedAt: z
    .string()
    .datetime('Invalid posted date format')
    .optional(),
  scamScore: z
    .number()
    .min(0, 'Scam score minimum is 0')
    .max(1, 'Scam score maximum is 1')
    .default(0)
});

export const updateListingSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(500, 'Title must be less than 500 characters')
    .optional(),
  description: z
    .string()
    .max(10000, 'Description must be less than 10,000 characters')
    .optional(),
  price: priceSchema.optional(),
  bedrooms: bedroomsSchema.optional(),
  bathrooms: z
    .number()
    .min(0, 'Minimum bathrooms is 0')
    .max(20, 'Maximum bathrooms is 20')
    .optional(),
  squareFeet: z
    .number()
    .int('Square feet must be a whole number')
    .min(50, 'Minimum square feet is 50')
    .max(10000, 'Maximum square feet is 10,000')
    .optional(),
  neighborhood: z
    .enum(NYC_NEIGHBORHOODS as [string, ...string[]])
    .optional(),
  address: z
    .string()
    .max(500, 'Address must be less than 500 characters')
    .optional(),
  latitude: z
    .number()
    .min(40.4, 'Latitude must be within NYC bounds')
    .max(40.9, 'Latitude must be within NYC bounds')
    .optional(),
  longitude: z
    .number()
    .min(-74.3, 'Longitude must be within NYC bounds')
    .max(-73.7, 'Longitude must be within NYC bounds')
    .optional(),
  petFriendly: z.boolean().optional(),
  images: z
    .array(z.string().url('Invalid image URL'))
    .max(20, 'Maximum 20 images allowed')
    .optional(),
  contactInfo: contactInfoSchema.optional(),
  isActive: z.boolean().optional(),
  scamScore: z
    .number()
    .min(0, 'Scam score minimum is 0')
    .max(1, 'Scam score maximum is 1')
    .optional()
});

// ================================
// Query Parameter Validation
// ================================

export const paginationSchema = z.object({
  limit: z
    .number()
    .int('Limit must be a whole number')
    .min(1, 'Minimum limit is 1')
    .max(200, 'Maximum limit is 200')
    .default(50),
  page: z
    .number()
    .int('Page must be a whole number')
    .min(1, 'Minimum page is 1')
    .default(1),
  sort: z
    .enum(['created_at', 'updated_at', 'price', 'posted_at', 'scraped_at'])
    .default('created_at'),
  order: z
    .enum(['ASC', 'DESC'])
    .default('DESC')
});

export const listingQuerySchema = z.object({
  neighborhood: z.enum(NYC_NEIGHBORHOODS as [string, ...string[]]).optional(),
  minPrice: priceSchema.optional(),
  maxPrice: priceSchema.optional(),
  bedrooms: bedroomsSchema.optional(),
  petFriendly: z.boolean().optional(),
  maxScamScore: z
    .number()
    .min(0, 'Min scam score is 0')
    .max(1, 'Max scam score is 1')
    .default(0.5),
  isActive: z.boolean().default(true)
}).merge(paginationSchema);

// ================================
// API Response Validation
// ================================

export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
    timestamp: z.string().optional()
  }).optional(),
  timestamp: z.string().optional()
});

// ================================
// Unsubscribe Validation
// ================================

export const unsubscribeByTokenSchema = z.object({
  token: z
    .string()
    .length(32, 'Invalid unsubscribe token')
});

export const unsubscribeByEmailSchema = z.object({
  email: emailSchema
});

// ================================
// Environment/Config Validation
// ================================

export const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  SMTP_HOST: z.string().min(1, 'SMTP host is required'),
  SMTP_PORT: z.number().int().min(1).max(65535),
  SMTP_USER: emailSchema,
  SMTP_PASS: z.string().min(1, 'SMTP password is required'),
  SCRAPING_INTERVAL: z.number().int().min(60000).default(300000), // 5 minutes default
  USER_AGENT: z.string().min(1, 'User agent is required'),
  GOOGLE_MAPS_API_KEY: z.string().optional()
});

// ================================
// Validation Helper Functions
// ================================

export function validateEmail(email: string): { valid: boolean; error?: string } {
  try {
    emailSchema.parse(email);
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof z.ZodError ? error.errors[0].message : 'Invalid email' 
    };
  }
}

export function validateNeighborhoods(neighborhoods: string[]): { valid: boolean; error?: string; validNeighborhoods?: string[] } {
  try {
    const validated = neighborhoodsSchema.parse(neighborhoods);
    return { valid: true, validNeighborhoods: validated };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof z.ZodError ? error.errors[0].message : 'Invalid neighborhoods' 
    };
  }
}

export function validatePriceRange(minPrice?: number, maxPrice?: number): { valid: boolean; error?: string } {
  if (!maxPrice) {
    return { valid: false, error: 'Maximum price is required' };
  }
  
  try {
    priceSchema.parse(maxPrice);
    if (minPrice !== undefined) {
      priceSchema.parse(minPrice);
      if (minPrice > maxPrice) {
        return { valid: false, error: 'Minimum price must be less than or equal to maximum price' };
      }
    }
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof z.ZodError ? error.errors[0].message : 'Invalid price range' 
    };
  }
}

// Generate a cryptographically secure unsubscribe token
export function generateUnsubscribeToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < 32; i++) {
    result += chars[array[i] % chars.length];
  }
  
  return result;
}

// Export the neighborhoods list for use in other modules
export const NYC_NEIGHBORHOODS_LIST = NYC_NEIGHBORHOODS;

// Type exports for TypeScript
export type CreateAlertInput = z.infer<typeof createAlertSchema>;
export type UpdateAlertInput = z.infer<typeof updateAlertSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type ListingQueryParams = z.infer<typeof listingQuerySchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;