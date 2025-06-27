/**
 * API Route: /api/listings
 * Purpose: Endpoint for scraper to add listings and frontend/matcher to retrieve listings
 * Status: POST/GET implemented ✅ DONE | PUT/DELETE 🔄 TODO | Batch insertion TODO
 * Features: Validation, duplicate prevention, scam detection, NYC geo-validation, filtering/pagination/sorting
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { listings } from '@/lib/database/schema';
import {
  eq,
  and,
  or,
  gte,
  lte,
  desc,
  asc,
  sql,
  like,
  isNull,
} from 'drizzle-orm';
import { z } from 'zod';
import {
  VALIDATION_LIMITS,
  ERROR_CODES,
  HTTP_STATUS,
  NYC_BOUNDS,
  isValidNeighborhood,
} from '@/lib/utils/constants';

// ================================
// Zod Validation Schemas
// ================================

const createListingSchema = z
  .object({
    external_id: z
      .string()
      .min(1, 'External ID is required')
      .max(VALIDATION_LIMITS.text.source, 'External ID too long'),
    title: z
      .string()
      .min(1, 'Title is required')
      .max(VALIDATION_LIMITS.text.title, 'Title too long'),
    description: z
      .string()
      .max(VALIDATION_LIMITS.text.description, 'Description too long')
      .nullable()
      .optional(),
    price: z
      .number()
      .int('Price must be an integer')
      .min(
        VALIDATION_LIMITS.price.min,
        `Price must be at least $${VALIDATION_LIMITS.price.min}`
      )
      .max(
        VALIDATION_LIMITS.price.max,
        `Price must be at most $${VALIDATION_LIMITS.price.max}`
      ),
    bedrooms: z
      .number()
      .int('Bedrooms must be an integer')
      .min(
        VALIDATION_LIMITS.bedrooms.min,
        `Bedrooms must be at least ${VALIDATION_LIMITS.bedrooms.min}`
      )
      .max(
        VALIDATION_LIMITS.bedrooms.max,
        `Bedrooms must be at most ${VALIDATION_LIMITS.bedrooms.max}`
      )
      .nullable()
      .optional(),
    square_feet: z
      .number()
      .int('Square feet must be an integer')
      .min(
        VALIDATION_LIMITS.squareFeet.min,
        `Square feet must be at least ${VALIDATION_LIMITS.squareFeet.min}`
      )
      .max(
        VALIDATION_LIMITS.squareFeet.max,
        `Square feet must be at most ${VALIDATION_LIMITS.squareFeet.max}`
      )
      .nullable()
      .optional(),
    neighborhood: z
      .string()
      .max(VALIDATION_LIMITS.text.name, 'Neighborhood name too long')
      .refine(
        (name) => !name || isValidNeighborhood(name),
        'Invalid NYC neighborhood'
      )
      .nullable()
      .optional(),
    address: z
      .string()
      .max(VALIDATION_LIMITS.text.address, 'Address too long')
      .nullable()
      .optional(),
    latitude: z
      .number()
      .min(NYC_BOUNDS.latitude.min, 'Latitude out of NYC bounds')
      .max(NYC_BOUNDS.latitude.max, 'Latitude out of NYC bounds')
      .nullable()
      .optional(),
    longitude: z
      .number()
      .min(NYC_BOUNDS.longitude.min, 'Longitude out of NYC bounds')
      .max(NYC_BOUNDS.longitude.max, 'Longitude out of NYC bounds')
      .nullable()
      .optional(),
    pet_friendly: z.boolean().nullable().optional(),
    listing_url: z
      .string()
      .url('Invalid listing URL')
      .max(500, 'Listing URL too long'),
    source: z
      .string()
      .max(VALIDATION_LIMITS.text.source, 'Source name too long')
      .default('craigslist'),
    posted_at: z
      .string()
      .datetime('Invalid posted_at date format')
      .nullable()
      .optional(),
  })
  .refine(
    (data) => {
      // If coordinates are provided, both must be provided
      if (data.latitude !== undefined || data.longitude !== undefined) {
        return data.latitude !== undefined && data.longitude !== undefined;
      }
      return true;
    },
    {
      message: 'Both latitude and longitude must be provided together',
      path: ['coordinates'],
    }
  );

const getListingsSchema = z.object({
  // Filtering parameters
  neighborhoods: z
    .string()
    .transform((str) => str.split(',').filter(Boolean))
    .refine(
      (neighborhoods) =>
        neighborhoods.every((name) => isValidNeighborhood(name)),
      'One or more neighborhoods are invalid'
    )
    .optional(),
  min_price: z
    .string()
    .transform((str) => parseInt(str, 10))
    .refine((num) => !isNaN(num) && num >= VALIDATION_LIMITS.price.min)
    .optional(),
  max_price: z
    .string()
    .transform((str) => parseInt(str, 10))
    .refine((num) => !isNaN(num) && num <= VALIDATION_LIMITS.price.max)
    .optional(),
  bedrooms: z
    .string()
    .transform((str) => parseInt(str, 10))
    .refine(
      (num) =>
        !isNaN(num) &&
        num >= VALIDATION_LIMITS.bedrooms.min &&
        num <= VALIDATION_LIMITS.bedrooms.max
    )
    .optional(),
  pet_friendly: z
    .string()
    .transform((str) => str.toLowerCase() === 'true')
    .optional(),
  max_scam_score: z
    .string()
    .transform((str) => parseInt(str, 10))
    .refine((num) => !isNaN(num) && num >= 0 && num <= 100)
    .optional(),
  source: z.string().max(VALIDATION_LIMITS.text.source).optional(),

  // Pagination parameters
  page: z
    .string()
    .transform((str) => parseInt(str, 10))
    .refine((num) => !isNaN(num) && num >= 1)
    .default('1'),
  limit: z
    .string()
    .transform((str) => parseInt(str, 10))
    .refine((num) => !isNaN(num) && num >= 1 && num <= 100)
    .default('20'),

  // Sorting parameters
  sort_by: z
    .enum(['price', 'scraped_at', 'posted_at', 'bedrooms', 'scam_score'])
    .default('scraped_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),

  // Special filters
  active_only: z
    .string()
    .transform((str) => str.toLowerCase() !== 'false')
    .default('true'),
});

// ================================
// Scam Detection Logic
// ================================

function calculateScamScore(listing: {
  price: number;
  title: string;
  description?: string | null;
  bedrooms?: number | null;
}): number {
  let scamScore = 0;

  // Price-based scam detection
  if (listing.price < 800) {
    scamScore += 30; // Very low price for NYC
  } else if (listing.price < 1200) {
    scamScore += 15; // Low price but possible
  }

  // Bedroom to price ratio (unrealistic deals)
  if (listing.bedrooms && listing.bedrooms >= 2 && listing.price < 1500) {
    scamScore += 25; // Multi-bedroom under $1500 is suspicious
  }

  // Title-based detection
  const title = listing.title.toLowerCase();
  const scamTitleKeywords = [
    'urgent',
    'must go',
    'leaving country',
    'military',
    'deployed',
    'key',
    'western union',
    'wire',
    'deposit only',
    'god bless',
    'christian',
    'blessed',
  ];

  const titleMatches = scamTitleKeywords.filter((keyword) =>
    title.includes(keyword)
  ).length;
  scamScore += titleMatches * 10;

  // Description-based detection
  if (listing.description) {
    const description = listing.description.toLowerCase();
    const scamDescKeywords = [
      'western union',
      'wire transfer',
      'moneygram',
      'cashier check',
      'certified check',
      'paypal',
      'god bless',
      'military',
      'deployed',
      'overseas',
      'missionary',
      'urgent',
      'leaving country',
      'pet deposit only',
      'first month only',
    ];

    const descMatches = scamDescKeywords.filter((keyword) =>
      description.includes(keyword)
    ).length;
    scamScore += descMatches * 8;

    // Long descriptions with personal stories are often scams
    if (listing.description.length > 2000) {
      scamScore += 15;
    }
  }

  // Cap the scam score at 100
  return Math.min(scamScore, 100);
}

// ================================
// Listing Creation Endpoint
// ================================

export async function POST(request: NextRequest) {
  try {
    const db = getDatabase();
    const body = await request.json();

    // Validate input using Zod schema
    const validation = createListingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: ERROR_CODES.VALIDATION_ERROR,
          message: 'Validation failed',
          details: validation.error.errors,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const validatedData = validation.data;

    // Check for duplicate listing by external_id
    const existingListing = await db
      .select()
      .from(listings)
      .where(eq(listings.external_id, validatedData.external_id))
      .limit(1);

    if (existingListing.length > 0) {
      return NextResponse.json(
        {
          error: ERROR_CODES.VALIDATION_ERROR,
          message: 'Listing with this external_id already exists',
          existing_listing_id: existingListing[0].id,
        },
        { status: HTTP_STATUS.CONFLICT }
      );
    }

    // Calculate scam score
    const scamScore = calculateScamScore({
      price: validatedData.price,
      title: validatedData.title,
      description: validatedData.description,
      bedrooms: validatedData.bedrooms,
    });

    // Insert new listing
    const newListing = await db
      .insert(listings)
      .values({
        external_id: validatedData.external_id,
        title: validatedData.title,
        description: validatedData.description ?? null,
        price: validatedData.price,
        bedrooms: validatedData.bedrooms ?? null,
        square_feet: validatedData.square_feet ?? null,
        neighborhood: validatedData.neighborhood ?? null,
        address: validatedData.address ?? null,
        latitude: validatedData.latitude ?? null,
        longitude: validatedData.longitude ?? null,
        pet_friendly: validatedData.pet_friendly ?? null,
        listing_url: validatedData.listing_url,
        source: validatedData.source,
        posted_at: validatedData.posted_at ?? null,
        scam_score: scamScore,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        listing: newListing[0],
        scam_analysis: {
          scam_score: scamScore,
          risk_level:
            scamScore >= 70 ? 'high' : scamScore >= 40 ? 'medium' : 'low',
        },
      },
      { status: HTTP_STATUS.CREATED }
    );
  } catch (error) {
    console.error('Listing creation error:', error);
    return NextResponse.json(
      {
        error: ERROR_CODES.DATABASE_ERROR,
        message: 'Failed to create listing',
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

// ================================
// Listing Retrieval Endpoint
// ================================

export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    const { searchParams } = new URL(request.url);

    // Convert search params to object for validation
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const validation = getListingsSchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid query parameters',
          details: validation.error.errors,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const {
      neighborhoods,
      min_price,
      max_price,
      bedrooms,
      pet_friendly,
      max_scam_score,
      source,
      page,
      limit,
      sort_by,
      sort_order,
      active_only,
    } = validation.data;

    // Build where conditions
    const whereConditions = [];

    if (active_only) {
      whereConditions.push(eq(listings.is_active, true));
    }

    if (neighborhoods && neighborhoods.length > 0) {
      const neighborhoodConditions = neighborhoods.map((name) =>
        eq(listings.neighborhood, name)
      );
      whereConditions.push(or(...neighborhoodConditions));
    }

    if (min_price !== undefined) {
      whereConditions.push(gte(listings.price, min_price));
    }

    if (max_price !== undefined) {
      whereConditions.push(lte(listings.price, max_price));
    }

    if (bedrooms !== undefined) {
      // Treat null bedrooms as studios (0 bedrooms)
      if (bedrooms === 0) {
        whereConditions.push(
          or(eq(listings.bedrooms, 0), isNull(listings.bedrooms))
        );
      } else {
        whereConditions.push(eq(listings.bedrooms, bedrooms));
      }
    }

    if (pet_friendly !== undefined) {
      whereConditions.push(eq(listings.pet_friendly, pet_friendly));
    }

    if (max_scam_score !== undefined) {
      whereConditions.push(lte(listings.scam_score, max_scam_score));
    }

    if (source) {
      whereConditions.push(eq(listings.source, source));
    }

    // Build order by clause with type-safe column mapping
    const sortableColumns = {
      price: listings.price,
      scraped_at: listings.scraped_at,
      posted_at: listings.posted_at,
      bedrooms: listings.bedrooms,
      scam_score: listings.scam_score,
    };

    const orderByColumn = sortableColumns[sort_by];
    const orderBy =
      sort_order === 'asc' ? asc(orderByColumn) : desc(orderByColumn);

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Execute query with filtering, sorting, and pagination
    const listingsQuery = db
      .select()
      .from(listings)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const listingsResult = await listingsQuery;

    // Get total count for pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(listings)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const countResult = await countQuery;
    const totalCount = countResult[0]?.count || 0;

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json(
      {
        success: true,
        listings: listingsResult,
        pagination: {
          page,
          limit,
          total_count: totalCount,
          total_pages: totalPages,
          has_next_page: hasNextPage,
          has_prev_page: hasPrevPage,
        },
        filters: {
          neighborhoods: neighborhoods || [],
          min_price,
          max_price,
          bedrooms,
          pet_friendly,
          max_scam_score,
          source,
          active_only,
        },
        sorting: {
          sort_by,
          sort_order,
        },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Listing retrieval error:', error);
    return NextResponse.json(
      {
        error: ERROR_CODES.DATABASE_ERROR,
        message: 'Failed to retrieve listings',
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
