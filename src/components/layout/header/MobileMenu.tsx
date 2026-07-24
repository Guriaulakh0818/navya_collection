'use client';

import { useState } from 'react';
import Link from 'next/link';

import { HeaderActions as Actions } from './HeaderActions';
import { HeaderNavigation } from './HeaderNavigation';
import { HeaderSearch } from './HeaderSearch';

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

const menuItems = [
  { href: '/shop', label: 'Shop' },
  { href: '/account', label: 'Account' },
];

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  if (!open) return null;

  return (
    <div className="md:hidden">
      <div className="mx-auto max-w-[1440px] px-4 py-4">
        {searchOpen ? (
          <div className="mb-4">
            <HeaderSearch className="w-full" />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="mt-2 text-xs font-medium text-slate-600"
            >
              Close search
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="mb-4 w-full rounded-full border border-border px-4 py-2 text-left text-sm text-slate-600"
          >
            Search...
          </button>
        )}

        <nav className="flex flex-col gap-3">
          <HeaderNavigation />
          <div className="border-t border-border pt-3">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-sm font-medium text-slate-600"
                onClick={onClose}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="pt-2">
            <Actions className="flex items-center gap-2" />
          </div>
        </nav>
      </div>
    </div>
  );
}
