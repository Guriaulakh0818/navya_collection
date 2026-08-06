import { NextRequest, NextResponse } from 'next/server';

import { ShiprocketService } from '@/services/shipping/shiprocket.service';

/**
 * GET /api/shipping/auth
 * Verifies current Shiprocket connection & token health status.
 * Never exposes the raw Shiprocket Bearer token to frontend clients.
 */
export async function GET() {
  try {
    const result = await ShiprocketService.verifyConnection();
    return NextResponse.json(result, { status: result.statusCode });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to verify Shiprocket authentication status.',
        statusCode: 500,
        error: {
          code: 'SHIPROCKET_AUTH_VERIFY_ERROR',
          details: error.message,
        },
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/shipping/auth
 * Triggers/Forces token refresh with Shiprocket servers.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const forceRefresh = Boolean(body.forceRefresh);

    const result = forceRefresh
      ? await ShiprocketService.refreshToken()
      : await ShiprocketService.verifyConnection();

    return NextResponse.json(result, { status: result.statusCode });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to authenticate with Shiprocket.',
        statusCode: 500,
        error: {
          code: 'SHIPROCKET_AUTH_POST_ERROR',
          details: error.message,
        },
      },
      { status: 500 },
    );
  }
}
