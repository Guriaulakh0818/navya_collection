import { NextRequest, NextResponse } from 'next/server';

import { updateVariantSchema } from '@/features/variants/schemas/variant.schema';
import { VariantService } from '@/features/variants/services/variant.service';
import { getCurrentUser } from '@/lib/auth-guards';

interface RouteParams {
  params: {
    id: string;
    variantId: string;
  };
}

/**
 * GET /api/v1/products/[id]/variants/[variantId]
 *
 * Public endpoint to fetch details of a single variant.
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

    const result = await VariantService.getVariantById(variantId);

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
        message: 'Internal server error while fetching variant details.',
      },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/v1/products/[id]/variants/[variantId]
 *
 * Protected endpoint for Admin users to update an existing variant.
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

    const productId = params.id;
    const { variantId } = params;
    const body = await request.json().catch(() => ({}));
    const validation = updateVariantSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0]?.message || 'Invalid variant update data.',
          errors: validation.error.format(),
        },
        { status: 400 },
      );
    }

    const result = await VariantService.updateVariant(productId, variantId, validation.data);

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
        message: 'Internal server error while updating variant.',
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/v1/products/[id]/variants/[variantId]
 * Alias for PATCH endpoint
 */
export async function PUT(request: NextRequest, context: RouteParams) {
  return PATCH(request, context);
}

/**
 * DELETE /api/v1/products/[id]/variants/[variantId]
 *
 * Protected endpoint for Admin users to soft delete a variant.
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

    const productId = params.id;
    const { variantId } = params;
    const result = await VariantService.deleteVariant(productId, variantId);

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
        message: 'Internal server error while deleting variant.',
      },
      { status: 500 },
    );
  }
}
