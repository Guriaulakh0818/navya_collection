import { NextRequest, NextResponse } from 'next/server';

import { getAdminUser } from '@/backend/lib/session';
import { catalogSeed } from '@/config/production-catalog-seed';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const INTERNAL_SYNC_SECRET =
  process.env.INTERNAL_SYNC_SECRET || 'navya_prod_sync_taxonomy_secret_2026';

const SHOP_OWNER_EMAIL_MAP: Record<string, string> = {
  cmui9v6ob0004cuzeht6sh5em: 'gurvindersingh0218@gmail.com',
  cmui9v6p40007cuzej7y3y64h: 'ramesh.saniyafashions@gmail.com',
  cmui9v6ph000acuze1jh353ys: 'vikram.stylezone@gmail.com',
  cmui9v6pu000dcuze4thu2khl: 'jaspreet.fashions@gmail.com',
  cmui9v6q6000gcuzegpycq8cm: 'barkat.fashion@gmail.com',
  cmtpt93ff000fzqz23tqclwmv: 'admin@navyacollection.store',
};

// POST /api/v1/admin/catalog/sync - Bulk Synchronize Approved Shops & Real Products into Prisma DB
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

    // 0. Auto-migrate missing columns in production Supabase DB if needed
    const runSqlSafe = async (sql: string) => {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch (err: any) {
        console.warn(`[SQL Migration Warning] ${sql}:`, err.message);
      }
    };

    await runSqlSafe('ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "sellerFundedShipping" BOOLEAN DEFAULT false;');
    await runSqlSafe('ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "sellerFundedThreshold" NUMERIC(10, 2);');
    await runSqlSafe('ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "sellerfundingshipping" BOOLEAN DEFAULT false;');
    await runSqlSafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "returnPolicyType" VARCHAR(255) DEFAULT \'RETURN_AND_REPLACEMENT\';');
    await runSqlSafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "returnAllowed" BOOLEAN DEFAULT true;');
    await runSqlSafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "returnWindowDays" INTEGER DEFAULT 3;');
    await runSqlSafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "replacementAllowed" BOOLEAN DEFAULT true;');
    await runSqlSafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "replacementWindowDays" INTEGER DEFAULT 7;');
    await runSqlSafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "specialShippingMode" VARCHAR(255) DEFAULT \'STANDARD\';');
    await runSqlSafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "specialShippingRate" NUMERIC(10, 2);');
    await runSqlSafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "taxRate" NUMERIC(5, 2) DEFAULT 0;');
    await runSqlSafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "hsnCode" VARCHAR(255);');
    await runSqlSafe('ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;');
    await runSqlSafe('ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "attributes" JSONB;');
    await runSqlSafe('ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "availableStock" INTEGER DEFAULT 0;');
    await runSqlSafe('ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "reservedStock" INTEGER DEFAULT 0;');
    await runSqlSafe('ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "soldStock" INTEGER DEFAULT 0;');
    await runSqlSafe('ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "minimumStockLevel" INTEGER DEFAULT 5;');
    await runSqlSafe('ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "maximumStockLevel" INTEGER;');
    await runSqlSafe('ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "stockStatus" VARCHAR(50) DEFAULT \'IN_STOCK\';');

    let usersSynced = 0;
    let shopsSynced = 0;
    let productsSynced = 0;
    let imagesSynced = 0;
    let variantsSynced = 0;

    const emailToUserIdMap = new Map<string, string>();

    // 1. Resilient Upsert Users (Shop Owners)
    for (const u of catalogSeed.users) {
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
    }

    // Fallback owner (Gurvinder Singh or first user)
    const fallbackOwnerId =
      emailToUserIdMap.get('gurvindersingh0218@gmail.com') ||
      Array.from(emailToUserIdMap.values())[0];

    const shopIdMap = new Map<string, string>();

    // 2. Resilient Upsert Shops (Using safe standard schema columns and resolved ownerId)
    for (const s of catalogSeed.shops) {
      const existingShop = await prisma.shop.findFirst({
        where: { OR: [{ id: s.id }, { slug: s.slug }] },
        select: { id: true, slug: true },
      });

      const ownerEmail = SHOP_OWNER_EMAIL_MAP[s.id] || s.email;
      const ownerId = emailToUserIdMap.get(ownerEmail) || fallbackOwnerId;

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
        ownerId,
        deletedAt: null,
      };

      let activeShopId = s.id;
      if (existingShop) {
        activeShopId = existingShop.id;
        await prisma.shop.update({
          where: { id: existingShop.id },
          data: shopData,
        });
      } else {
        const created = await prisma.shop.create({
          data: {
            id: s.id,
            ...shopData,
          },
        });
        activeShopId = created.id;
      }
      shopIdMap.set(s.id, activeShopId);
      shopIdMap.set(s.slug, activeShopId);
      shopsSynced++;
    }

    // 3. Resilient Upsert Products, Images & Variants
    for (const p of catalogSeed.products) {
      const existingProd = await prisma.product.findFirst({
        where: { OR: [{ id: p.id }, { slug: p.slug }, { sku: p.sku }] },
        select: { id: true, slug: true, sku: true },
      });

      const assignedShopId = p.shopId ? shopIdMap.get(p.shopId) || p.shopId : null;

      const prodData = {
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        brand: p.brand,
        gender: p.gender,
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
        categoryId: p.categoryId,
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
        gender: p.gender,
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
        categoryId: p.categoryId,
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
      if (existingProd) {
        activeProdId = existingProd.id;
        try {
          await prisma.product.update({
            where: { id: existingProd.id },
            data: prodData,
          });
        } catch {
          await prisma.product.update({
            where: { id: existingProd.id },
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
      }
      productsSynced++;

      // Images
      if (p.images && p.images.length > 0) {
        for (const img of p.images) {
          const existingImg = await prisma.productImage.findFirst({
            where: { OR: [{ id: img.id }, { imageUrl: img.imageUrl, productId: activeProdId }] },
            select: { id: true },
          });

          if (existingImg) {
            await prisma.productImage.update({
              where: { id: existingImg.id },
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
          }
          imagesSynced++;
        }
      }

      // Variants
      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          const variantName =
            (v as any).name ||
            `${v.size || ''} ${v.color || ''}`.trim() ||
            'Standard Variant';

          const existingVariant = await prisma.productVariant.findFirst({
            where: { OR: [{ id: v.id }, { sku: v.sku }] },
            select: { id: true, sku: true },
          });

          if (existingVariant) {
            await prisma.productVariant.update({
              where: { id: existingVariant.id },
              data: {
                name: variantName,
                price: v.price,
                stock: v.stock,
                status: (v.status as any) || 'active',
                deletedAt: null,
              },
              select: { id: true },
            });
          } else {
            await prisma.productVariant.create({
              data: {
                id: v.id,
                productId: activeProdId,
                name: variantName,
                sku: v.sku,
                size: v.size,
                color: v.color,
                price: v.price,
                compareAtPrice: v.compareAtPrice,
                stock: v.stock,
                status: (v.status as any) || 'active',
              },
              select: { id: true },
            });
          }
          variantsSynced++;
        }
      }
    }

    const totalDbProducts = await prisma.product.count({ where: { deletedAt: null } });
    const totalDbShops = await prisma.shop.count({ where: { status: 'APPROVED' } });

    return NextResponse.json({
      success: true,
      message: `Production catalog synced successfully! Synced ${productsSynced} products and ${shopsSynced} approved shops.`,
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
    console.error('❌ POST Admin Catalog Sync Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
