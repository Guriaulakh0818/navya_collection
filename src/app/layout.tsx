import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';

import './globals.css';

import SiteLayout from '@/components/layout';
import { AppProvider } from '@/providers';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: {
    default: 'Navya Collection | Affordable Premium Fashion',
    template: '%s | Navya Collection',
  },
  description:
    'Navya Collection is an affordable premium fashion brand for gents and kids, built on trust, modern design, and smooth shopping experience.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
  const isRealClerkKey =
    Boolean(publishableKey) &&
    publishableKey.startsWith('pk_') &&
    !publishableKey.includes('placeholder') &&
    !publishableKey.includes('navyacollection');

  return (
    <html lang="en" className={`${dmSans.variable} font-sans`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {isRealClerkKey ? (
          <ClerkProvider publishableKey={publishableKey}>
            <AuthProvider>
              <QueryProvider>
                <ThemeProvider>
                  <AppProvider>
                    <SiteLayout>{children}</SiteLayout>
                  </AppProvider>
                </ThemeProvider>
              </QueryProvider>
            </AuthProvider>
          </ClerkProvider>
        ) : (
          <AuthProvider>
            <QueryProvider>
              <ThemeProvider>
                <AppProvider>
                  <SiteLayout>{children}</SiteLayout>
                </AppProvider>
              </ThemeProvider>
            </QueryProvider>
          </AuthProvider>
        )}
      </body>
    </html>
  );
}
