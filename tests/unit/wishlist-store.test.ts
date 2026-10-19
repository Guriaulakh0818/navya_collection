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

  it('allows customer to wishlist more than 1 product (multiple products)', async () => {
    const store = useWishlistStore.getState();

    // Add first product
    await store.addItem({
      productId: MOCK_PRODUCTS[0].id,
      name: MOCK_PRODUCTS[0].name,
      price: MOCK_PRODUCTS[0].price,
      image: MOCK_PRODUCTS[0].images[0],
    });

    // Add second product
    await store.addItem({
      productId: MOCK_PRODUCTS[1].id,
      name: MOCK_PRODUCTS[1].name,
      price: MOCK_PRODUCTS[1].price,
      image: MOCK_PRODUCTS[1].images[0],
    });

    // Add third product using fallback { id }
    await store.addItem({
      id: 'prod_custom_3',
      name: 'Designer Banarasi Silk Saree',
      price: 4999,
    });

    const state = useWishlistStore.getState();
    expect(state.items.length).toBe(3);
    expect(state.count).toBe(3);
    expect(state.isInWishlist(MOCK_PRODUCTS[0].id)).toBe(true);
    expect(state.isInWishlist(MOCK_PRODUCTS[1].id)).toBe(true);
    expect(state.isInWishlist('prod_custom_3')).toBe(true);
  });

  it('allows customer to wishlist specific product variants', async () => {
    const store = useWishlistStore.getState();

    // Add product with Variant A (Red / L)
    await store.addItem({
      productId: 'prod_anarkali',
      variantId: 'var_red_l',
      name: 'Embroidered Anarkali Suit',
      price: 2999,
      selectedColor: 'Red',
      selectedSize: 'L',
      variantName: 'Red - L',
    });

    // Add same product with Variant B (Blue / M)
    await store.addItem({
      productId: 'prod_anarkali',
      variantId: 'var_blue_m',
      name: 'Embroidered Anarkali Suit',
      price: 3199,
      selectedColor: 'Blue',
      selectedSize: 'M',
      variantName: 'Blue - M',
    });

    const state = useWishlistStore.getState();
    expect(state.items.length).toBe(2);
    expect(state.count).toBe(2);

    // Verify variant-level check
    expect(state.isInWishlist('prod_anarkali', 'var_red_l')).toBe(true);
    expect(state.isInWishlist('prod_anarkali', 'var_blue_m')).toBe(true);
    expect(state.isInWishlist('prod_anarkali', 'var_green_s')).toBe(false);

    // Remove specific variant A
    await store.removeItem('prod_anarkali', 'var_red_l');
    const updatedState = useWishlistStore.getState();
    expect(updatedState.items.length).toBe(1);
    expect(updatedState.isInWishlist('prod_anarkali', 'var_red_l')).toBe(false);
    expect(updatedState.isInWishlist('prod_anarkali', 'var_blue_m')).toBe(true);
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
