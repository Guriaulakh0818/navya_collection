import { NextRequest, NextResponse } from 'next/server';

import { getAdminUser } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const INTERNAL_SYNC_SECRET =
  process.env.INTERNAL_SYNC_SECRET || 'navya_prod_sync_taxonomy_secret_2026';

function isAuthorized(request: NextRequest, admin: any) {
  const authHeader =
    request.headers.get('authorization') || request.headers.get('x-sync-secret');
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

    const [shops, users] = await Promise.all([
      prisma.shop.findMany({
        where: { slug: { in: ['navya-collection', 'sk-collection'] } },
        include: {
          owner: {
            select: { id: true, name: true, email: true, mobile: true, role: true, approvalStatus: true },
          },
        },
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { email: { in: ['navyacollection45@gmail.com', 'admin@navyacollection.store', 'gurvindersingh0218@gmail.com'] } },
            { name: { contains: 'Ramniwas', mode: 'insensitive' } },
            { name: { contains: 'Jarnail', mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, email: true, mobile: true, role: true, approvalStatus: true },
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

    // 2. Reconcile Jarnail Singh (Sk collection in Fatehabad)
    let jarnailUser = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { contains: 'Jarnail', mode: 'insensitive' } },
          { email: { contains: 'jarnail', mode: 'insensitive' } },
        ],
      },
    });

    if (jarnailUser) {
      jarnailUser = await prisma.user.update({
        where: { id: jarnailUser.id },
        data: {
          name: 'Jarnail Singh',
          role: 'SELLER',
          approvalStatus: 'APPROVED',
        },
      });
    } else {
      jarnailUser = await prisma.user.create({
        data: {
          name: 'Jarnail Singh',
          email: 'jarnail.skcollection@gmail.com',
          mobile: '+919053883125',
          role: 'SELLER',
          approvalStatus: 'APPROVED',
        },
      });
    }

    // 3. Reconcile Navya Collection Shop
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
          deletedAt: null,
        },
        include: {
          owner: {
            select: { id: true, name: true, email: true, mobile: true, role: true, approvalStatus: true },
          },
        },
      });
    }

    // 4. Reconcile Sk collection Shop
    const skShop = await prisma.shop.findFirst({
      where: {
        OR: [
          { slug: 'sk-collection' },
          { name: { contains: 'Sk collection', mode: 'insensitive' } },
        ],
      },
    });

    let updatedSkShop = null;
    if (skShop) {
      updatedSkShop = await prisma.shop.update({
        where: { id: skShop.id },
        data: {
          name: 'Sk collection',
          slug: 'sk-collection',
          ownerId: jarnailUser.id,
          email: jarnailUser.email || 'jarnail.skcollection@gmail.com',
          phone: jarnailUser.mobile || '+919053883125',
          city: 'Fatehabad',
          state: 'Haryana',
          pincode: '125050',
          fullAddress: 'Fatehabad, Haryana, India',
          status: 'APPROVED',
          verificationBadge: 'VERIFIED_SELLER',
          deletedAt: null,
        },
        include: {
          owner: {
            select: { id: true, name: true, email: true, mobile: true, role: true, approvalStatus: true },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Seller and shop ownership reconciled successfully.',
      data: {
        navyaCollection: updatedNavyaShop,
        skCollection: updatedSkShop,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
