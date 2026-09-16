import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Wishlist | Navya Collection',
  description: 'View and manage your saved wishlist items on Navya Collection.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
