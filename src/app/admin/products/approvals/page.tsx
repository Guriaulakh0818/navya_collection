import { Metadata } from 'next';

import { AdminProductApprovalTable } from '@/frontend/features/admin/components/AdminProductApprovalTable';

export const metadata: Metadata = {
  title: 'Seller Product Approvals Queue | Navya Admin Portal',
  description:
    'Moderate seller submitted products, inspect Cloudinary gallery images, prices, variants, and approve or reject submissions.',
};

export default function AdminProductApprovalsPage() {
  return <AdminProductApprovalTable />;
}
