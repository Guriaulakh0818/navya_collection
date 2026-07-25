'use client';

import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Heart,
  Image as ImageIcon,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ProductCard } from '@/features/products/components/ProductCard';
import type { Product } from '@/features/products/types/product.types';

const categories = [
  {
    id: '1',
    name: 'Gents Collection',
    slug: 'gents',
    count: 140,
    desc: 'Casual Shirts, Formal Trousers, Ethnic Kurtas & Blazers',
    accent: 'bg-slate-900 text-white',
  },
  {
    id: '2',
    name: 'Kids Wear',
    slug: 'kids',
    count: 95,
    desc: 'Boys T-Shirts, Girls Dresses & Infant Cotton Sets',
    accent: 'bg-orange text-white',
  },
  {
    id: '3',
    name: 'New Season 2026',
    slug: 'new',
    count: 60,
    desc: 'Fresh arrivals crafted for maximum comfort & luxury feel',
    accent: 'bg-navy text-white',
  },
  {
    id: '4',
    name: 'Festive Deals',
    slug: 'offers',
    count: 40,
    desc: 'Exclusive up to 50% OFF discounts on selected lines',
    accent: 'bg-amber-600 text-white',
  },
];

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Classic Royal Navy Shirt',
    slug: 'classic-royal-navy-shirt',
    sku: 'NC-SHIRT-001',
    description: '100% Breathable Cotton Royal Navy Slim-Fit Shirt.',
    price: 899,
    compareAtPrice: 1399,
    images: [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=800',
        alt: 'Navy Shirt',
        isPrimary: true,
      },
    ],
    category: { id: '1', name: 'Gents', slug: 'gents' },
    categoryId: '1',
    status: 'active',
    stock: 25,
    rating: 4.8,
    reviewCount: 142,
    isNewArrival: true,
    isFeatured: true,
  },
  {
    id: '2',
    name: 'Kids Ethnic Kurta Set',
    slug: 'kids-ethnic-kurta-set',
    sku: 'NC-KIDS-002',
    description: 'Soft Jacquard Kurta Set for festive celebrations.',
    price: 749,
    compareAtPrice: 1099,
    images: [
      {
        id: '2',
        url: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&q=80&w=800',
        alt: 'Kids Kurta',
        isPrimary: true,
      },
    ],
    category: { id: '2', name: 'Kids', slug: 'kids' },
    categoryId: '2',
    status: 'active',
    stock: 18,
    rating: 4.9,
    reviewCount: 88,
    isNewArrival: true,
  },
  {
    id: '3',
    name: 'Festive Embroidered Silk Kurta',
    slug: 'festive-embroidered-silk-kurta',
    sku: 'NC-GENTS-003',
    description: 'Traditional handcrafted silk kurta with mandarin collar.',
    price: 1499,
    compareAtPrice: 2199,
    images: [
      {
        id: '3',
        url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800',
        alt: 'Silk Kurta',
        isPrimary: true,
      },
    ],
    category: { id: '1', name: 'Gents', slug: 'gents' },
    categoryId: '1',
    status: 'active',
    stock: 12,
    rating: 4.7,
    reviewCount: 95,
  },
  {
    id: '4',
    name: 'Slim Fit Stretch Chinos',
    slug: 'slim-fit-stretch-chinos',
    sku: 'NC-GENTS-004',
    description: 'Versatile stretch cotton chinos for modern work and leisure.',
    price: 1199,
    compareAtPrice: 1699,
    images: [
      {
        id: '4',
        url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&q=80&w=800',
        alt: 'Chinos',
        isPrimary: true,
      },
    ],
    category: { id: '1', name: 'Gents', slug: 'gents' },
    categoryId: '1',
    status: 'active',
    stock: 30,
    rating: 4.6,
    reviewCount: 210,
  },
  {
    id: '5',
    name: 'Boys Cotton Graphic T-Shirt',
    slug: 'boys-cotton-graphic-tshirt',
    sku: 'NC-KIDS-005',
    description: 'Ultra-soft bio-washed cotton T-shirt.',
    price: 499,
    compareAtPrice: 799,
    images: [
      {
        id: '5',
        url: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&q=80&w=800',
        alt: 'Boys T-shirt',
        isPrimary: true,
      },
    ],
    category: { id: '2', name: 'Kids', slug: 'kids' },
    categoryId: '2',
    status: 'active',
    stock: 45,
    rating: 4.8,
    reviewCount: 64,
  },
  {
    id: '6',
    name: 'Tailored Italian Fit Blazer',
    slug: 'tailored-italian-fit-blazer',
    sku: 'NC-GENTS-006',
    description: 'Premium blazer suited for weddings and formal events.',
    price: 2999,
    compareAtPrice: 4499,
    images: [
      {
        id: '6',
        url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800',
        alt: 'Formal Blazer',
        isPrimary: true,
      },
    ],
    category: { id: '1', name: 'Gents', slug: 'gents' },
    categoryId: '1',
    status: 'active',
    stock: 8,
    rating: 4.9,
    reviewCount: 175,
  },
];

