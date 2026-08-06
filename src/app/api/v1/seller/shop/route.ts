import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { SESSION_COOKIE_NAME } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';
import { shopManagementSchema } from '@/shared/validations/shop-management.schema';

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'navya_collection_jwt_secret_key_2026_min_32chars';
  return new TextEncoder().encode(secret);
}

export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 },
      );
    }

    const { payload } = await jwtVerify(token, getJwtSecretKey());
    const userId = payload.userId as string;
    const userRole = String(payload.role || 'USER');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Invalid session token.' },
        { status: 401 },
      );
    }

    const validSellerRoles = ['SELLER', 'OWNER', 'ADMIN', 'SUPER_ADMIN'];
    if (!validSellerRoles.includes(userRole)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Seller or Admin role required.' },
        { status: 403 },
      );
    }

    const body = await req.json();
    const validationResult = shopManagementSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const data = validationResult.data;

    // Find seller's primary shop
    const shop = await prisma.shop.findFirst({
      where: { ownerId: userId, deletedAt: null },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, message: 'Seller shop not found.' },
        { status: 404 },
      );
    }

    // Check slug uniqueness if slug changed
    if (data.slug !== shop.slug) {
      const existingSlug = await prisma.shop.findUnique({
        where: { slug: data.slug },
      });
      if (existingSlug && existingSlug.id !== shop.id) {
        return NextResponse.json(
          {
            success: false,
            message: 'This unique shop URL slug is already taken. Please choose another.',
          },
          { status: 400 },
        );
      }
    }

    // Update shop details
    const updatedShop = await prisma.shop.update({
      where: { id: shop.id },
      data: {
        name: data.name,
        slug: data.slug,
        logo: data.logo || null,
        banner: data.banner || null,
        description: data.description || null,
        phone: data.phone,
        email: data.email,
        fullAddress: data.fullAddress,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        shippingPolicy: data.shippingPolicy || null,
        returnPolicy: data.returnPolicy || null,
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        isClosed: data.isClosed ?? false,
        closedReason: data.closedReason || null,
        closedUntil: data.closedUntil ? new Date(data.closedUntil) : null,
        vacationMessage: data.vacationMessage || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Shop details, branding, policies, and SEO updated successfully!',
      data: updatedShop,
    });
  } catch (error: any) {
    console.error('❌ PUT Seller Shop API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update shop details.' },
      { status: 500 },
    );
  }
}
