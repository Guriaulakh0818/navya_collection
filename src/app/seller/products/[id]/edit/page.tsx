import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { resolveAttributeTemplate } from '@/config/product-attribute-engine';
import { SellerProductForm } from '@/frontend/features/seller/components/SellerProductForm';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Edit Product Listing | JiivaaKart Merchant Portal',
  description:
    'Edit product details, variants matrix, inventory stock levels, images, and SEO metadata.',
};

export default async function EditSellerProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      variants: { orderBy: { createdAt: 'asc' } },
      category: true,
    },
  });

  if (!product || product.deletedAt) {
    notFound();
  }

  // Extract attributes from first variant if available
  const firstVariant = product.variants?.[0];
  const variantAttrs = (firstVariant?.attributes as any) || {};

  // Infer productType from stored attributes or template registry
  const resolvedTemplate = resolveAttributeTemplate(product.categoryId, variantAttrs.productType);
  const productType = variantAttrs.productType || resolvedTemplate.id;

  const serializedProduct = {
    id: product.id,
    name: product.name,
    brand: product.brand || '',
    sku: product.sku,
    barcode: firstVariant?.barcode || '',
    description: product.description || '',
    productType,
    price: Number(product.price),
    compareAtPrice:
      product.compareAtPrice && Number(product.compareAtPrice) > 0
        ? Number(product.compareAtPrice)
        : undefined,
    costPrice:
      product.costPrice && Number(product.costPrice) > 0 ? Number(product.costPrice) : undefined,
    taxGstRate: product.taxRate ? Number(product.taxRate) : 5,
    taxRate: product.taxRate ? Number(product.taxRate) : 5,
    hsnCode: product.hsnCode || '6204',
    stock: Number(product.stock),
    lowStockThreshold: Number(product.lowStockThreshold || 5),
    weight: firstVariant?.weight || 500,
    status: product.status,
    returnPolicyType: product.returnPolicyType || 'RETURN_AND_REPLACEMENT',
    categoryId: product.categoryId,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        }
      : null,
    metaTitle: product.metaTitle || '',
    metaDescription: product.metaDescription || '',
    metaKeywords: product.metaKeywords || '',
    focusKeyword: product.focusKeyword || '',
    occasion: product.occasion || variantAttrs.occasion || '',
    color: product.color || firstVariant?.color || '',
    fabric: product.fabric || variantAttrs.fabric || '',
    fit: product.fit || variantAttrs.fit || '',
    pattern: variantAttrs.pattern || '',
    sleeve: variantAttrs.sleeve || '',
    neck: variantAttrs.neck || '',
    attributes: variantAttrs,
    images: product.images.map((img) => ({
      id: img.id,
      imageUrl: img.imageUrl,
      altText: img.altText || product.name,
      isPrimary: img.isPrimary,
      sortOrder: img.sortOrder,
    })),
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      barcode: v.barcode || '',
      price: Number(v.price),
      compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined,
      stock: Number(v.stock),
      size: v.size || '',
      color: v.color || '',
      imageUrl: v.imageUrl || (v.attributes as any)?.imageUrl || '',
      weight: v.weight ? Number(v.weight) : undefined,
      attributes: v.attributes || {},
    })),
  };

  return <SellerProductForm productId={id} initialData={serializedProduct} />;
}
