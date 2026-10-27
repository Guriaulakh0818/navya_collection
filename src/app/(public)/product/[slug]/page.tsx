import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { generateProductJsonLdSchemas, generateProductMetadata, JsonLd } from '@/features/seo';
import { ProductDetailClient } from '@/frontend/features/products/components/ProductDetailClient';
import { ProductService } from '@/frontend/features/products/services/product.service';
import { prisma } from '@/lib/prisma';

export const revalidate = 600; // Incremental Static Revalidation (ISR) every 10 minutes
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'active', deletedAt: null },
      select: { slug: true },
      take: 50,
    });
    return products.filter((p) => Boolean(p.slug)).map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

const getFormattedProduct = cache(async (slug: string) => {
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
});

const getProductDiscoveryData = cache(
  async (productId: string, categoryId?: string | null, shopId?: string | null) => {
    try {
      const baseInclude = {
        images: {
          where: { deletedAt: null },
          orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }],
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
            city: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      };

      const formatProduct = (p: any) => ({
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
              city: p.shop.city || null,
            }
          : null,
        category: p.category
          ? {
              id: p.category.id,
              name: p.category.name,
              slug: p.category.slug,
            }
          : null,
      });

      // 1. Similar Category Products (Up to 12)
      const similarPromise = categoryId
        ? prisma.product
            .findMany({
              where: {
                id: { not: productId },
                categoryId,
                deletedAt: null,
                status: 'active',
              },
              take: 12,
              orderBy: { createdAt: 'desc' },
              include: baseInclude,
            })
            .catch(() => [])
        : Promise.resolve([]);

      // 2. Same Boutique Store Products (Up to 8)
      const shopPromise = shopId
        ? prisma.product
            .findMany({
              where: {
                id: { not: productId },
                shopId,
                deletedAt: null,
                status: 'active',
              },
              take: 8,
              orderBy: { createdAt: 'desc' },
              include: baseInclude,
            })
            .catch(() => [])
        : Promise.resolve([]);

      // 3. Trending across JiivaaKart (Up to 30)
      const trendingPromise = prisma.product
        .findMany({
          where: {
            id: { not: productId },
            deletedAt: null,
            status: 'active',
          },
          take: 30,
          orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
          include: baseInclude,
        })
        .catch(() => []);

      const [similarRaw, shopRaw, trendingRaw] = await Promise.all([
        similarPromise,
        shopPromise,
        trendingPromise,
      ]);

      let similarProds = similarRaw.map(formatProduct);
      const shopProducts = shopRaw.map(formatProduct);
      const trendingProducts = trendingRaw.map(formatProduct);

      // If similar category products are fewer than 6, supplement from trending
      if (similarProds.length < 6) {
        const existingIds = new Set([productId, ...similarProds.map((p) => p.id)]);
        const backfill = trendingProducts.filter((p) => !existingIds.has(p.id));
        similarProds = [...similarProds, ...backfill.slice(0, 10 - similarProds.length)];
      }

      return {
        relatedProducts: similarProds,
        shopProducts,
        trendingProducts,
      };
    } catch (error) {
      console.error('Error fetching product discovery data:', error);
      return {
        relatedProducts: [],
        shopProducts: [],
        trendingProducts: [],
      };
    }
  },
);

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

  const { relatedProducts, shopProducts, trendingProducts } = await getProductDiscoveryData(
    product.id,
    product.category?.id,
    product.shop?.id,
  );

  const jsonLdSchemas = generateProductJsonLdSchemas(product);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 pt-4 font-sans">
      <JsonLd data={jsonLdSchemas} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProductDetailClient
          key={product.id}
          product={product}
          relatedProducts={relatedProducts}
          shopProducts={shopProducts}
          trendingProducts={trendingProducts}
        />
      </div>
    </div>
  );
}
