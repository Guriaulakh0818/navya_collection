import { CheckCircle2, PackageCheck } from 'lucide-react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Order Confirmed | JiivaaKart',
  description: 'Your order has been placed successfully.',
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  searchParams: Promise<{ orderNumber?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const displayOrderNumber =
    resolvedParams?.orderNumber || `JK-2026-${Date.now().toString().slice(-6)}`;
  const estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(
    'en-IN',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <div className="mx-auto max-w-2xl px-4 md:px-6 py-12 sm:py-16 text-center space-y-6">
        {/* Celebratory Jiivaa Mascot sitting on Delivery Box */}
        <div className="relative mx-auto w-40 h-48 sm:w-48 sm:h-56 flex items-center justify-center">
          <div className="absolute inset-0 bg-radial from-orange/25 via-orange/5 to-transparent rounded-full blur-2xl pointer-events-none" />
          <Image
            src="/brand/jiivaa/crops/journey/hero-sitting-box-thumbsup-transparent.png"
            alt="Jiivaa - Order Placed Celebration"
            width={325}
            height={425}
            className="relative z-10 w-full h-full object-contain drop-shadow-lg select-none"
            priority
          />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Order Placed Successfully!</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-4xl font-black text-navy tracking-tight">
            Shaandaar Choice!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Thank you for shopping with JiivaaKart. Local Indian boutique partners are preparing
            your package!
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-left max-w-lg mx-auto space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-xs font-bold text-navy">
            <PackageCheck className="w-4 h-4 text-orange" />
            <span>Delivery &amp; Package Details</span>
          </div>

          <div className="space-y-2.5 text-xs sm:text-sm text-slate-600">
            <div className="flex justify-between items-center">
              <span>Order Number</span>
              <span className="font-mono font-bold text-navy">{displayOrderNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Estimated Delivery</span>
              <span className="font-semibold text-navy">{estimatedDelivery}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Payment Mode</span>
              <span className="font-semibold text-emerald-600">Cash on Delivery (Verified)</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            className="rounded-full bg-orange hover:bg-orange-600 text-white font-bold text-xs px-6 py-2.5 shadow-md shadow-orange/25 w-full sm:w-auto"
            asChild
          >
            <Link href="/account/orders">Track My Parcel &rarr;</Link>
          </Button>
          <Button
            variant="outline"
            className="rounded-full border border-slate-300 text-navy font-bold text-xs px-6 py-2.5 w-full sm:w-auto"
            asChild
          >
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
