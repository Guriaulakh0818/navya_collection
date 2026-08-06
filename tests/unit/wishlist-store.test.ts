import { beforeEach, describe, expect, it } from 'vitest';

import { useWishlistStore } from '../../src/frontend/stores/wishlist.store';
import { MOCK_PRODUCTS } from '../mocks/products.mock';

describe('Zustand Wishlist Store', () => {
  beforeEach(() => {
    useWishlistStore.setState({
      items: [],
      count: 0,
      isGuest: true,
      isLoading: false,
      error: null,
    });
  });

  it('adds item to wishlist', async () => {
    await useWishlistStore.getState().addItem({
      productId: MOCK_PRODUCTS[0].id,
      name: MOCK_PRODUCTS[0].name,
      price: MOCK_PRODUCTS[0].price,
      image: MOCK_PRODUCTS[0].images[0],
    });

    const state = useWishlistStore.getState();
    expect(state.items.length).toBe(1);
    expect(state.count).toBe(1);
    expect(state.isInWishlist(MOCK_PRODUCTS[0].id)).toBe(true);
  });

  it('toggles item off when already in wishlist', async () => {
    const item = {
      productId: MOCK_PRODUCTS[0].id,
      name: MOCK_PRODUCTS[0].name,
      price: MOCK_PRODUCTS[0].price,
      image: MOCK_PRODUCTS[0].images[0],
    };

    await useWishlistStore.getState().toggleItem(item);
    expect(useWishlistStore.getState().isInWishlist(MOCK_PRODUCTS[0].id)).toBe(true);

    await useWishlistStore.getState().toggleItem(item);
    expect(useWishlistStore.getState().isInWishlist(MOCK_PRODUCTS[0].id)).toBe(false);
    expect(useWishlistStore.getState().count).toBe(0);
  });

  it('removes item from wishlist by productId', async () => {
    await useWishlistStore.getState().addItem({
      productId: MOCK_PRODUCTS[0].id,
      name: MOCK_PRODUCTS[0].name,
      price: MOCK_PRODUCTS[0].price,
    });

    await useWishlistStore.getState().removeItem(MOCK_PRODUCTS[0].id);

    expect(useWishlistStore.getState().items.length).toBe(0);
    expect(useWishlistStore.getState().isInWishlist(MOCK_PRODUCTS[0].id)).toBe(false);
  });
});
