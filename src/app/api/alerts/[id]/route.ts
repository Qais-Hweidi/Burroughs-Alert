/**
 * API Route: /api/alerts/[id]
 * Purpose: Get specific alert by ID for frontend listings page
 * Status: Complete implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { alerts, users } from '@/lib/database/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { ERROR_CODES, HTTP_STATUS } from '@/lib/utils/constants';

const getAlertByIdSchema = z.object({
  id: z
    .string()
    .transform((str) => parseInt(str, 10))
    .refine((num) => !isNaN(num) && num > 0, 'Invalid alert ID'),
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
