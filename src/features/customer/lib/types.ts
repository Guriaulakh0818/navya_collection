import { CartItem } from '@/features/shared/lib/types';

export type CartState = {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
};

export type { CartItem };
