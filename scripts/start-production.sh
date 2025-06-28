#!/bin/bash

# Production startup script for Render
echo "Starting Burroughs-Alert in production..."
echo "PORT environment variable: ${PORT:-not set}"
echo "Using port: ${PORT:-3000}"

# Start Next.js server
echo "Starting Next.js server..."
npm run start &
NEXT_PID=$!

# Wait for Next.js to be ready
echo "Waiting for Next.js to initialize..."
sleep 15

# Check if Next.js is running
if ps -p $NEXT_PID > /dev/null; then
    echo "Next.js server started successfully"
    
    # Start job system
    echo "Starting background job system..."
    npm run jobs:start &
    JOBS_PID=$!
    
    echo "All services started. PIDs: Next.js=$NEXT_PID, Jobs=$JOBS_PID"
    
    # Wait for either process to exit
    wait $NEXT_PID $JOBS_PID
else
    echo "ERROR: Next.js server failed to start"
    exit 1
fi