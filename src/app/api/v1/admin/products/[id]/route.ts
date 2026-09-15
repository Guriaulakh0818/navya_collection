import { NextRequest, NextResponse } from 'next/server';

import { getAdminUser } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/v1/admin/products/[id] - Toggle product status or update metadata (ADMIN & OWNER ONLY)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await getAdminUser();
    if (!admin || !['ADMIN', 'OWNER', 'SUPER_ADMIN'].includes(admin.role?.toUpperCase())) {
      return NextResponse.json(
        {
          success: false,
          message: 'Forbidden. Supervisor accounts are read-only and cannot edit products.',
        },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
    }

    let validCategoryId: string | undefined = undefined;
    let metaKeywordsUpdate: string | undefined = undefined;

    if (Array.isArray(body.categoryIds) && body.categoryIds.length > 0) {
      const { resolveValidCategoryId } = await import('@/backend/lib/category-resolver');
      const { getFlattenedCategoryOptions } = await import('@/config/categories.config');

      const primaryTarget = body.categoryId || body.categoryIds[0];
      validCategoryId = await resolveValidCategoryId(primaryTarget);

      // Collect all category IDs, slugs, and names for multi-category indexing
      const allTaxonomy = getFlattenedCategoryOptions();
      const tags = new Set<string>();

      for (const catId of body.categoryIds) {
        tags.add(catId);
        const found = allTaxonomy.find((t) => t.id === catId || t.slug === catId);
        if (found) {
          tags.add(found.slug);
          tags.add(found.name.toLowerCase());
          if (found.mainGroupName) tags.add(found.mainGroupName.toLowerCase());
        }
      }
      metaKeywordsUpdate = Array.from(tags).join(', ');
    } else if (body.categoryId) {
      const { resolveValidCategoryId } = await import('@/backend/lib/category-resolver');
      validCategoryId = await resolveValidCategoryId(body.categoryId);
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.name ? { name: body.name } : {}),
        ...(body.price ? { price: Number(body.price) } : {}),
        ...(body.stock !== undefined ? { stock: Number(body.stock) } : {}),
        ...(validCategoryId ? { categoryId: validCategoryId } : {}),
        ...(metaKeywordsUpdate !== undefined
          ? { metaKeywords: metaKeywordsUpdate }
          : body.metaKeywords
            ? { metaKeywords: body.metaKeywords }
            : {}),
        ...(body.description ? { description: body.description } : {}),
      },
      include: {
        category: true,
        images: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Product updated successfully!`,
      data: updated,
    });
  } catch (error: any) {
    console.error('❌ PATCH Admin Product Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE /api/v1/admin/products/[id] - Soft delete product (OWNER / SUPER_ADMIN ONLY)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await getAdminUser();
    if (!admin || !['OWNER', 'SUPER_ADMIN'].includes(admin.role?.toUpperCase())) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Only the Owner can delete products from catalog.' },
        { status: 403 },
      );
    }

    const { id } = await params;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
    }

    await prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'archived',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Product '${existingProduct.name}' deleted successfully.`,
    });
  } catch (error: any) {
    console.error('❌ DELETE Admin Product Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
