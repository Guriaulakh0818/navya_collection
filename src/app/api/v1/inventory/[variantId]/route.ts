import { NextRequest, NextResponse } from 'next/server';

import { updateInventorySchema } from '@/features/inventory/schemas/inventory.schema';
import { InventoryService } from '@/features/inventory/services/inventory.service';
import { getCurrentUser } from '@/lib/auth-guards';

interface RouteParams {
  params: {
    variantId: string;
  };
}

/**
 * GET /api/v1/inventory/[variantId]
 *
 * Endpoint to fetch single variant inventory details.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { variantId } = params;

    if (!variantId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Variant identifier is required.',
        },
        { status: 400 },
      );
    }

    const user = await getCurrentUser();
    const isAdmin = Boolean(user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'));

    const result = await InventoryService.getVariantInventory(variantId, isAdmin);

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
        message: 'Internal server error while fetching variant inventory.',
      },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/v1/inventory/[variantId]
 *
 * Protected endpoint for Admin users to update inventory levels directly.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    const validation = updateInventorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0]?.message || 'Invalid inventory update data.',
          errors: validation.error.format(),
        },
        { status: 400 },
      );
    }

    const result = await InventoryService.updateInventory(variantId, validation.data);

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
        message: 'Internal server error while updating inventory.',
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/v1/inventory/[variantId]
 * Alias for PATCH endpoint
 */
export async function PUT(request: NextRequest, context: RouteParams) {
  return PATCH(request, context);
}
