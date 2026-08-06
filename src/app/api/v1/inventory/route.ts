import { NextRequest, NextResponse } from 'next/server';

import { getInventoryQuerySchema } from '@/features/inventory/schemas/inventory.schema';
import { InventoryService } from '@/features/inventory/services/inventory.service';
import { getCurrentUser } from '@/lib/auth-guards';

/**
 * GET /api/v1/inventory
 *
 * Endpoint to fetch inventory listing with pagination, search (SKU/Product Name), and stock status filters.
 * Non-admins see sanitized badges; Admins see full warehouse metrics.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const validation = getInventoryQuerySchema.safeParse(rawParams);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid query parameters.',
          errors: validation.error.format(),
        },
        { status: 400 },
      );
    }

    const user = await getCurrentUser();
    const isAdmin = Boolean(user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'));

    const result = await InventoryService.getInventoryList(validation.data, isAdmin);

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        data: result.data,
        meta: result.meta,
      },
      { status: result.statusCode },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error while fetching inventory.',
      },
      { status: 500 },
    );
  }
}
