'use client';

import { Button } from '@/components/ui/button';
import type { Product } from '@/features/products/types/product.types';
import { useCartStore } from '@/stores';

type AddToCartButtonProps = {
  product: Product;
  className?: string;
  disabled?: boolean;
};

export function AddToCartButton({ product, className, disabled }: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = () => {
    addItem({
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images[0]?.url,
    });
  };

  return (
    <Button className={className} size="sm" onClick={handleAddToCart} disabled={disabled}>
      Add to Cart
    </Button>
  );
}
