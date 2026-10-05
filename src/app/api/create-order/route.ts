import { NextResponse } from 'next/server';

/**
 * POST /api/create-order (DEPRECATED & SECURED)
 *
 * Under BM-06 Specification, client-supplied arbitrary payment amounts are strictly prohibited.
 * All payments must be generated through the authoritative server-side checkout preview engine.
 * Authoritative endpoint: POST /api/v1/payments/create-order
 */
export async function POST(_request: Request) {
  return NextResponse.json(
    {
      success: false,
      code: 'DEPRECATED_UNSAFE_PAYMENT_CREATION',
      error:
        'Arbitrary client-side payment amounts are prohibited under BM-06. Please use the authoritative endpoint: POST /api/v1/payments/create-order',
    },
    { status: 400 },
  );
}
