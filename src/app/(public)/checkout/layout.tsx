import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Secure Checkout | Navya Collection',
  description: 'Complete your order securely on Navya Collection.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
