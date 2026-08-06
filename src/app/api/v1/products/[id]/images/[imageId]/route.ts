import { NextRequest, NextResponse } from 'next/server';

import { updateImageSchema } from '@/features/images/schemas/image.schema';
import { ImageService } from '@/features/images/services/image.service';
import { getCurrentUser } from '@/lib/auth-guards';

interface RouteParams {
  params: {
    id: string;
    imageId: string;
  };
}

/**
 * PATCH /api/v1/products/[id]/images/[imageId]
 *
 * Protected endpoint for Admin users to update image alt text, sort order, or replace image file.
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
    const { imageId } = params;
    const body = await request.json().catch(() => ({}));
    const validation = updateImageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0]?.message || 'Invalid image update data.',
          errors: validation.error.format(),
        },
        { status: 400 },
      );
    }

    const result = await ImageService.updateImage(productId, imageId, validation.data);

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
        message: 'Internal server error while updating product image.',
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/v1/products/[id]/images/[imageId]
 * Alias for PATCH endpoint
 */
export async function PUT(request: NextRequest, context: RouteParams) {
  return PATCH(request, context);
}

/**
 * DELETE /api/v1/products/[id]/images/[imageId]
 *
 * Protected endpoint for Admin users to soft delete an image.
 * Auto-assigns next available image as primary if deleted image was primary.
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
    const { imageId } = params;

    const result = await ImageService.deleteImage(productId, imageId);

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
        message: 'Internal server error while deleting product image.',
      },
      { status: 500 },
    );
  }
}
