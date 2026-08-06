import { Metadata } from 'next';

import { SellerProductList } from '@/frontend/features/seller/components/SellerProductList';

export const metadata: Metadata = {
  title: 'Seller Product Catalog Management | Navya Merchant Portal',
  description:
    'Manage boutique products, inventory stock levels, publication statuses, bulk delete, and variant pricing.',
};

export default function SellerProductsPage() {
  return <SellerProductList />;
}
