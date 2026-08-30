import { Prisma, PrismaClient } from '@prisma/client';

import { prisma } from '@/backend/lib/prisma';

/**
 * Concurrency-safe Parent SKU generator.
 * Uses atomic DB sequence counter (`sku_sequences`) in a transaction.
 * Generates permanent parent SKUs formatted as `NVC-000001`, `NVC-000002`, etc.
 */
export async function generateParentSku(
  txClient?: PrismaClient | Prisma.TransactionClient,
): Promise<string> {
  const client = txClient || prisma;

  let attempts = 0;
  while (attempts < 100) {
    attempts++;

    // Atomic increment in sequence table
    const seq = await client.skuSequence.upsert({
      where: { name: 'PRODUCT_SKU' },
      update: { nextVal: { increment: 1 } },
      create: { name: 'PRODUCT_SKU', nextVal: 1 },
    });

    const seqNum = seq.nextVal;
    const formattedSku = `NVC-${String(seqNum).padStart(6, '0')}`;

    // Verify database uniqueness as safety layer
    const existing = await client.product.findFirst({
      where: { sku: formattedSku },
      select: { id: true },
    });

    if (!existing) {
      return formattedSku;
    }
  }

  // Fallback random collision-free SKU if 100 consecutive numbers collided with legacy SKUs
  return `NVC-${Math.floor(100000 + Math.random() * 900000)}`;
}

/**
 * Normalizes color text into a 3-4 character uppercase SKU code.
 * Examples: "Black" -> "BLK", "Royal Blue" -> "BLU", "Red" -> "RED", "Gold" -> "GLD"
 */
export function normalizeColorCode(color?: string | null): string {
  if (!color || !color.trim()) return '';
  const clean = color
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  if (!clean) return '';

  // Standard common colors mapping
  const colorMap: Record<string, string> = {
    BLACK: 'BLK',
    WHITE: 'WHT',
    BLUE: 'BLU',
    ROYALBLUE: 'RBL',
    NAVYBLUE: 'NVY',
    RED: 'RED',
    GREEN: 'GRN',
    YELLOW: 'YEL',
    PINK: 'PNK',
    PURPLE: 'PRP',
    ORANGE: 'ORG',
    MAROON: 'MRN',
    GOLD: 'GLD',
    SILVER: 'SLV',
    BEIGE: 'BGE',
    BROWN: 'BRN',
    GREY: 'GRY',
    GRAY: 'GRY',
    NAVY: 'NVY',
    PEACH: 'PCH',
  };

  if (colorMap[clean]) {
    return colorMap[clean];
  }

  if (clean.length <= 4) return clean;

  // Extract consonants if possible
  const consonants = clean.replace(/[AEIOU]/g, '');
  if (consonants.length >= 3) {
    return consonants.substring(0, 3);
  }

  return clean.substring(0, 3);
}

/**
 * Normalizes size text into a concise uppercase SKU code.
 * Examples: "Free Size" -> "FS", "XXL" -> "2XL", "S" -> "S"
 */
export function normalizeSizeCode(size?: string | null): string {
  if (!size || !size.trim()) return '';
  const clean = size.trim().toUpperCase();

  const sizeMap: Record<string, string> = {
    'FREE SIZE': 'FS',
    'CUSTOM STITCHING': 'CST',
    'ONE SIZE': 'OS',
    XXL: '2XL',
    XXXL: '3XL',
    XXXXL: '4XL',
    SMALL: 'S',
    MEDIUM: 'M',
    LARGE: 'L',
    'EXTRA LARGE': 'XL',
  };

  if (sizeMap[clean]) {
    return sizeMap[clean];
  }

  return clean.replace(/\s+/g, '').substring(0, 4);
}

/**
 * Generates a unique, normalized Variant SKU based on Parent SKU, Color, Size, and Variant Index.
 * Example: Parent `NVC-000125`, Color `Black`, Size `S` => `NVC-000125-BLK-S`
 */
export function generateVariantSku(
  parentSku: string,
  color?: string | null,
  size?: string | null,
  index: number = 0,
): string {
  const cleanParent = parentSku.trim();
  const colorCode = normalizeColorCode(color);
  const sizeCode = normalizeSizeCode(size);

  const parts = [cleanParent];
  if (colorCode) parts.push(colorCode);
  if (sizeCode) parts.push(sizeCode);

  // If neither color nor size is provided, add variant index suffix
  if (!colorCode && !sizeCode) {
    parts.push(`V${index + 1}`);
  }

  return parts.join('-');
}

/**
 * Concurrency-safe Shop Code generator.
 * Uses atomic DB sequence counter (`sku_sequences`) with name 'SHOP_ID'.
 * Generates permanent Shop Codes formatted as `NAVYA-SHOP-000001`, `NAVYA-SHOP-000002`, etc.
 */
export async function generateShopCode(
  txClient?: PrismaClient | Prisma.TransactionClient,
): Promise<string> {
  const client = txClient || prisma;

  let attempts = 0;
  while (attempts < 100) {
    attempts++;

    // Atomic increment in sequence table
    const seq = await client.skuSequence.upsert({
      where: { name: 'SHOP_ID' },
      update: { nextVal: { increment: 1 } },
      create: { name: 'SHOP_ID', nextVal: 1 },
    });

    const seqNum = seq.nextVal;
    const formattedShopCode = `NAVYA-SHOP-${String(seqNum).padStart(6, '0')}`;

    // Verify database uniqueness
    const existing = await client.shop.findFirst({
      where: { shopCode: formattedShopCode },
      select: { id: true },
    });

    if (!existing) {
      return formattedShopCode;
    }
  }

  // Fallback random collision-free Shop Code
  return `NAVYA-SHOP-${Math.floor(100000 + Math.random() * 900000)}`;
}
