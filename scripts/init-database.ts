#!/usr/bin/env tsx

/**
 * Database initialization script
 * Ensures database has the latest schema
 */

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../src/lib/database/schema';

// Load environment variables
config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL || 'file:./data/app.db';
const dbPath = databaseUrl.replace('file:', '');

console.log('Initializing database at:', dbPath);

try {
  // Create database connection
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite, { schema });

  // Check if we need to add commute columns
  const checkColumn = sqlite.prepare(`
    SELECT COUNT(*) as count 
    FROM pragma_table_info('alerts') 
    WHERE name = 'commute_destination_place_id'
  `).get() as { count: number };

  if (checkColumn.count === 0) {
    console.log('Adding commute columns to alerts table...');
    
    // Add the missing columns
    sqlite.exec(`
      ALTER TABLE alerts ADD COLUMN commute_destination TEXT;
      ALTER TABLE alerts ADD COLUMN commute_destination_place_id TEXT;
      ALTER TABLE alerts ADD COLUMN commute_destination_lat REAL;
      ALTER TABLE alerts ADD COLUMN commute_destination_lng REAL;
      ALTER TABLE alerts ADD COLUMN max_commute_time INTEGER;
    `);
    
    console.log('✅ Commute columns added successfully');
  } else {
    console.log('✅ Database schema is up to date');
  }

  // Verify the schema
  const tables = sqlite.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all() as { name: string }[];

  console.log('\nDatabase tables:', tables.map(t => t.name).join(', '));
  
  sqlite.close();
  console.log('\n✅ Database initialization complete');
  
} catch (error) {
  console.error('❌ Database initialization failed:', error);
  process.exit(1);
}