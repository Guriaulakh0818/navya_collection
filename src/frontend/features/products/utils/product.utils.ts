import { formatPrice as globalFormatPrice } from '@/utils/format-price';

import type { Product } from '../types/product.types';

export function calculateDiscount(price: number, compareAtPrice?: number): number | null {
  if (!compareAtPrice || compareAtPrice <= 0) return null;
  const discount = ((compareAtPrice - price) / compareAtPrice) * 100;
  return Math.round(discount);
}

export function formatPrice(amount: number, currency = 'INR'): string {
  return globalFormatPrice(amount, currency);
}

export function getProductSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isLowStock(product: Product): boolean {
  if (product.variants && product.variants.length > 0) {
    return product.variants.some((v) => (v.stock ?? 0) <= (product.lowStockThreshold ?? 5));
  }
  return product.stock <= (product.lowStockThreshold ?? 5);
}
