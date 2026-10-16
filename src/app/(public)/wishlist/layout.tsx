import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Wishlist | JiivaaKart',
  description: 'View and manage your saved wishlist items on JiivaaKart.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
