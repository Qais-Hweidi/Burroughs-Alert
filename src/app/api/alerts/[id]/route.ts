/**
 * API Route: /api/alerts/[id]
 * Purpose: Get, update, and delete specific alert by ID
 * Status: Complete implementation with CRUD operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { alerts, users } from '@/lib/database/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import {
  ERROR_CODES,
  HTTP_STATUS,
  VALIDATION_LIMITS,
  isValidNeighborhood,
} from '@/lib/utils/constants';

const getAlertByIdSchema = z.object({
  id: z
    .string()
    .transform((str) => parseInt(str, 10))
    .refine((num) => !isNaN(num) && num > 0, 'Invalid alert ID'),
});

const updateAlertSchema = z
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
      )
      .optional(),
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
    commute_destination_place_id: z
      .string()
      .max(500, 'Place ID too long')
      .nullable()
      .optional(),
    commute_destination_coordinates: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
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

const deleteAlertSchema = z.object({
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
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDatabase();
    const { id } = await params;

    // Validate alert ID
    const validation = getAlertByIdSchema.safeParse({ id });
    if (!validation.success) {
      return NextResponse.json(
        {
          error: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid alert ID',
          details: validation.error.errors,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const alertId = validation.data.id;

    // Get alert with user information
    const alertResult = await db
      .select({
        alert_id: alerts.id,
        user_id: alerts.user_id,
        neighborhoods: alerts.neighborhoods,
        min_price: alerts.min_price,
        max_price: alerts.max_price,
        bedrooms: alerts.bedrooms,
        pet_friendly: alerts.pet_friendly,
        max_commute_minutes: alerts.max_commute_minutes,
        commute_destination: alerts.commute_destination,
        commute_destination_place_id: alerts.commute_destination_place_id,
        commute_destination_lat: alerts.commute_destination_lat,
        commute_destination_lng: alerts.commute_destination_lng,
        is_active: alerts.is_active,
        created_at: alerts.created_at,
        user_email: users.email,
      })
      .from(alerts)
      .leftJoin(users, eq(alerts.user_id, users.id))
      .where(and(eq(alerts.id, alertId), eq(alerts.is_active, true)))
      .limit(1);

    if (alertResult.length === 0) {
      return NextResponse.json(
        {
          error: ERROR_CODES.USER_NOT_FOUND,
          message: 'Alert not found or inactive',
        },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    const alert = alertResult[0];

    return NextResponse.json(
      {
        success: true,
        alert: {
          id: alert.alert_id,
          user_id: alert.user_id,
          email: alert.user_email,
          neighborhoods: JSON.parse(alert.neighborhoods),
          min_price: alert.min_price,
          max_price: alert.max_price,
          bedrooms: alert.bedrooms,
          pet_friendly: alert.pet_friendly,
          max_commute_minutes: alert.max_commute_minutes,
          commute_destination: alert.commute_destination,
          commute_destination_lat: alert.commute_destination_lat,
          commute_destination_lng: alert.commute_destination_lng,
          is_active: alert.is_active,
          created_at: alert.created_at,
        },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Alert retrieval error:', error);
    return NextResponse.json(
      {
        error: ERROR_CODES.DATABASE_ERROR,
        message: 'Failed to retrieve alert',
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

// ================================
// Alert Update Endpoint
// ================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDatabase();
    const { id } = await params;
    const body = await request.json();

    // Validate alert ID
    const idValidation = getAlertByIdSchema.safeParse({ id });
    if (!idValidation.success) {
      return NextResponse.json(
        {
          error: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid alert ID',
          details: idValidation.error.errors,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Validate request body
    const bodyValidation = updateAlertSchema.safeParse(body);
    if (!bodyValidation.success) {
      return NextResponse.json(
        {
          error: ERROR_CODES.VALIDATION_ERROR,
          message: 'Validation failed',
          details: bodyValidation.error.errors,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const alertId = idValidation.data.id;
    const {
      email,
      neighborhoods,
      min_price,
      max_price,
      bedrooms,
      pet_friendly,
      max_commute_minutes,
      commute_destination,
      commute_destination_place_id,
      commute_destination_coordinates,
    } = bodyValidation.data;

    // Verify alert exists and user owns it
    const alertResult = await db
      .select({
        alert_id: alerts.id,
        user_id: alerts.user_id,
        user_email: users.email,
        is_active: alerts.is_active,
      })
      .from(alerts)
      .leftJoin(users, eq(alerts.user_id, users.id))
      .where(eq(alerts.id, alertId))
      .limit(1);

    if (alertResult.length === 0) {
      return NextResponse.json(
        {
          error: ERROR_CODES.USER_NOT_FOUND,
          message: 'Alert not found',
        },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    const alertData = alertResult[0];

    // Verify user owns the alert
    if (alertData.user_email !== email) {
      return NextResponse.json(
        {
          error: ERROR_CODES.VALIDATION_ERROR,
          message: 'You can only update your own alerts',
        },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // Verify alert is active
    if (!alertData.is_active) {
      return NextResponse.json(
        {
          error: ERROR_CODES.VALIDATION_ERROR,
          message: 'Cannot update inactive alert',
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Build update object
    const updateValues: any = {};

    if (neighborhoods !== undefined) {
      updateValues.neighborhoods = JSON.stringify(neighborhoods);
    }
    if (min_price !== undefined) {
      updateValues.min_price = min_price;
    }
    if (max_price !== undefined) {
      updateValues.max_price = max_price;
    }
    if (bedrooms !== undefined) {
      updateValues.bedrooms = bedrooms;
    }
    if (pet_friendly !== undefined) {
      updateValues.pet_friendly = pet_friendly;
    }
    if (max_commute_minutes !== undefined) {
      updateValues.max_commute_minutes = max_commute_minutes;
    }
    if (commute_destination !== undefined) {
      updateValues.commute_destination = commute_destination;
    }
    if (commute_destination_place_id !== undefined) {
      updateValues.commute_destination_place_id = commute_destination_place_id;
    }
    if (commute_destination_coordinates !== undefined) {
      updateValues.commute_destination_lat =
        commute_destination_coordinates?.lat ?? null;
      updateValues.commute_destination_lng =
        commute_destination_coordinates?.lng ?? null;
    }

    // Update alert
    const updatedAlert = await db
      .update(alerts)
      .set(updateValues)
      .where(eq(alerts.id, alertId))
      .returning();

    if (updatedAlert.length === 0) {
      return NextResponse.json(
        {
          error: ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to update alert',
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    return NextResponse.json(
      {
        success: true,
        alert: {
          ...updatedAlert[0],
          neighborhoods: JSON.parse(updatedAlert[0].neighborhoods),
        },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Alert update error:', error);
    return NextResponse.json(
      {
        error: ERROR_CODES.DATABASE_ERROR,
        message: 'Failed to update alert',
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

// ================================
// Alert Delete Endpoint
// ================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDatabase();
    const { id } = await params;
    const body = await request.json();

    // Validate alert ID
    const idValidation = getAlertByIdSchema.safeParse({ id });
    if (!idValidation.success) {
      return NextResponse.json(
        {
          error: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid alert ID',
          details: idValidation.error.errors,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Validate request body
    const bodyValidation = deleteAlertSchema.safeParse(body);
    if (!bodyValidation.success) {
      return NextResponse.json(
        {
          error: ERROR_CODES.VALIDATION_ERROR,
          message: 'Validation failed',
          details: bodyValidation.error.errors,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const alertId = idValidation.data.id;
    const { email } = bodyValidation.data;

    // Verify alert exists and user owns it
    const alertResult = await db
      .select({
        alert_id: alerts.id,
        user_id: alerts.user_id,
        user_email: users.email,
        is_active: alerts.is_active,
      })
      .from(alerts)
      .leftJoin(users, eq(alerts.user_id, users.id))
      .where(eq(alerts.id, alertId))
      .limit(1);

    if (alertResult.length === 0) {
      return NextResponse.json(
        {
          error: ERROR_CODES.USER_NOT_FOUND,
          message: 'Alert not found',
        },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    const alertData = alertResult[0];

    // Verify user owns the alert
    if (alertData.user_email !== email) {
      return NextResponse.json(
        {
          error: ERROR_CODES.VALIDATION_ERROR,
          message: 'You can only delete your own alerts',
        },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // Verify alert is active
    if (!alertData.is_active) {
      return NextResponse.json(
        {
          error: ERROR_CODES.VALIDATION_ERROR,
          message: 'Alert is already inactive',
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Deactivate alert (soft delete)
    const deactivatedAlert = await db
      .update(alerts)
      .set({ is_active: false })
      .where(eq(alerts.id, alertId))
      .returning();

    if (deactivatedAlert.length === 0) {
      return NextResponse.json(
        {
          error: ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to delete alert',
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Alert deleted successfully',
        alert: {
          ...deactivatedAlert[0],
          neighborhoods: JSON.parse(deactivatedAlert[0].neighborhoods),
        },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Alert delete error:', error);
    return NextResponse.json(
      {
        error: ERROR_CODES.DATABASE_ERROR,
        message: 'Failed to delete alert',
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
