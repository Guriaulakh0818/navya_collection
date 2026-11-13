import { NextRequest, NextResponse } from 'next/server';

import { getAdminUser } from '@/backend/lib/session';
import { Founding50Service } from '@/backend/services/founding-50.service';
import { PushNotificationService } from '@/backend/services/push-notification.service';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const INTERNAL_SYNC_SECRET =
  process.env.INTERNAL_SYNC_SECRET || 'navya_prod_sync_taxonomy_secret_2026';

function isAuthorized(request: NextRequest, admin: any) {
  const authHeader = request.headers.get('authorization') || request.headers.get('x-sync-secret');
  const isSecretAuthorized =
    authHeader &&
    (authHeader === INTERNAL_SYNC_SECRET || authHeader === `Bearer ${INTERNAL_SYNC_SECRET}`);

  const isAdminAuthorized =
    admin && ['ADMIN', 'OWNER', 'SUPER_ADMIN'].includes(admin.role?.toUpperCase());

  return Boolean(isSecretAuthorized || isAdminAuthorized);
}

// GET /api/v1/admin/sellers/reconcile - Inspect current sellers and shops
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!isAuthorized(request, admin)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // Auto-heal Founding 50 database schema
    await Founding50Service.ensureSchema();
    await PushNotificationService.ensureTable();

    const [shops, users] = await Promise.all([
      prisma.shop.findMany({
        where: { slug: 'navya-collection' },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              mobile: true,
              role: true,
              approvalStatus: true,
            },
          },
        },
      }),
      prisma.user.findMany({
        where: {
          OR: [
            {
              email: {
                in: [
                  'navyacollection45@gmail.com',
                  'admin@navyacollection.store',
                  'admin@jiivaakart.com',
                  'gurvindersingh0218@gmail.com',
                ],
              },
            },
            { name: { contains: 'Ramniwas', mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          role: true,
          approvalStatus: true,
        },
      }),
    ]);

    return NextResponse.json({ success: true, data: { shops, users } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/v1/admin/sellers/reconcile - Reconcile shop ownership to real sellers
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!isAuthorized(request, admin)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // Auto-heal Founding 50 database schema
    await Founding50Service.ensureSchema();
    await PushNotificationService.ensureTable();

    // 1. Reconcile Ramniwas Verma (Navya Collection Flagship in Hisar)
    let ramniwasUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'navyacollection45@gmail.com' },
          { mobile: '8901422923' },
          { name: { contains: 'Ramniwas', mode: 'insensitive' } },
        ],
      },
    });

    if (ramniwasUser) {
      ramniwasUser = await prisma.user.update({
        where: { id: ramniwasUser.id },
        data: {
          name: 'Ramniwas Verma',
          email: 'navyacollection45@gmail.com',
          mobile: '8901422923',
          role: 'SELLER',
          approvalStatus: 'APPROVED',
        },
      });
    } else {
      ramniwasUser = await prisma.user.create({
        data: {
          name: 'Ramniwas Verma',
          email: 'navyacollection45@gmail.com',
          mobile: '8901422923',
          role: 'SELLER',
          approvalStatus: 'APPROVED',
        },
      });
    }

    // 2. Reconcile Navya Collection Shop
    const navyaShop = await prisma.shop.findFirst({
      where: {
        OR: [
          { slug: 'navya-collection' },
          { name: { contains: 'Navya Collection', mode: 'insensitive' } },
        ],
      },
    });

    let updatedNavyaShop = null;
    if (navyaShop) {
      updatedNavyaShop = await prisma.shop.update({
        where: { id: navyaShop.id },
        data: {
          name: 'Navya Collection',
          slug: 'navya-collection',
          ownerId: ramniwasUser.id,
          email: 'navyacollection45@gmail.com',
          phone: '8901422923',
          city: 'Hisar',
          state: 'Haryana',
          pincode: '125001',
          fullAddress: 'Hisar, Haryana, India',
          status: 'APPROVED',
          verificationBadge: 'VERIFIED_SELLER',
          isFoundingSeller: true,
          foundingSlotNumber: (navyaShop as any).foundingSlotNumber || 1,
          foundingStatus: 'ACTIVE',
          foundingJoinedAt: (navyaShop as any).foundingJoinedAt || new Date(),
          commissionRate: 5.0,
          deletedAt: null,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              mobile: true,
              role: true,
              approvalStatus: true,
            },
          },
        },
      });
    } else {
      updatedNavyaShop = await prisma.shop.create({
        data: {
          name: 'Navya Collection',
          slug: 'navya-collection',
          ownerId: ramniwasUser.id,
          email: 'navyacollection45@gmail.com',
          phone: '8901422923',
          city: 'Hisar',
          state: 'Haryana',
          pincode: '125001',
          fullAddress: 'Hisar, Haryana, India',
          status: 'APPROVED',
          verificationBadge: 'VERIFIED_SELLER',
          isFoundingSeller: true,
          foundingSlotNumber: 1,
          foundingStatus: 'ACTIVE',
          foundingJoinedAt: new Date(),
          commissionRate: 5.0,
          deletedAt: null,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              mobile: true,
              role: true,
              approvalStatus: true,
            },
          },
        },
      });
    }

    // 4. Safely Link ONLY Truly Unassigned Products (NEVER alter status/deletedAt of existing products)
    let productUpdateCount = 0;
    if (updatedNavyaShop) {
      const linked = await prisma.product.updateMany({
        where: {
          OR: [{ shopId: null }, { shopId: '' }],
          status: 'active',
          deletedAt: null,
        },
        data: {
          shopId: updatedNavyaShop.id,
        },
      });
      productUpdateCount = linked.count;
    }

    // 5. CLEANUP: Re-archive and soft-delete all products that were previously rejected or deleted
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        action: { in: ['PRODUCT_REJECTED', 'BULK_PRODUCTS_DELETED', 'PRODUCT_DELETED'] },
      },
      select: { action: true, entityId: true, metadata: true },
    });

    const archivedIds = new Set<string>();

    // Known rejected test products from admin rejections and user reports:
    const knownRejectedIds = [
      'cmvqygp9o000gelbcezknz34u', // Men Beige Printed Hooded (mistakenly in Sarees)
      'cmvqyg2u90002elbc1pyxaldc', // Men Beige Printed Hooded (mistakenly in Sarees)
      'cmvqyi1dj000uelbcniah5e00', // Men Beige Printed Hoodie (Louis Vuitton print)
      'cmvqy1zdb0002ghgcylxne38j', // Men Brown Printed Hoodie (Louis Vuitton print)
      'cmvqxuluo0002y6hane4099d7', // Men Black Printed Hoodie (Louis Vuitton print)
      'cmv3vetkh0002unih3h7wz2w7', // t shirt (Royal Store logo test banner)
      'cmv9pyhvw0009ose67938cdds', // black t shirt (Adidas test print)
    ];
    knownRejectedIds.forEach((id) => archivedIds.add(id));

    for (const log of auditLogs) {
      if (log.entityId) {
        archivedIds.add(log.entityId);
      }
      if (log.metadata && typeof log.metadata === 'object') {
        const meta = log.metadata as any;
        if (Array.isArray(meta.productIds)) {
          meta.productIds.forEach((pid: string) => {
            if (typeof pid === 'string') archivedIds.add(pid);
          });
        }
        if (typeof meta.productId === 'string') {
          archivedIds.add(meta.productId);
        }
      }
    }

    // Auto-detect any hoodies, sweatshirts, or track wear mistakenly tagged under sarees
    const misplacedSareeProducts = await prisma.product.findMany({
      where: {
        category: {
          slug: { in: ['sarees', 'women-sarees', 'silk-sarees'] },
        },
        OR: [
          { name: { contains: 'hood', mode: 'insensitive' } },
          { name: { contains: 'sweatshirt', mode: 'insensitive' } },
          { name: { contains: 'jacket', mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    });
    misplacedSareeProducts.forEach((p) => archivedIds.add(p.id));

    // Auto-detect test products named simply 't shirt' or 'black t shirt' or containing 'royal store'
    const testTShirts = await prisma.product.findMany({
      where: {
        OR: [
          { name: { equals: 't shirt', mode: 'insensitive' } },
          { name: { equals: 'black t shirt', mode: 'insensitive' } },
          { description: { contains: 'royal store', mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    });
    testTShirts.forEach((p) => archivedIds.add(p.id));

    let archivedCount = 0;
    if (archivedIds.size > 0) {
      const archiveRes = await prisma.product.updateMany({
        where: { id: { in: Array.from(archivedIds) } },
        data: {
          status: 'archived',
          deletedAt: new Date(),
        },
      });
      archivedCount = archiveRes.count;
    }

    // 6. Explicitly enforce REJECTED & archived status for Sk collection (Jarnail Singh)
    const rejectedSkShop = await prisma.shop.findFirst({
      where: {
        OR: [
          { slug: 'sk-collection' },
          { name: { contains: 'Sk collection', mode: 'insensitive' } },
        ],
      },
    });

    if (rejectedSkShop) {
      await prisma.shop.update({
        where: { id: rejectedSkShop.id },
        data: {
          status: 'REJECTED',
          isFoundingSeller: false,
          foundingSlotNumber: null,
          foundingStatus: 'INELIGIBLE',
          deletedAt: new Date(),
        },
      });

      if (rejectedSkShop.ownerId) {
        await prisma.user
          .update({
            where: { id: rejectedSkShop.ownerId },
            data: { approvalStatus: 'REJECTED' },
          })
          .catch(() => {});
      }

      await prisma.product
        .updateMany({
          where: { shopId: rejectedSkShop.id },
          data: {
            status: 'archived',
            deletedAt: new Date(),
          },
        })
        .catch(() => {});
    }

    // 7. Auto-compact Founding 50 slots so approved boutiques get clean sequential slots
    const enrollment = await Founding50Service.autoEnrollApprovedShops();

    // 8. Reconcile Referral & Rewards Ledger: Purge duplicate ghost credits from unauthenticated guest attempts
    let ghostLedgerPurgedCount = 0;
    let ghostEventsPurgedCount = 0;
    try {
      ghostLedgerPurgedCount = await prisma.$executeRawUnsafe(`
        DELETE FROM user_coins_ledger
        WHERE id IN ('coin-1793642598080-taas', 'coin-1793642743390-rfs8')
           OR (description LIKE '%Friend New Friend%' AND type = 'REFERRAL_BONUS')
      `);
      ghostEventsPurgedCount = await prisma.$executeRawUnsafe(`
        DELETE FROM referral_events
        WHERE id IN ('ref-1793642586298-lk1t', 'ref-1793642731838-oxv8')
           OR (friend_user_id IS NULL AND (friend_name = 'New Friend' OR friend_name IS NULL))
      `);
    } catch (e: any) {
      console.warn('[RECONCILE_REFERRAL_PURGE_WARN]', e.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Seller and shop ownership reconciled, rejected/deleted products safely archived.',
      data: {
        navyaCollection: updatedNavyaShop,
        linkedUnassignedProductsCount: productUpdateCount,
        archivedRejectedProductsCount: archivedCount,
        archivedProductIds: Array.from(archivedIds),
        foundingEnrollment: enrollment,
        ghostLedgerPurgedCount,
        ghostEventsPurgedCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
