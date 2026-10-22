import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_SESSION_COOKIE_NAME, SESSION_COOKIE_NAME } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'navya_collection_jwt_secret_key_2026_min_32chars';
  return new TextEncoder().encode(secret);
}

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const token =
    cookieStore.get(SESSION_COOKIE_NAME)?.value ||
    cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return payload.userId as string;
  } catch {
    return null;
  }
}

// POST or GET /api/v1/seller/products/reconcile-images
// Reconciles and guarantees that for each product:
// - Exactly 1 primary image exists with isPrimary = true and sortOrder = 0
// - All other images are ordered sequentially with isPrimary = false and sortOrder = 1, 2, ...
// - Variants without photos link to the primary image
export async function POST(request: NextRequest) {
  return handleReconciliation(request);
}

export async function GET(request: NextRequest) {
  return handleReconciliation(request);
}

async function handleReconciliation(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUser();
    let shopIdFilter: string | undefined = undefined;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, email: true },
      });

      const isPlatformAdmin = Boolean(
        user && ['ADMIN', 'SUPER_ADMIN', 'OWNER'].includes(String(user.role).toUpperCase()),
      );

      if (!isPlatformAdmin) {
        const shop = await prisma.shop.findFirst({
          where: {
            deletedAt: null,
            OR: [{ ownerId: userId }, ...(user?.email ? [{ email: user.email }] : [])],
          },
          select: { id: true },
        });
        if (shop) {
          shopIdFilter = shop.id;
        }
      }
    }

    const whereClause: any = { deletedAt: null };
    if (shopIdFilter) {
      whereClause.shopId = shopIdFilter;
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        images: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
        variants: {
          where: { deletedAt: null },
        },
      },
    });

    let fixedCount = 0;
    let totalImagesReindexed = 0;

    for (const product of products) {
      const images = product.images;
      if (!images || images.length === 0) continue;

      // Identify intended primary image:
      // First preference: image where isPrimary is true
      // Second preference: first image in array
      const primaryIdx = images.findIndex((img) => img.isPrimary);
      const chosenPrimary = primaryIdx >= 0 ? images[primaryIdx] : images[0];

      const remaining = images.filter((img) => img.id !== chosenPrimary.id);
      const reordered = [chosenPrimary, ...remaining];

      let needsUpdate = false;
      for (let i = 0; i < reordered.length; i++) {
        const targetImg = reordered[i];
        if (targetImg.isPrimary !== (i === 0) || targetImg.sortOrder !== i) {
          needsUpdate = true;
          break;
        }
      }

      if (needsUpdate) {
        await prisma.$transaction(async (tx) => {
          for (let i = 0; i < reordered.length; i++) {
            await tx.productImage.update({
              where: { id: reordered[i].id },
              data: {
                isPrimary: i === 0,
                sortOrder: i,
              },
            });
            totalImagesReindexed++;
          }

          const primaryUrl = chosenPrimary.imageUrl;
          if (primaryUrl && product.variants && product.variants.length > 0) {
            for (const v of product.variants) {
              if (!v.imageUrl) {
                await tx.productVariant.update({
                  where: { id: v.id },
                  data: { imageUrl: primaryUrl },
                });
              }
            }
          }
        });

        fixedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Reconciliation complete: ${fixedCount} products updated, ${totalImagesReindexed} images ordered.`,
      data: {
        productsScanned: products.length,
        productsFixed: fixedCount,
        imagesReindexed: totalImagesReindexed,
      },
    });
  } catch (error: any) {
    console.error('Reconciliation error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Reconciliation failed' },
      { status: 500 },
    );
  }
}
