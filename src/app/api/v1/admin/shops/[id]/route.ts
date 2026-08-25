import { ShopStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

/**
 * DELETE /api/v1/admin/shops/[id]
 * Performs a safe SOFT-DELETE on a shop:
 * 1. Sets Shop.deletedAt = new Date() and Shop.status = ShopStatus.INACTIVE.
 * 2. Hides the shop from public marketplace queries.
 * 3. PRESERVES the owner User account (User is NEVER deleted).
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await getCurrentUser();
    if (!admin || !['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(admin.role?.toUpperCase())) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Admin authorization required.' },
        { status: 403 },
      );
    }

    const shopId = params.id;
    if (!shopId) {
      return NextResponse.json(
        { success: false, message: 'Shop ID parameter is required.' },
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

    // Atomic transaction for safe soft delete
    const updatedShop = await prisma.$transaction(async (tx) => {
      // 1. Soft-delete Shop (Mark INACTIVE and set deletedAt)
      const shop = await tx.shop.update({
        where: { id: shopId },
        data: {
          status: ShopStatus.INACTIVE,
          deletedAt: new Date(),
        },
      });

      // 2. Audit Log (Owner User is preserved)
      const clientIp =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        '127.0.0.1';

      await tx.auditLog.create({
        data: {
          adminId: admin.id,
          action: 'SHOP_SOFT_DELETED',
          entity: 'Shop',
          entityId: shopId,
          metadata: {
            shopName: targetShop.name,
            ownerId: targetShop.ownerId,
            ownerEmail: targetShop.owner?.email || 'N/A',
            note: 'Shop removed from public marketplace. Owner user account preserved intact.',
          },
          ipAddress: clientIp,
        },
      });

      return shop;
    });

    return NextResponse.json({
      success: true,
      message: `Shop "${targetShop.name}" removed from marketplace. Owner user account "${targetShop.owner?.email}" preserved intact.`,
      data: updatedShop,
    });
  } catch (error: any) {
    console.error('❌ Admin Delete Shop Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to soft delete shop.' },
      { status: 500 },
    );
  }
}
