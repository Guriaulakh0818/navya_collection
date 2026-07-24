import { Card } from '@/components/ui/card';

const traits = ['Friendly', 'Trustworthy', 'Modern', 'Reliable'];
const emotions = ['Trust', 'Comfort', 'Confidence', 'Freshness', 'Happiness', 'Simplicity'];

export function BrandArchetypeShowcase() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Brand Archetype</p>
        <h1 className="mt-3 font-heading text-5xl text-navy">Everyman + Creator</h1>
        <p className="mt-4 max-w-4xl text-base text-slate-600">
          Navya Collection should feel like a welcoming, trustworthy, family-first fashion brand that is modern, reliable, and honest in value.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-heading text-4xl text-navy">Primary Archetype</h2>
          <p className="mt-3 text-sm text-slate-700">
            Everyman — built for everyday Indian families and designed to feel familiar, safe, and dependable.
          </p>
        </Card>

        <Card>
          <h2 className="font-heading text-4xl text-navy">Secondary Archetype</h2>
          <p className="mt-3 text-sm text-slate-700">
            Creator — fresh collections, modern thinking, and continuous improvement in the shopping experience.
          </p>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-heading text-4xl text-navy">Brand Personality</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {traits.map((trait) => (
              <span key={trait} className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-navy">
                {trait}
              </span>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-heading text-4xl text-navy">Brand Emotions</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {emotions.map((emotion) => (
              <span key={emotion} className="rounded-full bg-orange/10 px-3 py-1 text-xs font-bold text-orange">
                {emotion}
              </span>
            ))}
          </div>
        </Card>
      </section>

      <section>
        <Card>
          <h2 className="font-heading text-4xl text-navy">Brand Promise</h2>
          <p className="mt-3 text-base text-slate-700">Modern fashion with honest value for every family.</p>
        </Card>
      </section>
    </main>
  );
}
