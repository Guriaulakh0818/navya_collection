import { Metadata } from 'next';

import { BecomeSellerContent } from '@/frontend/features/seller/components/BecomeSellerContent';

export const metadata: Metadata = {
  title: 'Become a Seller | Navya Collection Multi-Vendor Marketplace',
  description:
    'Register your luxury Indian ethnic couture boutique, saree store, or artisan brand on Navya Collection. Reach millions of customers nationwide with instant payouts.',
};

export default function BecomeSellerPage() {
  return <BecomeSellerContent />;
}
