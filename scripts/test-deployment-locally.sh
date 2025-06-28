#!/bin/bash

# Test deployment setup locally before pushing
echo "🧪 Testing deployment setup locally..."
echo "This simulates what happens on Render"
echo ""

# Clean up any existing test database
if [ -f "./data/test-deploy.db" ]; then
  rm ./data/test-deploy.db
  echo "Removed old test database"
fi

# Set test environment
export DATABASE_URL="file:./data/test-deploy.db"
export NODE_ENV="production"
export PORT="3000"

echo "Environment variables set:"
echo "  DATABASE_URL=$DATABASE_URL"
echo "  NODE_ENV=$NODE_ENV"
echo "  PORT=$PORT"
echo ""

# Start Next.js in background
echo "Starting Next.js server..."
npm run start &
NEXT_PID=$!

# Wait for server to initialize
echo "Waiting for server to initialize database..."
sleep 10

# Check if server is running
if ps -p $NEXT_PID > /dev/null; then
    echo "✅ Next.js started successfully"
    
    # Check database schema
    echo ""
    echo "Checking database schema..."
    npx tsx -e "
    const Database = require('better-sqlite3');
    const db = new Database('./data/test-deploy.db');
    const columns = db.prepare('PRAGMA table_info(alerts)').all();
    console.log('Alerts table columns:');
    columns.forEach(col => console.log('  -', col.name));
    
    const hasCommuteColumn = columns.some(col => col.name === 'commute_destination_place_id');
    if (hasCommuteColumn) {
        console.log('\\n✅ Commute columns exist!');
    } else {
        console.log('\\n❌ Commute columns missing!');
        process.exit(1);
    }
    db.close();
    "
    
    # Kill the server
    kill $NEXT_PID
    echo ""
    echo "✅ Test passed! Safe to deploy."
else
    echo "❌ Next.js failed to start"
    exit 1
fi

# Cleanup
rm -f ./data/test-deploy.db
echo "Cleaned up test database"