import { Product } from '@/features/public/lib/types';
import { Card } from '@/components/ui/card';

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="flex flex-col">
      <div className="rounded-[20px] bg-gradient-to-br from-sky-50 to-orange-50 p-8 text-center">
        <div className="mx-auto h-24 w-24 rounded-full bg-white shadow-sm" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        {product.tag && (
          <span className="rounded-full bg-orange/10 px-3 py-1 text-xs font-bold text-orange">{product.tag}</span>
        )}
        <span className="font-semibold text-navy">₹{product.price.toLocaleString('en-IN')}</span>
      </div>
      <h3 className="mt-4 font-heading text-xl text-navy">{product.name}</h3>
      <p className="mt-2 flex-1 text-sm text-slate-600">{product.description}</p>
      <a
        href={`/product/${product.id}`}
        className="mt-4 inline-flex w-full justify-center rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-[#234b8f]"
      >
        View Details
      </a>
    </Card>
  );
}
