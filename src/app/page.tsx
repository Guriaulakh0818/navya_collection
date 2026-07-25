'use client';

import { ArrowRight, RefreshCw, Shield, Truck } from 'lucide-react';
import Link from 'next/link';

import { HeaderLogo } from '@/components/layout/header/HeaderLogo';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatPrice } from '@/utils/format-price';

const categories = [
  { id: '1', name: 'Gents', slug: 'gents', image: '/images/categories/gents.jpg', count: 120 },
  { id: '2', name: 'Kids', slug: 'kids', image: '/images/categories/kids.jpg', count: 85 },
  { id: '3', name: 'New Arrivals', slug: 'new', image: '/images/categories/new.jpg', count: 45 },
  { id: '4', name: 'Offers', slug: 'offers', image: '/images/categories/offers.jpg', count: 30 },
];

const products = [
  {
    id: '1',
    name: 'Classic Navy Shirt',
    price: 899,
    compareAtPrice: 1299,
    tag: 'Best Seller',
    category: 'Gents',
    image: '/images/products/shirt.jpg',
  },
  {
    id: '2',
    name: 'Kids Summer Set',
    price: 649,
    compareAtPrice: 899,
    tag: 'New Arrival',
    category: 'Kids',
    image: '/images/products/kids-summer.jpg',
  },
  {
    id: '3',
    name: 'Premium Cotton Kurta',
    price: 1299,
    compareAtPrice: 1899,
    tag: 'Trending',
    category: 'Gents',
    image: '/images/products/kurta.jpg',
  },
  {
    id: '4',
    name: 'Slim Fit Chinos',
    price: 1099,
    compareAtPrice: 1499,
    tag: 'Best Seller',
    category: 'Gents',
    image: '/images/products/chinos.jpg',
  },
  {
    id: '5',
    name: 'Kids Hoodie Jacket',
    price: 899,
    compareAtPrice: 1199,
    tag: 'New Arrival',
    category: 'Kids',
    image: '/images/products/hoodie.jpg',
  },
  {
    id: '6',
    name: 'Formal Blazer',
    price: 2499,
    compareAtPrice: 3299,
    tag: 'Trending',
    category: 'Gents',
    image: '/images/products/blazer.jpg',
  },
  {
    id: '7',
    name: 'Casual Linen Shirt',
    price: 799,
    compareAtPrice: 1199,
    tag: 'Best Seller',
    category: 'Gents',
    image: '/images/products/linen.jpg',
  },
  {
    id: '8',
    name: 'Kids Party Wear',
    price: 999,
    compareAtPrice: 1499,
    tag: 'New Arrival',
    category: 'Kids',
    image: '/images/products/party.jpg',
  },
];

const offers = [
  {
    id: '1',
    title: 'Summer Sale',
    description: 'Up to 50% off on selected items',
    code: 'SUMMER50',
    validUntil: '2026-08-31',
  },
  {
    id: '2',
    title: 'First Order Discount',
    description: 'Get 20% off on your first order',
    code: 'WELCOME20',
    validUntil: '2026-12-31',
  },
];

