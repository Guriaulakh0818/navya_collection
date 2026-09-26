import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shopping Cart | Navya Collection',
  description: 'View and manage items in your Navya Collection shopping cart.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
