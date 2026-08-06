import { NextRequest, NextResponse } from 'next/server';

import { calculateTaxSchema } from '@/features/tax/schemas/tax.schema';
import { TaxService } from '@/features/tax/services/tax.service';
import { getCurrentUser } from '@/lib/session';

/**
 * POST /api/v1/tax/calculate
 *
 * Centralized Server-Side Tax Calculation Endpoint for Checkout.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userIdHeader = request.headers.get('x-user-id');
    const userId = user?.id || userIdHeader || '';

    const body = await request.json();
    const validationResult = calculateTaxSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMsg =
        validationResult.error.issues[0]?.message || 'Invalid tax calculation payload.';
      return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
    }

    const response = await TaxService.calculateTax(userId, validationResult.data);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_CALCULATE_TAX_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}
