import { Building2, ChevronRight, MapPin, ShieldCheck, Sparkles, Store } from 'lucide-react';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface RecentlyAddedShopsProps {
  shops: any[];
}

export const RecentlyAddedShops = React.memo(function RecentlyAddedShops({
  shops,
}: RecentlyAddedShopsProps) {
  if (!shops || shops.length === 0) return null;

  return (
    <section className="space-y-6 my-12 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight">
              Bharat Ki Nayi Online Local Kapdo Ki Dukane
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Har Gali, Har Shehar Ki Local Kapdo Ki Dukano Ko Online Digital Pehchan Dena Hamara Main
            Mission Hai.
          </p>
        </div>

        <Link
          href="/become-seller"
          className="text-xs text-amber-700 hover:text-amber-600 font-extrabold flex items-center gap-1 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-xl shadow-xs transition-colors"
        >
          Join as Seller <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {shops.map((shop) => (
          <Link
            key={shop.id}
            href={`/shop/${shop.slug}`}
            className="p-4 bg-slate-50/70 border border-slate-200 hover:border-amber-500/50 hover:bg-white rounded-2xl transition-all flex items-center justify-between gap-3 group shadow-xs hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 shrink-0 relative overflow-hidden flex items-center justify-center text-amber-700 shadow-xs">
                {shop.logo ? (
                  <Image
                    src={shop.logo}
                    alt={shop.name}
                    fill
                    sizes="48px"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <Building2 className="w-6 h-6" />
                )}
              </div>

              <div>
                <h4 className="font-extrabold text-navy text-sm group-hover:text-amber-600 transition-colors line-clamp-1">
                  {shop.name}
                </h4>
                <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5 font-medium">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" /> {shop.city || 'Hisar'}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-amber-700 font-semibold">Verified Store</span>
                </div>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>
    </section>
  );
});
