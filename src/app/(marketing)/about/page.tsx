import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | Navya Collection',
  description: 'Learn about Navya Collection — our brand story, mission, and values.',
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Our Story</p>
        <h1 className="mt-3 font-heading text-4xl text-navy">
          Built on trust, style, and family-first values.
        </h1>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white p-6 shadow-premium">
          <h2 className="font-heading text-2xl text-navy">Mission</h2>
          <p className="mt-3 text-sm text-slate-600">
            Navya Collection makes premium, trustworthy fashion accessible to every Indian family.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-6 shadow-premium">
          <h2 className="font-heading text-2xl text-navy">Vision</h2>
          <p className="mt-3 text-sm text-slate-600">
            To become India&apos;s most trusted online fashion destination for gents and kids.
          </p>
        </div>
      </div>
    </div>
  );
}
