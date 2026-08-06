import { NextRequest, NextResponse } from 'next/server';

import { productFilterQuerySchema } from '@/features/filters/schemas/filter.schema';
import { FilterService } from '@/features/filters/services/filter.service';

/**
 * GET /api/v1/products/filter
 *
 * Public API to filter, search, sort, and paginate active products.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const validation = productFilterQuerySchema.safeParse(rawParams);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid product filter parameters.',
          errors: validation.error.format(),
        },
        { status: 400 },
      );
    }

    const result = await FilterService.filterProducts(validation.data);

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
        message: 'Internal server error while filtering products.',
      },
      { status: 500 },
    );
  }
}