export default function HomePage() {
  const newArrivals = products.filter((p) => p.tag === 'New Arrival');
  const bestSellers = products.filter((p) => p.tag === 'Best Seller');
  const trending = products.filter((p) => p.tag === 'Trending');

  return (
    <div className="min-h-screen">
      <Breadcrumb
        items={[{ label: 'Home' }]}
        className="mx-auto max-w-[1440px] px-4 md:px-6 py-4"
      />

      {/* Hero Section */}
      <section className="relative bg-navy text-white">
        <div className="mx-auto max-w-[1440px] px-4 md:px-6 py-16 md:py-24">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-white/20 text-white hover:bg-white/30">
              New Collection 2026
            </Badge>
            <h1 className="font-heading text-4xl md:text-6xl font-bold leading-tight">
              Affordable Premium Fashion for <span className="text-orange">Gents</span> &{' '}
              <span className="text-orange">Kids</span>
            </h1>
            <p className="mt-4 text-lg text-white/80">
              Discover the latest trends in fashion. Quality meets affordability.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" className="bg-white text-navy hover:bg-white/90">
                Shop Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                Explore Collection
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-border bg-white">
        <div className="mx-auto max-w-[1440px] px-4 md:px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <Truck className="h-6 w-6 text-orange" />
              <div>
                <p className="font-semibold text-navy">Free Shipping</p>
                <p className="text-sm text-slate-600">On orders above ₹999</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-orange" />
              <div>
                <p className="font-semibold text-navy">Secure Payments</p>
                <p className="text-sm text-slate-600">100% secure checkout</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RefreshCw className="h-6 w-6 text-orange" />
              <div>
                <p className="font-semibold text-navy">Easy Returns</p>
                <p className="text-sm text-slate-600">7-day return policy</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16">
        <div className="mx-auto max-w-[1440px] px-4 md:px-6">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Categories</p>
            <h2 className="mt-2 font-heading text-3xl text-navy">Featured Categories</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/shop?category=${category.slug}`}
                className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-slate-100"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-heading text-xl">{category.name}</h3>
                  <p className="text-sm text-white/80">{category.count} items</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Product Grid Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-[1440px] px-4 md:px-6">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Shop</p>
            <h2 className="mt-2 font-heading text-3xl text-navy">Our Collection</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.slice(0, 4).map((product) => (
              <Card key={product.id} className="group overflow-hidden border-0 shadow-sm">
                <div className="aspect-[3/4] bg-slate-100 relative">
                  {product.tag && (
                    <Badge className="absolute top-2 left-2 z-10">{product.tag}</Badge>
                  )}
                  <div className="h-full w-full bg-gradient-to-br from-sky-50 to-orange-50" />
                </div>
                <div className="p-4">
                  <p className="text-xs text-slate-500 mb-1">{product.category}</p>
                  <h3 className="font-heading text-lg text-navy group-hover:text-orange transition-colors">
                    {product.name}
                  </h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-semibold text-navy">{formatPrice(product.price)}</span>
                    {product.compareAtPrice && (
                      <span className="text-sm text-slate-500 line-through">
                        {formatPrice(product.compareAtPrice)}
                      </span>
                    )}
                  </div>
                  <Button className="w-full mt-4 rounded-full" size="sm">
                    Add to Cart
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-[1440px] px-4 md:px-6">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Just In</p>
                <h2 className="mt-2 font-heading text-3xl text-navy">New Arrivals</h2>
              </div>
              <Link
                href="/shop?filter=new"
                className="text-sm font-medium text-navy hover:text-orange flex items-center"
              >
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {newArrivals.map((product) => (
                <Card key={product.id} className="group overflow-hidden border-0 shadow-sm">
                  <div className="aspect-[3/4] bg-slate-100 relative">
                    <Badge className="absolute top-2 left-2 z-10">{product.tag}</Badge>
                    <div className="h-full w-full bg-gradient-to-br from-sky-50 to-orange-50" />
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-slate-500 mb-1">{product.category}</p>
                    <h3 className="font-heading text-lg text-navy group-hover:text-orange transition-colors">
                      {product.name}
                    </h3>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="font-semibold text-navy">{formatPrice(product.price)}</span>
                      {product.compareAtPrice && (
                        <span className="text-sm text-slate-500 line-through">
                          {formatPrice(product.compareAtPrice)}
                        </span>
                      )}
                    </div>
                    <Button className="w-full mt-4 rounded-full" size="sm">
                      Add to Cart
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Offers */}
      <section className="py-16 bg-navy text-white">
        <div className="mx-auto max-w-[1440px] px-4 md:px-6">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Deals</p>
            <h2 className="mt-2 font-heading text-3xl">Special Offers</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {offers.map((offer) => (
              <Card key={offer.id} className="bg-white/10 border-white/20 text-white p-6">
                <h3 className="font-heading text-2xl">{offer.title}</h3>
                <p className="mt-2 text-white/80">{offer.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <code className="rounded-full bg-white/20 px-4 py-1 text-sm font-mono">
                    {offer.code}
                  </code>
                  <span className="text-xs text-white/60">Valid until {offer.validUntil}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-slate-50">
        <div className="mx-auto max-w-2xl px-4 md:px-6 text-center">
          <h2 className="font-heading text-3xl text-navy">Stay Updated</h2>
          <p className="mt-2 text-slate-600">
            Subscribe to our newsletter for exclusive offers and updates.
          </p>
          <form className="mt-6 flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 rounded-full border border-border px-4 py-3 text-sm text-slate-900 outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
              required
            />
            <Button type="submit" className="rounded-full">
              Subscribe
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
