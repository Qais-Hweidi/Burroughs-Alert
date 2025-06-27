#!/usr/bin/env node

const Database = require('better-sqlite3');
const db = new Database('./data/app.db');

function showTable(tableName, limit = 10) {
  console.log(`\n=== ${tableName.toUpperCase()} TABLE ===`);
  try {
    const rows = db.prepare(`SELECT * FROM ${tableName} LIMIT ${limit}`).all();
    if (rows.length > 0) {
      console.table(rows);
    } else {
      console.log('No data found');
    }
  } catch (error) {
    console.error(`Error reading ${tableName}:`, error.message);
  }
}

function showStats() {
  console.log('\n=== DATABASE STATISTICS ===');

  const tables = ['users', 'alerts', 'listings', 'notifications'];
  tables.forEach((table) => {
    try {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
      console.log(`${table}: ${count.count} records`);
    } catch (error) {
      console.log(`${table}: Error - ${error.message}`);
    }
  });
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Burroughs Alert Database Viewer');
  console.log('Usage: node scripts/view-database.js [table] [limit]');
  console.log('Available tables: users, alerts, listings, notifications');
  console.log('Example: node scripts/view-database.js listings 5');

  showStats();
} else {
  const table = args[0];
  const limit = parseInt(args[1]) || 10;
  showTable(table, limit);
}

db.close();
