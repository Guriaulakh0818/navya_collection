import { Suspense } from 'react';
import { Metadata } from 'next';

import { Loader } from '@/components/ui/loader';
import { ShopManagementForm } from '@/frontend/features/seller/components/ShopManagementForm';

export const metadata: Metadata = {
  title: 'Shop Customization & Branding | JiivaaKart Merchant Portal',
  description:
    'Manage boutique branding, Cloudinary logo & banner uploads, unique storefront URL, shipping policies, and SEO metadata.',
};

export default function SellerShopPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center p-8 text-center">
          <Loader size="md" text="Loading Shop Management..." />
        </div>
      }
    >
      <ShopManagementForm />
    </Suspense>
  );
}
