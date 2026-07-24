import type { Metadata } from 'next';
import { Playfair_Display, Poppins } from 'next/font/google';

import './globals.css';

import SiteLayout from '@/components/layout';
import { AppProvider } from '@/providers';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-heading',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Navya Collection | Affordable Premium Fashion',
  description:
    'Navya Collection is an affordable premium fashion brand for gents and kids, built on trust, modern design, and smooth shopping experience.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${poppins.variable}`}>
      <body className="min-h-screen bg-background font-body text-foreground antialiased">
        <AppProvider>
          <SiteLayout>{children}</SiteLayout>
        </AppProvider>
      </body>
    </html>
  );
}
