import { NextRequest, NextResponse } from 'next/server';

import {
  uploadMultipleImagesSchema,
  uploadSingleImageSchema,
} from '@/features/images/schemas/image.schema';
import { ImageService } from '@/features/images/services/image.service';
import { getCurrentUser } from '@/lib/auth-guards';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/v1/products/[id]/images
 *
 * Public endpoint to fetch all active product images enriched with Cloudinary optimized URLs.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
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

    const result = await ImageService.getProductImages(productId);

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
        message: 'Internal server error while fetching product images.',
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/v1/products/[id]/images
 *
 * Protected endpoint for Admin users to upload single or multiple product images.
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

    // Check if multiple images upload payload
    if (Array.isArray(body.images)) {
      const bulkValidation = uploadMultipleImagesSchema.safeParse(body);
      if (!bulkValidation.success) {
        return NextResponse.json(
          {
            success: false,
            message: bulkValidation.error.issues[0]?.message || 'Invalid multiple images payload.',
            errors: bulkValidation.error.format(),
          },
          { status: 400 },
        );
      }

      const result = await ImageService.uploadMultipleImages(productId, bulkValidation.data);

      return NextResponse.json(
        {
          success: result.success,
          message: result.message,
          data: result.data,
        },
        { status: result.statusCode },
      );
    }

    // Single image upload
    const validation = uploadSingleImageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0]?.message || 'Invalid image input data.',
          errors: validation.error.format(),
        },
        { status: 400 },
      );
    }

    const result = await ImageService.uploadSingleImage(productId, validation.data);

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
        message: 'Internal server error while uploading product image.',
      },
      { status: 500 },
    );
  }
}
