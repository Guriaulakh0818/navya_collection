import { NextResponse } from 'next/server';

import { CategoryService } from '@/features/categories/services/category.service';

/**
 * GET /api/v1/categories/featured
 *
 * Public endpoint to fetch featured categories for home page showcase.
 */
export async function GET() {
  try {
    const result = await CategoryService.getFeaturedCategories();

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
        message: 'Internal server error while fetching featured categories.',
      },
      { status: 500 },
    );
  }
}
