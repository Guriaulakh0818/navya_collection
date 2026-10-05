import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DIRECT_URL ||
        process.env.DATABASE_URL ||
        'postgresql://postgres:postgres@localhost:5432/navya_collection_local',
    },
  },
});

async function syncLiveCatalog() {
  console.log(
    '🔄 Fetching live catalog from https://navyacollection.store/api/v1/marketplace/catalog ...',
  );

  const response = await axios.get('https://navyacollection.store/api/v1/marketplace/catalog', {
    timeout: 15000,
    headers: {
      'User-Agent': 'Navya-Local-Sync/1.0',
    },
  });

  if (!response.data || !response.data.success || !response.data.data) {
    throw new Error('Failed to fetch valid catalog data from live website');
  }

  const { shops, categories, products } = response.data.data;

  console.log(
    `📦 Found on Live: ${shops?.length || 0} Shops, ${categories?.length || 0} Categories, ${products?.length || 0} Products`,
  );

  // Ensure owner user exists for shops
  const ownerUser = await prisma.user.upsert({
    where: { email: 'admin@navyacollection.store' },
    update: {},
    create: {
      name: 'Navya Admin',
      email: 'admin@navyacollection.store',
      role: 'OWNER',
    },
  });

  // 1. Sync Categories by slug or id
  console.log('🏷️ Syncing Categories...');
  for (const cat of categories || []) {
    const existingById = await prisma.category.findUnique({ where: { id: cat.id } });
    const existingBySlug = await prisma.category.findUnique({ where: { slug: cat.slug } });

    if (existingById) {
      await prisma.category.update({
        where: { id: cat.id },
        data: { name: cat.name, slug: cat.slug, status: 'active' },
      });
    } else if (existingBySlug) {
      await prisma.category.update({
        where: { id: existingBySlug.id },
        data: { name: cat.name, status: 'active' },
      });
    } else {
      await prisma.category.create({
        data: {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          status: 'active',
          displayOrder: 1,
        },
      });
    }
  }

  // 2. Sync Shops
  console.log('🏪 Syncing Shops...');
  for (const s of shops || []) {
    const existingShop = await prisma.shop.findFirst({
      where: { OR: [{ id: s.id }, { slug: s.slug }] },
    });

    const shopData = {
      name: s.name,
      slug: s.slug,
      phone: s.phone || '+919053883125',
      email: s.email || 'helpdesk@navyacollection.store',
      city: s.city || 'Hisar',
      state: s.state || 'Haryana',
      pincode: s.pincode || '125050',
      fullAddress: s.fullAddress || `${s.city || 'Hisar'}, ${s.state || 'Haryana'}, India`,
      status: (s.status as any) || 'APPROVED',
      verificationBadge: (s.verificationBadge as any) || 'VERIFIED_SELLER',
    };

    if (existingShop) {
      await prisma.shop.update({
        where: { id: existingShop.id },
        data: shopData,
      });
    } else {
      await prisma.shop.create({
        data: {
          id: s.id,
          ...shopData,
          ownerId: ownerUser.id,
        },
      });
    }
  }

  // 3. Clear dummy mock order/return/product data
  console.log('🧹 Cleaning old dummy orders & products from local database...');
  await prisma.returnItem.deleteMany({});
  await prisma.returnRequest.deleteMany({});
  await prisma.shipmentItem.deleteMany({});
  await prisma.shipmentTrackingEvent.deleteMany({});
  await prisma.shipment.deleteMany({});
  await prisma.paymentTransaction.deleteMany({});
  await prisma.vendorOrder.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.wishlist.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});

  // 4. Sync Products & Images
  console.log('🛍️ Syncing real live products...');
  for (const p of products || []) {
    // Resolve category id
    let targetCatId = p.categoryId;
    const cat = await prisma.category.findFirst({
      where: { OR: [{ id: p.categoryId }, { slug: p.category?.slug }] },
    });
    if (cat) {
      targetCatId = cat.id;
    } else {
      const created = await prisma.category.create({
        data: {
          id: p.categoryId,
          name: p.category?.name || p.categoryId,
          slug: p.category?.slug || p.categoryId,
          status: 'active',
        },
      });
      targetCatId = created.id;
    }

    // Resolve shop id
    let targetShopId = p.shopId;
    const shop = await prisma.shop.findFirst({
      where: { OR: [{ id: p.shopId }, { slug: p.shop?.slug }] },
    });
    if (shop) {
      targetShopId = shop.id;
    }

    const price = typeof p.price === 'string' ? parseFloat(p.price) : p.price;
    const compareAtPrice = p.compareAtPrice ? parseFloat(p.compareAtPrice) : null;
    const costPrice = p.costPrice ? parseFloat(p.costPrice) : null;

    const productPayload = {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      brand: p.brand,
      gender: p.gender,
      ageGroup: p.ageGroup,
      fabric: p.fabric,
      description: p.description,
      price,
      compareAtPrice,
      costPrice,
      stock: p.stock || 10,
      lowStockThreshold: p.lowStockThreshold || 5,
      status: p.status || 'active',
      isFeatured: p.isFeatured ?? true,
      isNewArrival: p.isNewArrival ?? true,
      categoryId: targetCatId,
      rating: p.rating || 0,
      reviewCount: p.reviewCount || 0,
      metaTitle: p.metaTitle,
      metaDescription: p.metaDescription,
      metaKeywords: p.metaKeywords,
      canonicalUrl: p.canonicalUrl,
      ogImage: p.ogImage,
      focusKeyword: p.focusKeyword,
      color: p.color,
      fit: p.fit,
      occasion: p.occasion,
      shopId: targetShopId,
    };

    await prisma.product.create({
      data: productPayload,
    });

    // Sync product images
    if (p.images && p.images.length > 0) {
      for (let i = 0; i < p.images.length; i++) {
        const img = p.images[i];
        await prisma.productImage.create({
          data: {
            productId: p.id,
            imageUrl: img.imageUrl,
            altText: p.name,
            sortOrder: i,
            isPrimary: i === 0,
          },
        });
      }
    }
  }

  console.log('✅ Real live records synced to local database successfully!');
}

syncLiveCatalog()
  .catch((err) => {
    console.error('❌ Error syncing live catalog:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
