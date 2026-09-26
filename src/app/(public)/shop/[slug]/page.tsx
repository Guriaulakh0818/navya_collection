import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { generateShopJsonLdSchemas, generateShopMetadata, JsonLd } from '@/features/seo';
import { ShopProfileStorefront } from '@/frontend/features/shop/components/ShopProfileStorefront';
import { prisma } from '@/lib/prisma';

interface ShopPageProps {
  params: Promise<{ slug: string }>;
}

async function getApprovedShopBySlug(slug: string) {
  if (!slug) return null;
  const cleanSlug = slug.toLowerCase().trim();

  try {
    const shop = await prisma.shop.findFirst({
      where: {
        OR: [{ slug: cleanSlug }, { id: cleanSlug }],
        status: 'APPROVED',
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        banner: true,
        description: true,
        city: true,
        state: true,
        pincode: true,
        fullAddress: true,
        phone: true,
        email: true,
        rating: true,
        reviewCount: true,
        verificationBadge: true,
        shippingPolicy: true,
        returnPolicy: true,
        metaTitle: true,
        metaDescription: true,
        isClosed: true,
        vacationMessage: true,
      },
    });

    if (!shop) return null;

    // Fetch Products strictly isolated to this shop
    const products = await prisma.product.findMany({
      where: {
        shopId: shop.id,
        status: 'active',
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        price: true,
        compareAtPrice: true,
        stock: true,
        rating: true,
        reviewCount: true,
        images: {
          select: {
            imageUrl: true,
            altText: true,
          },
          orderBy: { sortOrder: 'asc' },
          take: 2,
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

    // Fetch Distinct Categories with active products in this shop
    const categories = await prisma.category.findMany({
      where: {
        products: {
          some: {
            shopId: shop.id,
            status: 'active',
            deletedAt: null,
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    return {
      shop,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        price: Number(p.price || 0),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        stock: p.stock || 0,
        rating: p.rating || 0,
        reviewCount: p.reviewCount || 0,
        images: p.images,
        category: p.category,
      })),
      categories,
    };
  } catch (error) {
    console.error(`Error fetching shop by slug (${slug}):`, error);
    return null;
  }
}

export async function generateMetadata({ params }: ShopPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getApprovedShopBySlug(slug);

  if (!data || !data.shop) {
    return {
      title: 'Shop Not Found | Navya Collection',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const hasProducts = data.products.length > 0;
  return generateShopMetadata(
    {
      ...data.shop,
      productCount: data.products.length,
    },
    { hasProducts },
  );
}

export default async function BoutiqueShopPage({ params }: ShopPageProps) {
  const { slug } = await params;
  const data = await getApprovedShopBySlug(slug);

  if (!data || !data.shop) {
    notFound();
  }

  const { shop, products, categories } = data;
  const shopJsonLd = generateShopJsonLdSchemas(shop);

  return (
    <>
      <JsonLd data={shopJsonLd} />
      <ShopProfileStorefront
        shop={shop}
        products={products}
        categories={categories}
        relatedProducts={[]}
      />
    </>
  );
}
