import { Metadata } from 'next';

import { SellerInventoryManager } from '@/frontend/features/seller/components/SellerInventoryManager';

export const metadata: Metadata = {
  title: 'Inventory & Stock Management | JiivaaKart Merchant Portal',
  description:
    'Manage product stock levels, quick increment/decrement, 1-click archiving, and inventory alerts.',
};

export default function SellerInventoryPage() {
  return <SellerInventoryManager />;
}
