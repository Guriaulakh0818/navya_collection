import { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { DM_Sans } from 'next/font/google';

import './globals.css';

import SiteLayout from '@/components/layout';
import { NavigationProgressBar } from '@/components/ui/NavigationProgressBar';
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  GoogleAnalytics,
  JsonLd,
  SEO_CONSTANTS,
} from '@/features/seo';
import { AppProvider } from '@/providers';
import { AuthProvider } from '@/providers/auth-provider';
import { CartSyncProvider } from '@/providers/cart-sync-provider';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
  preload: true,
});

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#183A73' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(SEO_CONSTANTS.SITE_URL),
  title: {
    default: SEO_CONSTANTS.DEFAULT_TITLE,
    template: SEO_CONSTANTS.TITLE_TEMPLATE,
  },
  description: SEO_CONSTANTS.DEFAULT_DESCRIPTION,
  keywords: SEO_CONSTANTS.DEFAULT_KEYWORDS,
  authors: [{ name: 'JiivaaKart', url: SEO_CONSTANTS.SITE_URL }],
  creator: 'JiivaaKart',
  publisher: 'JiivaaKart',
  applicationName: 'JiivaaKart',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SEO_CONSTANTS.SITE_URL,
    siteName: SEO_CONSTANTS.SITE_NAME,
    title: SEO_CONSTANTS.DEFAULT_TITLE,
    description: SEO_CONSTANTS.DEFAULT_DESCRIPTION,
    images: [
      {
        url: SEO_CONSTANTS.DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: SEO_CONSTANTS.SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO_CONSTANTS.DEFAULT_TITLE,
    description: SEO_CONSTANTS.DEFAULT_DESCRIPTION,
    images: [SEO_CONSTANTS.DEFAULT_OG_IMAGE],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgSchema = generateOrganizationSchema();
  const siteSchema = generateWebSiteSchema();

  return (
    <html
      lang="en"
      className={`${dmSans.variable} font-sans overflow-x-hidden max-w-full`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="144x144" href="/favicon-144x144.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <JsonLd data={[orgSchema, siteSchema]} />
      </head>
      <body
        className="min-h-screen bg-background font-sans text-foreground antialiased overflow-x-hidden max-w-full"
        suppressHydrationWarning
      >
        <Suspense fallback={null}>
          <NavigationProgressBar />
        </Suspense>
        <GoogleAnalytics
          gaMeasurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-Z60T8WT006'}
        />
        <AuthProvider>
          <QueryProvider>
            <ThemeProvider>
              <CartSyncProvider>
                <AppProvider>
                  <SiteLayout>{children}</SiteLayout>
                </AppProvider>
              </CartSyncProvider>
            </ThemeProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
