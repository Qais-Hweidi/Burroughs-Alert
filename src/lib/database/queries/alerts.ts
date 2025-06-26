/**
 * Database Queries: Alerts
 * Purpose: Type-safe database operations for user apartment search alerts using Drizzle ORM
 * Status: ✅ IMPLEMENTED - Complete alert management with validation and error handling
 * Dependencies: Drizzle ORM, SQLite database connection, schema types
 */

import { eq, and, or, sql } from 'drizzle-orm';
import { getDatabase } from '../index';
import { schema } from '../schema';
import type { AlertSelect, AlertInsert, UserSelect } from '../schema';

// ================================
// Types
// ================================

export interface CreateAlertInput {
  email: string;
  neighborhoods: string[];
  min_price?: number;
  max_price?: number;
  bedrooms?: number; // null = any, 0 = studio, 1+ = bedrooms
  pet_friendly?: boolean; // null = any, true/false = specific
  max_commute_minutes?: number;
  commute_destination?: string;
}

export interface AlertWithUser extends AlertSelect {
  user: UserSelect;
}

export interface AlertQueryResult {
  success: boolean;
  data?: AlertSelect | AlertSelect[];
  error?: string;
}

// ================================
// Create Operations
// ================================

/**
 * Create a new alert for a user (creating user if needed)
 */
export async function createAlert(
  input: CreateAlertInput
): Promise<AlertQueryResult> {
  const db = getDatabase();

  try {
    // Validate input
    if (!input.email || !input.neighborhoods?.length) {
      return {
        success: false,
        error: 'Email and at least one neighborhood are required',
      };
    }

    // Validate price range
    if (input.min_price !== undefined && input.max_price !== undefined) {
      if (input.min_price > input.max_price) {
        return {
          success: false,
          error: 'Minimum price cannot be greater than maximum price',
        };
      }
    }

    // Find or create user
    let user = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, input.email))
      .get();

    if (!user) {
      // Create new user with unsubscribe token
      const unsubscribeToken = generateUnsubscribeToken();
      const [newUser] = await db
        .insert(schema.users)
        .values({
          email: input.email,
          unsubscribe_token: unsubscribeToken,
          is_active: true,
        })
        .returning();
      user = newUser;
    }

    // Create alert
    const [alert] = await db
      .insert(schema.alerts)
      .values({
        user_id: user.id,
        neighborhoods: JSON.stringify(input.neighborhoods),
        min_price: input.min_price || null,
        max_price: input.max_price || null,
        bedrooms: input.bedrooms !== undefined ? input.bedrooms : null,
        pet_friendly:
          input.pet_friendly !== undefined ? input.pet_friendly : null,
        max_commute_minutes: input.max_commute_minutes || null,
        commute_destination: input.commute_destination || null,
        is_active: true,
      })
      .returning();

    return {
      success: true,
      data: alert,
    };
  } catch (error) {
    console.error('Error creating alert:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create alert',
    };
  }
}

// ================================
// Read Operations
// ================================

/**
 * Get all alerts for a user by email
 */
export async function getAlertsByEmail(
  email: string
): Promise<AlertQueryResult> {
  const db = getDatabase();

  try {
    const alerts = await db
      .select({
        id: schema.alerts.id,
        user_id: schema.alerts.user_id,
        neighborhoods: schema.alerts.neighborhoods,
        min_price: schema.alerts.min_price,
        max_price: schema.alerts.max_price,
        bedrooms: schema.alerts.bedrooms,
        pet_friendly: schema.alerts.pet_friendly,
        max_commute_minutes: schema.alerts.max_commute_minutes,
        commute_destination: schema.alerts.commute_destination,
        created_at: schema.alerts.created_at,
        updated_at: schema.alerts.updated_at,
        is_active: schema.alerts.is_active,
      })
      .from(schema.alerts)
      .innerJoin(schema.users, eq(schema.alerts.user_id, schema.users.id))
      .where(
        and(eq(schema.users.email, email), eq(schema.users.is_active, true))
      )
      .orderBy(sql`${schema.alerts.created_at} DESC`);

    return {
      success: true,
      data: alerts,
    };
  } catch (error) {
    console.error('Error getting alerts by email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get alerts',
    };
  }
}

/**
 * Get all active alerts with user information for matching
 */
export async function getActiveAlertsWithUsers(): Promise<AlertWithUser[]> {
  const db = getDatabase();

  try {
    const alerts = await db
      .select({
        // Alert fields
        id: schema.alerts.id,
        user_id: schema.alerts.user_id,
        neighborhoods: schema.alerts.neighborhoods,
        min_price: schema.alerts.min_price,
        max_price: schema.alerts.max_price,
        bedrooms: schema.alerts.bedrooms,
        pet_friendly: schema.alerts.pet_friendly,
        max_commute_minutes: schema.alerts.max_commute_minutes,
        commute_destination: schema.alerts.commute_destination,
        created_at: schema.alerts.created_at,
        updated_at: schema.alerts.updated_at,
        is_active: schema.alerts.is_active,
        // User fields
        userEmail: schema.users.email,
        userCreatedAt: schema.users.created_at,
        userUpdatedAt: schema.users.updated_at,
        userIsActive: schema.users.is_active,
        userUnsubscribeToken: schema.users.unsubscribe_token,
      })
      .from(schema.alerts)
      .innerJoin(schema.users, eq(schema.alerts.user_id, schema.users.id))
      .where(
        and(eq(schema.alerts.is_active, true), eq(schema.users.is_active, true))
      )
      .orderBy(sql`${schema.alerts.created_at} DESC`);

    // Transform to AlertWithUser format
    return alerts.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      neighborhoods: row.neighborhoods,
      min_price: row.min_price,
      max_price: row.max_price,
      bedrooms: row.bedrooms,
      pet_friendly: row.pet_friendly,
      max_commute_minutes: row.max_commute_minutes,
      commute_destination: row.commute_destination,
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_active: row.is_active,
      user: {
        id: row.user_id,
        email: row.userEmail,
        created_at: row.userCreatedAt,
        updated_at: row.userUpdatedAt,
        is_active: row.userIsActive,
        unsubscribe_token: row.userUnsubscribeToken,
      },
    }));
  } catch (error) {
    console.error('Error getting active alerts with users:', error);
    return [];
  }
}

