'use client';

import { Suspense, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import { Footer } from '@/components/layout/footer/Footer';
import { Header } from '@/components/layout/header/Header';
import { RefereePromoRibbon } from '@/features/referral/components/RefereePromoRibbon';
import { RefereeWelcomeModal } from '@/features/referral/components/RefereeWelcomeModal';
import { ReferralWelcomeModal } from '@/features/referral/components/ReferralWelcomeModal';

export default function SiteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const isSellerRoute = pathname?.startsWith('/seller');

  if (isAdminRoute || isSellerRoute) {
    return <main className="w-full max-w-full min-h-screen overflow-x-hidden">{children}</main>;
  }

  return (
    <>
      <Suspense fallback={null}>
        <RefereePromoRibbon />
      </Suspense>
      <Header />
      <main className="w-full max-w-full overflow-x-hidden">{children}</main>
      <Footer />
      <Suspense fallback={null}>
        <ReferralWelcomeModal />
        <RefereeWelcomeModal />
      </Suspense>
    </>
  );
}