const customerReviews = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    city: 'Bengaluru',
    rating: 5,
    comment:
      'The quality of the Navy Linen Shirt is unbelievable for ₹899! Perfect fit and stitch details. Will order again.',
    product: 'Classic Royal Navy Shirt',
  },
  {
    id: '2',
    name: 'Sneha Sharma',
    city: 'Mumbai',
    rating: 5,
    comment:
      'Bought kids kurta set for Diwali. The fabric is super soft, zero irritation for my 5-year-old son!',
    product: 'Kids Ethnic Kurta Set',
  },
  {
    id: '3',
    name: 'Amit Vikram',
    city: 'Delhi NCR',
    rating: 5,
    comment: 'Fast delivery within 3 days. Premium packaging and exact sizing as per size chart.',
    product: 'Slim Fit Stretch Chinos',
  },
];

export default function HomePage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-navy via-[#172e6e] to-[#0f1f4b] text-white overflow-hidden py-12 md:py-16 lg:py-20">
        {/* Glowing Background Orbs */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-orange/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-navy-500/30 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-orange/15 via-transparent to-transparent opacity-70" />

        <div className="relative mx-auto max-w-[1440px] px-4 md:px-6">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content Column (7 cols on lg) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 border border-white/20 backdrop-blur-md text-orange-200">
                <Sparkles className="h-4 w-4 text-orange animate-pulse" />
                <span className="text-xs font-semibold tracking-wide">
                  New Season Collection 2026
                </span>
              </div>

              <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                Affordable Luxury Fashion for{' '}
                <span className="text-orange underline decoration-orange/40 decoration-wavy decoration-2">
                  Gents
                </span>{' '}
                &{' '}
                <span className="text-orange underline decoration-orange/40 decoration-wavy decoration-2">
                  Kids
                </span>
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-slate-200 max-w-xl leading-relaxed">
                Elevate your daily style with India’s most trusted fashion collection. Handcrafted
                fabrics, precision fits, and unbeatable direct-to-consumer prices.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href="/shop?category=gents">
                  <Button
                    size="lg"
                    className="rounded-full bg-orange hover:bg-orange-600 text-white font-bold px-7 shadow-lg shadow-orange/30 transition-all hover:scale-[1.02]"
                  >
                    Shop Gents <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/shop?category=kids">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full border-white/30 bg-white/10 hover:bg-white/20 text-white font-bold px-7 backdrop-blur-sm transition-all hover:scale-[1.02]"
                  >
                    Explore Kids Wear
                  </Button>
                </Link>
              </div>

              {/* Quick Trust Highlights */}
              <div className="pt-6 grid grid-cols-3 gap-3 border-t border-white/15">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <h4 className="text-lg lg:text-xl font-extrabold text-white">50k+</h4>
                  <p className="text-[11px] text-slate-300">Happy Customers</p>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <h4 className="text-lg lg:text-xl font-extrabold text-white">4.9 ★</h4>
                  <p className="text-[11px] text-slate-300">5,000+ Reviews</p>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <h4 className="text-lg lg:text-xl font-extrabold text-white">Express</h4>
                  <p className="text-[11px] text-slate-300">Pan-India Delivery</p>
                </div>
              </div>
            </div>

            {/* Right Visual Image Composition (5 cols on lg) */}
            <div className="lg:col-span-5 relative flex justify-end pl-0 lg:pl-8">
              <div className="relative w-full max-w-md lg:max-w-[480px] ml-auto">
                {/* Main Hero Card with max height constraint to match left text */}
                <div className="relative aspect-[4/3] sm:aspect-[16/11] lg:aspect-[4/3] max-h-[440px] w-full rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 bg-slate-900 group">
                  <Image
                    src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=1200"
                    alt="Navya Collection Hero Look"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Card overlay content */}
                  <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-orange bg-orange/20 px-2.5 py-0.5 rounded-full">
                        Premium Egyptian Cotton
                      </span>
                      <span className="text-xs font-extrabold text-white bg-navy px-2 py-0.5 rounded-md">
                        From ₹899
                      </span>
                    </div>
                    <h3 className="font-heading text-base sm:text-lg font-bold mt-1.5">
                      Tailored Royal Navy Shirt
                    </h3>
                  </div>
                </div>

                {/* Floating Decorative Glass Badge 1 (Top Right) */}
                <div className="absolute -top-4 -right-4 hidden sm:flex items-center gap-2.5 p-3 rounded-2xl bg-white/90 text-slate-900 shadow-xl border border-white/40 backdrop-blur-md">
                  <div className="h-8 w-8 rounded-xl bg-orange/10 flex items-center justify-center text-orange font-bold text-sm">
                    🔥
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Trending Now
                    </p>
                    <p className="text-xs font-extrabold text-navy">Linen & Cotton Fits</p>
                  </div>
                </div>

                {/* Floating Decorative Glass Badge 2 (Bottom Left) */}
                <div className="absolute -bottom-4 -left-4 hidden sm:flex items-center gap-2.5 p-3 rounded-2xl bg-navy/90 text-white shadow-xl border border-white/20 backdrop-blur-md">
                  <div className="h-8 w-8 rounded-xl bg-amber-400/20 flex items-center justify-center text-amber-400 font-bold text-sm">
                    ★
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                      Verified Quality
                    </p>
                    <p className="text-xs font-extrabold text-white">100% Breathable Fabric</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-10 bg-white border-b border-slate-100 shadow-sm">
        <div className="mx-auto max-w-[1440px] px-4 md:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <Truck className="h-8 w-8 text-orange shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-slate-900">FREE Express Shipping</h4>
                <p className="text-xs text-slate-500">On all orders above ₹999</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <ShieldCheck className="h-8 w-8 text-orange shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-slate-900">100% Premium Quality</h4>
                <p className="text-xs text-slate-500">Durable fabric & color lock</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <RefreshCw className="h-8 w-8 text-orange shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-slate-900">Easy 7-Day Returns</h4>
                <p className="text-xs text-slate-500">Hassle-free exchange policy</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <CheckCircle2 className="h-8 w-8 text-orange shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-slate-900">Cash on Delivery</h4>
                <p className="text-xs text-slate-500">Available across all PIN codes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16">
        <div className="mx-auto max-w-[1440px] px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-orange">
              Curated Lineup
            </span>
            <h2 className="mt-2 font-heading text-3xl md:text-4xl font-bold text-navy">
              Featured Categories
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Discover handpicked styles tailored for Gents and Kids.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="group relative overflow-hidden rounded-3xl p-6 h-64 flex flex-col justify-between shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div
                  className={`absolute inset-0 ${cat.accent} opacity-95 transition-opacity group-hover:opacity-100`}
                />
                <div className="relative z-10">
                  <span className="text-xs font-bold uppercase tracking-widest text-white/70">
                    {cat.count}+ Styles
                  </span>
                  <h3 className="font-heading text-2xl font-bold text-white mt-1">{cat.name}</h3>
                </div>
                <div className="relative z-10 flex items-center justify-between">
                  <p className="text-xs text-white/80 max-w-[180px] line-clamp-2">{cat.desc}</p>
                  <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-white group-hover:text-navy transition-all">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Best Sellers & Trending */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-[1440px] px-4 md:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-orange">
                Popular Choices
              </span>
              <h2 className="mt-1 font-heading text-3xl md:text-4xl font-bold text-navy">
                Best Sellers
              </h2>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center text-xs font-bold text-navy hover:text-orange transition-colors"
            >
              View Full Collection →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {mockProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals Banner */}
      <section className="py-16 bg-slate-50">
        <div className="mx-auto max-w-[1440px] px-4 md:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-orange">
                Just Arrived
              </span>
              <h2 className="mt-1 font-heading text-3xl md:text-4xl font-bold text-navy">
                New Arrivals 2026
              </h2>
            </div>
            <Link
              href="/shop?filter=new"
              className="inline-flex items-center text-xs font-bold text-navy hover:text-orange transition-colors"
            >
              Explore All New →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {mockProducts.slice(2, 6).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Special Offers Section */}
      <section className="py-16 bg-navy text-white relative overflow-hidden">
        <div className="mx-auto max-w-[1440px] px-4 md:px-6">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-orange">
              Special Coupons
            </span>
            <h2 className="mt-2 font-heading text-3xl md:text-4xl font-bold">
              Exclusive Discount Deals
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="rounded-3xl bg-white/10 border border-white/15 p-6 backdrop-blur-md flex flex-col justify-between">
              <div>
                <span className="bg-orange text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  FESTIVAL SPECIAL
                </span>
                <h3 className="font-heading text-2xl font-bold mt-3">Flat 15% Off Your Order</h3>
                <p className="text-xs text-white/70 mt-1">
                  Valid on all Gents & Kids wear purchases above ₹1,299.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/10">
                <span className="font-mono text-sm font-bold text-orange tracking-widest bg-white/10 px-4 py-1.5 rounded-xl">
                  NAVYA15
                </span>
                <button
                  onClick={() => handleCopy('NAVYA15')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white hover:text-orange transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copiedCode === 'NAVYA15' ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
            </div>

            <div className="rounded-3xl bg-white/10 border border-white/15 p-6 backdrop-blur-md flex flex-col justify-between">
              <div>
                <span className="bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  NEW CUSTOMER
                </span>
                <h3 className="font-heading text-2xl font-bold mt-3">Flat ₹200 Off First Order</h3>
                <p className="text-xs text-white/70 mt-1">
                  Applicable for new users on cart value above ₹999.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/10">
                <span className="font-mono text-sm font-bold text-orange tracking-widest bg-white/10 px-4 py-1.5 rounded-xl">
                  FIRST200
                </span>
                <button
                  onClick={() => handleCopy('FIRST200')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white hover:text-orange transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copiedCode === 'FIRST200' ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-[1440px] px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-orange">
              Customer Love
            </span>
            <h2 className="mt-2 font-heading text-3xl md:text-4xl font-bold text-navy">
              What Our Buyers Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {customerReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-500 mb-3">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    &quot;{rev.comment}&quot;
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-navy">{rev.name}</h4>
                    <span className="text-[10px] text-slate-500">
                      {rev.city} • Verified Purchase
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-orange bg-orange/10 px-2 py-1 rounded">
                    {rev.product}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instagram Feed / Lookbook */}
      <section className="py-16 bg-slate-50 border-t border-slate-100">
        <div className="mx-auto max-w-[1440px] px-4 md:px-6 text-center">
          <ImageIcon className="h-8 w-8 text-orange mx-auto mb-2" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            #NavyaStyle Lookbook
          </span>
          <h2 className="mt-1 font-heading text-3xl font-bold text-navy mb-8">
            Follow Us On Instagram
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=600',
              'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&q=80&w=600',
              'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=600',
              'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600',
            ].map((url, idx) => (
              <div
                key={idx}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-200"
              >
                <Image
                  src={url}
                  alt={`Navya Collection lookbook ${idx + 1}`}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <ImageIcon className="h-8 w-8" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
