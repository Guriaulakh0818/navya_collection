import { NextRequest, NextResponse } from 'next/server';

import { updateCategorySchema } from '@/features/categories/schemas/category.schema';
import { CategoryService } from '@/features/categories/services/category.service';
import { getCurrentUser } from '@/lib/auth-guards';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/v1/categories/[id]
 *
 * Public endpoint to fetch category details by ID or Slug.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Category identifier is required.',
        },
        { status: 400 },
      );
    }

    const result = await CategoryService.getCategoryByIdOrSlug(id);

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
        message: 'Internal server error while fetching category details.',
      },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/v1/categories/[id]
 *
 * Protected endpoint for Admin users to update an existing category.
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

    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const validation = updateCategorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0]?.message || 'Invalid category update data.',
          errors: validation.error.format(),
        },
        { status: 400 },
      );
    }

    const result = await CategoryService.updateCategory(id, validation.data);

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
        message: 'Internal server error while updating category.',
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/v1/categories/[id]
 * Alias for PATCH endpoint
 */
export async function PUT(request: NextRequest, context: RouteParams) {
  return PATCH(request, context);
}

/**
 * DELETE /api/v1/categories/[id]
 *
 * Protected endpoint for Admin users to soft delete a category.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
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

    const { id } = params;
    const result = await CategoryService.deleteCategory(id);

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
      },
      { status: result.statusCode },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error while deleting category.',
      },
      { status: 500 },
    );
  }
}
