/**
 * API Route: /api/alerts/[id]/unsubscribe
 * Purpose: Delete user and all their alerts from database (for listings page unsubscribe button)
 * Status: New endpoint for direct unsubscribe from listings page
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, withTransaction } from '@/lib/database';
import { schema } from '@/lib/database/schema';
import { eq, and } from 'drizzle-orm';

// ================================
// Types and Interfaces
// ================================

interface UnsubscribeResponse {
  success: boolean;
  message: string;
  details?: {
    email: string;
    deletedAlerts: number;
    timestamp: string;
  };
}

// ================================
// Unsubscribe Processing Functions
// ================================

/**
 * Process unsubscribe by alert ID - deletes user and all their data
 */
const processUnsubscribeByAlertId = async (
  alertId: string
): Promise<UnsubscribeResponse> => {
  try {
    const result = await withTransaction(async (db) => {
      // Find the alert and associated user
      const alert = await db
        .select({
          id: schema.alerts.id,
          user_id: schema.alerts.user_id,
        })
        .from(schema.alerts)
        .where(eq(schema.alerts.id, alertId))
        .limit(1)
        .then((results) => results[0] || null);

      if (!alert) {
        return {
          success: false,
          message: 'Alert not found.',
        };
      }

      // Get user info
      const user = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, alert.user_id))
        .limit(1)
        .then((results) => results[0] || null);

      if (!user) {
        return {
          success: false,
          message: 'User not found.',
        };
      }

      // Count all user alerts before deletion
      const allUserAlerts = await db
        .select()
        .from(schema.alerts)
        .where(eq(schema.alerts.user_id, user.id));

      const alertCount = allUserAlerts.length;

      // Delete all notifications for this user
      await db
        .delete(schema.notifications)
        .where(eq(schema.notifications.user_id, user.id));

      // Delete all alerts for this user
      await db.delete(schema.alerts).where(eq(schema.alerts.user_id, user.id));

      // Delete the user
      await db.delete(schema.users).where(eq(schema.users.id, user.id));

      // Log the unsubscribe action
      console.log(
        `User completely unsubscribed and deleted: ${user.email} (${alertCount} alerts deleted)`
      );

      return {
        success: true,
        message:
          'You have been successfully unsubscribed and all your data has been deleted.',
        details: {
          email: user.email,
          deletedAlerts: alertCount,
          timestamp: new Date().toISOString(),
        },
      };
    });

    return result;
  } catch (error) {
    console.error('Unsubscribe processing error:', error);
    return {
      success: false,
      message:
        'An error occurred while processing your unsubscribe request. Please try again.',
    };
  }
};

// ================================
// API Route Handlers
// ================================

/**
 * DELETE /api/alerts/[id]/unsubscribe
 * Delete user and all their data
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  try {
    // Validate alert ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid alert ID provided.',
        },
        { status: 400 }
      );
    }

    // Process unsubscribe
    const result = await processUnsubscribeByAlertId(id);

    // Return appropriate status code
    const statusCode = result.success ? 200 : 404;

    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    console.error('Unsubscribe API error:', error);

    return NextResponse.json(
      {
        success: false,
        message:
          'An unexpected error occurred while processing your unsubscribe request.',
      },
      { status: 500 }
    );
  }
}

// ================================
// Method Not Allowed Handlers
// ================================

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PATCH() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
