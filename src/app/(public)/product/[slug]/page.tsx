'use client';

import { Heart, Minus, Plus, RotateCcw, Share2, Truck } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductBadge } from '@/features/products/components/ProductBadge';
import { ProductGrid } from '@/features/products/components/ProductGrid';
import { ProductImageGallery } from '@/features/products/components/ProductImageGallery';
import { ProductPrice } from '@/features/products/components/ProductPrice';
import { ProductRating } from '@/features/products/components/ProductRating';
import type { Product } from '@/features/products/types/product.types';

const mockProduct: Product = {
  id: '1',
  name: 'Classic Navy Shirt',
  slug: 'classic-navy-shirt',
  sku: 'NC-SHIRT-001',
  description:
    'A timeless classic navy shirt crafted from premium cotton. Perfect for office, casual outings, and evening events. Features a comfortable fit and breathable fabric.',
  price: 899,
  compareAtPrice: 1299,
  images: [
    { id: '1', url: '/images/products/shirt-1.jpg', alt: 'Front view', isPrimary: true },
    { id: '2', url: '/images/products/shirt-2.jpg', alt: 'Back view' },
    { id: '3', url: '/images/products/shirt-3.jpg', alt: 'Detail view' },
  ],
  category: { id: '1', name: 'Gents', slug: 'gents' },
  categoryId: '1',
  status: 'active',
  stock: 25,
  lowStockThreshold: 5,
  rating: 4.5,
  reviewCount: 128,
  variants: [
    { id: 'v1', sku: 'NC-SHIRT-S', name: 'Small', price: 899, stock: 8 },
    { id: 'v2', sku: 'NC-SHIRT-M', name: 'Medium', price: 899, stock: 12 },
    { id: 'v3', sku: 'NC-SHIRT-L', name: 'Large', price: 899, stock: 5 },
    { id: 'v4', sku: 'NC-SHIRT-XL', name: 'XL', price: 929, stock: 0 },
  ],
  reviews: [
    {
      id: 'r1',
      userId: 'u1',
      userName: 'Rahul',
      rating: 5,
      comment: 'Excellent quality!',
      createdAt: new Date('2026-07-01'),
    },
    {
      id: 'r2',
      userId: 'u2',
      userName: 'Priya',
      rating: 4,
      comment: 'Good fit and fabric.',
      createdAt: new Date('2026-07-05'),
    },
  ],
};

const relatedProducts: Product[] = Array.from({ length: 4 }).map((_, i) => ({
  id: String(i + 10),
  name: `Related Product ${i + 1}`,
  slug: `related-product-${i + 1}`,
  description: 'Premium quality product.',
  price: 799 + i * 100,
  compareAtPrice: [1299, 1499, 1799, 1999][i % 4],
  images: [],
  category: { id: '1', name: 'Gents', slug: 'gents' },
  categoryId: '1',
  status: 'active',
  stock: 10,
  rating: 4 + (i % 2) * 0.5,
  reviewCount: 20 + i * 5,
}));

