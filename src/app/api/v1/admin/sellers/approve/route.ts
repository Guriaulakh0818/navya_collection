import { Role, ShopStatus, VerificationBadge } from '@prisma/client';
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
      commissionRate = 10.0,
      verificationBadge = VerificationBadge.VERIFIED_SELLER,
    } = body;

    if (!shopId) {
      return NextResponse.json(
        { success: false, message: 'Shop ID is required.' },
        { status: 400 },
      );
    }

    const targetShop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: { owner: true, sellerProfile: true },
    });

    if (!targetShop) {
      return NextResponse.json({ success: false, message: 'Shop not found.' }, { status: 404 });
    }

    // Atomic approval transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Shop
      const updatedShop = await tx.shop.update({
        where: { id: shopId },
        data: {
          status: ShopStatus.APPROVED,
          verificationBadge: verificationBadge as VerificationBadge,
          commissionRate: parseFloat(String(commissionRate)),
        },
      });

      // 2. Update User owner
      await tx.user.update({
        where: { id: targetShop.ownerId },
        data: {
          role: Role.SELLER,
          approvalStatus: 'APPROVED',
        },
      });

      // 3. Update SellerProfile if exists
      if (targetShop.sellerProfileId) {
        await tx.sellerProfile.update({
          where: { id: targetShop.sellerProfileId },
          data: {
            status: ShopStatus.APPROVED,
            verificationBadge: verificationBadge as VerificationBadge,
            commissionRate: parseFloat(String(commissionRate)),
          },
        });
      }

      // 4. Update SellerDocuments
      await tx.sellerDocument.updateMany({
        where: { shopId },
        data: { status: 'APPROVED' },
      });

      // 5. Create Notification for Seller
      await tx.notification.create({
        data: {
          userId: targetShop.ownerId,
          type: 'SYSTEM',
          title: '🎉 Shop Approved & Activated!',
          message: `Congratulations! Your shop "${targetShop.name}" has been approved by Navya Collection Admin. Your seller dashboard is now active.`,
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
          action: 'SELLER_APPROVED',
          entity: 'Shop',
          entityId: shopId,
          metadata: {
            shopName: targetShop.name,
            ownerId: targetShop.ownerId,
            ownerEmail: targetShop.owner.email,
            commissionRate,
            verificationBadge,
          },
          ipAddress: clientIp,
        },
      });

      return updatedShop;
    });

    // Trigger Seller Email Notification asynchronously
    try {
      if (targetShop.owner?.email) {
        await NotificationService.notifySellerStatusChange(
          targetShop.ownerId,
          targetShop.owner.email,
          targetShop.name,
          'APPROVED',
        );
      }
    } catch (notifErr) {
      console.warn('⚠️ Failed to dispatch approval notification email:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: `Shop "${targetShop.name}" approved successfully! Seller dashboard is active.`,
      data: result,
    });
  } catch (error: any) {
    console.error('❌ Approve Seller Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to approve seller.' },
      { status: 500 },
    );
  }
}
