import {
  ensureUniqueSlug,
  generateProductCanonicalUrl,
  generateProductJsonLdSchemas,
  generateProductMetadata,
  generateProductMetaDescription,
  generateProductMetaKeywords,
  generateProductMetaTitle,
  generateSeoSlug,
} from '../../frontend/features/seo';

export async function testProductSeoEngine() {
  console.log('--- Running Product SEO Engine Unit Tests ---');

  // 1. Slug Generator Rules
  const rawTitle = 'Black Premium Cotton Shirt (For Men) #2026!';
  const slug = generateSeoSlug(rawTitle);
  if (slug !== 'black-premium-cotton-shirt-for-men-2026') {
    throw new Error(
      `generateSeoSlug failed. Expected 'black-premium-cotton-shirt-for-men-2026', got '${slug}'`,
    );
  }

  const uniqueSlug = ensureUniqueSlug('black-shirt', ['black-shirt']);
  if (uniqueSlug !== 'black-shirt-1') {
    throw new Error(`ensureUniqueSlug failed. Expected 'black-shirt-1', got '${uniqueSlug}'`);
  }

  // 2. Dynamic Meta Title Formula
  const productSample = {
    id: 'prod-001',
    name: 'Black Premium Cotton Shirt',
    slug: 'black-premium-cotton-shirt',
    sku: 'NC-BLK-001',
    description: 'Soft 100% Egyptian cotton slim fit casual shirt for men.',
    price: 999,
    brand: 'Navya Collection',
    category: {
      id: 'cat-1',
      name: 'Men',
      slug: 'men',
    },
    gender: 'men',
    color: 'black',
    fabric: 'cotton',
    fit: 'slim',
    occasion: 'casual',
    stock: 15,
  };

  const generatedTitle = generateProductMetaTitle(productSample);
  if (
    !generatedTitle.includes('Black Premium Cotton Shirt') ||
    !generatedTitle.includes('Navya Collection')
  ) {
    throw new Error(`generateProductMetaTitle failed formula check: '${generatedTitle}'`);
  }

  // Database Override Title
  const customProductTitle = generateProductMetaTitle({
    ...productSample,
    metaTitle: 'Custom SEO Title for Black Shirt | Navya',
  });
  if (customProductTitle !== 'Custom SEO Title for Black Shirt | Navya') {
    throw new Error(
      `metaTitle override failed in generateProductMetaTitle: '${customProductTitle}'`,
    );
  }

  // 3. Dynamic Meta Description Formula
  const generatedDesc = generateProductMetaDescription(productSample);
  if (
    !generatedDesc.includes('Buy Black Premium Cotton Shirt from Navya Collection') ||
    !generatedDesc.includes('100% genuine products')
  ) {
    throw new Error(`generateProductMetaDescription failed formula check: '${generatedDesc}'`);
  }
  if (generatedDesc.length > 165) {
    throw new Error(
      `generateProductMetaDescription exceeded character limit: ${generatedDesc.length}`,
    );
  }

  // Database Override Description
  const customDesc = generateProductMetaDescription({
    ...productSample,
    metaDescription: 'Custom meta description written specifically for Google indexing.',
  });
  if (customDesc !== 'Custom meta description written specifically for Google indexing.') {
    throw new Error(`metaDescription override failed: '${customDesc}'`);
  }

  // 4. Dynamic Meta Keywords Generator
  const keywords = generateProductMetaKeywords(productSample);
  if (!keywords.includes('black shirt') && !keywords.includes('black clothing')) {
    throw new Error(`generateProductMetaKeywords failed to extract color/fabric keywords.`);
  }

  // 5. Canonical URL Generator
  const canonical = generateProductCanonicalUrl(productSample);
  if (canonical !== 'https://navyacollection.in/product/black-premium-cotton-shirt') {
    throw new Error(`generateProductCanonicalUrl failed: '${canonical}'`);
  }

  // 6. Next.js 15 Metadata API
  const metadata = generateProductMetadata(productSample);
  if (
    !metadata.title ||
    !metadata.description ||
    metadata.alternates?.canonical !==
      'https://navyacollection.in/product/black-premium-cotton-shirt' ||
    (metadata.openGraph as any)?.type !== 'article'
  ) {
    throw new Error('generateProductMetadata failed Next.js 15 metadata structure check.');
  }

  // 7. Schema.org JSON-LD (Product, Offer, ImageObject, AggregateRating condition)
  // 7a. WITH REVIEWS -> AggregateRating MUST be present
  const schemasWithReviews = generateProductJsonLdSchemas({
    ...productSample,
    rating: 4.9,
    reviewCount: 28,
  });

  const productSchemaWithReviews = schemasWithReviews.find((s) => s['@type'] === 'Product') as any;
  if (!productSchemaWithReviews || !productSchemaWithReviews.aggregateRating) {
    throw new Error(
      'Product JSON-LD schema failed to include AggregateRating when reviewCount > 0',
    );
  }
  if (
    productSchemaWithReviews.aggregateRating.ratingValue !== 4.9 ||
    productSchemaWithReviews.aggregateRating.reviewCount !== 28
  ) {
    throw new Error('AggregateRating values do not match input rating and reviewCount.');
  }

  // 7b. WITHOUT REVIEWS -> AggregateRating MUST NOT be present
  const schemasNoReviews = generateProductJsonLdSchemas({
    ...productSample,
    rating: 0,
    reviewCount: 0,
  });

  const productSchemaNoReviews = schemasNoReviews.find((s) => s['@type'] === 'Product') as any;
  if (!productSchemaNoReviews) {
    throw new Error('Product JSON-LD schema generation failed.');
  }
  if (productSchemaNoReviews.aggregateRating !== undefined) {
    throw new Error(
      'Product JSON-LD schema MUST NOT include AggregateRating when reviewCount is 0!',
    );
  }

  // Check Offer details
  if (
    productSchemaNoReviews.offers['@type'] !== 'Offer' ||
    productSchemaNoReviews.offers.price !== 999 ||
    productSchemaNoReviews.offers.priceCurrency !== 'INR' ||
    productSchemaNoReviews.offers.availability !== 'https://schema.org/InStock'
  ) {
    throw new Error('Offer schema invalid in Product JSON-LD output.');
  }

  // Check BreadcrumbList structure
  const breadcrumbSchema = schemasWithReviews.find((s) => s['@type'] === 'BreadcrumbList') as any;
  if (!breadcrumbSchema || !Array.isArray(breadcrumbSchema.itemListElement)) {
    throw new Error('BreadcrumbList schema invalid in Product JSON-LD output.');
  }

  console.log('✅ All Product SEO Engine unit tests passed successfully!');
  return true;
}

testProductSeoEngine();