const recentlyViewed: Product[] = Array.from({ length: 4 }).map((_, i) => ({
  id: String(i + 20),
  name: `Recently Viewed ${i + 1}`,
  slug: `recently-viewed-${i + 1}`,
  description: 'Premium quality product.',
  price: 699 + i * 120,
  images: [],
  category: { id: '1', name: 'Gents', slug: 'gents' },
  categoryId: '1',
  status: 'active',
  stock: 10,
  rating: 4 + (i % 2) * 0.5,
  reviewCount: 20 + i * 5,
}));

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const [selectedVariant, setSelectedVariant] = useState(mockProduct.variants?.[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const activeVariant = useMemo(
    () => mockProduct.variants?.find((v) => v.id === selectedVariant) || null,
    [selectedVariant],
  );

  const stockStatus = useMemo(() => {
    if (!activeVariant) return { label: 'Out of Stock', color: 'bg-error' };
    if ((activeVariant.stock || 0) <= 0) return { label: 'Out of Stock', color: 'bg-error' };
    if ((activeVariant.stock || 0) <= (mockProduct.lowStockThreshold ?? 5))
      return { label: 'Low Stock', color: 'bg-warning' };
    return { label: 'In Stock', color: 'bg-success' };
  }, [activeVariant]);

  const discount = useMemo(() => {
    const price = activeVariant?.price ?? mockProduct.price;
    if (!mockProduct.compareAtPrice || mockProduct.compareAtPrice <= price) return null;
    return Math.round(((mockProduct.compareAtPrice - price) / mockProduct.compareAtPrice) * 100);
  }, [activeVariant]);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: mockProduct.name,
        text: mockProduct.description,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard');
    }
  };

  return (
    <div className="min-h-screen">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Shop', href: '/shop' },
          { label: mockProduct.name },
        ]}
        className="mx-auto max-w-[1440px] px-4 md:px-6 py-4"
      />

      <div className="mx-auto max-w-[1440px] px-4 md:px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <ProductImageGallery images={mockProduct.images} />

          <div>
            <div className="flex items-center gap-3 mb-4">
              <Badge>{mockProduct.category.name}</Badge>
              {discount && <ProductBadge type="sale" text={`${discount}% OFF`} />}
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${stockStatus.color}`}
              >
                {stockStatus.label}
              </span>
            </div>

            <h1 className="font-heading text-3xl text-navy">{mockProduct.name}</h1>
            <p className="mt-1 text-sm text-slate-500">SKU: {mockProduct.sku}</p>

            <div className="mt-3">
              <ProductPrice
                price={activeVariant?.price ?? mockProduct.price}
                compareAtPrice={mockProduct.compareAtPrice}
              />
            </div>

            <div className="mt-3">
              <ProductRating
                rating={mockProduct.rating ?? 0}
                reviewCount={mockProduct.reviewCount ?? 0}
              />
            </div>

            <p className="mt-4 text-sm text-slate-600">{mockProduct.description}</p>

            {mockProduct.variants && mockProduct.variants.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-navy mb-2">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {mockProduct.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant.id)}
                      disabled={(variant.stock || 0) <= 0}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                        selectedVariant === variant.id
                          ? 'border-navy bg-navy text-white'
                          : 'border-border hover:border-navy'
                      } ${(variant.stock || 0) <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {variant.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-navy mb-2">Quantity</h3>
              <div className="inline-flex items-center gap-3 rounded-full border border-border">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="rounded-full p-2 text-navy hover:bg-slate-50"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold text-navy w-6 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="rounded-full p-2 text-navy hover:bg-slate-50"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                className="flex-1 rounded-full"
                disabled={stockStatus.label === 'Out of Stock'}
              >
                Add to Cart
              </Button>
              <Button variant="outline" className="flex-1 rounded-full">
                Buy Now
              </Button>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => setIsWishlisted(!isWishlisted)}
                className="rounded-full"
              >
                <Heart className={`mr-2 h-4 w-4 ${isWishlisted ? 'fill-error text-error' : ''}`} />
                {isWishlisted ? 'Wishlisted' : 'Wishlist'}
              </Button>
              <Button variant="ghost" onClick={handleShare} className="rounded-full">
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Truck className="h-4 w-4 text-orange" />
                <span>Delivery estimate: 3-5 business days</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                <RotateCcw className="h-4 w-4 text-orange" />
                <span>Easy 7-day returns</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="py-6">
              <h3 className="font-heading text-2xl text-navy mb-4">Product Description</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{mockProduct.description}</p>
              <p className="text-sm text-slate-600 leading-relaxed mt-4">
                Crafted with premium materials, this product offers exceptional comfort and
                durability. Ideal for everyday use with a modern fit that complements any wardrobe.
              </p>
            </TabsContent>
            <TabsContent value="specifications" className="py-6">
              <h3 className="font-heading text-2xl text-navy mb-4">Specifications</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>Material: Premium Cotton</li>
                <li>Fit: Regular</li>
                <li>Sleeve: Full</li>
                <li>Care: Machine washable</li>
                <li>Origin: Made in India</li>
              </ul>
            </TabsContent>
            <TabsContent value="reviews" className="py-6">
              <h3 className="font-heading text-2xl text-navy mb-4">Reviews</h3>
              <div className="space-y-4">
                {mockProduct.reviews?.map((review) => (
                  <div key={review.id} className="rounded-xl border border-border bg-white p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-navy">{review.userName}</p>
                      <span className="text-xs text-slate-500">
                        {`${String(review.createdAt.getDate()).padStart(2, '0')}/${String(review.createdAt.getMonth() + 1).padStart(2, '0')}/${review.createdAt.getFullYear()}`}
                      </span>
                    </div>
                    <ProductRating rating={review.rating} />
                    <p className="mt-2 text-sm text-slate-600">{review.comment}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-16">
          <h2 className="font-heading text-3xl text-navy mb-6">Related Products</h2>
          <ProductGrid products={relatedProducts} />
        </div>

        <div className="mt-16">
          <h2 className="font-heading text-3xl text-navy mb-6">Recently Viewed</h2>
          <ProductGrid products={recentlyViewed} />
        </div>
      </div>
    </div>
  );
}
