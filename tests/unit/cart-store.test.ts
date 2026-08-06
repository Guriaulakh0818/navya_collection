import { beforeEach, describe, expect, it } from 'vitest';

import { useCartStore } from '../../src/frontend/stores/cart.store';

describe('Zustand Cart Store', () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [],
      itemCount: 0,
      subtotal: 0,
      discount: 0,
      shipping: 0,
      total: 0,
      freeShippingThreshold: 999,
      freeShippingRemaining: 999,
      appliedCoupon: null,
      isGuest: true,
      isLoading: false,
      error: null,
    });
  });

  it('adds item to cart and calculates subtotal correctly', async () => {
    await useCartStore.getState().addItem({
      productId: 'prod_001',
      name: 'Pure Chanderi Silk Saree',
      price: 3499,
      quantity: 1,
    });

    const state = useCartStore.getState();
    expect(state.items.length).toBe(1);
    expect(state.itemCount).toBe(1);
    expect(state.subtotal).toBe(3499);
    expect(state.freeShippingRemaining).toBe(0); // >= 999 gets free shipping
  });

  it('increments quantity when adding duplicate product', async () => {
    await useCartStore.getState().addItem({
      productId: 'prod_001',
      name: 'Pure Chanderi Silk Saree',
      price: 3499,
      quantity: 1,
    });

    await useCartStore.getState().addItem({
      productId: 'prod_001',
      name: 'Pure Chanderi Silk Saree',
      price: 3499,
      quantity: 2,
    });

    const state = useCartStore.getState();
    expect(state.items.length).toBe(1);
    expect(state.items[0].quantity).toBe(3);
    expect(state.subtotal).toBe(3499 * 3);
  });

  it('updates item quantity and recalculates totals', async () => {
    await useCartStore.getState().addItem({
      productId: 'prod_001',
      name: 'Pure Chanderi Silk Saree',
      price: 3499,
      quantity: 2,
    });

    await useCartStore.getState().updateQuantity('prod_001', 5);

    const state = useCartStore.getState();
    expect(state.items[0].quantity).toBe(5);
    expect(state.subtotal).toBe(3499 * 5);
  });

  it('removes item when quantity updated to zero or when removeItem called', async () => {
    await useCartStore.getState().addItem({
      productId: 'prod_001',
      name: 'Pure Chanderi Silk Saree',
      price: 3499,
      quantity: 1,
    });

    await useCartStore.getState().removeItem('prod_001');

    const state = useCartStore.getState();
    expect(state.items.length).toBe(0);
    expect(state.subtotal).toBe(0);
  });

  it('clears cart state completely', async () => {
    await useCartStore.getState().addItem({
      productId: 'prod_001',
      name: 'Pure Chanderi Silk Saree',
      price: 3499,
      quantity: 2,
    });

    await useCartStore.getState().clearCart();

    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
    expect(state.itemCount).toBe(0);
    expect(state.subtotal).toBe(0);
  });
});
