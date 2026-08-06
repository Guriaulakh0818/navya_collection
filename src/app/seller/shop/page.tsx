import { Metadata } from 'next';

import { ShopManagementForm } from '@/frontend/features/seller/components/ShopManagementForm';

export const metadata: Metadata = {
  title: 'Shop Customization & Branding | Navya Merchant Portal',
  description:
    'Manage boutique branding, Cloudinary logo & banner uploads, unique storefront URL, shipping policies, and SEO metadata.',
};

export default function SellerShopPage() {
  return <ShopManagementForm />;
}
