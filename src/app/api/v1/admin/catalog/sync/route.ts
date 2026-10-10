import { NextRequest, NextResponse } from 'next/server';

import { getAdminUser } from '@/backend/lib/session';
import { catalogSeed } from '@/config/production-catalog-seed';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const INTERNAL_SYNC_SECRET =
  process.env.INTERNAL_SYNC_SECRET || 'navya_prod_sync_taxonomy_secret_2026';

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

    let usersSynced = 0;
    let shopsSynced = 0;
    let productsSynced = 0;
    let imagesSynced = 0;
    let variantsSynced = 0;

    // 1. Upsert Users (Shop Owners)
    for (const u of catalogSeed.users) {
      await prisma.user.upsert({
        where: { email: u.email },
        create: {
          id: u.id,
          name: u.name,
          email: u.email,
          mobile: u.mobile,
          role: u.role as any,
          password: u.password,
          approvalStatus: 'APPROVED',
        },
        update: {
          name: u.name,
          role: u.role as any,
          approvalStatus: 'APPROVED',
        },
      });
      usersSynced++;
    }

    // 2. Upsert Shops
    for (const s of catalogSeed.shops) {
      await prisma.shop.upsert({
        where: { id: s.id },
        create: {
          id: s.id,
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
          verificationBadge: s.verificationBadge as any,
          rating: s.rating,
          reviewCount: s.reviewCount,
          commissionRate: s.commissionRate,
          subscriptionTier: s.subscriptionTier as any,
          isSubscriptionActive: s.isSubscriptionActive,
          status: 'APPROVED',
          ownerId: s.ownerId,
        },
        update: {
          name: s.name,
          slug: s.slug,
          status: 'APPROVED',
          rating: s.rating,
          reviewCount: s.reviewCount,
        },
      });
      shopsSynced++;
    }

    // 3. Upsert Products, Images & Variants
    for (const p of catalogSeed.products) {
      await prisma.product.upsert({
        where: { id: p.id },
        create: {
          id: p.id,
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
          lowStockThreshold: p.lowStockThreshold,
          status: p.status || 'active',
          isFeatured: p.isFeatured || false,
          isNewArrival: p.isNewArrival || false,
          categoryId: p.categoryId,
          shopId: p.shopId,
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
        },
        update: {
          name: p.name,
          slug: p.slug,
          status: p.status || 'active',
          price: p.price,
          categoryId: p.categoryId,
          shopId: p.shopId,
          stock: p.stock,
          rating: p.rating,
          reviewCount: p.reviewCount,
        },
      });
      productsSynced++;

      // Images
      if (p.images && p.images.length > 0) {
        for (const img of p.images) {
          await prisma.productImage.upsert({
            where: { id: img.id },
            create: {
              id: img.id,
              productId: p.id,
              imageUrl: img.imageUrl,
              secureUrl: img.secureUrl,
              cloudinaryPublicId: img.cloudinaryPublicId,
              altText: img.altText,
              sortOrder: img.sortOrder || 0,
              isPrimary: img.isPrimary || false,
            },
            update: {
              imageUrl: img.imageUrl,
              secureUrl: img.secureUrl,
              isPrimary: img.isPrimary || false,
            },
          });
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

          await prisma.productVariant.upsert({
            where: { id: v.id },
            create: {
              id: v.id,
              productId: p.id,
              name: variantName,
              sku: v.sku,
              size: v.size,
              color: v.color,
              price: v.price,
              compareAtPrice: v.compareAtPrice,
              stock: v.stock,
              status: v.status || 'active',
            },
            update: {
              name: variantName,
              price: v.price,
              stock: v.stock,
              status: v.status || 'active',
            },
          });
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
