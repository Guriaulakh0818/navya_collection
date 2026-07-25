import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { ProductBadge } from '@/features/products/components/ProductBadge';
import { ProductImageGallery } from '@/features/products/components/ProductImageGallery';
import { ProductPrice } from '@/features/products/components/ProductPrice';
import { ProductRating } from '@/features/products/components/ProductRating';
import type { Product } from '@/features/products/types/product.types';

const mockProduct: Product = {
  id: '1',
  name: 'Classic Navy Shirt',
  slug: 'classic-navy-shirt',
  description:
    'A timeless classic navy shirt crafted from premium cotton. Perfect for office, casual outings, and evening events.',
  price: 899,
  compareAtPrice: 1299,
  images: [
    { id: '1', url: '/images/products/shirt.jpg', alt: 'Classic Navy Shirt', isPrimary: true },
  ],
  category: { id: '1', name: 'Gents', slug: 'gents' },
  categoryId: '1',
  status: 'active',
  stock: 25,
  rating: 4.5,
  reviewCount: 128,
};

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return [{ slug: 'classic-navy-shirt' }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${mockProduct.name} | Navya Collection`,
    description: mockProduct.description,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = slug === 'classic-navy-shirt' ? mockProduct : null;

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Shop', href: '/shop' },
          { label: product.name },
        ]}
        className="mx-auto max-w-[1440px] px-4 md:px-6 py-4"
      />
      <div className="mx-auto max-w-[1440px] px-4 md:px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <ProductImageGallery images={product.images} />
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Badge>{product.category.name}</Badge>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <ProductBadge type="sale" text="Sale" />
              )}
            </div>
            <h1 className="font-heading text-3xl text-navy">{product.name}</h1>
            <div className="mt-2">
              <ProductRating rating={product.rating ?? 0} reviewCount={product.reviewCount ?? 0} />
            </div>
            <div className="mt-4">
              <ProductPrice price={product.price} compareAtPrice={product.compareAtPrice} />
            </div>
            <p className="mt-4 text-sm text-slate-600">{product.description}</p>
            <div className="mt-6 flex items-center gap-4">
              <Button className="flex-1 rounded-full">Add to Cart</Button>
              <Button variant="outline" className="rounded-full">
                Add to Wishlist
              </Button>
            </div>
            <div className="mt-6 rounded-2xl border border-border bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                <strong className="text-navy">Free Shipping</strong> on orders above ₹999
              </p>
              <p className="text-sm text-slate-600 mt-1">
                <strong className="text-navy">Easy Returns</strong> within 7 days
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
