import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { generateProductJsonLdSchemas, generateProductMetadata, JsonLd } from '@/features/seo';
import { ProductDetailClient } from '@/frontend/features/products/components/ProductDetailClient';
import { ProductService } from '@/frontend/features/products/services/product.service';

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

                return {
                  id: v.id,
                  sku: v.sku || `${dbProd.sku}-${v.id}`,
                  name: v.name || v.color || v.size || 'Standard',
                  color: v.color || v.colorName || null,
                  price: Number(v.price !== undefined && v.price !== null ? v.price : dbProd.price),
                  stock:
                    v.stock !== undefined && v.stock !== null
                      ? Number(v.stock)
                      : Number(dbProd.stock || 0),
                  size: v.size || null,
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

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getFormattedProduct(slug);

  if (!product) {
    return {
      title: 'Product Not Found | Navya Collection',
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

  const jsonLdSchemas = generateProductJsonLdSchemas(product);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 pt-4 font-sans">
      <JsonLd data={jsonLdSchemas} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProductDetailClient key={product.id} product={product} />
      </div>
    </div>
  );
}
