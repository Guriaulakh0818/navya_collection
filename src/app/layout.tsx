import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';

import './globals.css';

import SiteLayout from '@/components/layout';
import { AppProvider } from '@/providers';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';

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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-background font-body text-foreground antialiased">
        <AuthProvider>
          <QueryProvider>
            <ThemeProvider>
              <AppProvider>
                <SiteLayout>{children}</SiteLayout>
              </AppProvider>
            </ThemeProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
