'use client';

import {
  Check,
  Heart,
  HelpCircle,
  Minus,
  Plus,
  RotateCcw,
  Share2,
  ShieldCheck,
  Star,
  Truck,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddToCartButton } from '@/features/products/components/AddToCartButton';
import { ProductBadge } from '@/features/products/components/ProductBadge';
import { ProductGrid } from '@/features/products/components/ProductGrid';
import { ProductImageGallery } from '@/features/products/components/ProductImageGallery';
import { ProductPrice } from '@/features/products/components/ProductPrice';
import { ProductRating } from '@/features/products/components/ProductRating';
import type { Product } from '@/features/products/types/product.types';
import { useCartStore, useWishlistStore } from '@/stores';

const sampleProduct: Product = {
  id: '1',
  name: 'Classic Royal Navy Linen Shirt',
  slug: 'classic-royal-navy-shirt',
  sku: 'NC-SHIRT-001',
  description:
    'Tailored from 100% long-staple Egyptian cotton and flax linen blend. Features a slim fit, structured spread collar, mother-of-pearl buttons, and lightweight breathable feel for all-day elegance in Indian climates.',
  price: 899,
  compareAtPrice: 1399,
  images: [
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=1000',
      alt: 'Front view',
      isPrimary: true,
    },
    {
      id: '2',
      url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&q=80&w=1000',
      alt: 'Detail view',
    },
    {
      id: '3',
      url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1000',
      alt: 'Model style',
    },
  ],
  category: { id: '1', name: 'Gents Collection', slug: 'gents' },
  categoryId: '1',
  status: 'active',
  stock: 25,
  lowStockThreshold: 5,
  rating: 4.8,
  reviewCount: 142,
  variants: [
    { id: 'v1', sku: 'NC-SHIRT-S', name: 'S (38)', price: 899, stock: 8, size: 'S' },
    { id: 'v2', sku: 'NC-SHIRT-M', name: 'M (40)', price: 899, stock: 12, size: 'M' },
    { id: 'v3', sku: 'NC-SHIRT-L', name: 'L (42)', price: 899, stock: 5, size: 'L' },
    { id: 'v4', sku: 'NC-SHIRT-XL', name: 'XL (44)', price: 929, stock: 0, size: 'XL' },
  ],
  reviews: [
    {
      id: 'r1',
      userId: 'u1',
      userName: 'Rahul Verma',
      rating: 5,
      comment: 'Superb stitching quality! Soft on skin even during hot summer days.',
      createdAt: new Date('2026-07-10'),
    },
    {
      id: 'r2',
      userId: 'u2',
      userName: 'Vikram Singh',
      rating: 5,
      comment: 'Fits true to size. Color matches exact photo shown online.',
      createdAt: new Date('2026-07-15'),
    },
  ],
};

