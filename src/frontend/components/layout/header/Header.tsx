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
          <div className="mx-auto max-w-[1440px] px-2 sm:px-4 md:px-6 h-16 md:h-20 flex items-center justify-between gap-1.5 sm:gap-2 lg:gap-3 xl:gap-4 w-full min-w-0">
            {/* Left: Logo */}
            <div className="flex items-center shrink-0">
              <HeaderLogo />
            </div>

            {/* Next right to logo: Search Bar - Expanded fluid width */}
            <div className="hidden sm:block flex-1 min-w-[120px] max-w-[480px]">
              <HeaderSearch className="w-full" />
            </div>

            {/* Next right to search bar: Navigation items - Responsive breakpoints */}
            <div className="hidden lg:flex items-center shrink-0 min-w-0">
              <HeaderNavigation />
            </div>

            {/* Far Right Container: Actions (Wishlist, Cart, Account) + Mobile Menu Drawer on phone */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto bg-slate-50/80 md:bg-transparent p-1 md:p-0 rounded-full border border-slate-200/60 md:border-none shadow-xs md:shadow-none min-w-0">
              <HeaderActions />

              {/* Mobile Drawer Trigger (Right Container on Phone & Tablet < lg) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openMobile();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openMobile();
                }}
                className="lg:hidden inline-flex items-center justify-center rounded-full p-2 sm:p-2.5 text-slate-700 hover:bg-slate-200/60 hover:text-navy active:scale-95 transition-all cursor-pointer"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Mobile Search Row for extra small screens (< sm) */}
          <div className="sm:hidden px-4 pb-3 pt-1 border-t border-slate-100 bg-slate-50/50">
            <HeaderSearch className="w-full" />
          </div>

          {children}
        </>
      )}
    </HeaderWrapper>
  );
}
