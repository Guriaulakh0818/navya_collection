import { Building2, MapPin, Sparkles } from 'lucide-react';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { HorizontalCarousel } from '@/frontend/components/ui/HorizontalCarousel';

interface RecentlyAddedShopsProps {
  shops: any[];
}

export const RecentlyAddedShops = React.memo(function RecentlyAddedShops({
  shops,
}: RecentlyAddedShopsProps) {
  if (!shops || shops.length === 0) return null;

  return (
    <HorizontalCarousel
      title="Bharat Ki Nayi Online Local Kapdo Ki Dukane"
      subtitle="Har Gali, Har Shehar Ki Local Kapdo Ki Dukano Ko Online Digital Pehchan Dena Hamara Main Mission Hai."
      icon={<Sparkles className="w-5 h-5 text-amber-600" />}
      actionLink="/become-seller"
      actionText="Join as Seller"
      className="my-6 md:my-8 bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xs"
    >
      {shops.map((shop) => (
        <Link
          key={shop.id}
          href={`/shop/${shop.slug}`}
          className="p-3.5 sm:p-4 bg-slate-50/80 border border-slate-200 hover:border-amber-500/50 hover:bg-white rounded-2xl transition-all flex items-center justify-between gap-3 group shadow-xs hover:shadow-md w-[240px] xs:w-[270px] sm:w-[300px] shrink-0 snap-start"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 shrink-0 relative overflow-hidden flex items-center justify-center text-amber-700 shadow-xs select-none">
              {shop.logo ? (
                <Image
                  src={shop.logo}
                  alt={shop.name}
                  fill
                  sizes="44px"
                  className="w-full h-full object-cover rounded-xl select-none overflow-hidden [text-indent:-9999px]"
                />
              ) : (
                <Building2 className="w-5 h-5" />
              )}
            </div>

            <div className="min-w-0">
              <h4 className="font-extrabold text-navy text-xs sm:text-sm group-hover:text-amber-600 transition-colors truncate">
                {shop.name}
              </h4>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-0.5 font-medium truncate">
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 text-amber-600 shrink-0" /> {shop.city || 'Hisar'}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-amber-700 font-extrabold text-[10px]">Verified</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </HorizontalCarousel>
  );
});