const relatedProducts: Product[] = Array.from({ length: 4 }).map((_, i) => ({
  id: String(i + 10),
  name: ['Festive Silk Kurta', 'Slim Stretch Chinos', 'Italian Suit Blazer', 'Casual Polo T-Shirt'][
    i
  ],
  slug: `related-product-${i + 1}`,
  description: 'Premium quality fashion product.',
  price: 899 + i * 200,
  compareAtPrice: 1299 + i * 300,
  images: [
    {
      id: `rel-${i}`,
      url: [
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=800',
      ][i],
      alt: 'Related',
      isPrimary: true,
    },
  ],
  category: { id: '1', name: 'Gents', slug: 'gents' },
  categoryId: '1',
  status: 'active',
  stock: 10,
  rating: 4.8,
  reviewCount: 45,
}));

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const { toggleItem: toggleWishlist, isInWishlist } = useWishlistStore();
  const [selectedVariant, setSelectedVariant] = useState(sampleProduct.variants?.[1]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Review Form state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [newName, setNewName] = useState('');
  const [reviewsList, setReviewsList] = useState(sampleProduct.reviews || []);

  const activeVariant = useMemo(
    () =>
      sampleProduct.variants?.find((v) => v.id === selectedVariant) || sampleProduct.variants?.[0],
    [selectedVariant],
  );

  const isWishlisted = isInWishlist(sampleProduct.id);

  const stockStatus = useMemo(() => {
    if (!activeVariant) return { label: 'Out of Stock', color: 'bg-rose-500' };
    if ((activeVariant.stock || 0) <= 0) return { label: 'Out of Stock', color: 'bg-rose-500' };
    if ((activeVariant.stock || 0) <= (sampleProduct.lowStockThreshold ?? 5))
      return { label: 'Low Stock Alert', color: 'bg-amber-500' };
    return { label: 'In Stock', color: 'bg-emerald-500' };
  }, [activeVariant]);

  const discount = useMemo(() => {
    const price = activeVariant?.price ?? sampleProduct.price;
    if (!sampleProduct.compareAtPrice || sampleProduct.compareAtPrice <= price) return null;
    return Math.round(
      ((sampleProduct.compareAtPrice - price) / sampleProduct.compareAtPrice) * 100,
    );
  }, [activeVariant]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && newComment.trim()) {
      const newRev = {
        id: `rev-${Date.now()}`,
        userId: 'u-user',
        userName: newName.trim(),
        rating: newRating,
        comment: newComment.trim(),
        createdAt: new Date(),
      };
      setReviewsList([newRev, ...reviewsList]);
      setNewName('');
      setNewComment('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Shop', href: '/shop' },
          { label: sampleProduct.name },
        ]}
        className="mx-auto max-w-[1440px] px-4 md:px-6 py-4"
      />

      <div className="mx-auto max-w-[1440px] px-4 md:px-6 py-4">
        {/* Main Product Container */}
        <div className="grid gap-10 lg:grid-cols-2 bg-white p-6 md:p-10 rounded-3xl border border-slate-200/80 shadow-sm">
          {/* Gallery */}
          <ProductImageGallery images={sampleProduct.images} />

          {/* Details Column */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-navy text-white text-[10px] uppercase font-bold tracking-wider">
                  {sampleProduct.category.name}
                </Badge>
                {discount && <ProductBadge type="sale" text={`${discount}% OFF`} />}
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white ${stockStatus.color}`}
                >
                  {stockStatus.label}
                </span>
              </div>

              <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                {sampleProduct.name}
              </h1>
              <p className="mt-1 text-xs text-slate-400 font-mono">
                SKU: {activeVariant?.sku || sampleProduct.sku}
              </p>
            </div>

            {/* Price & Rating */}
            <div className="flex items-center justify-between border-y border-slate-100 py-3">
              <ProductPrice
                price={activeVariant?.price ?? sampleProduct.price}
                compareAtPrice={sampleProduct.compareAtPrice}
              />
              <ProductRating
                rating={sampleProduct.rating ?? 4.8}
                reviewCount={reviewsList.length}
              />
            </div>

            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
              {sampleProduct.description}
            </p>

            {/* Variants Picker */}
            {sampleProduct.variants && sampleProduct.variants.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Select Size
                  </h3>
                  <button
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="inline-flex items-center text-xs font-bold text-orange hover:underline gap-1"
                  >
                    <HelpCircle className="h-3.5 w-3.5" /> Size Chart Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {sampleProduct.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v.id)}
                      disabled={(v.stock || 0) <= 0}
                      className={`rounded-2xl border px-4 py-2 text-xs font-bold transition-all ${
                        selectedVariant === v.id
                          ? 'border-navy bg-navy text-white shadow-md'
                          : 'border-slate-200 text-slate-800 hover:border-navy'
                      } ${(v.stock || 0) <= 0 ? 'opacity-40 cursor-not-allowed line-through' : ''}`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Quantity
              </h3>
              <div className="inline-flex items-center gap-4 rounded-full border border-slate-200 bg-slate-50 p-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="rounded-full h-8 w-8 flex items-center justify-center text-slate-700 hover:bg-white transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="text-xs font-bold text-slate-900 w-6 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="rounded-full h-8 w-8 flex items-center justify-center text-slate-700 hover:bg-white transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <AddToCartButton
                product={sampleProduct}
                className="flex-1 rounded-full py-3.5 text-xs font-bold bg-navy hover:bg-navy-hover shadow-md"
                disabled={stockStatus.label === 'Out of Stock'}
              />
              <Button
                className="flex-1 rounded-full py-3.5 text-xs font-bold bg-orange hover:bg-orange-hover text-white shadow-md"
                disabled={stockStatus.label === 'Out of Stock'}
                onClick={() => {
                  addItem({
                    id: `${sampleProduct.id}-${selectedVariant}`,
                    productId: sampleProduct.id,
                    name: `${sampleProduct.name} (${activeVariant?.name || 'Standard'})`,
                    price: activeVariant?.price ?? sampleProduct.price,
                    quantity,
                    image: sampleProduct.images[0]?.url,
                  });
                  router.push('/checkout');
                }}
              >
                Buy Now (Fast Checkout)
              </Button>
            </div>

            {/* Wishlist & Share */}
            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={() =>
                  toggleWishlist({
                    productId: sampleProduct.id,
                    name: sampleProduct.name,
                    price: activeVariant?.price ?? sampleProduct.price,
                    image: sampleProduct.images[0]?.url,
                    slug: sampleProduct.slug,
                  })
                }
                className={`inline-flex items-center gap-2 text-xs font-bold transition-colors ${
                  isWishlisted ? 'text-rose-600' : 'text-slate-600 hover:text-navy'
                }`}
              >
                <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-rose-600' : ''}`} />
                {isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
              </button>
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-navy transition-colors"
              >
                <Share2 className="h-4 w-4" />
                {copiedLink ? 'Link Copied!' : 'Share Product'}
              </button>
            </div>

            {/* Delivery Features */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center gap-3 text-xs font-medium text-slate-700">
                <Truck className="h-4 w-4 text-orange shrink-0" />
                <span>
                  Pan-India Delivery in 3-5 business days. Free shipping on orders above ₹999.
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-slate-700">
                <RotateCcw className="h-4 w-4 text-orange shrink-0" />
                <span>7-Day Hassle-Free Returns & Exchange Policy.</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-slate-700">
                <ShieldCheck className="h-4 w-4 text-orange shrink-0" />
                <span>100% Certified Authentic Fabrics. Guaranteed Stitch Durability.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs: Description, Care, Reviews */}
        <div className="mt-12 bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="bg-slate-100 p-1 rounded-2xl">
              <TabsTrigger value="description" className="rounded-xl text-xs font-bold">
                Description
              </TabsTrigger>
              <TabsTrigger value="specifications" className="rounded-xl text-xs font-bold">
                Specifications
              </TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-xl text-xs font-bold">
                Customer Reviews ({reviewsList.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="py-6 space-y-3">
              <h3 className="font-heading text-xl font-bold text-navy">Craftsmanship Details</h3>
              <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                Designed for the modern gentleman, this garment is crafted using bio-washed cotton
                linen fabric to ensure zero shrinkage and optimum comfort during hot and humid days
                across India.
              </p>
            </TabsContent>

            <TabsContent value="specifications" className="py-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block font-semibold">Material</span>
                  <span className="font-bold text-navy">100% Egyptian Cotton Linen</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block font-semibold">Fit Type</span>
                  <span className="font-bold text-navy">Modern Slim Fit</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block font-semibold">Sleeve</span>
                  <span className="font-bold text-navy">Full Length Convertible</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block font-semibold">Care Instructions</span>
                  <span className="font-bold text-navy">Machine Wash Cold</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="py-6 space-y-6">
              {/* Existing Reviews */}
              <div className="space-y-4">
                {reviewsList.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-navy">{rev.userName}</h4>
                      <span className="text-[10px] text-slate-400">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 my-1">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-amber-500" />
                      ))}
                    </div>
                    <p className="text-xs text-slate-700">{rev.comment}</p>
                  </div>
                ))}
              </div>

              {/* Submit Review */}
              <form
                onSubmit={handleReviewSubmit}
                className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4"
              >
                <h4 className="font-heading text-base font-bold text-navy">
                  Write a Verified Buyer Review
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Rating:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewRating(star)}
                        className="text-amber-500"
                      >
                        <Star className={`h-4 w-4 ${star <= newRating ? 'fill-amber-500' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-xs outline-none"
                />
                <textarea
                  placeholder="Share details of fit, fabric quality, and comfort..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  required
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-4 text-xs outline-none"
                />
                <Button type="submit" className="rounded-full bg-navy text-xs font-bold">
                  Submit Review
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        <div className="mt-16">
          <h2 className="font-heading text-2xl font-bold text-navy mb-6">You May Also Like</h2>
          <ProductGrid products={relatedProducts} />
        </div>
      </div>

      {/* Size Chart Modal Drawer */}
      <Drawer
        open={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        title="Size Guide (Gents & Kids)"
        side="right"
      >
        <div className="space-y-4 p-2 text-xs">
          <p className="text-slate-600">All measurements are in inches. Standard Indian sizes.</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-200 text-left">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2 border border-slate-200">Size</th>
                  <th className="p-2 border border-slate-200">Chest</th>
                  <th className="p-2 border border-slate-200">Shoulder</th>
                  <th className="p-2 border border-slate-200">Length</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border">S (38)</td>
                  <td className="p-2 border">38&quot;</td>
                  <td className="p-2 border">17.5&quot;</td>
                  <td className="p-2 border">28&quot;</td>
                </tr>
                <tr>
                  <td className="p-2 border">M (40)</td>
                  <td className="p-2 border">40&quot;</td>
                  <td className="p-2 border">18.0&quot;</td>
                  <td className="p-2 border">29&quot;</td>
                </tr>
                <tr>
                  <td className="p-2 border">L (42)</td>
                  <td className="p-2 border">42&quot;</td>
                  <td className="p-2 border">18.5&quot;</td>
                  <td className="p-2 border">30&quot;</td>
                </tr>
                <tr>
                  <td className="p-2 border">XL (44)</td>
                  <td className="p-2 border">44&quot;</td>
                  <td className="p-2 border">19.0&quot;</td>
                  <td className="p-2 border">31&quot;</td>
                </tr>
              </tbody>
            </table>
          </div>
          <Button
            className="w-full rounded-full bg-navy mt-4"
            onClick={() => setIsSizeGuideOpen(false)}
          >
            Close Size Chart
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
