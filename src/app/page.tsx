import { ShoppingBag, Sparkles } from 'lucide-react';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { FeaturedBoutiquesSection } from '@/frontend/features/marketplace/components/FeaturedBoutiquesSection';
import { FreshArrivalsSection } from '@/frontend/features/marketplace/components/FreshArrivalsSection';
import { HomepageFaqSection } from '@/frontend/features/marketplace/components/HomepageFaqSection';
import { HowNavyaWorksSection } from '@/frontend/features/marketplace/components/HowNavyaWorksSection';
import { MarketplaceHero } from '@/frontend/features/marketplace/components/MarketplaceHero';
import { SellerStorySection } from '@/frontend/features/marketplace/components/SellerStorySection';
import { ShopByBudgetSection } from '@/frontend/features/marketplace/components/ShopByBudgetSection';
import { ShopByCategorySection } from '@/frontend/features/marketplace/components/ShopByCategorySection';
import { TrendingProductsSection } from '@/frontend/features/marketplace/components/TrendingProductsSection';
import { WhyShopNavyaSection } from '@/frontend/features/marketplace/components/WhyShopNavyaSection';
import { HOMEPAGE_FAQS } from '@/frontend/features/marketplace/constants/homepage-faqs';
import { getMarketplaceHomeData } from '@/frontend/features/marketplace/services/marketplace-data';
import { BecomeSellerContent } from '@/frontend/features/seller/components/BecomeSellerContent';
import { generateFaqSchema, JsonLd, SEO_CONSTANTS } from '@/frontend/features/seo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  let host = '';
  try {
    const headersList = await headers();
    host = (headersList.get('x-forwarded-host') || headersList.get('host') || '').toLowerCase();
  } catch {
    host = '';
  }

  // If accessed via admin.navyacollection.store or admin subdomain, redirect to admin dashboard
  if (host.startsWith('admin.') || host.includes('admin.navyacollection.store')) {
    redirect('/admin/dashboard');
  }

  // If accessed via seller.navyacollection.store or seller subdomain, render the Become Seller portal
  if (host.startsWith('seller.') || host.includes('seller.navyacollection.store')) {
    return <BecomeSellerContent />;
  }

  let featuredShops: any[] = [];
  let trendingProducts: any[] = [];
  let newArrivals: any[] = [];
  let offers: any[] = [];

  try {
    const data = await getMarketplaceHomeData();
    featuredShops = data?.featuredShops || [];
    trendingProducts = data?.trendingProducts || [];
    newArrivals = data?.newArrivals || [];
    offers = (data as any)?.offers || [];
  } catch (err) {
    console.error('❌ Failed to load marketplace home data:', err);
  }

  const primaryOffer = offers[0] || null;

  // Schema.org FAQPage structured data matching visible FAQ content
  const faqSchema = generateFaqSchema(HOMEPAGE_FAQS);

  const marketplaceStoreSchema = {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: SEO_CONSTANTS.SITE_NAME,
    url: SEO_CONSTANTS.SITE_URL,
    description: SEO_CONSTANTS.DEFAULT_DESCRIPTION,
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

        {/* 2. DYNAMIC PROMOTIONAL OFFER BANNER (If Active Offer Configured in DB) */}
        {primaryOffer && (
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-300/80 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-orange text-white flex items-center justify-center font-black shadow-xs shrink-0 text-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-navy-900 text-sm sm:text-base tracking-tight">
                    {primaryOffer.title}
                  </h3>
                  {primaryOffer.firstOrderOnly && (
                    <span className="px-2 py-0.5 bg-orange text-white text-[10px] font-black rounded-full uppercase tracking-wider">
                      First Order Only
                    </span>
                  )}
                  {primaryOffer.type === 'FREE_DELIVERY' && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black rounded-full uppercase tracking-wider">
                      Free Delivery
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  {primaryOffer.description ||
                    (primaryOffer.minCartValue
                      ? `Valid on minimum cart value of ₹${Number(primaryOffer.minCartValue).toLocaleString('en-IN')}. Applies automatically at checkout!`
                      : 'Limited time promotion across all partner stores.')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/shop"
                className="px-5 py-2.5 bg-orange hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Explore Catalog & Claim Offer →</span>
              </Link>
            </div>
          </div>
        )}

        {/* 3. SHOP BY CATEGORY (Circular Grid with Hot Badges & Clean Canonical Links) */}
        <ShopByCategorySection />

        {/* 4. FEATURED LOCAL BOUTIQUES (With Real Approved Shops) */}
        <FeaturedBoutiquesSection shops={featuredShops} />

        {/* 5. TRENDING MARKETPLACE ITEMS (Real Database Products) */}
        <TrendingProductsSection products={trendingProducts} />

        {/* 6. FRESH ARRIVALS (Real Database New Listings) */}
        <FreshArrivalsSection products={newArrivals} />

        {/* 7. SHOP BY BUDGET (Under ₹499, ₹999, ₹1499, Premium Picks) */}
        <ShopByBudgetSection />

        {/* 8. HOW NAVYA WORKS (4-Step Marketplace Flow) */}
        <HowNavyaWorksSection />

        {/* 9. WHY SHOP ON NAVYA? (Customer Value Trust Cards) */}
        <WhyShopNavyaSection />

        {/* 10. BECOME A SELLER / LOCAL STORE STORY (Seller Value & Onboarding CTA) */}
        <SellerStorySection />

        {/* 11. FREQUENTLY ASKED QUESTIONS (AEO Core Q&A Section) */}
        <HomepageFaqSection />
      </div>
    </div>
  );
}
