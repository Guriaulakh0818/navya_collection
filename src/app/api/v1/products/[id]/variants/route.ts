import { NextRequest, NextResponse } from 'next/server';

import {
  bulkCreateVariantsSchema,
  createVariantSchema,
  getVariantQuerySchema,
} from '@/features/variants/schemas/variant.schema';
import { VariantService } from '@/features/variants/services/variant.service';
import { getCurrentUser } from '@/lib/auth-guards';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/v1/products/[id]/variants
 *
 * Public endpoint to fetch all variants of a product.
 * Non-admins see only active variants; Admins can see all statuses.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const productId = params.id;

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Product identifier is required.',
        },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());
    const validation = getVariantQuerySchema.safeParse(rawParams);

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

    const result = await VariantService.getVariants(productId, validation.data, isAdmin);

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
        message: 'Internal server error while fetching product variants.',
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/v1/products/[id]/variants
 *
 * Protected endpoint for Admin users to create single or bulk variants for a product.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const body = await request.json().catch(() => ({}));

    // Check if bulk or single creation payload
    if (Array.isArray(body.variants)) {
      const bulkValidation = bulkCreateVariantsSchema.safeParse(body);
      if (!bulkValidation.success) {
        return NextResponse.json(
          {
            success: false,
            message: bulkValidation.error.issues[0]?.message || 'Invalid bulk variants payload.',
            errors: bulkValidation.error.format(),
          },
          { status: 400 },
        );
      }

      const result = await VariantService.bulkCreateVariants(productId, bulkValidation.data);

      return NextResponse.json(
        {
          success: result.success,
          message: result.message,
          data: result.data,
        },
        { status: result.statusCode },
      );
    }

    // Single creation
    const validation = createVariantSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0]?.message || 'Invalid variant input data.',
          errors: validation.error.format(),
        },
        { status: 400 },
      );
    }

    const result = await VariantService.createVariant(productId, validation.data);

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
        message: 'Internal server error while creating product variant.',
      },
      { status: 500 },
    );
  }
}
