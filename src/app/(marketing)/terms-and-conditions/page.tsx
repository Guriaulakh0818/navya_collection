import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Navya Collection',
  description: 'Terms and conditions for using Navya Collection.',
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="font-heading text-4xl text-navy">Terms & Conditions</h1>
      <p className="mt-4 text-sm text-slate-600">By using our website, you agree to the following terms and conditions.</p>
    </div>
  );
}
