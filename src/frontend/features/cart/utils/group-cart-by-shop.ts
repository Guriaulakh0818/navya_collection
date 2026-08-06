import { CartStoreItem } from '@/stores/cart.store';

export interface ShopCartGroup {
  shopId: string;
  shopName: string;
  shopSlug?: string;
  shopLogo?: string;
  items: CartStoreItem[];
  subtotal: number;
  itemCount: number;
}

/**
 * Groups cart items by Boutique Shop and calculates per-shop subtotals.
 */
export function groupCartItemsByShop(items: CartStoreItem[]): ShopCartGroup[] {
  if (!items || items.length === 0) return [];

  const groupsMap = new Map<string, ShopCartGroup>();

  items.forEach((item) => {
    const shopId = item.shopId || 'navya-boutique';
    const shopName = item.shopName || 'Navya Collection Boutique';
    const shopSlug = item.shopSlug || 'navya-collection';
    const shopLogo = item.shopLogo;

    if (!groupsMap.has(shopId)) {
      groupsMap.set(shopId, {
        shopId,
        shopName,
        shopSlug,
        shopLogo,
        items: [],
        subtotal: 0,
        itemCount: 0,
      });
    }

    const group = groupsMap.get(shopId)!;
    group.items.push(item);
    group.subtotal += Number(item.price || 0) * Number(item.quantity || 1);
    group.itemCount += Number(item.quantity || 1);
  });

  return Array.from(groupsMap.values());
}
