import { NextRequest, NextResponse } from 'next/server';

import { getAdminUser } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/v1/admin/products/approvals - List products for approval queue
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (
      !admin ||
      !['ADMIN', 'OWNER', 'SUPER_ADMIN', 'SUPERVISOR'].includes(admin.role?.toUpperCase())
    ) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending_approval';
    const query = (searchParams.get('q') || '').trim().toLowerCase();
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const whereCondition: any = {
      deletedAt: null,
    };

    if (status !== 'ALL') {
      whereCondition.status = status;
    }

    if (query) {
      whereCondition.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
        { shop: { name: { contains: query, mode: 'insensitive' } } },
      ];
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: whereCondition,
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          variants: true,
          category: { select: { id: true, name: true, slug: true } },
          shop: {
            select: {
              id: true,
              name: true,
              slug: true,
              phone: true,
              email: true,
              owner: {
                select: { id: true, name: true, email: true, mobile: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where: whereCondition }),
    ]);

    const counts = {
      ALL: await prisma.product.count({ where: { deletedAt: null } }),
      pending_approval: await prisma.product.count({
        where: { status: 'pending_approval', deletedAt: null },
      }),
      active: await prisma.product.count({ where: { status: 'active', deletedAt: null } }),
      draft: await prisma.product.count({ where: { status: 'draft', deletedAt: null } }),
      archived: await prisma.product.count({ where: { status: 'archived', deletedAt: null } }),
    };

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
      counts,
    });
  } catch (error: any) {
    console.error('❌ GET Admin Product Approvals Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
