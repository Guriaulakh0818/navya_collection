import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping Policy | Navya Collection',
  description: 'Shipping policy for Navya Collection orders.',
};

export default function ShippingPolicyPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="font-heading text-4xl text-navy">Shipping Policy</h1>
      <p className="mt-4 text-sm text-slate-600">
        Free shipping on orders above ₹999. Standard delivery takes 5-7 business days.
      </p>
    </div>
  );
}
