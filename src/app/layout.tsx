import type { Metadata, Viewport } from 'next';
import { DM_Sans } from 'next/font/google';

import './globals.css';

import SiteLayout from '@/components/layout';
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
  themeColor: SEO_CONSTANTS.THEME_COLOR,
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
  authors: [{ name: 'Navya Collection', url: SEO_CONSTANTS.SITE_URL }],
  creator: 'Navya Collection',
  publisher: 'Navya Collection',
  applicationName: 'Navya Collection',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
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
    site: SEO_CONSTANTS.TWITTER_HANDLE,
    creator: SEO_CONSTANTS.TWITTER_HANDLE,
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
        <GoogleAnalytics />
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
