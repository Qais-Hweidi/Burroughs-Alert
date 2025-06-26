/**
 * API Route: /api/alerts
 *
 * Handles CRUD operations for user apartment search alerts.
 * Implements dual system: immediate listing search + background notification setup.
 *
 * Features:
 * - POST: Create new alert with basic validation ✅ DONE
 * - GET: Retrieve all alerts (basic implementation) ✅ DONE
 * - GET: Retrieve user's existing alerts (by email or token)
 * - PUT: Update alert preferences
 * - DELETE: Remove alert and cleanup
 *
 * Business Logic:
 * - Basic email and neighborhoods validation ✅ DONE
 * - Database integration with user creation/lookup ✅ DONE
 * - Alert creation with foreign key relationships ✅ DONE
 * - Unsubscribe token generation ✅ DONE
 * - Validate NYC neighborhoods against constants
 * - Price range validation ($500-$10,000)
 * - Email format validation
 * - Duplicate alert prevention
 *
 * Related Documentation:
 * - docs/05-api-design.md (detailed API specification)
 * - docs/04-database-schema.md (alerts table schema)
 * - docs/07-algorithms-pseudocode.md (alert matching logic)
 */

// ✅ DONE: Basic alert CRUD operations with Next.js 15 App Router (POST/GET)
// ✅ DONE: Integrate with Drizzle ORM database queries
// ✅ DONE: Basic error handling and logging
// ✅ DONE: Implement unsubscribe token generation
// TODO: Add validation using Zod schemas
// TODO: Add comprehensive validation (NYC neighborhoods, price ranges, email format)
// TODO: Implement duplicate alert prevention
// TODO: Add PUT and DELETE endpoints
// TODO: Add user-specific alert retrieval (by email/token)

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { users, alerts } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const db = getDatabase();
    const body = await request.json();
    const { email, neighborhoods, min_price, max_price, bedrooms } = body;

    // Simple validation
    if (!email || !neighborhoods) {
      return NextResponse.json(
        { error: 'Email and neighborhoods are required' },
        { status: 400 }
      );
    }

    // Create or find user
    let user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (user.length === 0) {
      const newUser = await db.insert(users).values({
        email,
        unsubscribe_token: nanoid()
      }).returning();
      user = newUser;
    }

    // Create alert
    const alert = await db.insert(alerts).values({
      user_id: user[0].id,
      neighborhoods: JSON.stringify(neighborhoods),
      min_price: min_price || null,
      max_price: max_price || null,
      bedrooms: bedrooms || null
    }).returning();

    return NextResponse.json({
      success: true,
      alert: alert[0],
      user: user[0]
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const db = getDatabase();
    const allAlerts = await db.select().from(alerts).limit(10);
    return NextResponse.json({ alerts: allAlerts });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
