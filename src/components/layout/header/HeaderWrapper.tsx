'use client';

import { Menu } from 'lucide-react';
import { useCallback, useState, type ReactNode } from 'react';

import { MobileMenu } from './MobileMenu';

type HeaderWrapperProps = {
  children: ReactNode;
};

export function HeaderWrapper({ children }: HeaderWrapperProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const openMobile = useCallback(() => setIsMobileOpen(true), []);
  const closeMobile = useCallback(() => setIsMobileOpen(false), []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-sm transition-all">
      <div className="mx-auto max-w-[1440px] px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        {children}
        <button
          type="button"
          onClick={openMobile}
          className="lg:hidden inline-flex items-center justify-center rounded-full p-2 text-slate-700 hover:bg-slate-100 hover:text-navy transition-colors"
          aria-label="Open mobile menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <MobileMenu open={isMobileOpen} onClose={closeMobile} />
    </header>
  );
}
