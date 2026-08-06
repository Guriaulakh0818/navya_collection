import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { getCurrentUser } from '@/backend/lib/session';
import { AdminSellerReviewClient } from '@/frontend/features/admin/components/AdminSellerReviewClient';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Seller Application Review | Navya Admin Governance',
  description:
    'Inspect merchant registration details, verify documents, and approve or reject seller onboarding applications.',
};

interface AdminSellerReviewPageProps {
  params: {
    id: string;
  };
}

export default async function AdminSellerReviewPage({ params }: AdminSellerReviewPageProps) {
  const admin = await getCurrentUser();

  if (
    !admin ||
    !['OWNER', 'ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'].includes(admin.role?.toUpperCase())
  ) {
    redirect('/admin/login');
  }

  const shopId = params.id;

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          role: true,
          approvalStatus: true,
        },
      },
      sellerProfile: true,
      addresses: true,
      documents: true,
    },
  });

  if (!shop) {
    notFound();
  }

  // Convert Decimal objects to numbers/strings for React Client Component serialization
  const serializedShop = JSON.parse(JSON.stringify(shop));

  return <AdminSellerReviewClient shopData={serializedShop} />;
}
