/**
 * JiivaaKart Centralized Brand Assets Configuration
 * Legal Entity: JiivaaKart Private Limited
 * Brand: JiivaaKart
 * Tagline: Style That Speaks
 */

export const BRAND_ASSETS = {
  /**
   * Primary horizontal logo with shopping bag icon framing the "K" (without tagline)
   * Recommended for: Desktop/mobile main header, navigation bar
   */
  logoHorizontal: '/logos/jiivaakart-horizontal.png',

  /**
   * Compact JK monogram / shopping bag emblem
   * Recommended for: Mobile navigation icon, avatar badges, circular emblems, product placeholders
   */
  monogram: '/logos/jiivaakart-icon.png',

  /**
   * Full primary logo with "Style That Speaks" tagline
   * Recommended for: Footer, About page hero, marketing featurettes, invoice headers
   */
  logoWithTagline: '/logos/jiivaakart-primary.png',

  /**
   * Pure typographic wordmark ("JiivaaKart" in navy and orange)
   * Recommended for: Clean inline wordmarks and textual locks
   */
  wordmark: '/logos/jiivaakart-wordmark.png',

  /**
   * High-contrast packaging / courier version
   * Recommended for: Shipping labels, courier packaging, dispatch slips
   */
  packaging: '/logos/jiivaakart-packaging.png',

  /**
   * Browser favicon & application icon
   */
  favicon: '/logos/jiivaakart-favicon.png',
  appIcon: '/logos/jiivaakart-app-logo.png',
} as const;

export type BrandAssetKey = keyof typeof BRAND_ASSETS;

export const BRAND_IDENTITY = {
  companyName: 'JiivaaKart Private Limited',
  brandName: 'JiivaaKart',
  tagline: 'Style That Speaks',
  colors: {
    navy: '#0A2342',
    navyDark: '#051329',
    orange: '#F28C28',
    white: '#FFFFFF',
  },
} as const;
