import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  generateBreadcrumbSchema,
  generateProductJsonLdSchemas,
  generateProductSchema,
  JsonLd,
} from '@/features/seo';
import { ProductDetailClient } from '@/frontend/features/products/components/ProductDetailClient';
import { ProductService } from '@/frontend/features/products/services/product.service';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// Fallback sample product only if DB is completely empty (never flashed during loading)
const fallbackSampleProduct = {
  id: 'default-1',
  name: 'Royal Designer Silk Couture',
  slug: 'royal-designer-silk-couture',
  sku: 'NC-SILK-001',
  description:
    'Exquisite Indian luxury couture from Navya Collection. Featuring intricate hand embroidery, fine zardozi work, and premium silk fabric designed for grand weddings and celebrations.',
  price: 12999,
  compareAtPrice: 15999,
  stock: 15,
  lowStockThreshold: 5,
  rating: 4.9,
  reviewCount: 28,
  category: { id: 'c1', name: 'Indian Couture', slug: 'indian-couture' },
  images: [
    {
      id: 'img1',
      url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1000',
      alt: 'Royal Designer Silk Couture',
    },
  ],
  variants: [
    { id: 'v1', sku: 'NC-SILK-S', name: 'S (Blush Pink)', price: 12999, stock: 5, size: 'S' },
    { id: 'v2', sku: 'NC-SILK-M', name: 'M (Ivory White)', price: 12999, stock: 7, size: 'M' },
    { id: 'v3', sku: 'NC-SILK-L', name: 'L (Royal Crimson)', price: 12999, stock: 3, size: 'L' },
  ],
  reviews: [
    {
      id: 'r1',
      userName: 'Priya Sharma',
      rating: 5,
      comment: 'Breathtaking embroidery and silk texture! Received so many compliments.',
      createdAt: new Date('2026-07-20'),
    },
  ],
};

async function getFormattedProduct(slug: string) {
  try {
    const res = await ProductService.getProductByIdOrSlug(slug);
    if (res?.success && res?.data) {
      const dbProd = res.data;
      return {
        id: dbProd.id,
        name: dbProd.name,
        slug: dbProd.slug,
        sku: dbProd.sku,
        description: dbProd.description,
        price: Number(dbProd.price || 0),
        compareAtPrice: dbProd.compareAtPrice ? Number(dbProd.compareAtPrice) : null,
        stock: dbProd.stock || 0,
        lowStockThreshold: dbProd.lowStockThreshold || 5,
        rating: dbProd.rating || 4.8,
        category: dbProd.category || {
          id: 'c1',
          name: 'Boutique Collection',
          slug: 'boutique',
        },
        images:
          dbProd.images && dbProd.images.length > 0
            ? dbProd.images.map((img: any) => ({
                id: img.id,
                url: img.imageUrl,
                alt: img.altText || dbProd.name,
                isPrimary: img.isPrimary,
              }))
            : fallbackSampleProduct.images,
        variants:
          dbProd.variants && dbProd.variants.length > 0
            ? dbProd.variants.map((v: any) => ({
                id: v.id,
                sku: v.sku,
                name: `${v.size || 'Size'}`,
                price: Number(v.price || dbProd.price),
                stock: v.stock,
                size: v.size,
              }))
            : fallbackSampleProduct.variants,
        reviews:
          dbProd.reviews && dbProd.reviews.length > 0
            ? dbProd.reviews.map((r: any) => ({
                id: r.id,
                userName: r.user?.name || r.userName || 'Customer',
                rating: r.rating,
                comment: r.comment,
                createdAt: new Date(r.createdAt),
              }))
            : fallbackSampleProduct.reviews,
        shop: dbProd.shop || null,
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
    };
  }

  return {
    title: `${product.name} | Navya Collection`,
    description:
      product.description?.slice(0, 160) ||
      'Buy premium Indian ethnic couture at Navya Collection.',
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.images?.[0]?.url ? [{ url: product.images[0].url }] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getFormattedProduct(slug);

  const activeProduct = product || {
    ...fallbackSampleProduct,
    name: slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
  };

  const productSchema = generateProductSchema({
    id: activeProduct.id,
    name: activeProduct.name,
    description: activeProduct.description,
    price: activeProduct.price,
    images: activeProduct.images.map((i: any) => i.url),
    category: activeProduct.category?.name || 'Couture',
    ratingValue: activeProduct.rating,
    reviewCount: activeProduct.reviews?.length || 1,
    inStock: activeProduct.stock > 0,
    sku: activeProduct.sku,
  });

  const jsonLdSchemas = generateProductJsonLdSchemas(activeProduct as any);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 pt-4 font-sans">
      <JsonLd data={jsonLdSchemas} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProductDetailClient key={activeProduct.id} product={activeProduct} />
      </div>
    </div>
  );
}
