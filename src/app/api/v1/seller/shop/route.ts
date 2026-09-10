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

    // Flexibly find seller shop
    let shop = null;
    if (data.shopId || body.shopId) {
      shop = await prisma.shop.findFirst({
        where: { id: data.shopId || body.shopId, deletedAt: null },
        include: { pickupLocations: true, sellerProfile: true },
      });
    }

    if (!shop) {
      shop = await prisma.shop.findFirst({
        where: {
          deletedAt: null,
          OR: [{ ownerId: userId }, { sellerProfile: { userId } }],
        },
        include: { pickupLocations: true, sellerProfile: true },
      });
    }

    // If Admin/Super Admin/Owner, allow editing first active shop
    if (!shop && ['ADMIN', 'SUPER_ADMIN', 'OWNER'].includes(userRole)) {
      shop = await prisma.shop.findFirst({
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
        include: { pickupLocations: true, sellerProfile: true },
      });
    }

    if (!shop) {
      return NextResponse.json(
        { success: false, message: 'Seller shop not found.' },
        { status: 404 },
      );
    }

    const cleanSlug = (
      data.slug ||
      shop.slug ||
      data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    )
      .trim()
      .replace(/^-+|-+$/g, '');

    // Check slug uniqueness if slug changed
    if (cleanSlug !== shop.slug) {
      const existingSlug = await prisma.shop.findUnique({
        where: { slug: cleanSlug },
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

    // 1. Update shop details
    const updatedShop = await prisma.shop.update({
      where: { id: shop.id },
      data: {
        name: data.name,
        slug: cleanSlug,
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
        gstin: data.gstin || null,
        panNumber: data.panNumber || null,
        bankAccountHolder: data.bankAccountHolder || null,
        bankAccountNumber: data.bankAccountNumber || null,
        bankIfscCode: data.bankIfscCode || null,
        bankName: data.bankName || null,
        isClosed: data.isClosed ?? false,
        closedReason: data.closedReason || null,
        closedUntil: data.closedUntil ? new Date(data.closedUntil) : null,
        vacationMessage: data.vacationMessage || null,
      },
    });

    // 2. Synchronize Owner User Name & SellerProfile if provided
    const resolvedContactPerson = (
      data.contactPerson ||
      data.ownerName ||
      data.bankAccountHolder ||
      ''
    ).trim();

    if (shop.ownerId && resolvedContactPerson) {
      await prisma.user
        .update({
          where: { id: shop.ownerId },
          data: { name: resolvedContactPerson },
        })
        .catch(() => {});
    }

    if (shop.sellerProfileId) {
      await prisma.sellerProfile
        .update({
          where: { id: shop.sellerProfileId },
          data: {
            businessName: data.name,
            legalName: resolvedContactPerson || data.name,
            businessAddress: data.fullAddress,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
            gstin: data.gstin || null,
            panNumber: data.panNumber || null,
            bankAccountHolder: data.bankAccountHolder || null,
            bankAccountNumber: data.bankAccountNumber || null,
            bankIfscCode: data.bankIfscCode || null,
            bankName: data.bankName || null,
          },
        })
        .catch(() => {});
    }

    // 3. Synchronize Primary Pickup Location
    let primaryPickup = shop.pickupLocations?.find((p) => p.isPrimary) || shop.pickupLocations?.[0];
    const contactName = resolvedContactPerson || data.name || 'Store Manager';
    const shopCode = shop.shopCode || `NAVYA-SHOP-${shop.id.slice(-6).toUpperCase()}`;
    const locationCode = primaryPickup?.locationCode || `${shopCode}-PKP1`;

    if (primaryPickup) {
      primaryPickup = await prisma.pickupLocation.update({
        where: { id: primaryPickup.id },
        data: {
          name: `${data.name} Hub`,
          addressLine1: data.fullAddress,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          contactName,
          contactPhone: data.phone,
          contactEmail: data.email,
        },
      });
    } else {
      primaryPickup = await prisma.pickupLocation.create({
        data: {
          shopId: shop.id,
          locationCode,
          name: `${data.name} Hub`,
          addressLine1: data.fullAddress,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          country: 'India',
          contactName,
          contactPhone: data.phone,
          contactEmail: data.email,
          isPrimary: true,
          status: 'ACTIVE',
          shiprocketPickupName: locationCode,
          shiprocketStatus: 'PENDING',
        },
      });
    }

    // 4. Trigger background sync with Shiprocket so the new address & contact person are live
    const { PickupLocationService } =
      await import('@/backend/services/shipping/pickup-location.service');
    PickupLocationService.registerWithShiprocket(primaryPickup.id).catch((err) => {
      console.warn('[BACKGROUND_SHIPROCKET_SYNC_ERROR]', err);
    });

    return NextResponse.json({
      success: true,
      message:
        'Shop details, address, settlement bank, and Shiprocket pickup location updated successfully!',
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
