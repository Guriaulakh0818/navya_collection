import { ShopStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
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
    const { shopId, suspensionReason = 'Compliance investigation or policy violation.' } = body;

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

    // Atomic suspension transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Shop
      const updatedShop = await tx.shop.update({
        where: { id: shopId },
        data: {
          status: ShopStatus.SUSPENDED,
        },
      });

      // 2. Update User owner
      await tx.user.update({
        where: { id: targetShop.ownerId },
        data: {
          approvalStatus: 'SUSPENDED',
        },
      });

      // 3. Update SellerProfile if exists
      if (targetShop.sellerProfileId) {
        await tx.sellerProfile.update({
          where: { id: targetShop.sellerProfileId },
          data: {
            status: ShopStatus.SUSPENDED,
          },
        });
      }

      // 4. Create Notification for Seller
      await tx.notification.create({
        data: {
          userId: targetShop.ownerId,
          type: 'SYSTEM',
          title: '🚨 Shop Suspended',
          message: `Your shop "${targetShop.name}" has been suspended by Admin. Reason: ${suspensionReason}. Contact seller support for resolution.`,
        },
      });

      // 5. Create Audit Log
      const clientIp =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        '127.0.0.1';

      await tx.auditLog.create({
        data: {
          adminId: admin.id,
          action: 'SELLER_SUSPENDED',
          entity: 'Shop',
          entityId: shopId,
          metadata: {
            shopName: targetShop.name,
            ownerId: targetShop.ownerId,
            ownerEmail: targetShop.owner.email,
            suspensionReason,
          },
          ipAddress: clientIp,
        },
      });

      return updatedShop;
    });

    return NextResponse.json({
      success: true,
      message: `Shop "${targetShop.name}" suspended. Seller notified.`,
      data: result,
    });
  } catch (error: any) {
    console.error('❌ Suspend Seller Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to suspend seller shop.' },
      { status: 500 },
    );
  }
}
