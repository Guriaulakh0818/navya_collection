import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import type { Product } from '../types/product.types';
import { calculateDiscount } from '../utils/product.utils';
import { ProductBadge } from './ProductBadge';
import { ProductPrice } from './ProductPrice';
import { ProductQuickView } from './ProductQuickView';
import { ProductRating } from './ProductRating';

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const discount = calculateDiscount(product.price, product.compareAtPrice);

  return (
    <Card className="group overflow-hidden border-0 shadow-sm">
      <div className="relative aspect-[3/4] bg-gradient-to-br from-sky-50 to-orange-50">
        {discount ? <ProductBadge type="sale" text={`${discount}% OFF`} /> : null}
        {product.status === 'draft' ? <ProductBadge type="new" text="New" /> : null}
        <ProductQuickView product={product} />
      </div>
      <div className="p-4">
        <p className="text-xs text-slate-500 mb-1">{product.category.name}</p>
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-heading text-lg text-navy group-hover:text-orange transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <ProductPrice price={product.price} compareAtPrice={product.compareAtPrice} />
        </div>
        <div className="mt-2">
          <ProductRating rating={product.rating ?? 0} reviewCount={product.reviewCount ?? 0} />
        </div>
        <Button className="w-full mt-4 rounded-full" size="sm">
          Add to Cart
        </Button>
      </div>
    </Card>
  );
}
