import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

const MOCK_SHOPS = [
  {
    id: 'shop_navya_collection',
    name: 'Navya Collection',
    slug: 'navya-collection',
    logo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
    rating: 5.0,
    reviewCount: 156,
    city: 'Chandigarh',
    state: 'Punjab',
    status: 'APPROVED',
    verificationBadge: 'PREMIUM_STORE',
    _count: { products: 24 },
  },
  {
    id: 'shop_saniya_fashions',
    name: 'Saniya Fashions',
    slug: 'saniya-fashions',
    logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    banner: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200',
    rating: 4.9,
    reviewCount: 42,
    city: 'Chandigarh',
    state: 'Punjab',
    status: 'APPROVED',
    verificationBadge: 'VERIFIED_SELLER',
    _count: { products: 12 },
  },
  {
    id: 'shop_royal_heritage',
    name: 'Royal Heritage Sarees',
    slug: 'royal-heritage-sarees',
    logo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    banner: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1200',
    rating: 4.8,
    reviewCount: 38,
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    status: 'APPROVED',
    verificationBadge: 'TRUSTED_SELLER',
    _count: { products: 18 },
  },
];

const MOCK_PRODUCTS = [
  {
    id: 'prd_banarasi_1',
    name: 'Royal Banarasi Silk Saree',
    slug: 'royal-banarasi-silk-saree',
    price: 14999,
    compareAtPrice: 17499,
    stock: 45,
    rating: 4.8,
    reviewCount: 28,
    categoryId: 'cat_sarees',
    category: { id: 'cat_sarees', name: 'Sarees', slug: 'sarees' },
    shop: {
      id: 'shop_saniya_fashions',
      name: 'Saniya Fashions',
      slug: 'saniya-fashions',
      city: 'Hisar',
    },
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800' }],
  },
  {
    id: 'prd_kanjeevaram_2',
    name: 'Heritage Kanjeevaram Silk Saree',
    slug: 'heritage-kanjeevaram-silk-saree',
    price: 24999,
    compareAtPrice: 28999,
    stock: 25,
    rating: 4.9,
    reviewCount: 34,
    categoryId: 'cat_sarees',
    category: { id: 'cat_sarees', name: 'Sarees', slug: 'sarees' },
    shop: {
      id: 'shop_royal_heritage',
      name: 'Royal Heritage Sarees',
      slug: 'royal-heritage-sarees',
      city: 'Varanasi',
    },
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800' }],
  },
  {
    id: 'prd_gents_suit_3',
    name: 'Classic Royal Navy Tuxedo Suit',
    slug: 'classic-royal-navy-tuxedo-suit',
    price: 8999,
    compareAtPrice: 11999,
    stock: 15,
    rating: 4.7,
    reviewCount: 19,
    categoryId: 'cat_gents',
    category: { id: 'cat_gents', name: 'Gents Wear', slug: 'gents' },
    shop: {
      id: 'shop_navya_flagship',
      name: 'Navya Flagship Store',
      slug: 'navya-flagship-store',
      city: 'Hisar',
    },
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800' }],
  },
  {
    id: 'prd_kids_kurta_4',
    name: 'Kids Festive Silk Kurta Set',
    slug: 'kids-festive-silk-kurta-set',
    price: 2499,
    compareAtPrice: 3299,
    stock: 30,
    rating: 4.8,
    reviewCount: 22,
    categoryId: 'cat_kids',
    category: { id: 'cat_kids', name: 'Kids Wear', slug: 'kids' },
    shop: {
      id: 'shop_navya_flagship',
      name: 'Navya Flagship Store',
      slug: 'navya-flagship-store',
      city: 'Hisar',
    },
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800' }],
  },
  {
    id: 'prd_bridal_lehenga_5',
    name: 'Heavy Designer Velvet Bridal Lehenga',
    slug: 'heavy-designer-velvet-bridal-lehenga',
    price: 34999,
    compareAtPrice: 42999,
    stock: 10,
    rating: 5.0,
    reviewCount: 45,
    categoryId: 'cat_lehengas',
    category: { id: 'cat_lehengas', name: 'Bridal Lehengas', slug: 'lehengas' },
    shop: {
      id: 'shop_saniya_fashions',
      name: 'Saniya Fashions',
      slug: 'saniya-fashions',
      city: 'Hisar',
    },
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800' }],
  },
  {
    id: 'prd_chanderi_kurti_6',
    name: 'Hand Embroidered Chanderi Kurti',
    slug: 'hand-embroidered-chanderi-kurti',
    price: 3999,
    compareAtPrice: 4999,
    stock: 40,
    rating: 4.6,
    reviewCount: 15,
    categoryId: 'cat_kurtis',
    category: { id: 'cat_kurtis', name: 'Kurtis & Tunics', slug: 'kurtis' },
    shop: {
      id: 'shop_royal_heritage',
      name: 'Royal Heritage Sarees',
      slug: 'royal-heritage-sarees',
      city: 'Varanasi',
    },
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800' }],
  },
];

export async function GET() {
  try {
    let dbShops: any[] = [];
    let dbProducts: any[] = [];
    let dbCategories: any[] = [];

    try {
      [dbShops, dbProducts, dbCategories] = await Promise.all([
        // 1. Fetch ALL non-deleted shops across the entire marketplace
        prisma.shop.findMany({
          where: {
            deletedAt: null,
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            ownerId: true,
            name: true,
            slug: true,
            logo: true,
            banner: true,
            rating: true,
            reviewCount: true,
            verificationBadge: true,
            city: true,
            state: true,
            status: true,
            createdAt: true,
            _count: {
              select: { products: { where: { deletedAt: null, status: 'active' } } },
            },
          },
        }),

        // 2. Fetch ALL active non-deleted products across all shops & sellers
        prisma.product.findMany({
          where: {
            status: 'active',
            deletedAt: null,
          },
          orderBy: { createdAt: 'desc' },
          include: {
            images: { select: { imageUrl: true }, take: 2 },
            shop: {
              select: { id: true, name: true, slug: true, city: true, verificationBadge: true },
            },
            category: { select: { id: true, name: true, slug: true } },
          },
        }),

        // 3. Fetch ALL Categories
        prisma.category.findMany({
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
          },
        }),
      ]);
    } catch (dbErr) {
      console.warn('⚠️ DB query error in catalog route, using rich marketplace fallback:', dbErr);
    }

    const finalShops = dbShops.length > 0 ? dbShops : MOCK_SHOPS;
    const finalProducts = dbProducts.length > 0 ? dbProducts : MOCK_PRODUCTS;

    return NextResponse.json({
      success: true,
      data: {
        shops: finalShops,
        products: finalProducts,
        categories: dbCategories,
      },
    });
  } catch (error: any) {
    console.error('❌ GET Marketplace Catalog Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch catalog.' },
      { status: 500 },
    );
  }
}
