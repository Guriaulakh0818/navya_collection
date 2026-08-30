import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

/**
 * GET /api/health
 * Production System & Database Health Check Endpoint.
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Ping PostgreSQL database via Prisma query
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;

    return NextResponse.json(
      {
        status: 'UP',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        databaseEnv: process.env.DATABASE_ENV || 'local',
        database: {
          status: 'CONNECTED',
          environment: (process.env.DATABASE_ENV || 'local').toUpperCase(),
          latencyMs: latency,
        },
        version: '1.0.0',
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      },
    );
  } catch (error: any) {
    console.error('❌ Health Check Failed:', error);
    return NextResponse.json(
      {
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        database: {
          status: 'DISCONNECTED',
          error: error.message || 'Database connection error.',
        },
      },
      { status: 503 },
    );
  }
}
