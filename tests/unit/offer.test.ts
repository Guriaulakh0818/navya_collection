import { describe, expect, it, vi } from 'vitest';

import { OfferService } from '@/backend/services/offer.service';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $executeRawUnsafe: vi.fn().mockResolvedValue(1),
    offer: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'test-offer-1',
          title: '30% OFF',
          description: '30% Exclusive Off',
          type: 'PERCENT_DISCOUNT',
          value: 30,
          minCartValue: 500,
          firstOrderOnly: true,
          isActive: true,
          startDate: null,
          endDate: null,
        },
      ]),
      create: vi.fn().mockImplementation(({ data }) =>
        Promise.resolve({
          id: 'test-created-id',
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
      update: vi.fn().mockImplementation(({ where, data }) =>
        Promise.resolve({
          id: where.id,
          title: 'Updated Offer',
          ...data,
        }),
      ),
      delete: vi.fn().mockResolvedValue({ id: 'deleted-id' }),
    },
    order: {
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));

describe('OfferService', () => {
  it('should list offers successfully', async () => {
    const offers = await OfferService.listOffers();
    expect(offers).toHaveLength(1);
    expect(offers[0].title).toBe('30% OFF');
  });

  it('should create an offer successfully', async () => {
    const created = await OfferService.createOffer({
      title: 'Festival 50% Off',
      type: 'PERCENT_DISCOUNT',
      value: 50,
      minCartValue: 1000,
      firstOrderOnly: false,
      isActive: true,
    });

    expect(created.id).toBe('test-created-id');
    expect(created.title).toBe('Festival 50% Off');
    expect(created.value).toBe(50);
  });

  it('should evaluate shipping offer correctly', async () => {
    const evaluation = await OfferService.evaluateShippingOffer('user-1', 600, 49);
    expect(evaluation).toBeDefined();
    expect(typeof evaluation.finalShippingCharge).toBe('number');
  });
});
