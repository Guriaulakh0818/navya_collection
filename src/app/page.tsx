const categories = [
  {
    title: 'Gents Essentials',
    subtitle: 'Premium basics with a clean modern touch.',
    badge: 'Phase 01',
  },
  {
    title: 'Kids Everyday',
    subtitle: 'Comfort-first styles designed for families.',
    badge: 'Phase 02',
  },
  {
    title: 'Women & Accessories',
    subtitle: 'Future-ready expansion with the same premium identity.',
    badge: 'Future',
  },
];

const featuredProducts = [
  {
    name: 'Classic Navy Shirt',
    price: '₹899',
    tag: 'Best Seller',
  },
  {
    name: 'Kids Summer Set',
    price: '₹649',
    tag: 'New Arrival',
  },
  {
    name: 'Premium Cotton Kurta',
    price: '₹1,299',
    tag: 'Trending',
  },
];

const trustPoints = [
  'COD & UPI friendly checkout',
  'Mobile-first experience',
  'Secure order tracking journey',
];

const testimonials = [
  {
    name: 'Rohan S.',
    text: 'Professional look, easy ordering, and trust-friendly shopping experience.',
  },
  {
    name: 'Priya K.',
    text: 'The brand feel is clean and premium. This is exactly what the business needs.',
  },
];

const phases = [
  'Brand foundation and design system',
  'Homepage + sticky navigation + hero section',
  'Product catalog + category filters',
  'Cart, checkout, and order tracking',
];

