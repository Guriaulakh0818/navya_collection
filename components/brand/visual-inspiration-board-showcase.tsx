import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const inspirationPrinciples = [
  'Never copy logo, typography, icons, layout, colors, or marketing.',
  'Study design philosophy only.',
  'Build a unique identity through consistency and trust.',
];

const brandStudies = [
  {
    brand: 'Apple',
    inspiration: ['Simplicity', 'Large white space', 'Premium feel', 'Consistency'],
    takeaway: 'Less is more.',
  },
  {
    brand: 'Nike',
    inspiration: ['Strong symbol', 'Emotional branding', 'Clean identity'],
    takeaway: 'A brand should be recognizable even without its name.',
  },
  {
    brand: 'Adidas',
    inspiration: ['Timeless logo', 'Consistent branding', 'Clean product presentation'],
    takeaway: 'The symbol should work everywhere.',
  },
  {
    brand: 'Zara',
    inspiration: ['Premium fashion photography', 'Luxury layout', 'Minimal homepage'],
    takeaway: 'Let the products speak.',
  },
  {
    brand: 'Uniqlo',
    inspiration: ['Easy navigation', 'Organized categories', 'Family shopping experience'],
    takeaway: 'Simple shopping sells more.',
  },
  {
    brand: 'Muji',
    inspiration: ['Calm design', 'Honest branding', 'Functional UI'],
    takeaway: 'Don’t decorate unnecessarily.',
  },
  {
    brand: 'Amazon',
    inspiration: ['Customer trust', 'Easy checkout', 'Excellent search'],
    takeaway: 'Convenience wins.',
  },
];

const styleRules = [
  'Premium but affordable',
  'Modern but familiar',
  'Minimal but warm',
  'Fashion-focused but easy to use',
];

const uiTraits = [
  'Rounded buttons',
  'Soft shadows',
  'Rounded corners',
  'Minimal borders',
  'Subtle, fast, professional animations',
];

const keywords = ['Modern', 'Premium', 'Minimal', 'Trustworthy', 'Elegant', 'Simple', 'Confident', 'Clean'];

export function VisualInspirationBoardShowcase() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Visual Inspiration Board</p>
        <h1 className="mt-3 font-heading text-5xl text-navy">Navya Collection • VIB</h1>
        <p className="mt-4 max-w-4xl text-base text-slate-600">
          We study legendary brand philosophy, but we never copy any brand’s logo, typography, layout, colors, or marketing. The goal is a unique visual identity built on trust, clarity, and premium confidence.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {inspirationPrinciples.map((item) => (
          <Card key={item}>
            <p className="text-sm text-slate-700">{item}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-heading text-4xl text-navy">Desired Feel</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {styleRules.map((item) => (
              <Badge key={item} variant="accent">{item}</Badge>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-heading text-4xl text-navy">Customer Experience Goal</h2>
          <p className="mt-4 text-sm text-slate-700">
            “I found exactly what I wanted.”
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Not “This website looks complicated.”
          </p>
        </Card>
      </section>

      <section>
        <h2 className="font-heading text-4xl text-navy">Brand Analysis</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {brandStudies.map((study) => (
            <Card key={study.brand}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">{study.brand}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {study.inspiration.map((item) => (
                  <Badge key={item}>{item}</Badge>
                ))}
              </div>
              <p className="mt-4 text-sm text-slate-700">What we learn: {study.takeaway}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-heading text-4xl text-navy">Homepage Direction</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            <li>Large hero banner</li>
            <li>Clean navigation</li>
            <li>Big product images</li>
            <li>Simple sections</li>
            <li>Easy product discovery</li>
            <li>Fast shopping journey</li>
          </ul>
        </Card>

        <Card>
          <h2 className="font-heading text-4xl text-navy">Product Card Direction</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            <li>Product image</li>
            <li>Product name</li>
            <li>Price</li>
            <li>Discount</li>
            <li>Rating</li>
            <li>Wishlist</li>
          </ul>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-heading text-4xl text-navy">Photography and Packaging</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            <li>Bright, clean, consistent high-resolution photography</li>
            <li>Natural colors and neutral backgrounds</li>
            <li>White poly mailers, navy branding, orange accent, minimal printing</li>
          </ul>
        </Card>

        <Card>
          <h2 className="font-heading text-4xl text-navy">Social and UI</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {uiTraits.map((item) => (
              <Badge key={item} variant="success">{item}</Badge>
            ))}
          </div>
        </Card>
      </section>

      <section>
        <Card>
          <h2 className="font-heading text-4xl text-navy">Visual Keywords</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {keywords.map((word) => (
              <Badge key={word}>{word}</Badge>
            ))}
          </div>
        </Card>
      </section>

      <section className="rounded-2xl border border-border bg-navy px-6 py-8 text-white shadow-premium">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Final Design Goal</p>
        <h2 className="mt-3 font-heading text-4xl">A professional fashion brand customers can trust.</h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-200">
          The brand should be memorable because of its consistency, not because of flashy design.
        </p>
      </section>
    </main>
  );
}
