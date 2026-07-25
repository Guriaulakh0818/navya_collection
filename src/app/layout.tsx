import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';

import './globals.css';

import SiteLayout from '@/components/layout';
import { AppProvider } from '@/providers';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-heading',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: {
    default: 'Navya Collection | Affordable Premium Fashion',
    template: '%s | Navya Collection',
  },
  description:
    'Navya Collection is an affordable premium fashion brand for gents and kids, built on trust, modern design, and smooth shopping experience.',
  keywords: [
    'fashion',
    'mens clothing',
    'kids clothing',
    'navya collection',
    'premium fashion',
    'affordable fashion',
    'online shopping',
    'india',
  ],
  authors: [{ name: 'Navya Collection', url: 'https://navyacollection.in' }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://navyacollection.in',
    siteName: 'Navya Collection',
    title: 'Navya Collection | Affordable Premium Fashion',
    description: 'Affordable premium fashion brand for gents and kids.',
    images: [
      {
        url: '/images/og.jpg',
        width: 1200,
        height: 630,
        alt: 'Navya Collection',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Navya Collection | Affordable Premium Fashion',
    description: 'Affordable premium fashion brand for gents and kids.',
    images: ['/images/og.jpg'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  metadataBase: new URL('https://navyacollection.in'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-background font-body text-foreground antialiased">
        <AppProvider>
          <SiteLayout>{children}</SiteLayout>
        </AppProvider>
      </body>
    </html>
  );
}
