import { Metadata } from 'next';

import { SellerProductForm } from '@/frontend/features/seller/components/SellerProductForm';

export const metadata: Metadata = {
  title: 'Add New Boutique Product | Navya Merchant Portal',
  description:
    'Create a new product listing with Cloudinary images, Size/Color variants matrix, stock inventory, and SEO metadata.',
};

export default function NewSellerProductPage() {
  return <SellerProductForm />;
}
