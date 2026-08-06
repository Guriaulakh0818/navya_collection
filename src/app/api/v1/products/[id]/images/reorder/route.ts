import { NextRequest, NextResponse } from 'next/server';

import { reorderImagesSchema } from '@/features/images/schemas/image.schema';
import { ImageService } from '@/features/images/services/image.service';
import { getCurrentUser } from '@/lib/auth-guards';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * PATCH /api/v1/products/[id]/images/reorder
 *
 * Protected endpoint for Admin users to drag-and-drop reorder product images.
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
    const body = await request.json().catch(() => ({}));
    const validation = reorderImagesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0]?.message || 'Invalid image reorder data.',
          errors: validation.error.format(),
        },
        { status: 400 },
      );
    }

    const result = await ImageService.reorderImages(productId, validation.data);

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
        message: 'Internal server error while reordering product images.',
      },
      { status: 500 },
    );
  }
}