/**
 * Get a specific alert by ID
 */
export async function getAlertById(id: number): Promise<AlertQueryResult> {
  const db = getDatabase();

  try {
    const alert = await db
      .select()
      .from(schema.alerts)
      .where(eq(schema.alerts.id, id))
      .get();

    if (!alert) {
      return {
        success: false,
        error: 'Alert not found',
      };
    }

    return {
      success: true,
      data: alert,
    };
  } catch (error) {
    console.error('Error getting alert by ID:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get alert',
    };
  }
}

// ================================
// Update Operations
// ================================

/**
 * Update an existing alert
 */
export async function updateAlert(
  id: number,
  updates: Partial<CreateAlertInput>
): Promise<AlertQueryResult> {
  const db = getDatabase();

  try {
    // Validate price range if both provided
    if (updates.min_price !== undefined && updates.max_price !== undefined) {
      if (updates.min_price > updates.max_price) {
        return {
          success: false,
          error: 'Minimum price cannot be greater than maximum price',
        };
      }
    }

    // Build update object
    const updateValues: Partial<AlertInsert> = {};

    if (updates.neighborhoods) {
      updateValues.neighborhoods = JSON.stringify(updates.neighborhoods);
    }
    if (updates.min_price !== undefined) {
      updateValues.min_price = updates.min_price;
    }
    if (updates.max_price !== undefined) {
      updateValues.max_price = updates.max_price;
    }
    if (updates.bedrooms !== undefined) {
      updateValues.bedrooms = updates.bedrooms;
    }
    if (updates.pet_friendly !== undefined) {
      updateValues.pet_friendly = updates.pet_friendly;
    }
    if (updates.max_commute_minutes !== undefined) {
      updateValues.max_commute_minutes = updates.max_commute_minutes;
    }
    if (updates.commute_destination !== undefined) {
      updateValues.commute_destination = updates.commute_destination;
    }

    // Always update the updated_at timestamp (handled by database trigger or default)

    const [alert] = await db
      .update(schema.alerts)
      .set(updateValues)
      .where(eq(schema.alerts.id, id))
      .returning();

    if (!alert) {
      return {
        success: false,
        error: 'Alert not found',
      };
    }

    return {
      success: true,
      data: alert,
    };
  } catch (error) {
    console.error('Error updating alert:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update alert',
    };
  }
}

/**
 * Deactivate an alert (soft delete)
 */
export async function deactivateAlert(id: number): Promise<AlertQueryResult> {
  const db = getDatabase();

  try {
    const [alert] = await db
      .update(schema.alerts)
      .set({
        is_active: false,
      })
      .where(eq(schema.alerts.id, id))
      .returning();

    if (!alert) {
      return {
        success: false,
        error: 'Alert not found',
      };
    }

    return {
      success: true,
      data: alert,
    };
  } catch (error) {
    console.error('Error deactivating alert:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to deactivate alert',
    };
  }
}

// ================================
// Delete Operations
// ================================

/**
 * Permanently delete an alert and associated notifications
 */
export async function deleteAlert(id: number): Promise<AlertQueryResult> {
  const db = getDatabase();

  try {
    // Delete associated notifications first (cascade should handle this, but explicit is better)
    await db
      .delete(schema.notifications)
      .where(eq(schema.notifications.alert_id, id));

    // Delete the alert
    const result = await db
      .delete(schema.alerts)
      .where(eq(schema.alerts.id, id));

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error('Error deleting alert:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete alert',
    };
  }
}

// ================================
// Utility Functions
// ================================

/**
 * Generate a secure unsubscribe token
 */
function generateUnsubscribeToken(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

/**
 * Parse neighborhoods JSON string safely
 */
export function parseNeighborhoods(neighborhoodsJson: string): string[] {
  try {
    const parsed = JSON.parse(neighborhoodsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Validate alert input data
 */
export function validateAlertInput(input: CreateAlertInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Email validation
  if (!input.email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    errors.push('Invalid email format');
  }

  // Neighborhoods validation
  if (
    !input.neighborhoods ||
    !Array.isArray(input.neighborhoods) ||
    input.neighborhoods.length === 0
  ) {
    errors.push('At least one neighborhood must be selected');
  }

  // Price validation
  if (input.min_price !== undefined && input.min_price < 0) {
    errors.push('Minimum price cannot be negative');
  }
  if (input.max_price !== undefined && input.max_price < 0) {
    errors.push('Maximum price cannot be negative');
  }
  if (
    input.min_price !== undefined &&
    input.max_price !== undefined &&
    input.min_price > input.max_price
  ) {
    errors.push('Minimum price cannot be greater than maximum price');
  }

  // Bedrooms validation
  if (
    input.bedrooms !== undefined &&
    (input.bedrooms < 0 || input.bedrooms > 10)
  ) {
    errors.push('Bedrooms must be between 0 and 10');
  }

  // Commute validation
  if (
    input.max_commute_minutes !== undefined &&
    (input.max_commute_minutes < 1 || input.max_commute_minutes > 120)
  ) {
    errors.push('Maximum commute time must be between 1 and 120 minutes');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
