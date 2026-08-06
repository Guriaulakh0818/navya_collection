import { describe, expect, it } from 'vitest';

import { formatPrice } from '../../src/shared/utils/format-price';

describe('Format Price Utility', () => {
  it('formats numeric amounts as Indian Rupee (INR)', () => {
    const formatted = formatPrice(3499);
    expect(formatted).toMatch(/₹\s?3,499/);
  });

  it('formats zero correctly', () => {
    const formatted = formatPrice(0);
    expect(formatted).toMatch(/₹\s?0/);
  });

  it('formats large values with Indian comma separator style', () => {
    const formatted = formatPrice(125000);
    expect(formatted).toMatch(/₹\s?1,25,000/);
  });
});
