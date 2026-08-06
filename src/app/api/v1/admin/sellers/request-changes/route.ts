import { ShopStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { NotificationService } from '@/backend/services/notification.service';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin || !['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Admin access required.' },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      shopId,
      notes = 'Compliance review in progress. Document verification or clarification requested.',
    } = body;

    if (!shopId) {
      return NextResponse.json(
        { success: false, message: 'Shop ID is required.' },
        { status: 400 },
      );
    }

    const targetShop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: { owner: true },
    });

    if (!targetShop) {
      return NextResponse.json({ success: false, message: 'Shop not found.' }, { status: 404 });
    }

    // Atomic transaction for requesting changes / setting UNDER_REVIEW
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Shop status
      const updatedShop = await tx.shop.update({
        where: { id: shopId },
        data: {
          status: ShopStatus.UNDER_REVIEW,
        },
      });

      // 2. Update User approvalStatus
      await tx.user.update({
        where: { id: targetShop.ownerId },
        data: {
          approvalStatus: 'PENDING_APPROVAL',
        },
      });

      // 3. Update SellerProfile status if exists
      if (targetShop.sellerProfileId) {
        await tx.sellerProfile.update({
          where: { id: targetShop.sellerProfileId },
          data: {
            status: ShopStatus.UNDER_REVIEW,
          },
        });
      }

      // 4. Create Audit Log
      const clientIp =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        '127.0.0.1';

      await tx.auditLog.create({
        data: {
          adminId: admin.id,
          action: 'SELLER_REQUEST_CHANGES',
          entity: 'Shop',
          entityId: shopId,
          metadata: {
            shopName: targetShop.name,
            ownerId: targetShop.ownerId,
            ownerEmail: targetShop.owner.email,
            notes,
          },
          ipAddress: clientIp,
        },
      });

      return updatedShop;
    });

    // Trigger Seller Notification asynchronously
    try {
      if (targetShop.owner?.email) {
        await NotificationService.notifySellerStatusChange(
          targetShop.ownerId,
          targetShop.owner.email,
          targetShop.name,
          'UNDER_REVIEW',
          notes,
        );
      }
    } catch (notifErr) {
      console.warn('⚠️ Failed to dispatch under review notification:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: `Status updated to Under Review for shop "${targetShop.name}". Seller notified.`,
      data: result,
    });
  } catch (error: any) {
    console.error('❌ Request Changes Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update seller status to Under Review.',
      },
      { status: 500 },
    );
  }
}
