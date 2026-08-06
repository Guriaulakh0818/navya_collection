import { NextRequest, NextResponse } from 'next/server';

import { productSearchQuerySchema } from '@/features/search/schemas/search.schema';
import { SearchService } from '@/features/search/services/search.service';

/**
 * GET /api/v1/products/search
 *
 * Public endpoint to search active products with keyword matching, filters, pagination, and multi-attribute sorting.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const validation = productSearchQuerySchema.safeParse(rawParams);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid search query parameters.',
          errors: validation.error.format(),
        },
        { status: 400 },
      );
    }

    const result = await SearchService.searchProducts(validation.data);

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
        message: 'Internal server error while searching products.',
      },
      { status: 500 },
    );
  }
}
