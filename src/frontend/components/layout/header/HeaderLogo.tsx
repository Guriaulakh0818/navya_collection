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
      <div className="relative h-8 sm:h-9 md:h-10 lg:h-11 w-[98px] sm:w-[115px] md:w-[130px] lg:w-[145px] transition-transform group-hover:scale-[1.02]">
        <Image
          src={BRAND_ASSETS.logoHorizontal}
          alt="JiivaaKart"
          fill
          priority
          sizes="(max-width: 640px) 98px, (max-width: 768px) 115px, (max-width: 1024px) 130px, 145px"
          className="object-contain object-left"
        />
      </div>
    </Link>
  );
}
