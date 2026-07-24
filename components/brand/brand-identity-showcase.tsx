import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export function BrandIdentityShowcase() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Brand Guidelines</p>
        <h1 className="mt-3 font-heading text-5xl text-navy">Navya Collection Brand Identity</h1>
        <p className="mt-4 max-w-3xl text-slate-600">
          A premium, minimal, and trustworthy brand direction built to support a fashion-first shopping experience across web, social, packaging, and future mobile channels.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-heading text-4xl text-navy">Brand Personality</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>Modern</Badge>
            <Badge variant="accent">Premium</Badge>
            <Badge>Trustworthy</Badge>
            <Badge variant="success">Affordable</Badge>
          </div>
        </Card>

        <Card>
          <h2 className="font-heading text-4xl text-navy">Brand Values</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>Trust</li>
            <li>Quality</li>
            <li>Simplicity</li>
            <li>Customer First</li>
            <li>Transparency</li>
            <li>Consistency</li>
          </ul>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <h3 className="font-heading text-2xl text-navy">Logo Strategy</h3>
          <p className="mt-2 text-sm text-slate-600">The brand symbol and wordmark must work independently and together.</p>
        </Card>
        <Card>
          <h3 className="font-heading text-2xl text-navy">Photography</h3>
          <p className="mt-2 text-sm text-slate-600">Clean backgrounds, consistent lighting, and lifestyle confidence.</p>
        </Card>
        <Card>
          <h3 className="font-heading text-2xl text-navy">Packaging</h3>
          <p className="mt-2 text-sm text-slate-600">Use the same premium minimalist identity across delivery and branded materials.</p>
        </Card>
      </section>
    </main>
  );
}
