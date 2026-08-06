import { NextRequest, NextResponse } from 'next/server';

import { adjustStockSchema } from '@/features/inventory/schemas/inventory.schema';
import { InventoryService } from '@/features/inventory/services/inventory.service';
import { getCurrentUser } from '@/lib/auth-guards';

interface RouteParams {
  params: {
    variantId: string;
  };
}

/**
 * POST /api/v1/inventory/[variantId]/adjust
 *
 * Protected endpoint for Admin users to perform manual stock adjustments (INCREASE, DECREASE, RESERVE, RELEASE, SET).
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Access denied. Admin authorization required.',
        },
        { status: 403 },
      );
    }

    const { variantId } = params;
    const body = await request.json().catch(() => ({}));
    const validation = adjustStockSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0]?.message || 'Invalid stock adjustment payload.',
          errors: validation.error.format(),
        },
        { status: 400 },
      );
    }

    const result = await InventoryService.adjustStock(variantId, validation.data);

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        data: result.data,
      },
      { status: result.statusCode },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error while adjusting stock.',
      },
      { status: 500 },
    );
  }
}
