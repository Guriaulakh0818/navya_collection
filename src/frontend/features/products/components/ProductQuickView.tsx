'use client';

import { Drawer } from '@/components/ui/drawer';

import type { Product } from '../types/product.types';
import { AddToCartButton } from './AddToCartButton';

type ProductQuickViewProps = {
  product: Product;
};

export function ProductQuickView({ product }: ProductQuickViewProps) {
  return (
    <Drawer open={false} onClose={() => {}} title={product.name}>
      <p className="text-sm text-slate-600 mb-4">Quick view placeholder for {product.name}</p>
      <AddToCartButton product={product} className="w-full rounded-full" />
    </Drawer>
  );
}
