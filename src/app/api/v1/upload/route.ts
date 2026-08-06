import { NextRequest, NextResponse } from 'next/server';

import {
  CloudinaryFolder,
  deleteImageFromCloudinary,
  uploadImageToCloudinary,
  validateImageFile,
} from '@/lib/cloudinary';
import { getCurrentUser } from '@/lib/session';

/**
 * POST /api/v1/upload
 *
 * Server-side validated image upload endpoint supporting single and multiple file uploads.
 * Enforces per-folder file size limits (5MB for products, 10MB for banners) and MIME type checks.
 * RESTRICTED: Requires ADMIN or SUPER_ADMIN authorization.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required. Please log in.' },
        { status: 401 },
      );
    }
    const contentType = request.headers.get('content-type') || '';
    const { searchParams } = new URL(request.url);

    const folderParam = (searchParams.get('folder') || 'products') as CloudinaryFolder;
    const categorySlug =
      searchParams.get('categorySlug') || searchParams.get('category') || undefined;
    const productSlug = searchParams.get('productSlug') || searchParams.get('product') || undefined;
    const bannerSlug = searchParams.get('bannerSlug') || searchParams.get('banner') || undefined;

    const validFolders: CloudinaryFolder[] = [
      'products',
      'categories',
      'banners',
      'brands',
      'logos',
      'users',
      'seller_shops',
      'seller_products',
      'temp',
    ];

    if (!validFolders.includes(folderParam)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid folder '${folderParam}'. Valid options: ${validFolders.join(', ')}.`,
        },
        { status: 400 },
      );
    }

    const uploadResults = [];

    // 1. Handle multipart/form-data upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const files = formData.getAll('file') as File[];

      if (files.length === 0) {
        return NextResponse.json(
          { success: false, message: 'No file provided in form-data payload.' },
          { status: 400 },
        );
      }

      // Limit batch size to max 10 files per request
      if (files.length > 10) {
        return NextResponse.json(
          { success: false, message: 'Maximum 10 files allowed per upload batch.' },
          { status: 400 },
        );
      }

      for (let idx = 0; idx < files.length; idx++) {
        const file = files[idx];

        // SERVER-SIDE STRICT VALIDATION (MIME & File Size)
        const validation = validateImageFile(file.type, file.size, folderParam);
        if (!validation.valid) {
          return NextResponse.json({ success: false, message: validation.error }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Data = `data:${file.type};base64,${buffer.toString('base64')}`;

        const result = await uploadImageToCloudinary(base64Data, {
          folder: folderParam,
          categorySlug,
          productSlug,
          bannerSlug,
          imageNumber: idx + 1,
        });

        uploadResults.push(result);
      }
    } else {
      // 2. Handle JSON payload (base64 strings or image URLs)
      const body = await request.json();
      const images: string[] = Array.isArray(body.images)
        ? body.images
        : body.imageUrl
          ? [body.imageUrl]
          : [];

      if (images.length === 0) {
        return NextResponse.json(
          { success: false, message: 'No image URL or base64 data provided in JSON payload.' },
          { status: 400 },
        );
      }

      if (images.length > 10) {
        return NextResponse.json(
          { success: false, message: 'Maximum 10 files allowed per upload batch.' },
          { status: 400 },
        );
      }

      for (let idx = 0; idx < images.length; idx++) {
        const imgString = images[idx];
        const result = await uploadImageToCloudinary(imgString, {
          folder: folderParam,
          categorySlug,
          productSlug,
          bannerSlug,
          imageNumber: idx + 1,
        });

        uploadResults.push(result);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully uploaded ${uploadResults.length} image(s) to Cloudinary.`,
        data: uploadResults,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('[UPLOAD_ROUTE_POST_ERROR]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error during image upload.' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/v1/upload
 *
 * Deletes an image asset from Cloudinary using publicId.
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required. Please log in.' },
        { status: 401 },
      );
    }
    const { searchParams } = new URL(request.url);
    let publicId = searchParams.get('publicId');

    if (!publicId) {
      try {
        const body = await request.json();
        publicId = body.publicId;
      } catch {
        // Query param fallback
      }
    }

    if (!publicId) {
      return NextResponse.json(
        { success: false, message: "Query parameter or JSON body 'publicId' is required." },
        { status: 400 },
      );
    }

    const deleted = await deleteImageFromCloudinary(publicId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: `Failed to delete image asset '${publicId}' from Cloudinary.` },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Image '${publicId}' deleted successfully from Cloudinary.`,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('[UPLOAD_ROUTE_DELETE_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error during Cloudinary image deletion.' },
      { status: 500 },
    );
  }
}
