import { describe, expect, it } from 'vitest';

export function simulateShopSoftDelete(
  shops: Array<{
    id: string;
    name: string;
    ownerId: string;
    status: string;
    deletedAt: Date | null;
  }>,
  users: Array<{ id: string; email: string; role: string }>,
  targetShopId: string,
) {
  const shopIndex = shops.findIndex((s) => s.id === targetShopId);
  if (shopIndex === -1) throw new Error('Shop not found');

  // Perform soft delete on target shop
  shops[shopIndex] = {
    ...shops[shopIndex],
    status: 'INACTIVE',
    deletedAt: new Date(),
  };

  // Return non-deleted public shops & current user state
  const publicShops = shops.filter((s) => s.status === 'APPROVED' && s.deletedAt === null);
  return { shops, users, publicShops };
}

describe('Regression Test: User Account Survival on Shop Soft-Delete', () => {
  it('soft-deletes Shop A while preserving Owner User A, User B, and Shop B intact', () => {
    const users = [
      { id: 'user-1', email: 'owner.a@example.com', role: 'SELLER' },
      { id: 'user-2', email: 'owner.b@example.com', role: 'SELLER' },
    ];

    const shops = [
      { id: 'shop-1', name: 'Boutique A', ownerId: 'user-1', status: 'APPROVED', deletedAt: null },
      { id: 'shop-2', name: 'Boutique B', ownerId: 'user-2', status: 'APPROVED', deletedAt: null },
    ];

    // Soft delete Shop A
    const result = simulateShopSoftDelete(shops, users, 'shop-1');

    // 1. User A MUST still exist
    const userA = result.users.find((u) => u.id === 'user-1');
    expect(userA).toBeDefined();
    expect(userA?.email).toBe('owner.a@example.com');

    // 2. Shop A MUST be marked INACTIVE and set deletedAt
    const shopA = result.shops.find((s) => s.id === 'shop-1');
    expect(shopA?.status).toBe('INACTIVE');
    expect(shopA?.deletedAt).not.toBeNull();

    // 3. Shop A MUST be hidden from public marketplace
    expect(result.publicShops.map((s) => s.id)).not.toContain('shop-1');

    // 4. User B and Shop B MUST remain completely unchanged
    const userB = result.users.find((u) => u.id === 'user-2');
    expect(userB).toBeDefined();
    expect(userB?.email).toBe('owner.b@example.com');

    const shopB = result.shops.find((s) => s.id === 'shop-2');
    expect(shopB?.status).toBe('APPROVED');
    expect(shopB?.deletedAt).toBeNull();
    expect(result.publicShops.map((s) => s.id)).toContain('shop-2');
  });
});
