'use client';

import { Menu } from 'lucide-react';
import type { ReactNode } from 'react';

import { HeaderActions } from './HeaderActions';
import { HeaderLogo } from './HeaderLogo';
import { HeaderNavigation } from './HeaderNavigation';
import { HeaderSearch } from './HeaderSearch';
import { HeaderWrapper } from './HeaderWrapper';

type HeaderProps = {
  children?: ReactNode;
};

export function Header({ children }: HeaderProps) {
  return (
    <HeaderWrapper>
      {({ openMobile }) => (
        <>
          {/* Single-Line Header Bar */}
          <div className="mx-auto max-w-[1440px] px-4 md:px-6 h-16 md:h-20 flex items-center justify-between gap-3 lg:gap-6">
            {/* Extreme Left: Mobile button + Logo */}
            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              <button
                type="button"
                onClick={openMobile}
                className="lg:hidden inline-flex items-center justify-center rounded-full p-2 text-slate-700 hover:bg-slate-100 hover:text-navy transition-colors"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
              <HeaderLogo />
            </div>

            {/* Next right to logo: Search Bar */}
            <div className="hidden sm:block w-[180px] md:w-[220px] lg:w-[240px] xl:w-[320px] shrink-0">
              <HeaderSearch className="w-full" />
            </div>

            {/* Next right to search bar: All Navigation items */}
            <div className="hidden lg:flex items-center flex-1 justify-start ml-2 xl:ml-4">
              <HeaderNavigation />
            </div>

            {/* Extreme Right: Wishlist, Cart & Account Icons */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">
              <HeaderActions />
            </div>
          </div>

          {/* Mobile Search Row for small screens (< sm) */}
          <div className="sm:hidden px-4 pb-3 pt-1 border-t border-slate-100 bg-slate-50/50">
            <HeaderSearch className="w-full" />
          </div>

          {children}
        </>
      )}
    </HeaderWrapper>
  );
}
