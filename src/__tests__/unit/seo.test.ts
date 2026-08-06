import manifest from '../../app/manifest';
import robots from '../../app/robots';
import {
  generateBreadcrumbSchema,
  generateOrganizationSchema,
  generateProductSchema,
  generateWebSiteSchema,
} from '../../frontend/features/seo/utils/schema-generators';

export async function testSeoModule() {
  console.log('--- Running SEO & Performance Unit Tests ---');

  // 1. Test Organization Schema
  const orgSchema = generateOrganizationSchema();
  if (orgSchema['@type'] !== 'Organization' || !orgSchema.name || !orgSchema.logo) {
    throw new Error(
      'generateOrganizationSchema failed to produce valid Schema.org Organization object.',
    );
  }

  // 2. Test WebSite Schema
  const siteSchema = generateWebSiteSchema();
  if (siteSchema['@type'] !== 'WebSite' || !siteSchema.potentialAction) {
    throw new Error(
      'generateWebSiteSchema failed to produce valid Schema.org SearchAction object.',
    );
  }

  // 3. Test Product Schema
  const productSchema = generateProductSchema({
    id: 'prod-101',
    name: 'Classic Royal Navy Shirt',
    description: '100% Egyptian Cotton Linen Shirt for Gents',
    price: 899,
    category: 'Gents Collection',
    inStock: true,
  });

  if (
    productSchema['@type'] !== 'Product' ||
    productSchema.offers.price !== 899 ||
    productSchema.offers.availability !== 'https://schema.org/InStock'
  ) {
    throw new Error('generateProductSchema failed to produce valid Product & Offer schema.');
  }

  // 4. Test Breadcrumb Schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Shop', url: '/shop' },
    { name: 'Gents Shirt', url: '/product/gents-shirt' },
  ]);

  if (
    breadcrumbSchema['@type'] !== 'BreadcrumbList' ||
    breadcrumbSchema.itemListElement.length !== 3
  ) {
    throw new Error('generateBreadcrumbSchema failed to produce valid BreadcrumbList schema.');
  }

  // 5. Test Robots.txt config
  const robotsConfig = robots();
  if (!robotsConfig.sitemap || !Array.isArray(robotsConfig.rules)) {
    throw new Error('robots.ts failed to return valid Robots configuration.');
  }

  // 6. Test Web Manifest config
  const manifestConfig = manifest();
  if (manifestConfig.name !== 'Navya Collection' || !manifestConfig.icons) {
    throw new Error('manifest.ts failed to return valid PWA Web Manifest configuration.');
  }

  console.log('✅ All SEO & Performance unit tests passed successfully!');
  return true;
}

testSeoModule();
