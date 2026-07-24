import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Navya Collection',
  description: 'Privacy policy for Navya Collection.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="font-heading text-4xl text-navy">Privacy Policy</h1>
      <p className="mt-4 text-sm text-slate-600">This privacy policy outlines how Navya Collection collects, uses, and protects your data.</p>
    </div>
  );
}
