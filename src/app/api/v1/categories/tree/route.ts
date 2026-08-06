import { NextResponse } from 'next/server';

import { CategoryService } from '@/features/categories/services/category.service';

/**
 * GET /api/v1/categories/tree
 *
 * Public endpoint to fetch hierarchical category tree (Root -> Children -> Sub-children).
 */
export async function GET() {
  try {
    const result = await CategoryService.getCategoryTree();

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
        message: 'Internal server error while fetching category tree.',
      },
      { status: 500 },
    );
  }
}