export default function HomePage() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-2 md:items-center">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-orange">
            Affordable Premium Fashion
          </p>
          <h1 className="font-heading text-5xl leading-tight text-navy md:text-6xl">
            Built for trust, style, and family-first shopping.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-600">
            Navya Collection is designed as a trusted online fashion brand for gents and kids, with a premium identity, easy browsing experience, and a clear roadmap into future growth.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#products" className="rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white shadow-premium">
              Explore Collection
            </a>
            <a href="#phases" className="rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold text-navy">
              View Phase Plan
            </a>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-white p-4 shadow-premium">
              <div className="text-lg font-bold text-navy">Premium</div>
              <div className="text-sm text-slate-500">Minimal identity</div>
            </div>
            <div className="rounded-2xl border border-border bg-white p-4 shadow-premium">
              <div className="text-lg font-bold text-navy">Mobile-first</div>
              <div className="text-sm text-slate-500">Fast experience</div>
            </div>
            <div className="rounded-2xl border border-border bg-white p-4 shadow-premium">
              <div className="text-lg font-bold text-navy">Trustworthy</div>
              <div className="text-sm text-slate-500">Easy to shop</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6 shadow-premium">
          <div className="mb-4 flex items-center justify-between">
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-navy">Brand Theme</span>
            <span className="rounded-full bg-orange/10 px-3 py-1 text-xs font-bold text-orange">v1.0</span>
          </div>
          <div className="rounded-[24px] bg-gradient-to-br from-slate-50 to-white p-8">
            <div className="mx-auto w-56 rounded-[24px] bg-gradient-to-br from-navy to-[#2b5aa4] p-8 text-center text-white shadow-lg">
              <div className="text-xs uppercase tracking-[0.2em] opacity-75">Signature</div>
              <div className="mt-3 font-heading text-4xl">NC</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-600">
            A timeless one-brand identity with originality, movement, and premium confidence.
          </p>
        </div>
      </section>

      <section id="brand" className="mx-auto max-w-6xl px-4 py-10 md:py-16">
        <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Brand Positioning</p>
            <h2 className="mt-3 font-heading text-4xl text-navy">Professional, premium, and trustworthy from day one.</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-white p-5 shadow-premium">
              <h3 className="mb-2 font-heading text-2xl text-navy">Personality</h3>
              <p className="text-sm text-slate-600">Modern, premium, trustworthy, family-friendly, minimal, confident.</p>
            </div>
            <div className="rounded-2xl border border-border bg-white p-5 shadow-premium">
              <h3 className="mb-2 font-heading text-2xl text-navy">Style</h3>
              <p className="text-sm text-slate-600">Minimal, spacious, mobile-first, premium, smooth animations only.</p>
            </div>
            <div className="rounded-2xl border border-border bg-white p-5 shadow-premium">
              <h3 className="mb-2 font-heading text-2xl text-navy">Feel</h3>
              <p className="text-sm text-slate-600">Professional, reliable, easy to shop, and fashion-forward.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="collections" className="bg-slate-50/70 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Collection Directions</p>
          <h2 className="mt-3 font-heading text-4xl text-navy">Phase-wise foundation for the product experience</h2>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {categories.map((category) => (
              <div key={category.title} className="rounded-2xl border border-border bg-white p-6 shadow-premium">
                <span className="mb-3 inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-navy">{category.badge}</span>
                <h3 className="font-heading text-2xl text-navy">{category.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{category.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="products" className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Featured Catalog</p>
            <h2 className="mt-3 font-heading text-4xl text-navy">New arrivals, best sellers, and trending picks</h2>
          </div>
          <a href="#contact" className="hidden rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-navy md:inline-flex">
            Browse More
          </a>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {featuredProducts.map((product) => (
            <article key={product.name} className="rounded-2xl border border-border bg-white p-5 shadow-premium">
              <div className="rounded-[20px] bg-gradient-to-br from-sky-50 to-orange-50 p-8 text-center">
                <div className="mx-auto h-24 w-24 rounded-full bg-white shadow-sm"></div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="rounded-full bg-orange/10 px-3 py-1 text-xs font-bold text-orange">{product.tag}</span>
                <span className="font-semibold text-navy">{product.price}</span>
              </div>
              <h3 className="mt-4 font-heading text-2xl text-navy">{product.name}</h3>
              <p className="mt-2 text-sm text-slate-600">Designed for daily wear with premium comfort and a polished finish.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-slate-50/70 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-border bg-white p-6 shadow-premium">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Offers</p>
              <h2 className="mt-3 font-heading text-4xl text-navy">Seasonal campaigns built for conversion</h2>
              <p className="mt-3 text-sm text-slate-600">Promotional blocks, festive offers, and confidence-building trust cues for COD and online payment users.</p>
            </div>
            <div className="rounded-2xl border border-border bg-white p-6 shadow-premium">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Why Choose Us</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                {trustPoints.map((point) => (
                  <li key={point} className="rounded-xl bg-slate-50 px-3 py-2">{point}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="phases" className="mx-auto max-w-6xl px-4 py-14">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Implementation Plan</p>
        <h2 className="mt-3 font-heading text-4xl text-navy">How the website will be built in phases</h2>

        <div className="mt-8 space-y-4">
          {phases.map((phase, index) => (
            <div key={phase} className="flex items-start gap-4 rounded-2xl border border-border bg-white p-4 shadow-premium">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-orange/10 text-sm font-bold text-orange">
                {String(index + 1).padStart(2, '0')}
              </div>
              <div>
                <h3 className="font-semibold text-navy">{phase}</h3>
                <p className="text-sm text-slate-600">This is aligned to the approved BRD and the next release goals.</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-slate-50 p-6 shadow-premium">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Customer Reviews</p>
              <div className="mt-5 space-y-4">
                {testimonials.map((item) => (
                  <div key={item.name} className="rounded-xl bg-white p-4">
                    <div className="font-semibold text-navy">{item.name}</div>
                    <p className="mt-1 text-sm text-slate-600">“{item.text}”</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-navy p-6 text-white shadow-premium">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Newsletter</p>
              <h3 className="mt-3 font-heading text-3xl">Stay updated with new arrivals and special offers.</h3>
              <p className="mt-3 text-sm text-slate-200">Customer email capture will help future repeat-purchase and marketing campaigns.</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <input className="w-full rounded-full border-0 px-4 py-3 text-slate-900" placeholder="Enter your email" />
                <button className="rounded-full bg-orange px-5 py-3 font-semibold text-white">Subscribe</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-6xl px-4 py-14">
        <div className="rounded-2xl border border-border bg-white p-8 shadow-premium md:flex md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Next Step</p>
            <h2 className="mt-3 font-heading text-4xl text-navy">Now we build the real e-commerce experience.</h2>
          </div>
          <a href="mailto:hello@navyacollection.in" className="mt-4 inline-flex rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white md:mt-0">
            Start Phase 02
          </a>
        </div>
      </section>
    </>
  );
}
