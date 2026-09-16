import { Metadata } from 'next';

import { BecomeSellerContent } from '@/frontend/features/seller/components/BecomeSellerContent';
import { generateBreadcrumbSchema, JsonLd, SEO_CONSTANTS } from '@/frontend/features/seo';

export const metadata: Metadata = {
  title: `Become a Seller | ${SEO_CONSTANTS.SITE_NAME}`,
  description:
    'Join Navya Collection as a boutique partner or fashion creator. Showcase your clothing products to customers across India with integrated order and shipping management.',
  alternates: {
    canonical: `${SEO_CONSTANTS.SITE_URL}/become-seller`,
  },
  openGraph: {
    title: `Become a Seller | ${SEO_CONSTANTS.SITE_NAME}`,
    description:
      'Join Navya Collection as a boutique partner or fashion creator. Showcase your clothing products to customers across India with integrated order and shipping management.',
    url: `${SEO_CONSTANTS.SITE_URL}/become-seller`,
    siteName: SEO_CONSTANTS.SITE_NAME,
    locale: SEO_CONSTANTS.DEFAULT_LOCALE,
    type: 'website',
  },
};

export default function BecomeSellerPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: SEO_CONSTANTS.SITE_URL },
    { name: 'Become a Seller', url: `${SEO_CONSTANTS.SITE_URL}/become-seller` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <BecomeSellerContent />
    </>
  );
}
