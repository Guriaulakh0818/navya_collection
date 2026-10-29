import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const revalidate = 120; // 2 minutes Edge CDN cache

export async function GET() {
  try {
    let dbShops: any[] = [];
    let dbProducts: any[] = [];
    let dbCategories: any[] = [];

    try {
      [dbShops, dbProducts, dbCategories] = await Promise.all([
        // 1. Fetch ALL APPROVED non-deleted shops across the entire marketplace
        prisma.shop.findMany({
          where: {
            status: 'APPROVED',
            deletedAt: null,
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
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

        // 2. Fetch ALL active products belonging ONLY to APPROVED shops
        prisma.product.findMany({
          where: {
            status: 'active',
            deletedAt: null,
            shop: {
              status: 'APPROVED',
              deletedAt: null,
            },
          },
          orderBy: { createdAt: 'desc' },
          include: {
            images: {
              select: { imageUrl: true },
              take: 2,
              orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
            },
            shop: {
              select: { id: true, name: true, slug: true, city: true, verificationBadge: true },
            },
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                parentId: true,
                parent: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    parentId: true,
                    parent: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                      },
                    },
                  },
                },
              },
            },
          },
        }),

        // 3. Fetch ALL Active Categories
        prisma.category.findMany({
          where: { deletedAt: null, status: 'active' },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            parentId: true,
          },
        }),
      ]);
    } catch (dbErr) {
      console.warn('⚠️ DB query error in catalog route:', dbErr);
    }

    const finalShops = dbShops;
    const finalProducts = dbProducts.map((p) => {
      const pName = (p.name || '').trim().toLowerCase();
      let catSlug = p.category?.slug || '';
      let parentSlug = p.category?.parent?.slug || '';
      let grandParentSlug = p.category?.parent?.parent?.slug || '';

      // 1. High-accuracy gender determination
      let g: 'kids' | 'men' | 'women' = 'men';
      if (
        pName.startsWith('baby') ||
        pName.startsWith('boy') ||
        pName.startsWith('girl') ||
        pName.startsWith('kid') ||
        /\b(baby|babies|infant|infants|toddler|toddlers|newborn|child|children|kids?|boys?|girls?)\b/i.test(
          pName,
        ) ||
        catSlug.startsWith('kids-') ||
        catSlug.startsWith('baby-') ||
        catSlug.startsWith('boys-') ||
        catSlug.startsWith('girls-') ||
        parentSlug === 'kids' ||
        grandParentSlug === 'kids' ||
        p.category?.parentId === 'group_kids'
      ) {
        g = 'kids';
      } else if (
        pName.startsWith('women') ||
        pName.startsWith('lad') ||
        /\b(women|woman|womens|women's|women’s|ladies|female|saree|sari|lehenga|kurti|anarkali|choli|ghagra|dupatta|bra|panty|lingerie)\b/i.test(
          pName,
        ) ||
        catSlug.startsWith('women-') ||
        parentSlug === 'women' ||
        grandParentSlug === 'women' ||
        p.category?.parentId === 'group_women'
      ) {
        g = 'women';
      } else if (
        pName.startsWith('men') ||
        pName.startsWith('gent') ||
        /\b(men|man|mens|men's|men’s|gents|male|sherwani|nehru)\b/i.test(pName) ||
        catSlug.startsWith('men-') ||
        parentSlug === 'men' ||
        grandParentSlug === 'men' ||
        p.category?.parentId === 'group_men'
      ) {
        g = 'men';
      } else if (p.gender === 'kids' || p.gender === 'women' || p.gender === 'men') {
        g = p.gender;
      }

      // 2. Resilient Category Hierarchy Normalization
      let resolvedCategory = p.category;
      if (
        g === 'kids' &&
        (catSlug.startsWith('women-') || catSlug.startsWith('men-') || !catSlug)
      ) {
        if (pName.includes('shirt') && !pName.includes('t-shirt') && !pName.includes('tshirt')) {
          resolvedCategory = {
            id: 'cat_boys_shirts',
            name: 'Shirts',
            slug: 'boys-shirts',
            parentId: 'cat_kids_boys',
            parent: {
              id: 'cat_kids_boys',
              name: 'Boys',
              slug: 'boys-fashion',
              parentId: 'group_kids',
              parent: { id: 'group_kids', name: 'Kids', slug: 'kids' },
            },
          };
        } else if (pName.includes('t-shirt') || pName.includes('tshirt')) {
          resolvedCategory = {
            id: 'cat_boys_tshirts',
            name: 'T-Shirts',
            slug: 'boys-t-shirts',
            parentId: 'cat_kids_boys',
            parent: {
              id: 'cat_kids_boys',
              name: 'Boys',
              slug: 'boys-fashion',
              parentId: 'group_kids',
              parent: { id: 'group_kids', name: 'Kids', slug: 'kids' },
            },
          };
        } else if (
          pName.includes('cardigan') ||
          pName.includes('sweater') ||
          pName.includes('hoodie')
        ) {
          if (pName.includes('girl')) {
            resolvedCategory = {
              id: 'cat_girls_jackets',
              name: 'Jackets',
              slug: 'girls-jackets',
              parentId: 'cat_kids_girls',
              parent: {
                id: 'cat_kids_girls',
                name: 'Girls',
                slug: 'girls-fashion',
                parentId: 'group_kids',
                parent: { id: 'group_kids', name: 'Kids', slug: 'kids' },
              },
            };
          } else if (pName.includes('baby')) {
            resolvedCategory = {
              id: 'cat_baby_boys',
              name: 'Baby Boys',
              slug: 'baby-boys',
              parentId: 'cat_kids_baby',
              parent: {
                id: 'cat_kids_baby',
                name: 'Baby',
                slug: 'baby-fashion',
                parentId: 'group_kids',
                parent: { id: 'group_kids', name: 'Kids', slug: 'kids' },
              },
            };
          } else {
            resolvedCategory = {
              id: 'cat_boys_jackets',
              name: 'Jackets',
              slug: 'boys-jackets',
              parentId: 'cat_kids_boys',
              parent: {
                id: 'cat_kids_boys',
                name: 'Boys',
                slug: 'boys-fashion',
                parentId: 'group_kids',
                parent: { id: 'group_kids', name: 'Kids', slug: 'kids' },
              },
            };
          }
        } else if (pName.includes('top') || pName.includes('tee')) {
          resolvedCategory = {
            id: 'cat_girls_tops_tees',
            name: 'Tops & Tees',
            slug: 'girls-tops-tees',
            parentId: 'cat_kids_girls',
            parent: {
              id: 'cat_kids_girls',
              name: 'Girls',
              slug: 'girls-fashion',
              parentId: 'group_kids',
              parent: { id: 'group_kids', name: 'Kids', slug: 'kids' },
            },
          };
        } else if (
          pName.includes('kurti') ||
          pName.includes('ethnic') ||
          pName.includes('kurta') ||
          pName.includes('suit')
        ) {
          if (pName.includes('girl')) {
            resolvedCategory = {
              id: 'cat_girls_ethnic',
              name: 'Ethnic Wear',
              slug: 'girls-ethnic-wear',
              parentId: 'cat_kids_girls',
              parent: {
                id: 'cat_kids_girls',
                name: 'Girls',
                slug: 'girls-fashion',
                parentId: 'group_kids',
                parent: { id: 'group_kids', name: 'Kids', slug: 'kids' },
              },
            };
          } else {
            resolvedCategory = {
              id: 'cat_boys_ethnic',
              name: 'Ethnic Wear',
              slug: 'boys-ethnic-wear',
              parentId: 'cat_kids_boys',
              parent: {
                id: 'cat_kids_boys',
                name: 'Boys',
                slug: 'boys-fashion',
                parentId: 'group_kids',
                parent: { id: 'group_kids', name: 'Kids', slug: 'kids' },
              },
            };
          }
        } else if (pName.includes('gown') || pName.includes('dress') || pName.includes('frock')) {
          resolvedCategory = {
            id: 'cat_girls_dresses',
            name: 'Dresses',
            slug: 'girls-dresses',
            parentId: 'cat_kids_girls',
            parent: {
              id: 'cat_kids_girls',
              name: 'Girls',
              slug: 'girls-fashion',
              parentId: 'group_kids',
              parent: { id: 'group_kids', name: 'Kids', slug: 'kids' },
            },
          };
        } else if (pName.includes('tracksuit') || pName.includes('fleece')) {
          resolvedCategory = {
            id: 'cat_kids_boys',
            name: 'Boys',
            slug: 'boys-fashion',
            parentId: 'group_kids',
            parent: { id: 'group_kids', name: 'Kids', slug: 'kids' },
          };
        }
      } else if (g === 'men' && (catSlug === 'women-sarees' || catSlug.startsWith('women-'))) {
        if (pName.includes('pant') || pName.includes('trouser')) {
          resolvedCategory = {
            id: 'cat_men_trousers',
            name: 'Trousers',
            slug: 'men-trousers',
            parentId: 'cat_men_bottomwear',
            parent: {
              id: 'cat_men_bottomwear',
              name: 'Bottomwear',
              slug: 'men-bottomwear',
              parentId: 'group_men',
              parent: { id: 'group_men', name: 'Men', slug: 'men' },
            },
          };
        } else {
          resolvedCategory = {
            id: 'cat_men_shirts',
            name: 'Shirts',
            slug: 'men-shirts',
            parentId: 'cat_men_topwear',
            parent: {
              id: 'cat_men_topwear',
              name: 'Topwear',
              slug: 'men-topwear',
              parentId: 'group_men',
              parent: { id: 'group_men', name: 'Men', slug: 'men' },
            },
          };
        }
      } else if (
        g === 'men' &&
        (pName.includes('track lower') || pName.includes('track pant')) &&
        catSlug === 'men-t-shirts'
      ) {
        resolvedCategory = {
          id: 'cat_men_trackpants',
          name: 'Track Pants',
          slug: 'men-track-pants',
          parentId: 'cat_men_bottomwear',
          parent: {
            id: 'cat_men_bottomwear',
            name: 'Bottomwear',
            slug: 'men-bottomwear',
            parentId: 'group_men',
            parent: { id: 'group_men', name: 'Men', slug: 'men' },
          },
        };
      }

      return {
        ...p,
        gender: g,
        category: resolvedCategory,
        categoryId: resolvedCategory?.id || p.categoryId,
        images: (p.images || []).map((img: any) => {
          const src =
            img.imageUrl || img.url || img.secureUrl || (typeof img === 'string' ? img : '');
          return {
            ...img,
            url: src,
            imageUrl: src,
          };
        }),
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          shops: finalShops,
          products: finalProducts,
          categories: dbCategories,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
        },
      },
    );
  } catch (error: any) {
    console.error('❌ GET Marketplace Catalog Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch catalog.' },
      { status: 500 },
    );
  }
}
