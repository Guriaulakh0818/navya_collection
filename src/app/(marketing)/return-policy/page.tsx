import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Return Policy | Navya Collection',
  description: 'Return policy for Navya Collection products.',
};

export default function ReturnPolicyPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="font-heading text-4xl text-navy">Return Policy</h1>
      <p className="mt-4 text-sm text-slate-600">
        Easy 7-day returns on all eligible products. Products must be unused and in original
        packaging.
      </p>
    </div>
  );
}
