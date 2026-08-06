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
    const userId = payload.userId as string;

    const shop = await prisma.shop.findFirst({
      where: { ownerId: userId, deletedAt: null },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, message: 'Seller shop not found' },
        { status: 404 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { productIds } = body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Please select at least one product to delete.' },
        { status: 400 },
      );
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // Bulk soft delete products matching shopId
      const updateResult = await tx.product.updateMany({
        where: {
          id: { in: productIds },
          shopId: shop.id,
          deletedAt: null,
        },
        data: {
          deletedAt: now,
        },
      });

      // Log Audit Trail
      const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
      await tx.auditLog.create({
        data: {
          adminId: userId,
          action: 'BULK_PRODUCTS_DELETED',
          entity: 'Product',
          metadata: {
            deletedCount: updateResult.count,
            productIds,
          },
          ipAddress: clientIp,
        },
      });

      return updateResult.count;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result} selected products.`,
      count: result,
    });
  } catch (error: any) {
    console.error('❌ Bulk Delete Seller Products Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
