import { NextRequest, NextResponse } from 'next/server';

import { bulkUpdateInventorySchema } from '@/features/inventory/schemas/inventory.schema';
import { InventoryService } from '@/features/inventory/services/inventory.service';
import { getCurrentUser } from '@/lib/auth-guards';

/**
 * POST /api/v1/inventory/bulk-update
 *
 * Protected endpoint for Admin users to perform bulk stock updates across multiple variants.
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json().catch(() => ({}));
    const validation = bulkUpdateInventorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0]?.message || 'Invalid bulk inventory update payload.',
          errors: validation.error.format(),
        },
        { status: 400 },
      );
    }

    const result = await InventoryService.bulkUpdateInventory(validation.data);

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
        message: 'Internal server error while bulk updating inventory.',
      },
      { status: 500 },
    );
  }
}
