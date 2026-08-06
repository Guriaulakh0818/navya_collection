import { NextRequest, NextResponse } from 'next/server';

import {
  createCategorySchema,
  getCategoryQuerySchema,
} from '@/features/categories/schemas/category.schema';
import { CategoryService } from '@/features/categories/services/category.service';
import { getCurrentUser } from '@/lib/auth-guards';

/**
 * GET /api/v1/categories
 *
 * Public endpoint to fetch categories list with pagination, search, status, and parent filtering.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const validation = getCategoryQuerySchema.safeParse(rawParams);

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

    const result = await CategoryService.getCategories(validation.data);

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
        message: 'Internal server error while fetching categories.',
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/v1/categories
 *
 * Protected endpoint for Admin users to create a new category.
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
    const validation = createCategorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0]?.message || 'Invalid category input data.',
          errors: validation.error.format(),
        },
        { status: 400 },
      );
    }

    const result = await CategoryService.createCategory(validation.data);

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
        message: 'Internal server error while creating category.',
      },
      { status: 500 },
    );
  }
}
