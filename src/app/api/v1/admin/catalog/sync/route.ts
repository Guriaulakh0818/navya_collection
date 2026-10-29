import { NextRequest, NextResponse } from 'next/server';

import { getAdminUser } from '@/backend/lib/session';
import { catalogSeed } from '@/config/production-catalog-seed';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const INTERNAL_SYNC_SECRET =
  process.env.INTERNAL_SYNC_SECRET || 'navya_prod_sync_taxonomy_secret_2026';

// POST /api/v1/admin/catalog/sync - Bulk Synchronize Approved Shops & Real Products into Prisma DB
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('x-sync-secret');
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

    const { searchParams } = new URL(request.url);
    const offsetParam = searchParams.get('offset');
    const limitParam = searchParams.get('limit');
    const offset = offsetParam ? Math.max(0, parseInt(offsetParam, 10)) : 0;
    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : 10;

    let usersSynced = 0;
    let shopsSynced = 0;
    let productsSynced = 0;
    let imagesSynced = 0;
    let variantsSynced = 0;

    const emailToUserIdMap = new Map<string, string>();
    const shopIdMap = new Map<string, string>();

    // 1. Resilient Upsert Users (Shop Owners) - only on offset 0
    if (offset === 0) {
      for (const u of catalogSeed.users) {
        try {
          const existingUser = await prisma.user.findFirst({
            where: { OR: [{ id: u.id }, { email: u.email }] },
            select: { id: true, email: true },
          });

          let resolvedUserId = u.id;
          if (existingUser) {
            resolvedUserId = existingUser.id;
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name: u.name,
                role: (u.role as any) || 'SELLER',
                approvalStatus: 'APPROVED',
              },
            });
          } else {
            const created = await prisma.user.create({
              data: {
                id: u.id,
                name: u.name,
                email: u.email,
                mobile: u.mobile,
                role: (u.role as any) || 'SELLER',
                password: u.password,
                approvalStatus: 'APPROVED',
              },
            });
            resolvedUserId = created.id;
          }
          emailToUserIdMap.set(u.email, resolvedUserId);
          usersSynced++;
        } catch (uErr: any) {
          console.warn(`[User Sync] Warning for ${u.email}:`, uErr.message);
        }
      }
    } else {
      const allUsers = await prisma.user.findMany({ select: { id: true, email: true } });
      for (const u of allUsers) {
        if (u.email) emailToUserIdMap.set(u.email, u.id);
      }
    }

    // Fallback owner (Gurvinder Singh or first user)
    const fallbackOwnerId =
      emailToUserIdMap.get('gurvindersingh0218@gmail.com') ||
      Array.from(emailToUserIdMap.values())[0];

    // 2. Resilient Upsert Shops - only on offset 0
    if (offset === 0) {
      for (const s of catalogSeed.shops) {
        try {
          const existingShop = await prisma.shop.findFirst({
            where: { OR: [{ id: s.id }, { slug: s.slug }] },
            select: { id: true, slug: true, ownerId: true },
          });

          // Strictly preserve real existing shop ownerId in the database
          const resolvedOwnerId =
            existingShop?.ownerId || emailToUserIdMap.get(s.email) || fallbackOwnerId;

          const shopData = {
            name: s.name,
            slug: s.slug,
            shopCode: s.shopCode,
            logo: s.logo,
            banner: s.banner,
            description: s.description,
            phone: s.phone,
            email: s.email,
            gstin: s.gstin,
            panNumber: s.panNumber,
            city: s.city,
            state: s.state,
            pincode: s.pincode,
            fullAddress: s.fullAddress,
            returnPolicy: s.returnPolicy,
            shippingPolicy: s.shippingPolicy,
            verificationBadge: (s.verificationBadge as any) || 'VERIFIED_SELLER',
            rating: s.rating,
            reviewCount: s.reviewCount,
            commissionRate: s.commissionRate,
            subscriptionTier: (s.subscriptionTier as any) || 'GROWTH',
            isSubscriptionActive: s.isSubscriptionActive ?? true,
            status: 'APPROVED' as any,
            deletedAt: null,
          };

          let activeShopId = s.id;
          if (existingShop) {
            activeShopId = existingShop.id;
            await prisma.shop.update({
              where: { id: existingShop.id },
              data: {
                ...shopData,
                // Only assign ownerId if existingShop didn't have one
                ...(existingShop.ownerId ? {} : { ownerId: resolvedOwnerId }),
              },
            });
          } else {
            const created = await prisma.shop.create({
              data: {
                id: s.id,
                ...shopData,
                ownerId: resolvedOwnerId,
              },
            });
            activeShopId = created.id;
          }
          shopIdMap.set(s.id, activeShopId);
          shopIdMap.set(s.slug, activeShopId);
          shopsSynced++;
        } catch (sErr: any) {
          console.warn(`[Shop Sync] Warning for ${s.slug}:`, sErr.message);
        }
      }
    }

    // Always fill shopIdMap from DB so products can resolve shop
    const allDbShops = await prisma.shop.findMany({ select: { id: true, slug: true, name: true } });
    for (const s of allDbShops) {
      shopIdMap.set(s.id, s.id);
      shopIdMap.set(s.slug, s.id);
      shopIdMap.set(s.name.toLowerCase().trim(), s.id);
    }

    // Cross-link catalogSeed shop IDs to DB shops by matching slug or name
    for (const seedShop of catalogSeed.shops) {
      const matchedDbShop = allDbShops.find(
        (ds) =>
          ds.id === seedShop.id ||
          ds.slug === seedShop.slug ||
          ds.name.toLowerCase().trim() === seedShop.name.toLowerCase().trim(),
      );
      if (matchedDbShop) {
        shopIdMap.set(seedShop.id, matchedDbShop.id);
        shopIdMap.set(seedShop.slug, matchedDbShop.id);
      }
    }

    // Default fallback shop if none match
    const fallbackShop =
      allDbShops.find((s) => s.slug === 'navya-collection') ||
      allDbShops.find((s) => s.name.toLowerCase().includes('navya')) ||
      allDbShops[0];

    // 3. Batch Products Slice
    const totalSeedProducts = catalogSeed.products.length;
    const productsToSync = catalogSeed.products.slice(offset, offset + limit);

    // Preload existing products for fast memory check
    const existingProducts = await prisma.product.findMany({
      select: { id: true, slug: true, sku: true },
    });
    const prodById = new Map<string, string>();
    const prodBySlug = new Map<string, string>();
    const prodBySku = new Map<string, string>();
    for (const p of existingProducts) {
      prodById.set(p.id, p.id);
      if (p.slug) prodBySlug.set(p.slug, p.id);
      if (p.sku) prodBySku.set(p.sku, p.id);
    }

    // Preload images
    const existingImages = await prisma.productImage.findMany({
      select: { id: true, imageUrl: true, productId: true },
    });
    const imgById = new Set<string>();
    const imgByUrlAndProd = new Set<string>();
    for (const img of existingImages) {
      imgById.add(img.id);
      imgByUrlAndProd.add(`${img.productId}_${img.imageUrl}`);
    }

    // Preload variants
    const existingVariants = await prisma.productVariant.findMany({
      select: { id: true, sku: true },
    });
    const varById = new Map<string, string>();
    const varBySku = new Map<string, string>();
    for (const v of existingVariants) {
      varById.set(v.id, v.id);
      if (v.sku) varBySku.set(v.sku, v.id);
    }

    // Preload categories to ensure foreign key safety and smart slug resolution
    const allDbCategories = await prisma.category.findMany({
      select: { id: true, slug: true, name: true },
    });
    const catById = new Set(allDbCategories.map((c) => c.id));
    const catBySlug = new Map(allDbCategories.map((c) => [c.slug.toLowerCase(), c.id]));
    const fallbackCategoryId = allDbCategories[0]?.id;

    for (const p of productsToSync) {
      const existingId =
        prodById.get(p.id) ||
        (p.slug ? prodBySlug.get(p.slug) : undefined) ||
        (p.sku ? prodBySku.get(p.sku) : undefined);

      let assignedShopId = p.shopId ? shopIdMap.get(p.shopId) : null;
      if (!assignedShopId && fallbackShop) {
        assignedShopId = fallbackShop.id;
      }

      // Auto-derive gender if missing to enforce department boundaries
      const derivedGender =
        p.gender ||
        (p.name?.toLowerCase().includes('men') || p.slug?.toLowerCase().includes('men')
          ? 'men'
          : p.name?.toLowerCase().includes('baby') ||
              p.name?.toLowerCase().includes('boy') ||
              p.name?.toLowerCase().includes('girl') ||
              p.name?.toLowerCase().includes('kid')
            ? 'kids'
            : p.name?.toLowerCase().includes('women') ||
                p.name?.toLowerCase().includes('saree') ||
                p.name?.toLowerCase().includes('lehenga') ||
                p.name?.toLowerCase().includes('kurti')
              ? 'women'
              : 'unisex');

      // Safely resolve categoryId to strictly avoid foreign key violation and wrong department assignment
      let resolvedCategoryId = p.categoryId;
      if (!catById.has(resolvedCategoryId)) {
        if (catBySlug.has(resolvedCategoryId.toLowerCase())) {
          resolvedCategoryId = catBySlug.get(resolvedCategoryId.toLowerCase())!;
        } else if (
          (p.categoryId === 'cat_men_shirts' || p.categoryId === 'shirts') &&
          (catBySlug.get('men-shirts') || catBySlug.get('gents-wear'))
        ) {
          resolvedCategoryId = (catBySlug.get('men-shirts') || catBySlug.get('gents-wear'))!;
        } else if (
          (p.categoryId === 'cat_men_tshirts' || p.categoryId === 't-shirts') &&
          (catBySlug.get('men-t-shirts') || catBySlug.get('gents-wear'))
        ) {
          resolvedCategoryId = (catBySlug.get('men-t-shirts') || catBySlug.get('gents-wear'))!;
        } else if (
          (p.categoryId === 'cat_men_jeans' || p.categoryId === 'jeans') &&
          (catBySlug.get('men-jeans') || catBySlug.get('gents-wear'))
        ) {
          resolvedCategoryId = (catBySlug.get('men-jeans') || catBySlug.get('gents-wear'))!;
        } else if (
          (p.categoryId === 'cat_men_trackpants' || p.categoryId === 'track-pants') &&
          (catBySlug.get('men-track-pants') || catBySlug.get('gents-wear'))
        ) {
          resolvedCategoryId = (catBySlug.get('men-track-pants') || catBySlug.get('gents-wear'))!;
        } else if (
          (p.categoryId === 'cat_baby_boys' || p.categoryId === 'baby-boys') &&
          (catBySlug.get('baby-boys') ||
            catBySlug.get('baby-fashion') ||
            catBySlug.get('boys-fashion') ||
            catBySlug.get('kids') ||
            catBySlug.get('boys-wear') ||
            catBySlug.get('kids-wear'))
        ) {
          resolvedCategoryId = (catBySlug.get('baby-boys') ||
            catBySlug.get('baby-fashion') ||
            catBySlug.get('boys-fashion') ||
            catBySlug.get('kids') ||
            catBySlug.get('boys-wear') ||
            catBySlug.get('kids-wear'))!;
        } else {
          // Department-safe fallback (never cross Men into Women or vice versa)
          if (derivedGender === 'men') {
            resolvedCategoryId =
              catBySlug.get('men-shirts') || catBySlug.get('men') || fallbackCategoryId;
          } else if (derivedGender === 'kids') {
            resolvedCategoryId =
              catBySlug.get('baby-boys') ||
              catBySlug.get('boys-fashion') ||
              catBySlug.get('kids') ||
              fallbackCategoryId;
          } else {
            resolvedCategoryId =
              catBySlug.get('women-sarees') || catBySlug.get('women') || fallbackCategoryId;
          }
        }
      }

      const prodData = {
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        brand: p.brand,
        gender: derivedGender,
        ageGroup: p.ageGroup,
        fabric: p.fabric,
        description: p.description,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        costPrice: p.costPrice,
        stock: p.stock,
        lowStockThreshold: p.lowStockThreshold || 5,
        status: p.status || 'active',
        isFeatured: p.isFeatured || false,
        isNewArrival: p.isNewArrival || false,
        categoryId: resolvedCategoryId,
        shopId: assignedShopId,
        rating: p.rating || 0,
        reviewCount: p.reviewCount || 0,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        metaKeywords: p.metaKeywords,
        canonicalUrl: p.canonicalUrl,
        color: p.color,
        fit: p.fit,
        occasion: p.occasion,
        returnPolicyType: p.returnPolicyType || 'RETURN_AND_REPLACEMENT',
        returnAllowed: p.returnAllowed ?? true,
        returnWindowDays: p.returnWindowDays || 3,
        replacementAllowed: p.replacementAllowed ?? true,
        replacementWindowDays: p.replacementWindowDays || 7,
        specialShippingMode: p.specialShippingMode || 'STANDARD',
        taxRate: p.taxRate || 0,
        hsnCode: p.hsnCode,
        deletedAt: null,
      };

      const coreProdData = {
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        brand: p.brand,
        gender: derivedGender,
        ageGroup: p.ageGroup,
        fabric: p.fabric,
        description: p.description,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        costPrice: p.costPrice,
        stock: p.stock,
        lowStockThreshold: p.lowStockThreshold || 5,
        status: p.status || 'active',
        isFeatured: p.isFeatured || false,
        isNewArrival: p.isNewArrival || false,
        categoryId: resolvedCategoryId,
        shopId: assignedShopId,
        rating: p.rating || 0,
        reviewCount: p.reviewCount || 0,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        metaKeywords: p.metaKeywords,
        canonicalUrl: p.canonicalUrl,
        color: p.color,
        fit: p.fit,
        occasion: p.occasion,
        deletedAt: null,
      };

      let activeProdId = p.id;
      if (existingId) {
        activeProdId = existingId;
        try {
          await prisma.product.update({
            where: { id: existingId },
            data: prodData,
          });
        } catch {
          await prisma.product.update({
            where: { id: existingId },
            data: coreProdData,
          });
        }
      } else {
        try {
          const created = await prisma.product.create({
            data: {
              id: p.id,
              ...prodData,
            },
          });
          activeProdId = created.id;
        } catch {
          const created = await prisma.product.create({
            data: {
              id: p.id,
              ...coreProdData,
            },
          });
          activeProdId = created.id;
        }
        prodById.set(activeProdId, activeProdId);
      }
      productsSynced++;

      // Images
      if (p.images && p.images.length > 0) {
        for (const img of p.images) {
          const isExisting =
            imgById.has(img.id) || imgByUrlAndProd.has(`${activeProdId}_${img.imageUrl}`);

          try {
            if (isExisting) {
              await prisma.productImage.updateMany({
                where: {
                  OR: [{ id: img.id }, { imageUrl: img.imageUrl, productId: activeProdId }],
                },
                data: {
                  imageUrl: img.imageUrl,
                  secureUrl: img.secureUrl,
                  isPrimary: img.isPrimary || false,
                  deletedAt: null,
                },
              });
            } else {
              await prisma.productImage.create({
                data: {
                  id: img.id,
                  productId: activeProdId,
                  imageUrl: img.imageUrl,
                  secureUrl: img.secureUrl,
                  cloudinaryPublicId: img.cloudinaryPublicId,
                  altText: img.altText,
                  sortOrder: img.sortOrder || 0,
                  isPrimary: img.isPrimary || false,
                },
              });
              imgById.add(img.id);
              imgByUrlAndProd.add(`${activeProdId}_${img.imageUrl}`);
            }
            imagesSynced++;
          } catch (imgErr: any) {
            console.warn(`[Image Sync] Warning for ${img.imageUrl}:`, imgErr.message);
          }
        }
      }

      // Variants with bulletproof raw SQL
      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          const variantName =
            (v as any).name || `${v.size || ''} ${v.color || ''}`.trim() || 'Standard Variant';

          const existingVarId = varById.get(v.id) || (v.sku ? varBySku.get(v.sku) : undefined);

          try {
            if (existingVarId) {
              await prisma.$executeRawUnsafe(
                `
                UPDATE "product_variants"
                SET "name" = $1, "price" = $2, "compareAtPrice" = $3, "stock" = $4, "status" = $5, "updatedAt" = NOW()
                WHERE "id" = $6
              `,
                variantName,
                Number(v.price),
                v.compareAtPrice ? Number(v.compareAtPrice) : null,
                Number(v.stock),
                (v.status as any) || 'active',
                existingVarId,
              );
            } else {
              await prisma.$executeRawUnsafe(
                `
                INSERT INTO "product_variants" ("id", "productId", "name", "sku", "size", "color", "price", "compareAtPrice", "stock", "status", "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
              `,
                v.id,
                activeProdId,
                variantName,
                v.sku,
                v.size || null,
                v.color || null,
                Number(v.price),
                v.compareAtPrice ? Number(v.compareAtPrice) : null,
                Number(v.stock),
                (v.status as any) || 'active',
              );
              varById.set(v.id, v.id);
              if (v.sku) varBySku.set(v.sku, v.id);
            }
            variantsSynced++;
          } catch (vErr: any) {
            console.warn(`[CatalogSync] Variant warning for ${v.sku}:`, vErr.message);
          }
        }
      }
    }

    const totalDbProducts = await prisma.product.count({ where: { deletedAt: null } });
    const totalDbShops = await prisma.shop.count({ where: { status: 'APPROVED' } });

    const hasMore = offset + limit < totalSeedProducts;
    const nextOffset = hasMore ? offset + limit : null;

    // 4. On final batch, heal all live database products to guarantee department isolation
    if (!hasMore) {
      try {
        const allLiveProducts = await prisma.product.findMany({
          select: { id: true, name: true, slug: true, gender: true, categoryId: true },
        });

        for (const lp of allLiveProducts) {
          const pName = (lp.name || '').toLowerCase();
          const pSlug = (lp.slug || '').toLowerCase();
          let targetGender = lp.gender;

          if (!targetGender || targetGender === 'unisex') {
            if (
              pName.includes('men’s') ||
              pName.includes("men's") ||
              pName.includes('gents') ||
              pSlug.includes('men-')
            ) {
              targetGender = 'men';
            } else if (
              pName.includes('baby') ||
              pName.includes('boy') ||
              pName.includes('girl') ||
              pName.includes('kids') ||
              pSlug.includes('baby-') ||
              pSlug.includes('boys-')
            ) {
              targetGender = 'kids';
            } else if (
              pName.includes('women') ||
              pName.includes('saree') ||
              pName.includes('lehenga') ||
              pName.includes('kurti') ||
              pSlug.includes('women-')
            ) {
              targetGender = 'women';
            }
          }

          let targetCategoryId = lp.categoryId;
          if (targetGender === 'men' && (pName.includes('shirt') || pSlug.includes('shirt'))) {
            const correctMenCatId = catBySlug.get('men-shirts');
            if (correctMenCatId && targetCategoryId !== correctMenCatId) {
              targetCategoryId = correctMenCatId;
            }
          } else if (
            targetGender === 'men' &&
            (pName.includes('jeans') || pSlug.includes('jeans'))
          ) {
            const correctMenCatId = catBySlug.get('men-jeans');
            if (correctMenCatId && targetCategoryId !== correctMenCatId) {
              targetCategoryId = correctMenCatId;
            }
          } else if (
            targetGender === 'men' &&
            (pName.includes('track') || pSlug.includes('track'))
          ) {
            const correctMenCatId = catBySlug.get('men-track-pants');
            if (correctMenCatId && targetCategoryId !== correctMenCatId) {
              targetCategoryId = correctMenCatId;
            }
          } else if (
            targetGender === 'kids' &&
            (pName.includes('baby') || pSlug.includes('baby'))
          ) {
            const correctKidsCatId = catBySlug.get('baby-boys') || catBySlug.get('boys-fashion');
            if (correctKidsCatId && targetCategoryId !== correctKidsCatId) {
              targetCategoryId = correctKidsCatId;
            }
          }

          if (targetGender !== lp.gender || targetCategoryId !== lp.categoryId) {
            await prisma.product.update({
              where: { id: lp.id },
              data: {
                gender: targetGender || undefined,
                categoryId: targetCategoryId || undefined,
              },
            });
          }
        }
      } catch (healErr) {
        console.warn('Live department healing warning:', healErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${productsSynced} products in batch [${offset}-${offset + productsToSync.length} of ${totalSeedProducts}].`,
      hasMore,
      nextOffset,
      totalSeedProducts,
      stats: {
        usersSynced,
        shopsSynced,
        productsSynced,
        imagesSynced,
        variantsSynced,
        totalDbProducts,
        totalDbShops,
      },
    });
  } catch (error: any) {
    console.error('Catalog Sync Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Internal server error during catalog sync',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
