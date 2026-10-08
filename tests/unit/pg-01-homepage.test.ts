import { beforeEach, describe, expect, it, vi } from 'vitest';

import { metadata } from '../../src/app/page';
import { prisma } from '../../src/backend/lib/prisma';
import { HOMEPAGE_FAQS } from '../../src/frontend/features/marketplace/constants/homepage-faqs';
import { getMarketplaceHomeData } from '../../src/frontend/features/marketplace/services/marketplace-data';
import {
  AEO_FACTS,
  generateFaqSchema,
  generateOrganizationSchema,
  generateWebSiteSchema,
  SEO_CONSTANTS,
} from '../../src/frontend/features/seo';

// Mock prisma for isolating data queries
vi.mock('../../src/backend/lib/prisma', () => ({
  prisma: {
    shop: {
      findMany: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/backend/services/offer.service', () => ({
  OfferService: {
    getActiveOffers: vi.fn().mockResolvedValue([]),
  },
}));

describe('PG-01 — PUBLIC HOMEPAGE FORENSIC QA AUDIT SUITE', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Business Identity & Authoritative Facts Audit', () => {
    it('verifies official business identity and legal name', () => {
      expect(SEO_CONSTANTS.ORGANIZATION.NAME).toBe('Navya Collection');
      expect(SEO_CONSTANTS.ORGANIZATION.LEGAL_NAME).toBe('Navya Collection Private Limited');
      expect(AEO_FACTS.BRAND.NAME).toBe('Navya Collection');
      expect(AEO_FACTS.BRAND.LEGAL_NAME).toBe('Navya Collection Private Limited');
    });

    it('verifies headquarters location in Fatehabad, Haryana, India', () => {
      expect(SEO_CONSTANTS.ORGANIZATION.ADDRESS.ADDRESS_LOCALITY).toBe('Fatehabad');
      expect(SEO_CONSTANTS.ORGANIZATION.ADDRESS.ADDRESS_REGION).toBe('Haryana');
      expect(SEO_CONSTANTS.ORGANIZATION.ADDRESS.POSTAL_CODE).toBe('125050');
      expect(SEO_CONSTANTS.ORGANIZATION.ADDRESS.ADDRESS_COUNTRY).toBe('IN');

      expect(AEO_FACTS.BRAND.HEADQUARTERS.CITY).toBe('Fatehabad');
      expect(AEO_FACTS.BRAND.HEADQUARTERS.STATE).toBe('Haryana');
      expect(AEO_FACTS.BRAND.HEADQUARTERS.PINCODE).toBe('125050');
    });

    it('verifies authoritative public support contact channels and site URL', () => {
      expect(SEO_CONSTANTS.ORGANIZATION.URL).toBe('https://navyacollection.store');
      expect(SEO_CONSTANTS.ORGANIZATION.EMAIL).toBe('helpdesk@navyacollection.store');
      expect(SEO_CONSTANTS.ORGANIZATION.TELEPHONE).toMatch(/\+91-?9053883125/);

      expect(AEO_FACTS.CONTACT.EMAIL).toBe('helpdesk@navyacollection.store');
      expect(AEO_FACTS.CONTACT.PHONE).toBe('+91-9053883125');
    });
  });

  describe('2. Metadata, OpenGraph & Canonical Audit', () => {
    it('verifies homepage metadata canonical points strictly to production domain', () => {
      expect(metadata.alternates?.canonical).toBe('https://navyacollection.store');
      expect(metadata.openGraph?.url).toBe('https://navyacollection.store');
    });

    it('verifies homepage title, description, and OpenGraph social metadata', () => {
      expect(metadata.title).toBe(SEO_CONSTANTS.DEFAULT_TITLE);
      expect(metadata.description).toBe(SEO_CONSTANTS.DEFAULT_DESCRIPTION);
      expect(metadata.openGraph?.siteName).toBe('Navya Collection');
      expect((metadata.twitter as any)?.card).toBe('summary_large_image');
      expect(metadata.openGraph?.images).toBeDefined();
    });
  });

  describe('3. Structured Data (JSON-LD) Forensic Audit', () => {
    it('generates pristine Organization schema matching visible corporate identity without fake ratings', () => {
      const orgSchema = generateOrganizationSchema();

      expect(orgSchema['@context']).toBe('https://schema.org');
      expect(orgSchema['@type']).toBe('Organization');
      expect(orgSchema['@id']).toBe('https://navyacollection.store#organization');
      expect(orgSchema.name).toBe('Navya Collection');
      expect(orgSchema.legalName).toBe('Navya Collection Private Limited');
      expect(orgSchema.url).toBe('https://navyacollection.store');
      expect(orgSchema.address.addressLocality).toBe('Fatehabad');
      expect(orgSchema.address.addressRegion).toBe('Haryana');
      expect(orgSchema.address.postalCode).toBe('125050');
      expect(orgSchema.address.addressCountry).toBe('IN');
      expect(orgSchema.contactPoint[0].telephone).toBe('+91-9053883125');
      expect(orgSchema.contactPoint[0].email).toBe('helpdesk@navyacollection.store');

      // Crucial: Must NEVER contain AggregateRating unless verified real reviews exist
      expect(orgSchema.aggregateRating).toBeUndefined();
    });

    it('generates pristine WebSite schema with proper SearchAction and publisher', () => {
      const siteSchema = generateWebSiteSchema();

      expect(siteSchema['@context']).toBe('https://schema.org');
      expect(siteSchema['@type']).toBe('WebSite');
      expect(siteSchema['@id']).toBe('https://navyacollection.store#website');
      expect(siteSchema.url).toBe('https://navyacollection.store');
      expect(siteSchema.publisher['@id']).toBe('https://navyacollection.store#organization');
      expect(siteSchema.potentialAction['@type']).toBe('SearchAction');
      expect(siteSchema.potentialAction.target.urlTemplate).toBe(
        'https://navyacollection.store/search?q={search_term_string}',
      );
    });

    it('generates FAQPage schema accurately reflecting visible homepage FAQs', () => {
      const faqSchema = generateFaqSchema(HOMEPAGE_FAQS);

      expect(faqSchema).not.toBeNull();
      expect(faqSchema?.['@type']).toBe('FAQPage');
      expect(faqSchema?.mainEntity.length).toBe(HOMEPAGE_FAQS.length);
      expect(faqSchema?.mainEntity[0].name).toBe('What is Navya Collection?');
      expect(faqSchema?.mainEntity[0].acceptedAnswer.text).toContain(
        'Navya Collection is a fashion marketplace',
      );
    });
  });

  describe('4. Dynamic Data & Strict Catalog/Seller Isolation Audit', () => {
    it('ensures getMarketplaceHomeData strictly filters shops for APPROVED status and deletedAt null', async () => {
      vi.mocked(prisma.shop.findMany).mockResolvedValue([
        {
          id: 'shop-1',
          name: 'Verified Boutique',
          slug: 'verified-boutique',
          logo: null,
          banner: null,
          rating: 4.8,
          reviewCount: 15,
          verificationBadge: 'VERIFIED',
          city: 'Hisar',
          state: 'Haryana',
          _count: { products: 5 },
          products: [],
        } as any,
      ]);
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      vi.mocked(prisma.category.findMany).mockResolvedValue([]);

      const data = await getMarketplaceHomeData();

      // Check shop findMany calls
      const shopCalls = vi.mocked(prisma.shop.findMany).mock.calls;
      expect(shopCalls.length).toBeGreaterThanOrEqual(1);
      for (const call of shopCalls) {
        expect(call[0]?.where).toMatchObject({
          status: 'APPROVED',
          deletedAt: null,
        });
      }

      expect(data.featuredShops.length).toBe(1);
      expect(data.featuredShops[0].name).toBe('Verified Boutique');
    });

    it('ensures getMarketplaceHomeData strictly enforces shop: { status: "APPROVED", deletedAt: null } on trendingProducts, newArrivals, and bestSellers', async () => {
      vi.mocked(prisma.shop.findMany).mockResolvedValue([]);
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      vi.mocked(prisma.category.findMany).mockResolvedValue([]);

      await getMarketplaceHomeData();

      const productCalls = vi.mocked(prisma.product.findMany).mock.calls;
      expect(productCalls.length).toBe(3); // trendingProducts, newArrivals, bestSellers

      for (const call of productCalls) {
        const whereClause = call[0]?.where;
        expect(whereClause).toMatchObject({
          status: 'active',
          deletedAt: null,
          shop: {
            status: 'APPROVED',
            deletedAt: null,
          },
        });
      }
    });

    it('handles database error gracefully without throwing, returning empty arrays', async () => {
      vi.mocked(prisma.shop.findMany).mockRejectedValue(new Error('DB Connection Timeout'));
      vi.mocked(prisma.product.findMany).mockRejectedValue(new Error('DB Query Failed'));
      vi.mocked(prisma.category.findMany).mockRejectedValue(new Error('DB Query Failed'));

      const result = await getMarketplaceHomeData();

      expect(result).toBeDefined();
      expect(result.featuredShops).toEqual([]);
      expect(result.trendingProducts).toEqual([]);
      expect(result.newArrivals).toEqual([]);
      expect(Array.isArray(result.categories)).toBe(true);
    });
  });

  describe('5. Canonical Homepage Routes & Policy URLs Audit', () => {
    it('verifies all essential canonical routes in AEO_FACTS are configured and public', () => {
      expect(AEO_FACTS.CANONICAL_ROUTES.HOME).toBe('/');
      expect(AEO_FACTS.CANONICAL_ROUTES.SHOP).toBe('/shop');
      expect(AEO_FACTS.CANONICAL_ROUTES.CATEGORIES).toBe('/category');
      expect(AEO_FACTS.CANONICAL_ROUTES.BECOME_SELLER).toBe('/become-seller');
      expect(AEO_FACTS.CANONICAL_ROUTES.ABOUT).toBe('/about');
      expect(AEO_FACTS.CANONICAL_ROUTES.FAQ).toBe('/faq');
      expect(AEO_FACTS.CANONICAL_ROUTES.CONTACT).toBe('/contact');
      expect(AEO_FACTS.CANONICAL_ROUTES.SHIPPING_POLICY).toBe('/shipping-policy');
      expect(AEO_FACTS.CANONICAL_ROUTES.RETURN_POLICY).toBe('/return-policy');
      expect(AEO_FACTS.CANONICAL_ROUTES.PRIVACY).toBe('/privacy-policy');
      expect(AEO_FACTS.CANONICAL_ROUTES.TERMS).toBe('/terms-and-conditions');
    });
  });
});
