import { NextRequest, NextResponse } from 'next/server';

import { setPrimaryImageSchema } from '@/features/images/schemas/image.schema';
import { ImageService } from '@/features/images/services/image.service';
import { getCurrentUser } from '@/lib/auth-guards';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * PATCH /api/v1/products/[id]/images/primary
 *
 * Protected endpoint for Admin users to set a specific image as Primary.
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
    const validation = setPrimaryImageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0]?.message || 'Invalid primary image payload.',
          errors: validation.error.format(),
        },
        { status: 400 },
      );
    }

    const result = await ImageService.setPrimaryImage(productId, validation.data.imageId);

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
        message: 'Internal server error while setting primary product image.',
      },
      { status: 500 },
    );
  }
}
