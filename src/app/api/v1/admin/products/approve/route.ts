import { NextRequest, NextResponse } from 'next/server';

import { getAdminUser } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();

    if (!adminUser || !['ADMIN', 'OWNER', 'SUPER_ADMIN'].includes(adminUser.role?.toUpperCase())) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Supervisor is in read-only mode.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'Product ID is required.' },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        shop: {
          select: { id: true, name: true, ownerId: true },
        },
      },
    });

    if (!product || product.deletedAt) {
      return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
    }

    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

    await prisma.$transaction(async (tx) => {
      // 1. Update product status to active
      await tx.product.update({
        where: { id: productId },
        data: {
          status: 'active',
        },
      });

      // 2. Send Notification to Seller Owner
      if (product.shop?.ownerId) {
        await tx.notification.create({
          data: {
            userId: product.shop.ownerId,
            type: 'SYSTEM',
            title: '🎉 Product Listing Approved!',
            message: `Congratulations! Your product "${product.name}" has been approved by admin and is now live on Navya Collection.`,
          },
        });
      }

      // 3. Audit Log
      await tx.auditLog.create({
        data: {
          adminId: adminUser.id,
          action: 'PRODUCT_APPROVED',
          entity: 'Product',
          entityId: productId,
          metadata: {
            productName: product.name,
            shopId: product.shopId,
            shopName: product.shop?.name,
            approvedBy: adminUser.name || 'Admin',
          },
          ipAddress: clientIp,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Product "${product.name}" approved successfully and published live.`,
    });
  } catch (error: any) {
    console.error('❌ POST Approve Product Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
