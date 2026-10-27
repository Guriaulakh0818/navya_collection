import { Metadata } from 'next';

import { FeaturedBoutiquesSection } from '@/frontend/features/marketplace/components/FeaturedBoutiquesSection';
import { FreshArrivalsSection } from '@/frontend/features/marketplace/components/FreshArrivalsSection';
import { HowNavyaWorksSection } from '@/frontend/features/marketplace/components/HowNavyaWorksSection';
import { MarketplaceHero } from '@/frontend/features/marketplace/components/MarketplaceHero';
import { SellerStorySection } from '@/frontend/features/marketplace/components/SellerStorySection';
import { ShopByBudgetSection } from '@/frontend/features/marketplace/components/ShopByBudgetSection';
import { ShopByCategorySection } from '@/frontend/features/marketplace/components/ShopByCategorySection';
import { TrendingProductsSection } from '@/frontend/features/marketplace/components/TrendingProductsSection';
import { WhyShopNavyaSection } from '@/frontend/features/marketplace/components/WhyShopNavyaSection';
import { HOMEPAGE_FAQS } from '@/frontend/features/marketplace/constants/homepage-faqs';
import { getMarketplaceHomeData } from '@/frontend/features/marketplace/services/marketplace-data';
import { generateFaqSchema, JsonLd, SEO_CONSTANTS } from '@/frontend/features/seo';

export const revalidate = 120; // Incremental Static Revalidation (ISR) every 2 minutes

export const metadata: Metadata = {
  title: SEO_CONSTANTS.DEFAULT_TITLE,
  description: SEO_CONSTANTS.DEFAULT_DESCRIPTION,
  alternates: {
    canonical: SEO_CONSTANTS.SITE_URL,
  },
  openGraph: {
    title: SEO_CONSTANTS.DEFAULT_TITLE,
    description: SEO_CONSTANTS.DEFAULT_DESCRIPTION,
    url: SEO_CONSTANTS.SITE_URL,
    siteName: SEO_CONSTANTS.SITE_NAME,
    locale: SEO_CONSTANTS.DEFAULT_LOCALE,
    type: 'website',
    images: [
      {
        url: SEO_CONSTANTS.DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: SEO_CONSTANTS.SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO_CONSTANTS.DEFAULT_TITLE,
    description: SEO_CONSTANTS.DEFAULT_DESCRIPTION,
    images: [SEO_CONSTANTS.DEFAULT_OG_IMAGE],
  },
};

export default async function MultiVendorMarketplaceHomePage() {
  let featuredShops: any[] = [];
  let trendingProducts: any[] = [];
  let newArrivals: any[] = [];

  try {
    const data = await getMarketplaceHomeData();
    featuredShops = data?.featuredShops || [];
    trendingProducts = data?.trendingProducts || [];
    newArrivals = data?.newArrivals || [];
  } catch (err) {
    console.error('❌ Failed to load marketplace home data:', err);
  }

  // Schema.org FAQPage structured data matching visible FAQ content
  const faqSchema = generateFaqSchema(HOMEPAGE_FAQS);

  const marketplaceStoreSchema = {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: SEO_CONSTANTS.SITE_NAME,
    url: SEO_CONSTANTS.SITE_URL,
    description: SEO_CONSTANTS.DEFAULT_DESCRIPTION,
    logo: SEO_CONSTANTS.ORGANIZATION.LOGO,
    image: SEO_CONSTANTS.DEFAULT_OG_IMAGE,
    currenciesAccepted: 'INR',
    paymentAccepted: 'UPI, Credit Card, Debit Card, Net Banking, Cash on Delivery',
    priceRange: '₹₹',
    areaServed: {
      '@type': 'Country',
      name: 'India',
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans">
      {/* Homepage Structured Data for Search Engines & AI Crawlers */}
      <JsonLd data={[faqSchema, marketplaceStoreSchema]} />

      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-10">
        {/* 1. PREMIUM HERO SECTION (Contains Exactly ONE H1) */}
        <MarketplaceHero />

        {/* 2. SHOP BY CATEGORY (Circular Grid with Hot Badges & Clean Canonical Links) */}
        <ShopByCategorySection />

        {/* 3. SHOP BY BUDGET (Under ₹499, ₹999, ₹1499, Premium Picks) */}
        <ShopByBudgetSection />

        {/* 4. TRENDING MARKETPLACE ITEMS (Real Database Products) */}
        <TrendingProductsSection products={trendingProducts} />

        {/* 5. FRESH ARRIVALS (Real Database New Listings) */}
        <FreshArrivalsSection products={newArrivals} />

        {/* 6. FEATURED LOCAL BOUTIQUES (With Real Approved Shops) */}
        <FeaturedBoutiquesSection shops={featuredShops} />

        {/* 7. BECOME A SELLER / LOCAL STORE STORY (Seller Value & Onboarding CTA) */}
        <SellerStorySection />

        {/* 8. HOW JIIVAAKART WORKS (4-Step Marketplace Flow) */}
        <HowNavyaWorksSection />

        {/* 9. WHY SHOP ON JIIVAAKART? (Customer Value Trust Cards) */}
        <WhyShopNavyaSection />
      </div>
    </div>
  );
}
