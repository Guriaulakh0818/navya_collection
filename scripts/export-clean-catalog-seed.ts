import fs from 'fs';

import { autoCategorizeProduct } from '../src/shared/utils/auto-categorizer';

async function main() {
  console.log('Fetching live catalog from https://jiivaakart.com/api/v1/marketplace/catalog...');
  const res = await fetch('https://jiivaakart.com/api/v1/marketplace/catalog');
  const data = await res.json();

  const products: any[] = data?.data?.products || [];
  const shops: any[] = data?.data?.shops || [];
  console.log(`Fetched ${products.length} products and ${shops.length} shops.`);

  // Load existing seed to preserve users
  let existingSeed: any = { users: [], shops: [], products: [] };
  if (fs.existsSync('src/config/production-catalog-seed.json')) {
    existingSeed = JSON.parse(fs.readFileSync('src/config/production-catalog-seed.json', 'utf8'));
  }

  const cleanProducts = products.map((p) => {
    const autoRes = autoCategorizeProduct({
      name: p.name,
      description: p.description || undefined,
      price: Number(p.price || 0),
      fabric: p.fabric || undefined,
      occasion: p.occasion || undefined,
      gender: p.gender || undefined,
    });

    const resolvedGender =
      autoRes.departmentGroup === 'group_kids'
        ? 'kids'
        : autoRes.departmentGroup === 'group_women'
          ? 'women'
          : 'men';

    return {
      ...p,
      gender: resolvedGender,
      categoryId: autoRes.primaryCategoryId,
      isNewArrival: true,
      isFeatured: true,
    };
  });

  const updatedSeed = {
    exportedAt: new Date().toISOString(),
    users: existingSeed.users || [],
    shops: shops.length > 0 ? shops : existingSeed.shops || [],
    products: cleanProducts,
  };

  fs.writeFileSync(
    'src/config/production-catalog-seed.json',
    JSON.stringify(updatedSeed, null, 2),
    'utf8',
  );
  console.log(
    `✓ Updated src/config/production-catalog-seed.json with ${cleanProducts.length} products!`,
  );

  const tsContent = `// Auto-generated Production Catalog Seed
export interface CatalogVariant {
  id: string;
  name?: string;
  sku: string;
  size?: string | null;
  color?: string | null;
  price: string | number;
  compareAtPrice?: string | number | null;
  stock: number;
  status?: string;
  [key: string]: any;
}

export interface CatalogImage {
  id?: string;
  imageUrl: string;
  altText?: string | null;
  isThumbnail?: boolean;
  displayOrder?: number;
  [key: string]: any;
}

export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: string | number;
  compareAtPrice?: string | number | null;
  stock: number;
  status: string;
  gender?: string | null;
  categoryId?: string | null;
  shopId: string;
  images: CatalogImage[];
  variants?: CatalogVariant[];
  [key: string]: any;
}

export interface CatalogSeedType {
  exportedAt: string;
  users: any[];
  shops: any[];
  products: CatalogProduct[];
}

export const catalogSeed: CatalogSeedType = ${JSON.stringify(updatedSeed, null, 2)};
`;

  fs.writeFileSync('src/config/production-catalog-seed.ts', tsContent, 'utf8');
  console.log(
    `✓ Updated src/config/production-catalog-seed.ts with ${cleanProducts.length} products!`,
  );
}

main().catch(console.error);
