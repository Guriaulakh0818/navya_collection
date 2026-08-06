import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { SESSION_COOKIE_NAME } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'navya_collection_jwt_secret_key_2026_min_32chars';
  return new TextEncoder().encode(secret);
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, getJwtSecretKey());
    const adminId = payload.userId as string;

    const adminUser = await prisma.user.findUnique({
      where: { id: adminId },
      select: { id: true, role: true, name: true },
    });

    if (!adminUser || !['ADMIN', 'OWNER', 'SUPER_ADMIN'].includes(adminUser.role)) {
      return NextResponse.json(
        { success: false, message: 'Admin permissions required.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { productId, reason } = body;

    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'Product ID is required.' },
        { status: 400 },
      );
    }

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        {
          success: false,
          message: 'A clear rejection reason (at least 5 characters) is required.',
        },
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
      // 1. Update product status to archived / rejected
      await tx.product.update({
        where: { id: productId },
        data: {
          status: 'archived',
        },
      });

      // 2. Send Notification to Seller Owner
      if (product.shop?.ownerId) {
        await tx.notification.create({
          data: {
            userId: product.shop.ownerId,
            type: 'SYSTEM',
            title: '⚠️ Product Submission Rejected',
            message: `Your product submission "${product.name}" was rejected by admin. Reason: ${reason}`,
          },
        });
      }

      // 3. Audit Log
      await tx.auditLog.create({
        data: {
          adminId: adminUser.id,
          action: 'PRODUCT_REJECTED',
          entity: 'Product',
          entityId: productId,
          metadata: {
            productName: product.name,
            shopId: product.shopId,
            shopName: product.shop?.name,
            rejectionReason: reason,
            rejectedBy: adminUser.name,
          },
          ipAddress: clientIp,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Product "${product.name}" rejected successfully. Seller notified.`,
    });
  } catch (error: any) {
    console.error('❌ POST Reject Product Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
