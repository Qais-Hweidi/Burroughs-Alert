/**
 * API Route: /api/alerts
 * Purpose: Create and retrieve apartment search alerts with email-based authentication
 * Status: Complete implementation with full validation and duplicate prevention
 * Dependencies: Drizzle ORM, Zod validation, nanoid for tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { users, alerts } from '@/lib/database/schema';
import { eq, and, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import {
  VALIDATION_LIMITS,
  ERROR_CODES,
  HTTP_STATUS,
  getNeighborhoodNames,
  isValidNeighborhood,
} from '@/lib/utils/constants';

// ================================
// Zod Validation Schemas
// ================================

const createAlertSchema = z
  .object({
    email: z
      .string()
      .email('Invalid email format')
      .min(
        VALIDATION_LIMITS.email.minLength,
        `Email must be at least ${VALIDATION_LIMITS.email.minLength} characters`
      )
      .max(
        VALIDATION_LIMITS.email.maxLength,
        `Email must be at most ${VALIDATION_LIMITS.email.maxLength} characters`
      ),
    neighborhoods: z
      .array(z.string())
      .min(
        VALIDATION_LIMITS.neighborhoods.minSelection,
        'At least one neighborhood must be selected'
      )
      .refine(
        (neighborhoods) =>
          neighborhoods.every((name) => isValidNeighborhood(name)),
        'One or more neighborhoods are invalid'
      ),
    min_price: z
      .number()
      .int('Minimum price must be an integer')
      .min(
        VALIDATION_LIMITS.price.min,
        `Minimum price must be at least $${VALIDATION_LIMITS.price.min}`
      )
      .max(
        VALIDATION_LIMITS.price.max,
        `Minimum price must be at most $${VALIDATION_LIMITS.price.max}`
      )
      .nullable()
      .optional(),
    max_price: z
      .number()
      .int('Maximum price must be an integer')
      .min(
        VALIDATION_LIMITS.price.min,
        `Maximum price must be at least $${VALIDATION_LIMITS.price.min}`
      )
      .max(
        VALIDATION_LIMITS.price.max,
        `Maximum price must be at most $${VALIDATION_LIMITS.price.max}`
      )
      .nullable()
      .optional(),
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
    pet_friendly: z.boolean().nullable().optional(),
    max_commute_minutes: z
      .number()
      .int('Maximum commute time must be an integer')
      .min(
        VALIDATION_LIMITS.commute.minMinutes,
        `Commute time must be at least ${VALIDATION_LIMITS.commute.minMinutes} minutes`
      )
      .max(
        VALIDATION_LIMITS.commute.maxMinutes,
        `Commute time must be at most ${VALIDATION_LIMITS.commute.maxMinutes} minutes`
      )
      .nullable()
      .optional(),
    commute_destination: z
      .string()
      .max(
        VALIDATION_LIMITS.text.commuteDestination,
        `Commute destination must be at most ${VALIDATION_LIMITS.text.commuteDestination} characters`
      )
      .nullable()
      .optional(),
  })
  .refine(
    (data) => {
      // If min_price and max_price are both provided, min_price should be <= max_price
      if (data.min_price && data.max_price) {
        return data.min_price <= data.max_price;
      }
      return true;
    },
    {
      message: 'Minimum price must be less than or equal to maximum price',
      path: ['min_price'],
    }
  )
  .refine(
    (data) => {
      // If commute destination is provided, max_commute_minutes should also be provided
      if (data.commute_destination && !data.max_commute_minutes) {
        return false;
      }
      return true;
    },
    {
      message:
        'Maximum commute time is required when commute destination is provided',
      path: ['max_commute_minutes'],
    }
  );

const getUserAlertsSchema = z
  .object({
    email: z.string().email('Invalid email format').optional(),
    token: z
      .string()
      .length(
        VALIDATION_LIMITS.unsubscribeToken,
        `Token must be exactly ${VALIDATION_LIMITS.unsubscribeToken} characters`
      )
      .optional(),
  })
  .refine((data) => data.email || data.token, {
    message: 'Either email or token must be provided',
    path: ['email'],
  });

// ================================
// Alert Creation Endpoint
// ================================

export async function POST(request: NextRequest) {
  try {
    const db = getDatabase();
    const body = await request.json();

    // Validate input using Zod schema
    const validation = createAlertSchema.safeParse(body);
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

    const {
      email,
      neighborhoods,
      min_price,
      max_price,
      bedrooms,
      pet_friendly,
      max_commute_minutes,
      commute_destination,
    } = validation.data;

    // Create or find user
    let user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user.length === 0) {
      const newUser = await db
        .insert(users)
        .values({
          email,
          unsubscribe_token: nanoid(VALIDATION_LIMITS.unsubscribeToken),
        })
        .returning();
      user = newUser;
    }

    // Add generic borough names to neighborhoods
    const enhancedNeighborhoods = [...neighborhoods];

    // Check if any Manhattan neighborhoods are selected
    const manhattanNeighborhoods = [
      'Upper East Side',
      'Upper West Side',
      'Midtown',
      'Lower East Side',
      'Greenwich Village',
      'SoHo',
      'TriBeCa',
      'Financial District',
      'Chelsea',
      'Flatiron',
      'Gramercy',
      'Murray Hill',
      'Kips Bay',
      'Tudor City',
      "Hell's Kitchen",
      'Times Square',
      'Lincoln Square',
      'Yorkville',
      'East Harlem',
      'Central Harlem',
      'West Harlem',
      'Washington Heights',
      'Inwood',
      'Chinatown',
      'Little Italy',
      'NoLita',
      'Bowery',
      'East Village',
      'West Village',
    ];

    const brooklynNeighborhoods = [
      'Williamsburg',
      'DUMBO',
      'Brooklyn Heights',
      'Park Slope',
      'Prospect Heights',
      'Crown Heights',
      'Bedford-Stuyvesant',
      'Fort Greene',
      'Boerum Hill',
      'Carroll Gardens',
      'Red Hook',
      'Gowanus',
      'Sunset Park',
      'Bay Ridge',
      'Bensonhurst',
      'Coney Island',
      'Brighton Beach',
      'Sheepshead Bay',
      'Flatbush',
      'Midwood',
      'Borough Park',
      'Bushwick',
      'East New York',
      'Brownsville',
      'Canarsie',
      'Mill Basin',
      'Marine Park',
      'Gravesend',
    ];

    const bronxNeighborhoods = [
      'South Bronx',
      'Mott Haven',
      'Port Morris',
      'Melrose',
      'Morrisania',
      'Hunts Point',
      'Longwood',
      'Concourse',
      'High Bridge',
      'Morris Heights',
      'University Heights',
      'Fordham',
      'Belmont',
      'Tremont',
      'Mount Hope',
      'Claremont',
      'Soundview',
      'Castle Hill',
      'Parkchester',
      'Westchester Square',
      'Throggs Neck',
      'Country Club',
      'Pelham Bay',
      'Williamsbridge',
      'Norwood',
      'Bedford Park',
      'Kingsbridge',
      'Riverdale',
      'Spuyten Duyvil',
    ];

    const queensNeighborhoods = [
      'Astoria',
      'Long Island City',
      'Sunnyside',
      'Woodside',
      'Jackson Heights',
      'Elmhurst',
      'Corona',
      'Forest Hills',
      'Rego Park',
      'Kew Gardens',
      'Flushing',
      'Whitestone',
      'College Point',
      'Bayside',
      'Douglaston',
      'Little Neck',
      'Jamaica',
      'Hollis',
      'Queens Village',
      'Cambria Heights',
      'Laurelton',
      'Rosedale',
      'Springfield Gardens',
      'Howard Beach',
      'Ozone Park',
      'Richmond Hill',
      'Woodhaven',
      'Ridgewood',
      'Glendale',
      'Middle Village',
      'Maspeth',
      'Fresh Meadows',
      'Briarwood',
      'Bellerose',
      'Kew Gardens Hills',
      'Pomonok',
      'Electchester',
      'Glen Oaks',
      'Floral Park',
      'New Hyde Park',
      'Far Rockaway',
      'Rockaway Beach',
      'Rockaway Park',
      'Breezy Point',
      'Belle Harbor',
      'Neponsit',
      'Arverne',
      'Edgemere',
    ];

    const statenIslandNeighborhoods = [
      'St. George',
      'Tompkinsville',
      'Stapleton',
      'Clifton',
      'Concord',
      'Fort Wadsworth',
      'Rosebank',
      'Shore Acres',
      'Arrochar',
      'Grasmere',
      'South Beach',
      'Old Town',
      'Dongan Hills',
      'Grant City',
      'New Dorp',
      'Oakwood',
      'Midland Beach',
      'Bay Terrace',
      'Great Kills',
      'Eltingville',
      'Annadale',
      'Arden Heights',
      'Huguenot',
      "Prince's Bay",
      'Pleasant Plains',
      'Richmond Valley',
      'Tottenville',
      'Charleston',
      'Rossville',
      'Woodrow',
      'Travis',
      'Egbertville',
      'Heartland Village',
      'Chelsea',
      'Bloomfield',
      'Bulls Head',
      'New Brighton',
      'West Brighton',
      'Port Richmond',
      'Mariners Harbor',
      'Elm Park',
      'Graniteville',
      'Port Ivory',
      'Howland Hook',
      'Arlington',
      'Westerleigh',
      'Castleton Corners',
      'New Springville',
      'Willowbrook',
      'Lighthouse Hill',
      'Todt Hill',
      'Emerson Hill',
      'Grymes Hill',
      'Silver Lake',
    ];

    // Add generic borough names if specific neighborhoods from that borough are selected
    if (
      neighborhoods.some((n) => manhattanNeighborhoods.includes(n)) &&
      !enhancedNeighborhoods.includes('Manhattan')
    ) {
      enhancedNeighborhoods.push('Manhattan');
    }
    if (
      neighborhoods.some((n) => brooklynNeighborhoods.includes(n)) &&
      !enhancedNeighborhoods.includes('Brooklyn')
    ) {
      enhancedNeighborhoods.push('Brooklyn');
    }
    if (
      neighborhoods.some((n) => bronxNeighborhoods.includes(n)) &&
      !enhancedNeighborhoods.includes('Bronx')
    ) {
      enhancedNeighborhoods.push('Bronx');
    }
    if (
      neighborhoods.some((n) => queensNeighborhoods.includes(n)) &&
      !enhancedNeighborhoods.includes('Queens')
    ) {
      enhancedNeighborhoods.push('Queens');
    }
    if (
      neighborhoods.some((n) => statenIslandNeighborhoods.includes(n)) &&
      !enhancedNeighborhoods.includes('Staten Island')
    ) {
      enhancedNeighborhoods.push('Staten Island');
    }

    // Check for duplicate alerts
    const whereConditions = [
      eq(alerts.user_id, user[0].id),
      eq(alerts.neighborhoods, JSON.stringify(enhancedNeighborhoods)),
      eq(alerts.is_active, true),
    ];

    // Handle nullable fields properly
    if (min_price !== undefined) {
      whereConditions.push(
        min_price === null
          ? sql`${alerts.min_price} IS NULL`
          : eq(alerts.min_price, min_price)
      );
    }
    if (max_price !== undefined) {
      whereConditions.push(
        max_price === null
          ? sql`${alerts.max_price} IS NULL`
          : eq(alerts.max_price, max_price)
      );
    }
    if (bedrooms !== undefined) {
      whereConditions.push(
        bedrooms === null
          ? sql`${alerts.bedrooms} IS NULL`
          : eq(alerts.bedrooms, bedrooms)
      );
    }
    if (pet_friendly !== undefined) {
      whereConditions.push(
        pet_friendly === null
          ? sql`${alerts.pet_friendly} IS NULL`
          : eq(alerts.pet_friendly, pet_friendly)
      );
    }
    if (max_commute_minutes !== undefined) {
      whereConditions.push(
        max_commute_minutes === null
          ? sql`${alerts.max_commute_minutes} IS NULL`
          : eq(alerts.max_commute_minutes, max_commute_minutes)
      );
    }
    if (commute_destination !== undefined) {
      whereConditions.push(
        commute_destination === null
          ? sql`${alerts.commute_destination} IS NULL`
          : eq(alerts.commute_destination, commute_destination)
      );
    }

    const existingAlert = await db
      .select()
      .from(alerts)
      .where(and(...whereConditions))
      .limit(1);

    if (existingAlert.length > 0) {
      return NextResponse.json(
        {
          error: ERROR_CODES.VALIDATION_ERROR,
          message: 'An identical alert already exists for this user',
          existing_alert: existingAlert[0],
        },
        { status: HTTP_STATUS.CONFLICT }
      );
    }

    // Create new alert with enhanced neighborhoods
    const alert = await db
      .insert(alerts)
      .values({
        user_id: user[0].id,
        neighborhoods: JSON.stringify(enhancedNeighborhoods),
        min_price: min_price ?? null,
        max_price: max_price ?? null,
        bedrooms: bedrooms ?? null,
        pet_friendly: pet_friendly ?? null,
        max_commute_minutes: max_commute_minutes ?? null,
        commute_destination: commute_destination ?? null,
      })
      .returning();

    // Send welcome email for first alert (don't block on email failure)
    try {
      // Check if this is the user's first alert
      const existingAlerts = await db
        .select()
        .from(alerts)
        .where(eq(alerts.user_id, user[0].id))
        .limit(2);

      if (existingAlerts.length === 1) {
        // This is their first alert - send welcome email
        const { sendWelcomeEmail } = await import(
          '@/lib/notifications/email-service'
        );
        await sendWelcomeEmail(email);
        console.log(`Welcome email sent to ${email} for first alert`);
      }
    } catch (emailError) {
      console.error('Welcome email failed:', emailError);
      // Don't fail the API call if email fails
    }

    return NextResponse.json(
      {
        success: true,
        alert: {
          ...alert[0],
          neighborhoods: JSON.parse(alert[0].neighborhoods),
        },
        user: {
          id: user[0].id,
          email: user[0].email,
          created_at: user[0].created_at,
        },
      },
      { status: HTTP_STATUS.CREATED }
    );
  } catch (error) {
    console.error('Alert creation error:', error);
    return NextResponse.json(
      {
        error: ERROR_CODES.DATABASE_ERROR,
        message: 'Failed to create alert',
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

// ================================
// Alert Retrieval Endpoint
// ================================

export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    // If email or token is provided, get user-specific alerts
    if (email || token) {
      const validation = getUserAlertsSchema.safeParse({ email, token });
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

      // Find user by email or token
      let user: any[] = [];
      if (email) {
        user = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
      } else if (token) {
        user = await db
          .select()
          .from(users)
          .where(eq(users.unsubscribe_token, token))
          .limit(1);
      }

      if (user.length === 0) {
        return NextResponse.json(
          {
            error: ERROR_CODES.USER_NOT_FOUND,
            message: 'User not found',
          },
          { status: HTTP_STATUS.NOT_FOUND }
        );
      }

      // Get user's alerts
      const userAlerts = await db
        .select()
        .from(alerts)
        .where(and(eq(alerts.user_id, user[0].id), eq(alerts.is_active, true)))
        .orderBy(sql`${alerts.created_at} DESC`);

      return NextResponse.json(
        {
          success: true,
          user: {
            id: user[0].id,
            email: user[0].email,
            created_at: user[0].created_at,
          },
          alerts: userAlerts.map((alert) => ({
            ...alert,
            neighborhoods: JSON.parse(alert.neighborhoods),
          })),
        },
        { status: HTTP_STATUS.OK }
      );
    }

    // Return all alerts (basic implementation for system monitoring)
    const allAlerts = await db
      .select()
      .from(alerts)
      .where(eq(alerts.is_active, true))
      .orderBy(sql`${alerts.created_at} DESC`)
      .limit(10);

    return NextResponse.json(
      {
        success: true,
        alerts: allAlerts.map((alert) => ({
          ...alert,
          neighborhoods: JSON.parse(alert.neighborhoods),
        })),
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Alert retrieval error:', error);
    return NextResponse.json(
      {
        error: ERROR_CODES.DATABASE_ERROR,
        message: 'Failed to retrieve alerts',
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
