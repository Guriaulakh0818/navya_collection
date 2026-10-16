import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shopping Cart | JiivaaKart',
  description: 'View and manage items in your JiivaaKart shopping cart.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
