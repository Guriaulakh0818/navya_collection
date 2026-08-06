import { describe, expect, it } from 'vitest';

import { generateSlug } from '../../src/shared/utils/slug';

describe('Slug Generator Utility', () => {
  it('converts title strings to lowercase hyphenated URL slugs', () => {
    expect(generateSlug('Pure Chanderi Silk Saree')).toBe('pure-chanderi-silk-saree');
  });

  it('removes special characters and symbols', () => {
    expect(generateSlug('Silk Saree & Dupatta Set! @2026')).toBe('silk-saree-dupatta-set-2026');
  });

  it('handles multiple consecutive spaces and leading/trailing dashes', () => {
    expect(generateSlug('   Anarkali   Suit   ')).toBe('anarkali-suit');
  });
});
