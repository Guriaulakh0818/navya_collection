import { Metadata } from 'next';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'About | Navya Collection',
  description: 'Learn about Navya Collection — our brand story, mission, and values.',
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Our Story</p>
        <h1 className="mt-3 font-heading text-4xl text-navy">Built on trust, style, and family-first values.</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="font-heading text-2xl text-navy">Mission</h2>
          <p className="mt-3 text-sm text-slate-600">
            Navya Collection was founded with a simple mission: to make premium, trustworthy fashion accessible to every Indian family. We combine modern design with honest pricing so that style never feels like a luxury.
          </p>
        </Card>
        <Card>
          <h2 className="font-heading text-2xl text-navy">Vision</h2>
          <p className="mt-3 text-sm text-slate-600">
            To become India&apos;s most trusted online fashion destination for gents and kids, and eventually expand into women&apos;s wear and accessories while maintaining the same premium identity.
          </p>
        </Card>
        <Card>
          <h2 className="font-heading text-2xl text-navy">Values</h2>
          <p className="mt-3 text-sm text-slate-600">
            Transparency, quality, and customer trust guide every decision. We believe in honest pricing, reliable service, and a seamless shopping experience from browse to delivery.
          </p>
        </Card>
        <Card>
          <h2 className="font-heading text-2xl text-navy">Quality</h2>
          <p className="mt-3 text-sm text-slate-600">
            Every product is selected with care. We prioritize comfort, durability, and premium finishes so that our customers feel confident in every purchase they make.
          </p>
        </Card>
      </div>
    </div>
  );
}
