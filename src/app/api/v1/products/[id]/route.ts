import { NextRequest, NextResponse } from 'next/server';

import { updateProductSchema } from '@/features/products/schemas/product.schema';
import { ProductService } from '@/features/products/services/product.service';
import { getCurrentUser } from '@/lib/auth-guards';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/v1/products/[id]
 *
 * Public endpoint to fetch a single product by ID or Slug.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Product identifier is required.',
        },
        { status: 400 },
      );
    }

    const result = await ProductService.getProductByIdOrSlug(id);

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
        message: 'Internal server error while fetching product.',
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/v1/products/[id]
 *
 * Protected endpoint for Admin users to update an existing product.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    const validation = updateProductSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0]?.message || 'Invalid product update data.',
          errors: validation.error.format(),
        },
        { status: 400 },
      );
    }

    const result = await ProductService.updateProduct(id, validation.data);

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
        message: 'Internal server error while updating product.',
      },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/v1/products/[id]
 * Alias for PUT endpoint
 */
export async function PATCH(request: NextRequest, context: RouteParams) {
  return PUT(request, context);
}

/**
 * DELETE /api/v1/products/[id]
 *
 * Protected endpoint for Admin users to soft delete a product.
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
    const result = await ProductService.deleteProduct(id);

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
        message: 'Internal server error while deleting product.',
      },
      { status: 500 },
    );
  }
}
