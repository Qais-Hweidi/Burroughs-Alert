#!/usr/bin/env tsx

/**
 * Database migration script
 * Adds missing columns to existing tables
 */

import Database from 'better-sqlite3';

const databaseUrl = process.env.DATABASE_URL || 'file:./data/app.db';
const dbPath = databaseUrl.replace('file:', '');

console.log('Running database migrations on:', dbPath);

try {
  const db = new Database(dbPath);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Check if alerts table exists
  const tableExists = db
    .prepare(
      `
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='alerts'
  `
    )
    .get();

  if (!tableExists) {
    console.log(
      '⏭️ Alerts table does not exist. Fresh deployment - skipping migrations.'
    );
    console.log('✅ Migration complete (no tables to migrate)');
    process.exit(0);
  }

  // Get current columns
  const columns = db.prepare(`PRAGMA table_info(alerts)`).all() as Array<{
    name: string;
  }>;
  const columnNames = columns.map((col) => col.name);

  console.log('Current columns:', columnNames.join(', '));

  // Define migrations
  const migrations = [
    {
      column: 'max_commute_minutes',
      sql: 'ALTER TABLE alerts ADD COLUMN max_commute_minutes INTEGER',
    },
    {
      column: 'commute_destination',
      sql: 'ALTER TABLE alerts ADD COLUMN commute_destination TEXT',
    },
    {
      column: 'commute_destination_place_id',
      sql: 'ALTER TABLE alerts ADD COLUMN commute_destination_place_id TEXT',
    },
    {
      column: 'commute_destination_lat',
      sql: 'ALTER TABLE alerts ADD COLUMN commute_destination_lat REAL',
    },
    {
      column: 'commute_destination_lng',
      sql: 'ALTER TABLE alerts ADD COLUMN commute_destination_lng REAL',
    },
  ];

  // Run migrations
  let migrationsRun = 0;
  for (const migration of migrations) {
    if (!columnNames.includes(migration.column)) {
      console.log(`Adding column: ${migration.column}`);
      db.exec(migration.sql);
      migrationsRun++;
    }
  }

  if (migrationsRun > 0) {
    console.log(`✅ Applied ${migrationsRun} migrations successfully`);
  } else {
    console.log('✅ Database is already up to date');
  }

  // Verify final schema
  const finalColumns = db.prepare(`PRAGMA table_info(alerts)`).all() as Array<{
    name: string;
  }>;
  const finalColumnNames = finalColumns.map((col) => col.name);
  console.log('\nFinal columns:', finalColumnNames.join(', '));

  db.close();
  console.log('\n✅ Migration complete');
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}
