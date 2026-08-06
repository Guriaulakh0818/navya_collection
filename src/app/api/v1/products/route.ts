import { NextRequest, NextResponse } from 'next/server';

import {
  createProductSchema,
  getProductQuerySchema,
} from '@/features/products/schemas/product.schema';
import { ProductService } from '@/features/products/services/product.service';
import { getCurrentUser } from '@/lib/auth-guards';

/**
 * GET /api/v1/products
 *
 * Public endpoint to fetch products list with pagination, search, sorting, and filters.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const validation = getProductQuerySchema.safeParse(rawParams);

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

    const result = await ProductService.getProducts(validation.data);

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        data: result.data,
        meta: result.meta,
      },
      {
        status: result.statusCode,
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          Vary: 'Cookie, Host, Accept-Language',
        },
      },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error while fetching products.',
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/v1/products
 *
 * Protected endpoint for Admin users to create a new product.
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
    const validation = createProductSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0]?.message || 'Invalid product input data.',
          errors: validation.error.format(),
        },
        { status: 400 },
      );
    }

    const result = await ProductService.createProduct(validation.data);

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
        message: 'Internal server error while creating product.',
      },
      { status: 500 },
    );
  }
}
