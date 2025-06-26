/**
 * Test Setup and Configuration
 *
 * Provides test environment initialization and utilities for the apartment alert system.
 * Implements isolated testing with mock data and database management.
 *
 * Features implemented:
 * - Test database initialization and isolation ✅ DONE
 * - Mock data generation and seeding ✅ DONE
 * - Test environment configuration ✅ DONE
 * - Utility functions for test setup ✅ DONE
 * - Cleanup procedures for test isolation ✅ DONE
 *
 * Related Documentation:
 * - docs/06-file-structure.md (test organization)
 * - docs/04-database-schema.md (test data structure)
 * - CLAUDE.md (testing strategy and configuration)
 */

import { beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { users, alerts } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import { VALIDATION_LIMITS } from '@/lib/utils/constants';

// Test database configuration
const TEST_DB_PATH = ':memory:'; // Use in-memory database for tests
let testDb: Database.Database | null = null;
let testDbConnection: ReturnType<typeof drizzle> | null = null;

// Mock data generators
export const mockData = {
  user: {
    valid: () => ({
      email: `test${Date.now()}${Math.random().toString(36).substring(7)}@example.com`,
      unsubscribe_token: nanoid(VALIDATION_LIMITS.unsubscribeToken),
    }),
    invalid: () => ({
      email: 'invalid-email',
    }),
  },
  alert: {
    valid: () => ({
      email: `test${Date.now()}${Math.random().toString(36).substring(7)}@example.com`,
      neighborhoods: ['Upper East Side', 'Chelsea'],
      min_price: 1500,
      max_price: 3000,
      bedrooms: 1,
      pet_friendly: true,
      max_commute_minutes: 30,
      commute_destination: 'Times Square, NYC',
    }),
    minimal: () => ({
      email: `test${Date.now()}${Math.random().toString(36).substring(7)}@example.com`,
      neighborhoods: ['Upper East Side'],
    }),
    invalid: {
      email: () => ({
        email: 'invalid-email',
        neighborhoods: ['Upper East Side'],
      }),
      neighborhoods: () => ({
        email: `test${Date.now()}${Math.random().toString(36).substring(7)}@example.com`,
        neighborhoods: ['Invalid Neighborhood'],
      }),
      priceRange: () => ({
        email: `test${Date.now()}${Math.random().toString(36).substring(7)}@example.com`,
        neighborhoods: ['Upper East Side'],
        min_price: 100, // Below minimum
        max_price: 50, // Max less than min
      }),
      bedrooms: () => ({
        email: `test${Date.now()}${Math.random().toString(36).substring(7)}@example.com`,
        neighborhoods: ['Upper East Side'],
        bedrooms: 15, // Above maximum
      }),
      commute: () => ({
        email: `test${Date.now()}${Math.random().toString(36).substring(7)}@example.com`,
        neighborhoods: ['Upper East Side'],
        commute_destination: 'Times Square',
        // Missing max_commute_minutes
      }),
    },
  },
};

// Database utilities
export const testDbUtils = {
  initDatabase: () => {
    if (testDb) {
      testDb.close();
    }

    testDb = new Database(TEST_DB_PATH);
    testDbConnection = drizzle(testDb);

    // Initialize schema
    testDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        is_active INTEGER DEFAULT 1 NOT NULL,
        unsubscribe_token TEXT UNIQUE
      );
      
      CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        neighborhoods TEXT NOT NULL,
        min_price INTEGER,
        max_price INTEGER,
        bedrooms INTEGER,
        pet_friendly INTEGER,
        max_commute_minutes INTEGER,
        commute_destination TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        is_active INTEGER DEFAULT 1 NOT NULL
      );
      
      CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users(email);
      CREATE INDEX IF NOT EXISTS users_unsubscribe_token_idx ON users(unsubscribe_token);
      CREATE INDEX IF NOT EXISTS users_active_idx ON users(is_active);
      CREATE INDEX IF NOT EXISTS alerts_user_id_idx ON alerts(user_id);
      CREATE INDEX IF NOT EXISTS alerts_active_idx ON alerts(is_active);
    `);

    return testDbConnection;
  },

  getConnection: () => {
    if (!testDbConnection) {
      throw new Error('Test database not initialized');
    }
    return testDbConnection;
  },

  cleanup: () => {
    if (testDbConnection && testDb) {
      testDb.exec('DELETE FROM alerts');
      testDb.exec('DELETE FROM users');
    }
  },

  close: () => {
    if (testDb) {
      testDb.close();
      testDb = null;
      testDbConnection = null;
    }
  },

  createUser: async (userData: any) => {
    const db = testDbUtils.getConnection();
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  },

  createAlert: async (alertData: any) => {
    const db = testDbUtils.getConnection();
    const [alert] = await db.insert(alerts).values(alertData).returning();
    return alert;
  },

  getUserByEmail: async (email: string) => {
    const db = testDbUtils.getConnection();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user;
  },

  getAlertsByUserId: async (userId: number) => {
    const db = testDbUtils.getConnection();
    return await db.select().from(alerts).where(eq(alerts.user_id, userId));
  },

  getAllUsers: async () => {
    const db = testDbUtils.getConnection();
    return await db.select().from(users);
  },
};

// Global test setup
beforeAll(() => {
  // Set test environment variables
  (process.env as any).NODE_ENV = 'test';
  process.env.DATABASE_URL = TEST_DB_PATH;
});

beforeEach(() => {
  // Initialize fresh database for each test
  testDbUtils.initDatabase();
});

afterEach(() => {
  // Clean up after each test
  testDbUtils.cleanup();
});

afterAll(() => {
  // Close database connection
  testDbUtils.close();
});

// Mock the database module to use test database
vi.mock('@/lib/database', () => ({
  getDatabase: () => testDbUtils.getConnection(),
}));
