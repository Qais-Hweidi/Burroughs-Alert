import { NextResponse } from 'next/server';

/**
 * Health check endpoint specifically for keeping the Render.com instance awake
 * This endpoint will be called by external cron services like cron-job.org
 */
export async function GET() {
  const timestamp = new Date().toISOString();
  
  return NextResponse.json({
    status: 'ok',
    message: 'Burroughs-Alert is awake',
    timestamp,
    uptime: process.uptime(),
  });
}

export async function HEAD() {
  // Support HEAD requests for more efficient pinging
  return new NextResponse(null, { status: 200 });
}