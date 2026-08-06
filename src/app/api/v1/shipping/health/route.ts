import { NextResponse } from 'next/server';

import { ShiprocketModule } from '@/backend/services/shipping/shiprocket-module';

/**
 * GET /api/v1/shipping/health
 * Evaluates real-time health metrics of the Shiprocket Shipping Module.
 * Checks database connection, token freshness, API ping latency, and rate limits.
 */
export async function GET() {
  try {
    const health = await ShiprocketModule.getHealthStatus();
    const isOk = health.status === 'HEALTHY' || health.status === 'DEGRADED';

    return NextResponse.json(
      {
        success: isOk,
        message: `Shiprocket module health status: ${health.status}`,
        statusCode: isOk ? 200 : 503,
        data: health,
      },
      { status: isOk ? 200 : 503 },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to perform shipping health check.',
        statusCode: 500,
        error: {
          code: 'HEALTH_CHECK_ERROR',
          details: error.message,
        },
      },
      { status: 500 },
    );
  }
}
