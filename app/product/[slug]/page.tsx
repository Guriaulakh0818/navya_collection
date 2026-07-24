import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const products: Record<string, {
  name: string;
  price: string;
  tag: string;
  category: string;
  description: string;
}> = {
  'classic-navy-shirt': {
    name: 'Classic Navy Shirt',
    price: '₹899',
    tag: 'Best Seller',
    category: 'Gents',
    description: 'A timeless classic navy shirt crafted from premium cotton. Perfect for office, casual outings, and evening events. Features a comfortable fit and breathable fabric.',
  },
  'kids-summer-set': {
    name: 'Kids Summer Set',
    price: '₹649',
    tag: 'New Arrival',
    category: 'Kids',
    description: 'Light and breathable summer set designed for active kids. Soft fabric, fun colors, and easy-care material make it a parent favorite.',
  },
  'premium-cotton-kurta': {
    name: 'Premium Cotton Kurta',
    price: '₹1,299',
    tag: 'Trending',
    category: 'Gents',
    description: 'Handcrafted premium cotton kurta with traditional craftsmanship. Ideal for festivals, family gatherings, and cultural occasions.',
  },
  'slim-fit-chinos': {
    name: 'Slim Fit Chinos',
    price: '₹1,099',
    category: 'Gents',
    tag: 'Best Seller',
    description: 'Modern slim-fit chinos with stretch comfort. Versatile enough for work and weekend wear.',
  },
  'kids-hoodie-jacket': {
    name: 'Kids Hoodie Jacket',
    price: '₹899',
    category: 'Kids',
    tag: 'New Arrival',
    description: 'Warm and cozy hoodie jacket for kids. Features a soft inner lining and durable outer shell.',
  },
  'formal-blazer': {
    name: 'Formal Blazer',
    price: '₹2,499',
    category: 'Gents',
    tag: 'Trending',
    description: 'Impeccably tailored formal blazer for the modern gentleman. Premium fabric with a sharp silhouette.',
  },
};

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return Object.keys(products).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = products[slug];
  if (!product) return { title: 'Product Not Found | Navya Collection' };
  return {
    title: `${product.name} | Navya Collection`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = products[slug];

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="rounded-[24px] bg-gradient-to-br from-sky-50 to-orange-50 p-8">
          <div className="mx-auto aspect-square w-full max-w-sm rounded-[24px] bg-gradient-to-br from-navy to-[#2b5aa4] p-8 text-center text-white shadow-lg">
            <div className="text-xs uppercase tracking-[0.2em] opacity-75">Signature</div>
            <div className="mt-3 font-heading text-4xl">NC</div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3">
            <Badge>{product.tag}</Badge>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{product.category}</span>
          </div>
          <h1 className="mt-4 font-heading text-4xl text-navy">{product.name}</h1>
          <p className="mt-3 text-2xl font-bold text-navy">{product.price}</p>
          <p className="mt-4 text-base text-slate-600">{product.description}</p>

          <div className="mt-8 rounded-2xl border border-border bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-navy">Delivery & Returns</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li>• Free delivery on orders above ₹999</li>
              <li>• Easy 7-day returns</li>
              <li>• Cash on Delivery available</li>
            </ul>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-[#234b8f]">
              Add to Cart
            </button>
            <button className="rounded-full border border-border bg-white px-6 py-3 text-sm font-semibold text-navy hover:bg-slate-50">
              Buy Now
            </button>
          </div>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="font-heading text-3xl text-navy">You May Also Like</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(products)
            .filter((p) => p.name !== product.name)
            .slice(0, 3)
            .map((p) => (
              <Card key={p.name}>
                <div className="rounded-[20px] bg-gradient-to-br from-sky-50 to-orange-50 p-6 text-center">
                  <div className="mx-auto h-20 w-20 rounded-full bg-white shadow-sm" />
                </div>
                <h3 className="mt-3 font-heading text-xl text-navy">{p.name}</h3>
                <p className="mt-1 font-semibold text-navy">{p.price}</p>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
