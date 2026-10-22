import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { generateProductJsonLdSchemas, generateProductMetadata, JsonLd } from '@/features/seo';
import { ProductDetailClient } from '@/frontend/features/products/components/ProductDetailClient';
import { ProductService } from '@/frontend/features/products/services/product.service';
import { prisma } from '@/lib/prisma';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

async function getFormattedProduct(slug: string) {
  try {
    const res = await ProductService.getProductByIdOrSlug(slug);
    if (res?.success && res?.data) {
      const dbProd = res.data;
      const reviews =
        dbProd.reviews && dbProd.reviews.length > 0
          ? dbProd.reviews.map((r: any) => ({
              id: r.id,
              userName: r.user?.name || r.userName || 'Verified Buyer',
              rating: r.rating ? Number(r.rating) : 0,
              comment: r.comment || '',
              createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
            }))
          : [];

      return {
        id: dbProd.id,
        name: dbProd.name,
        slug: dbProd.slug,
        sku: dbProd.sku,
        description: dbProd.description || '',
        metaTitle: dbProd.metaTitle || null,
        metaDescription: dbProd.metaDescription || null,
        metaKeywords: dbProd.metaKeywords || null,
        canonicalUrl: dbProd.canonicalUrl || null,
        ogImage: dbProd.ogImage || null,
        robots: dbProd.robots || null,
        price: Number(dbProd.price || 0),
        compareAtPrice: dbProd.compareAtPrice ? Number(dbProd.compareAtPrice) : null,
        stock: dbProd.stock !== undefined && dbProd.stock !== null ? Number(dbProd.stock) : 0,
        lowStockThreshold: dbProd.lowStockThreshold ? Number(dbProd.lowStockThreshold) : 5,
        rating: dbProd.rating ? Number(dbProd.rating) : 0,
        reviewCount: reviews.length,
        brand: dbProd.brand || null,
        color: dbProd.color || null,
        fabric: dbProd.fabric || null,
        fit: dbProd.fit || null,
        occasion: dbProd.occasion || null,
        category: dbProd.category
          ? {
              id: dbProd.category.id,
              name: dbProd.category.name,
              slug: dbProd.category.slug,
            }
          : null,
        images: (() => {
          const combinedImages = (dbProd.images || []).map((img: any) => ({
            id: img.id,
            url: img.imageUrl,
            alt: img.altText || dbProd.name,
            isPrimary: Boolean(img.isPrimary),
          }));

          if (dbProd.variants && dbProd.variants.length > 0) {
            dbProd.variants.forEach((v: any) => {
              const vImg = v.imageUrl || (v.attributes as any)?.imageUrl || v.image;
              if (vImg && !combinedImages.some((img: any) => img.url === vImg)) {
                combinedImages.push({
                  id: `v-img-${v.id}`,
                  url: vImg,
                  alt: `${dbProd.name} - ${v.color || 'Variant'}`,
                  isPrimary: combinedImages.length === 0,
                });
              }
            });
          }
          // Sort so primary image is strictly at index 0
          combinedImages.sort((a: any, b: any) => {
            if (a.isPrimary && !b.isPrimary) return -1;
            if (!a.isPrimary && b.isPrimary) return 1;
            return 0;
          });

          return combinedImages;
        })(),
        variants:
          dbProd.variants && dbProd.variants.length > 0
            ? dbProd.variants.map((v: any) => {
                const variantImg =
                  v.imageUrl ||
                  (typeof v.attributes === 'object' && v.attributes !== null
                    ? (v.attributes as any).imageUrl
                    : null) ||
                  v.image ||
                  null;

                const vColor =
                  v.color ||
                  v.colorName ||
                  (typeof v.attributes === 'object' && v.attributes !== null
                    ? (v.attributes as any).color
                    : null);

                const vSize =
                  v.size ||
                  v.sizeName ||
                  (typeof v.attributes === 'object' && v.attributes !== null
                    ? (v.attributes as any).size
                    : null);

                const vPrice =
                  v.price !== undefined && v.price !== null
                    ? Number(v.price)
                    : Number(dbProd.price || 0);

                const vCompareAtPrice =
                  v.compareAtPrice !== undefined && v.compareAtPrice !== null
                    ? Number(v.compareAtPrice)
                    : dbProd.compareAtPrice
                      ? Number(dbProd.compareAtPrice)
                      : null;

                return {
                  id: v.id,
                  sku: v.sku || `${dbProd.sku}-${v.id}`,
                  name: v.name || vColor || vSize || 'Standard',
                  color: vColor,
                  size: vSize,
                  price: vPrice,
                  compareAtPrice: vCompareAtPrice,
                  stock:
                    v.stock !== undefined && v.stock !== null
                      ? Number(v.stock)
                      : Number(dbProd.stock || 0),
                  imageUrl: variantImg,
                  image: variantImg,
                  attributes: v.attributes || null,
                };
              })
            : [],
        reviews,
        shop: dbProd.shop
          ? {
              id: dbProd.shop.id,
              name: dbProd.shop.name,
              slug: dbProd.shop.slug,
            }
          : null,
      };
    }
  } catch (error) {
    console.error(`Error fetching product by slug (${slug}):`, error);
  }
  return null;
}

