import Image from 'next/image';
import Link from 'next/link';

import { BRAND_ASSETS } from '@/shared/config/brand-assets';

export function HeaderLogo() {
  return (
    <Link
      href="/"
      className="flex items-center shrink-0 group py-1 focus-visible:outline-2 focus-visible:outline-navy rounded-lg"
      aria-label="JiivaaKart Home"
    >
      <div className="relative h-10 sm:h-11 md:h-12 lg:h-[52px] w-[86px] sm:w-[95px] md:w-[104px] lg:w-[112px] transition-transform group-hover:scale-[1.02] -translate-y-0.5 sm:-translate-y-1 md:-translate-y-1.5">
        <Image
          src={BRAND_ASSETS.logoHorizontal}
          alt="JiivaaKart"
          fill
          priority
          sizes="(max-width: 640px) 86px, (max-width: 768px) 95px, (max-width: 1024px) 104px, 112px"
          className="object-contain object-left"
        />
      </div>
    </Link>
  );
}
