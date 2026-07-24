'use client';

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
    <header className="border-b border-border bg-white">
      <div className="mx-auto max-w-[1440px] px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        {children}
        <button
          type="button"
          onClick={openMobile}
          className="md:hidden inline-flex items-center justify-center rounded-full p-2 text-slate-600 hover:text-navy"
          aria-label="Toggle menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>
      </div>

      <MobileMenu open={isMobileOpen} onClose={closeMobile} />
    </header>
  );
}
