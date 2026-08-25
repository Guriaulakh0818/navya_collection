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
    const { shopId, rejectionReason = 'Incomplete or unverified documentation.' } = body;

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

    // Atomic rejection transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Shop
      const updatedShop = await tx.shop.update({
        where: { id: shopId },
        data: {
          status: ShopStatus.REJECTED,
        },
      });

      // 2. Update User owner
      await tx.user.update({
        where: { id: targetShop.ownerId },
        data: {
          approvalStatus: 'REJECTED',
        },
      });

      // 3. Update SellerProfile if exists
      if (targetShop.sellerProfileId) {
        await tx.sellerProfile.update({
          where: { id: targetShop.sellerProfileId },
          data: {
            status: ShopStatus.REJECTED,
          },
        });
      }

      // 4. Update SellerDocuments
      await tx.sellerDocument.updateMany({
        where: { shopId },
        data: {
          status: 'REJECTED',
          rejectionReason,
        },
      });

      // 5. Create Notification for Seller
      await tx.notification.create({
        data: {
          userId: targetShop.ownerId,
          type: 'SYSTEM',
          title: '⚠️ Seller Application Notice',
          message: `Your seller application for "${targetShop.name}" was not approved. Reason: ${rejectionReason}`,
        },
      });

      // 6. Create Audit Log
      const clientIp =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        '127.0.0.1';

      await tx.auditLog.create({
        data: {
          adminId: admin.id,
          action: 'SELLER_REJECTED',
          entity: 'Shop',
          entityId: shopId,
          metadata: {
            shopName: targetShop.name,
            ownerId: targetShop.ownerId,
            ownerEmail: targetShop.owner.email,
            rejectionReason,
          },
          ipAddress: clientIp,
        },
      });

      return updatedShop;
    });

    // Purge public marketplace cache immediately on status change
    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/', 'layout');
      revalidatePath('/shop');
      if (targetShop.slug) {
        revalidatePath(`/shop/${targetShop.slug}`);
      }
    } catch {
      // Cache revalidation fallback
    }

    // Trigger Seller Email & In-App Notification asynchronously
    try {
      const recipientEmail = targetShop.owner?.email || targetShop.email;
      if (recipientEmail) {
        await NotificationService.notifySellerStatusChange(
          targetShop.ownerId,
          recipientEmail,
          targetShop.name,
          'REJECTED',
          rejectionReason,
        );
      }
    } catch (notifErr) {
      console.warn('⚠️ Failed to dispatch rejection notification email:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: `Shop "${targetShop.name}" application rejected. Seller notified.`,
      data: result,
    });
  } catch (error: any) {
    console.error('❌ Reject Seller Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to reject seller application.' },
      { status: 500 },
    );
  }
}
