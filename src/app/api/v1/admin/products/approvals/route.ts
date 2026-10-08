import { NextRequest, NextResponse } from 'next/server';

import { handleApiError } from '@/backend/lib/api-error-handler';
import { getAdminUser } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/v1/admin/products/approvals - List products for approval queue
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (
      !admin ||
      !['ADMIN', 'OWNER', 'SUPER_ADMIN', 'SUPERVISOR'].includes((admin.role || '').toUpperCase())
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

    if (status === 'pending_approval') {
      whereCondition.status = { in: ['pending_approval', 'draft'] };
    } else if (status !== 'ALL') {
      whereCondition.status = status;
    }

    if (query) {
      whereCondition.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
        { shop: { name: { contains: query, mode: 'insensitive' } } },
      ];
    }

    const [products, totalCount, countAll, countPending, countActive, countDraft, countArchived] =
      await Promise.all([
        prisma.product
          .findMany({
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
          })
          .catch(() =>
            prisma.product
              .findMany({
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
                    },
                  },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
              })
              .catch(() =>
                prisma.product
                  .findMany({
                    where: whereCondition,
                    include: {
                      images: { orderBy: { sortOrder: 'asc' } },
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                  })
                  .catch(() =>
                    prisma.product
                      .findMany({
                        where: whereCondition,
                        orderBy: { createdAt: 'desc' },
                        skip,
                        take: limit,
                      })
                      .catch(() => []),
                  ),
              ),
          ),
        prisma.product.count({ where: whereCondition }).catch(() => 0),
        prisma.product.count({ where: { deletedAt: null } }).catch(() => 0),
        prisma.product
          .count({
            where: { status: { in: ['pending_approval', 'draft'] }, deletedAt: null },
          })
          .catch(() => 0),
        prisma.product.count({ where: { status: 'active', deletedAt: null } }).catch(() => 0),
        prisma.product.count({ where: { status: 'draft', deletedAt: null } }).catch(() => 0),
        prisma.product.count({ where: { status: 'archived', deletedAt: null } }).catch(() => 0),
      ]);

    const counts = {
      ALL: countAll,
      pending_approval: countPending,
      active: countActive,
      draft: countDraft,
      archived: countArchived,
    };

    return NextResponse.json({
      success: true,
      data: (products || []).map((p: any) => ({
        ...p,
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
      })),
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
      counts,
    });
  } catch (error: any) {
    return handleApiError(error, 'GET Admin Product Approvals Error', { isAdmin: true });
  }
}
