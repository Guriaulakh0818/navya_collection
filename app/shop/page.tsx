import { Metadata } from 'next';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Shop | Navya Collection',
  description: 'Browse our complete catalog of affordable premium fashion.',
};

const products = [
  { name: 'Classic Navy Shirt', price: '₹899', category: 'Gents', tag: 'Best Seller' },
  { name: 'Kids Summer Set', price: '₹649', category: 'Kids', tag: 'New Arrival' },
  { name: 'Premium Cotton Kurta', price: '₹1,299', category: 'Gents', tag: 'Trending' },
  { name: 'Slim Fit Chinos', price: '₹1,099', category: 'Gents', tag: 'Best Seller' },
  { name: 'Kids Hoodie Jacket', price: '₹899', category: 'Kids', tag: 'New Arrival' },
  { name: 'Formal Blazer', price: '₹2,499', category: 'Gents', tag: 'Trending' },
];

export default function ShopPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Catalog</p>
        <h1 className="mt-3 font-heading text-4xl text-navy">Shop All Products</h1>
        <p className="mt-2 max-w-2xl text-base text-slate-600">
          Discover our curated collection of premium fashion for gents and kids.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.name} className="flex flex-col">
            <div className="rounded-[20px] bg-gradient-to-br from-sky-50 to-orange-50 p-8 text-center">
              <div className="mx-auto h-24 w-24 rounded-full bg-white shadow-sm" />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="rounded-full bg-orange/10 px-3 py-1 text-xs font-bold text-orange">{product.tag}</span>
              <span className="font-semibold text-navy">{product.price}</span>
            </div>
            <h3 className="mt-4 font-heading text-xl text-navy">{product.name}</h3>
            <p className="mt-2 flex-1 text-sm text-slate-600">{product.category}</p>
            <a
              href={`/product/${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`}
              className="mt-4 inline-flex w-full justify-center rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-[#234b8f]"
            >
              View Details
            </a>
          </Card>
        ))}
      </div>
    </div>
  );
}
