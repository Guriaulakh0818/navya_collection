import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { SESSION_COOKIE_NAME } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'navya_collection_jwt_secret_key_2026_min_32chars';
  return new TextEncoder().encode(secret);
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 },
      );
    }

    const { payload } = await jwtVerify(token, getJwtSecretKey());
    const userId = payload.userId as string;

    if (!userId) {
      return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        approvalStatus: true,
        sellerProfile: true,
        ownedShops: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            verificationBadge: true,
            createdAt: true,
            updatedAt: true,
            city: true,
            state: true,
            phone: true,
            email: true,
            description: true,
            logo: true,
            banner: true,
            fullAddress: true,
            pincode: true,
            shippingPolicy: true,
            returnPolicy: true,
            metaTitle: true,
            metaDescription: true,
            isClosed: true,
            closedReason: true,
            closedUntil: true,
            vacationMessage: true,
            documents: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    let primaryShop = user.ownedShops[0] || null;

    if (primaryShop && primaryShop.name) {
      const expectedSlug = primaryShop.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      if (expectedSlug && primaryShop.slug !== expectedSlug) {
        try {
          const updated = await prisma.shop.update({
            where: { id: primaryShop.id },
            data: { slug: expectedSlug },
          });
          primaryShop.slug = updated.slug;
        } catch {
          // Keep current if slug exists on another shop
        }
      }
    }

    // Check if any rejected document or notification carries rejection reason
    let rejectionReason: string | null = null;
    if (primaryShop) {
      const rejectedDoc = primaryShop.documents?.find(
        (d) => d.status === 'REJECTED' && d.rejectionReason,
      );
      if (rejectedDoc) {
        rejectionReason = rejectedDoc.rejectionReason;
      }
    }

    if (!rejectionReason) {
      const latestRejectNotif = await prisma.notification.findFirst({
        where: {
          userId: user.id,
          type: 'SYSTEM',
          title: { contains: 'Rejected' },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (latestRejectNotif) {
        rejectionReason = latestRejectNotif.message;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        approvalStatus: user.approvalStatus,
        status:
          primaryShop?.status ||
          (user.approvalStatus === 'APPROVED' ? 'APPROVED' : 'PENDING_VERIFICATION'),
        isApproved: user.approvalStatus === 'APPROVED' && primaryShop?.status === 'APPROVED',
        shop: primaryShop,
        sellerProfile: user.sellerProfile,
        rejectionReason,
      },
    });
  } catch (error: any) {
    console.error('❌ Seller Status API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve seller status' },
      { status: 500 },
    );
  }
}
