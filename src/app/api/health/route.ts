/**
 * API Route: /api/health
 * Purpose: System health monitoring endpoint returning status of database, environment, and system components
 * Status: Fully implemented with comprehensive health checks
 * Response: JSON with overall status ("healthy"|"degraded"|"unhealthy") and component details
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/database';
import packageJson from '../../../../package.json';

// ================================
// Health Check Types
// ================================

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  components: {
    database: {
      status: 'healthy' | 'error';
      details: any;
    };
    environment: {
      status: 'healthy' | 'warning' | 'error';
      details: any;
    };
    system: {
      status: 'healthy';
      details: any;
    };
  };
  summary: {
    total: number;
    healthy: number;
    warnings: number;
    errors: number;
  };
}

// ================================
// Health Check Functions
// ================================

/**
 * Check environment configuration health
 */
const checkEnvironmentHealth = (): {
  status: 'healthy' | 'warning' | 'error';
  details: any;
} => {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check essential environment variables
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    warnings.push('DATABASE_URL not configured, using default');
  }

  // Check optional email configuration
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    warnings.push(
      'Email configuration incomplete (SMTP_HOST, SMTP_USER, SMTP_PASS)'
    );
  }

  // Check optional Google Maps API key
  const googleMapsKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!googleMapsKey) {
    warnings.push(
      'GOOGLE_MAPS_API_KEY not configured (commute calculations disabled)'
    );
  }

  const status: 'healthy' | 'warning' | 'error' =
    errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'healthy';

  return {
    status,
    details: {
      nodeEnv: process.env.NODE_ENV || 'development',
      databaseUrl: databaseUrl ? 'configured' : 'default',
      emailConfigured: smtpHost && smtpUser && smtpPass,
      googleMapsConfigured: !!googleMapsKey,
      warnings,
      errors,
    },
  };
};

/**
 * Check system resource health
 */
const checkSystemHealth = () => {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();

  return {
    status: 'healthy' as const,
    details: {
      uptime: Math.floor(uptime),
      uptimeFormatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
      memory: {
        used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
      },
      platform: process.platform,
      nodeVersion: process.version,
    },
  };
};

/**
 * Aggregate component health into overall system status
 */
const aggregateHealth = (
  components: SystemHealth['components']
): SystemHealth['status'] => {
  const statuses = Object.values(components).map(
    (component) => component.status
  );

  if (statuses.includes('error')) {
    return 'unhealthy';
  }

  if (statuses.includes('warning')) {
    return 'degraded';
  }

  return 'healthy';
};

/**
 * Generate health summary statistics
 */
const generateSummary = (components: SystemHealth['components']) => {
  const statuses = Object.values(components).map(
    (component) => component.status
  );

  return {
    total: statuses.length,
    healthy: statuses.filter((s) => s === 'healthy').length,
    warnings: statuses.filter((s) => s === 'warning').length,
    errors: statuses.filter((s) => s === 'error').length,
  };
};

// ================================
// API Route Handler
// ================================

/**
 * GET /api/health
 * Returns comprehensive system health information
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Perform all health checks
    const [databaseHealth, environmentHealth, systemHealth] = await Promise.all(
      [
        checkDatabaseHealth(),
        Promise.resolve(checkEnvironmentHealth()),
        Promise.resolve(checkSystemHealth()),
      ]
    );

    // Build health response
    const components = {
      database: {
        status: databaseHealth.status,
        details: databaseHealth,
      },
      environment: environmentHealth,
      system: systemHealth,
    };

    const overallStatus = aggregateHealth(components);
    const summary = generateSummary(components);

    const healthResponse: SystemHealth = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: packageJson.version,
      uptime: process.uptime(),
      components,
      summary,
    };

    // Add performance timing
    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        ...healthResponse,
        meta: {
          responseTime: `${responseTime}ms`,
          endpoint: '/api/health',
        },
      },
      {
        status:
          overallStatus === 'healthy'
            ? 200
            : overallStatus === 'degraded'
              ? 200
              : 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('Health check failed:', error);

    const errorResponse = {
      status: 'unhealthy' as const,
      timestamp: new Date().toISOString(),
      version: packageJson.version,
      error:
        error instanceof Error ? error.message : 'Unknown health check error',
      meta: {
        responseTime: `${Date.now() - startTime}ms`,
        endpoint: '/api/health',
      },
    };

    return NextResponse.json(errorResponse, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  }
}

// ================================
// Method Not Allowed Handler
// ================================

/**
 * Handle unsupported HTTP methods
 */
export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
