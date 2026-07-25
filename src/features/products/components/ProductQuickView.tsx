'use client';

import { Drawer } from '@/components/ui/drawer';

import type { Product } from '../types/product.types';

type ProductQuickViewProps = {
  product: Product;
};

export function ProductQuickView({ product }: ProductQuickViewProps) {
  return (
    <Drawer open={false} onClose={() => {}} title={product.name}>
      <p className="text-sm text-slate-600">Quick view placeholder for {product.name}</p>
    </Drawer>
  );
}
