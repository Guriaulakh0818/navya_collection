import Image from 'next/image';

import { BRAND_ASSETS } from '@/shared/config/brand-assets';

type FooterBottomProps = {
  logo?: React.ReactNode;
  legal?: React.ReactNode;
  social?: React.ReactNode;
};

export function FooterBottom({ logo, social }: FooterBottomProps) {
  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-6 md:flex-row">
      {logo || (
        <div className="flex items-center gap-2.5">
          <div className="relative h-9 w-9 rounded-full overflow-hidden border border-slate-200 bg-white p-1 shrink-0 shadow-xs">
            <Image
              src={BRAND_ASSETS.monogram}
              alt="JiivaaKart"
              fill
              className="object-contain p-0.5"
            />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-navy">JiivaaKart</div>
            <div className="text-xs text-slate-500">
              © {new Date().getFullYear()} JiivaaKart Private Limited
            </div>
          </div>
        </div>
      )}
      {social}
    </div>
  );
}
