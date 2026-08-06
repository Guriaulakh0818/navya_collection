'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import AnnouncementBar from '@/components/layout/announcement-bar/AnnouncementBar';
import { Footer } from '@/components/layout/footer/Footer';
import { Header } from '@/components/layout/header/Header';

export default function SiteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const isSellerRoute = pathname?.startsWith('/seller');

  if (isAdminRoute || isSellerRoute) {
    return <main className="w-full max-w-full min-h-screen overflow-x-hidden">{children}</main>;
  }

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="w-full max-w-full overflow-x-hidden">{children}</main>
      <Footer />
    </>
  );
}
