import { NextRequest, NextResponse } from 'next/server';

import { getAdminUser } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const INTERNAL_SYNC_SECRET =
  process.env.INTERNAL_SYNC_SECRET || 'navya_prod_sync_taxonomy_secret_2026';

// The verified authentic user-uploaded Navya Collection catalog products
const REAL_NAVYA_PRODUCT_IDS = [
  'cmtxbzlah0002nfod787erfmj', // Men's White & Blue Vertical Striped Full Sleeve Shirt
  'cmtx9q4ij0002e6bh2i2q46un', // Men's Grey Camo Print Relaxed Fit Track Lower
  'cmtvv7aeg000211z449fwo3gz', // Men’s Black Oversized Graphic Print Cotton T-Shirt
  'cmtomh4lb0002h03nlb9suyoi', // Men's Grey Abstract Printed Full Sleeve Casual Shirt
  'cmtojfrm60010bz82agfgdakd', // Men’s Wine Maroon Textured Full Sleeve Casual Shirt
  'cmtojeqtl000jbz82kykqew8v', // Men’s Wine Maroon Textured Full Sleeve Casual Shirt
  'cmtoj9xkk0002bz82ssrvjbjm', // Men’s Beige Textured Full Sleeve Casual Shirt
  'cmtoc21ns0002bcyjxdz0esqi', // Men’s Grey Printed Full Sleeve Casual Shirt
  'cmto6qye60002gew4p0cd0w6w', // Men’s Premium Blue & White Checkered Casual Shirt
  'cmto5wtvb0002phzaz7d9pe8y', // Men’s White Textured Casual Full Sleeve Shirt
  'cmuczol4n0002hrfqyphrxpel', // Baby Boys Printed T-Shirt & Shorts Set
];

const ALLOWED_LIVE_SHOP_SLUGS = ['navya-collection', 'sk-collection'];

// POST /api/v1/admin/catalog/cleanup
// Cleans up dummy products and inactivates closed shops so only the 2 live shops and real Navya products remain.
export async function POST(request: NextRequest) {
  try {
    const authHeader =
      request.headers.get('authorization') || request.headers.get('x-sync-secret');
    const isSecretAuthorized =
      authHeader &&
      (authHeader === INTERNAL_SYNC_SECRET || authHeader === `Bearer ${INTERNAL_SYNC_SECRET}`);

    const admin = await getAdminUser();
    const isAdminAuthorized =
      admin && ['ADMIN', 'OWNER', 'SUPER_ADMIN'].includes(admin.role?.toUpperCase());

    if (!isAdminAuthorized && !isSecretAuthorized) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Admin access or valid sync secret required.' },
        { status: 403 },
      );
    }

    // 1. Resolve NAVYA COLLECTION and Sk collection shops
    const navyaShop = await prisma.shop.findFirst({
      where: {
        OR: [{ slug: 'navya-collection' }, { name: { contains: 'Navya', mode: 'insensitive' } }],
      },
    });

    if (!navyaShop) {
      return NextResponse.json(
        { success: false, message: 'Navya Collection shop not found in database.' },
        { status: 404 },
      );
    }

    // 2. Activate ONLY the 2 authorized shops (NAVYA COLLECTION & Sk collection)
    const activatedShops = await prisma.shop.updateMany({
      where: {
        slug: { in: ALLOWED_LIVE_SHOP_SLUGS },
      },
      data: {
        status: 'APPROVED',
        deletedAt: null,
      },
    });

    // 3. Deactivate and close ALL other shops (Style Zone, Saniya Fashions, Barkat Fashion, Jaspreet Fashions, etc.)
    const deactivatedShops = await prisma.shop.updateMany({
      where: {
        slug: { notIn: ALLOWED_LIVE_SHOP_SLUGS },
      },
      data: {
        status: 'INACTIVE',
        deletedAt: new Date(),
      },
    });

    // 4. Find all dummy products to delete (any product NOT in the REAL_NAVYA_PRODUCT_IDS list)
    const dummyProducts = await prisma.product.findMany({
      where: {
        id: { notIn: REAL_NAVYA_PRODUCT_IDS },
      },
      select: { id: true, name: true, sku: true },
    });

    const dummyIds = dummyProducts.map((p) => p.id);

    let deletedVariants = 0;
    let deletedImages = 0;
    let deletedProducts = 0;

    if (dummyIds.length > 0) {
      // Clean dependent relations
      await prisma.cartItem.deleteMany({
        where: { productId: { in: dummyIds } },
      }).catch(() => {});

      await prisma.wishlist.deleteMany({
        where: { productId: { in: dummyIds } },
      }).catch(() => {});

      const vRes = await prisma.productVariant.deleteMany({
        where: { productId: { in: dummyIds } },
      }).catch(() => ({ count: 0 }));
      deletedVariants = vRes.count;

      const imgRes = await prisma.productImage.deleteMany({
        where: { productId: { in: dummyIds } },
      }).catch(() => ({ count: 0 }));
      deletedImages = imgRes.count;

      const pRes = await prisma.product.deleteMany({
        where: { id: { in: dummyIds } },
      }).catch(() => ({ count: 0 }));
      deletedProducts = pRes.count;
    }

    // 5. Ensure all REAL Navya Collection products are active and mapped to Navya shop
    await prisma.product.updateMany({
      where: {
        id: { in: REAL_NAVYA_PRODUCT_IDS },
      },
      data: {
        shopId: navyaShop.id,
        status: 'active',
        deletedAt: null,
      },
    });

    // 6. Fetch updated stats
    const liveShops = await prisma.shop.findMany({
      where: { status: 'APPROVED', deletedAt: null },
      select: { id: true, name: true, slug: true, _count: { select: { products: true } } },
    });

    const activeProducts = await prisma.product.findMany({
      where: { deletedAt: null, status: 'active' },
      select: { id: true, name: true, price: true, categoryId: true },
    });

    return NextResponse.json({
      success: true,
      message: `Cleaned up dummy data successfully! Only 2 live shops and ${activeProducts.length} real products remain.`,
      stats: {
        liveShopsCount: liveShops.length,
        liveShops: liveShops.map((s) => ({ name: s.name, slug: s.slug, products: s._count.products })),
        activeProductsCount: activeProducts.length,
        deletedDummyProductsCount: deletedProducts,
        deletedImagesCount: deletedImages,
        deletedVariantsCount: deletedVariants,
        deactivatedShopsCount: deactivatedShops.count,
      },
    });
  } catch (error: any) {
    console.error('Catalog Cleanup Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Internal server error during catalog cleanup',
      },
      { status: 500 },
    );
  }
}
