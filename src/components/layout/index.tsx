import type { ReactNode } from 'react';

import AnnouncementBar from '@/components/layout/announcement-bar/AnnouncementBar';
import { Footer } from '@/components/layout/footer/Footer';
import { Header } from '@/components/layout/header/Header';

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
