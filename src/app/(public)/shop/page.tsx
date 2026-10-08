import { Suspense } from 'react';
import type { Metadata } from 'next';

import { generateBreadcrumbSchema, JsonLd, SEO_CONSTANTS } from '@/features/seo';
import { MarketplaceCatalogContent } from '@/frontend/features/shop/components/MarketplaceCatalogContent';

export const metadata: Metadata = {
  metadataBase: new URL(SEO_CONSTANTS.SITE_URL),
  title: {
    absolute: 'Explore Boutique Shops & Designers | Navya Collection',
  },
  description:
    'Discover verified boutique partner stores across India on Navya Collection. Shop authentic designer fashion, luxury ethnic wear, and handcrafted garments.',
  keywords: [
    'boutique shops India',
    'verified fashion designers',
    'Indian ethnic wear boutiques',
    'artisan clothing stores',
    'Navya Collection partner shops',
  ],
  alternates: {
    canonical: `${SEO_CONSTANTS.SITE_URL}/shop`,
  },
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
  openGraph: {
    type: 'website',
    url: `${SEO_CONSTANTS.SITE_URL}/shop`,
    siteName: SEO_CONSTANTS.SITE_NAME,
    locale: 'en_IN',
    title: 'Explore Boutique Shops & Designers | Navya Collection',
    description:
      'Discover verified boutique partner stores across India on Navya Collection. Shop authentic designer fashion, luxury ethnic wear, and handcrafted garments.',
    images: [
      {
        url: SEO_CONSTANTS.DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Boutique Shops - Navya Collection',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Explore Boutique Shops & Designers | Navya Collection',
    description:
      'Discover verified boutique partner stores across India on Navya Collection. Shop authentic designer fashion, luxury ethnic wear, and handcrafted garments.',
    images: [SEO_CONSTANTS.DEFAULT_OG_IMAGE],
  },
};

export default function MarketplaceShopsCatalogPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Marketplace Shops', url: '/shop' },
  ]);

  return (
    <>
      <JsonLd data={[breadcrumbSchema]} />
      <Suspense
        fallback={
          <div className="min-h-screen bg-slate-50 p-12 text-center text-slate-500 font-bold text-xs">
            Loading Marketplace Stores...
          </div>
        }
      >
        <MarketplaceCatalogContent />
      </Suspense>
    </>
  );
}
