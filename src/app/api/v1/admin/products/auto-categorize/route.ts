import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { resolveValidCategoryId } from '@/backend/lib/category-resolver';
import { SESSION_COOKIE_NAME } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';
import { autoCategorizeProduct } from '@/shared/utils/auto-categorizer';

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'navya_collection_jwt_secret_key_2026_min_32chars';
  return new TextEncoder().encode(secret);
}

async function getAdminUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return payload;
  } catch {
    return null;
  }
}

// POST /api/v1/admin/products/auto-categorize - 1-Click Auto-Categorize All or Specific Product
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    const adminRole = (admin as any)?.role ? String((admin as any).role).toUpperCase() : '';
    if (!admin || !['ADMIN', 'OWNER', 'SUPER_ADMIN', 'SUPERVISOR'].includes(adminRole)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { productId, all } = body;

    let targetProducts = [];

    if (productId) {
      const prod = await prisma.product.findUnique({
        where: { id: productId, deletedAt: null },
      });
      if (!prod) {
        return NextResponse.json(
          { success: false, message: 'Product not found.' },
          { status: 404 },
        );
      }
      targetProducts = [prod];
    } else {
      // Fetch all products
      targetProducts = await prisma.product.findMany({
        where: { deletedAt: null },
      });
    }

    let updatedCount = 0;
    const summary: { id: string; name: string; categories: string[] }[] = [];

    for (const prod of targetProducts) {
      const { primaryCategoryId, categoryIds } = autoCategorizeProduct({
        name: prod.name,
        description: prod.description || undefined,
        price: Number(prod.price || 0),
        compareAtPrice: prod.compareAtPrice ? Number(prod.compareAtPrice) : undefined,
        gender: prod.gender || undefined,
        fabric: prod.fabric || undefined,
        occasion: prod.occasion || undefined,
      });

      const validCategoryId = await resolveValidCategoryId(primaryCategoryId);

      // Clean category tags for metaKeywords indexing
      const catTags = categoryIds.map((c) => c.replace(/[^a-zA-Z0-9_-]/g, '')).filter(Boolean);
      const existingTags = prod.metaKeywords
        ? prod.metaKeywords.split(',').map((s) => s.trim())
        : [];
      const combinedKeywords = Array.from(new Set([...catTags, ...existingTags])).join(', ');

      await prisma.product.update({
        where: { id: prod.id },
        data: {
          categoryId: validCategoryId,
          metaKeywords: combinedKeywords,
        },
      });

      updatedCount++;
      summary.push({
        id: prod.id,
        name: prod.name,
        categories: categoryIds,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully auto-categorized ${updatedCount} product(s) according to store taxonomy!`,
      updatedCount,
      summary,
    });
  } catch (error: any) {
    console.error('❌ Auto-Categorize API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Auto-categorization failed.' },
      { status: 500 },
    );
  }
}
