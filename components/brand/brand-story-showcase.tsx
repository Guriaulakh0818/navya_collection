import { Card } from '@/components/ui/card';

const promises = [
  'Affordable Fashion',
  'Trusted Quality',
  'Honest Pricing',
  'Modern Collections',
  'Customer First',
  'Premium Shopping Experience',
];

const keywords = [
  'New Beginning',
  'Modern',
  'Family',
  'Trust',
  'Affordable',
  'Premium',
  'Confidence',
  'Simplicity',
  'Growth',
  'India',
];

export function BrandStoryShowcase() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Brand Story</p>
        <h1 className="mt-3 font-heading text-5xl text-navy">Every new beginning starts with Navya.</h1>
        <p className="mt-4 max-w-4xl text-base text-slate-600">
          Navya Collection was born in 2026 with a simple vision—to make fashion more accessible, trustworthy, and affordable for every family. This story is the emotional foundation for the website, campaigns, and future product storytelling.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-heading text-4xl text-navy">Brand Promise</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            {promises.map((item) => (
              <li key={item} className="rounded-xl bg-slate-50 px-3 py-2">{item}</li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="font-heading text-4xl text-navy">Brand Meaning</h2>
          <p className="mt-3 text-sm text-slate-700">
            <strong>Navya</strong> = New • Fresh • Modern
          </p>
          <p className="mt-2 text-sm text-slate-600">
            The brand represents new beginnings, continuous growth, and a modern approach to fashion.
          </p>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-1">
        <Card>
          <h2 className="font-heading text-4xl text-navy">Brand Identity Keywords</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <span key={keyword} className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-navy">
                {keyword}
              </span>
            ))}
          </div>
        </Card>
      </section>
    </main>
  );
}