async function getRelatedProducts(
  productId: string,
  categoryId?: string | null,
  shopId?: string | null,
) {
  try {
    const whereConditions: any = {
      id: { not: productId },
      deletedAt: null,
      status: 'active',
    };

    if (categoryId) {
      whereConditions.categoryId = categoryId;
    }

    let prods = await prisma.product.findMany({
      where: whereConditions,
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        images: {
          where: { deletedAt: null },
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        },
        variants: {
          where: { deletedAt: null },
        },
        shop: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            verificationBadge: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // If fewer than 4 items from same category, fetch more products from other categories/shops
    if (prods.length < 4) {
      const existingIds = [productId, ...prods.map((p) => p.id)];
      const fallbackProds = await prisma.product.findMany({
        where: {
          id: { notIn: existingIds },
          deletedAt: null,
          status: 'active',
        },
        take: 8 - prods.length,
        orderBy: { createdAt: 'desc' },
        include: {
          images: {
            where: { deletedAt: null },
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          },
          variants: {
            where: { deletedAt: null },
          },
          shop: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              verificationBadge: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
      prods = [...prods, ...fallbackProds];
    }

    return prods.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      price: Number(p.price || 0),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      rating: p.rating ? Number(p.rating) : null,
      reviewCount: p.reviewCount ? Number(p.reviewCount) : 0,
      stock: p.stock ?? 0,
      images: (p.images || []).map((img: any) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        url: img.imageUrl,
        alt: img.altText || p.name,
        isPrimary: Boolean(img.isPrimary),
      })),
      variants: (p.variants || []).map((v: any) => ({
        id: v.id,
        color: v.color || (v.attributes as any)?.color || null,
        size: v.size || (v.attributes as any)?.size || null,
        price: Number(v.price ?? p.price ?? 0),
        compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
        imageUrl: v.imageUrl || (v.attributes as any)?.imageUrl || null,
      })),
      shop: p.shop
        ? {
            id: p.shop.id,
            name: p.shop.name,
            slug: p.shop.slug,
            logo: p.shop.logo,
            verificationBadge: p.shop.verificationBadge || 'NONE',
          }
        : null,
      category: p.category
        ? {
            id: p.category.id,
            name: p.category.name,
            slug: p.category.slug,
          }
        : null,
    }));
  } catch (error) {
    console.error('Error fetching related products:', error);
    return [];
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getFormattedProduct(slug);

  if (!product) {
    return {
      title: 'Product Not Found | JiivaaKart',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return generateProductMetadata(product);
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getFormattedProduct(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(
    product.id,
    product.category?.id,
    product.shop?.id,
  );

  const jsonLdSchemas = generateProductJsonLdSchemas(product);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 pt-4 font-sans">
      <JsonLd data={jsonLdSchemas} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProductDetailClient key={product.id} product={product} relatedProducts={relatedProducts} />
      </div>
    </div>
  );
}
