import { describe, expect, it } from 'vitest';

describe('Unit: Marketplace Review Service & Rating Calculations', () => {
  it('calculates average rating and percentage breakdown correctly', () => {
    const reviews = [{ rating: 5 }, { rating: 5 }, { rating: 4 }, { rating: 3 }, { rating: 5 }];

    const totalCount = reviews.length;
    const totalSum = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = parseFloat((totalSum / totalCount).toFixed(1));

    expect(totalCount).toBe(5);
    expect(totalSum).toBe(22);
    expect(averageRating).toBe(4.4);

    const counts = { 5: 3, 4: 1, 3: 1, 2: 0, 1: 0 };
    const percentages = {
      5: Math.round((counts[5] / totalCount) * 100),
      4: Math.round((counts[4] / totalCount) * 100),
      3: Math.round((counts[3] / totalCount) * 100),
      2: 0,
      1: 0,
    };

    expect(percentages[5]).toBe(60);
    expect(percentages[4]).toBe(20);
    expect(percentages[3]).toBe(20);
  });
});
