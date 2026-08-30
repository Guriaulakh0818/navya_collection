import { describe, expect, it } from 'vitest';

import {
  generateVariantSku,
  normalizeColorCode,
  normalizeSizeCode,
} from '../../src/backend/lib/sku-generator';

describe('SKU Generator Utility', () => {
  it('normalizes color codes into 3-character uppercase codes', () => {
    expect(normalizeColorCode('Black')).toBe('BLK');
    expect(normalizeColorCode('Royal Blue')).toBe('RBL');
    expect(normalizeColorCode('Red')).toBe('RED');
    expect(normalizeColorCode('Gold')).toBe('GLD');
  });

  it('normalizes size codes into concise uppercase codes', () => {
    expect(normalizeSizeCode('Free Size')).toBe('FS');
    expect(normalizeSizeCode('S')).toBe('S');
    expect(normalizeSizeCode('XXL')).toBe('2XL');
    expect(normalizeSizeCode('Extra Large')).toBe('XL');
  });

  it('generates variant SKUs with parent SKU prefix', () => {
    expect(generateVariantSku('NVC-000125', 'Black', 'S')).toBe('NVC-000125-BLK-S');
    expect(generateVariantSku('NVC-000125', 'Royal Blue', 'M')).toBe('NVC-000125-RBL-M');
    expect(generateVariantSku('NVC-000125', '', '', 0)).toBe('NVC-000125-V1');
  });
});
