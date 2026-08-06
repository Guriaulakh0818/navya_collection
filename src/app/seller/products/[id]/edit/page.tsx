import { Metadata } from 'next';

import { SellerProductForm } from '@/frontend/features/seller/components/SellerProductForm';

export const metadata: Metadata = {
  title: 'Edit Product Listing | Navya Merchant Portal',
  description:
    'Edit product details, variants matrix, inventory stock levels, images, and SEO metadata.',
};

export default async function EditSellerProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SellerProductForm productId={id} />;
}
