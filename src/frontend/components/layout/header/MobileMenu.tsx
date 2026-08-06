'use client';

import {
  Baby,
  ChevronRight,
  Grid,
  Home,
  PhoneCall,
  Shirt,
  ShoppingBag,
  Store,
  User,
  X,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import Link from 'next/link';

import { useAuthStore } from '@/stores';

import { HeaderLogo } from './HeaderLogo';

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const user = useAuthStore((s) => s.user);
  const [selectedItem, setSelectedItem] = useState<string>('Home');
  const [mounted, setMounted] = useState(() => typeof window !== 'undefined');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [open]);

  if (!open || !mounted) return null;

  const menuItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Shop', href: '/shop', icon: ShoppingBag },
    { label: 'Gents Wear', href: '/shop?category=gents', icon: Shirt },
    { label: 'Kids Wear', href: '/shop?category=kids', icon: Baby },
    { label: 'Categories', href: '/shop', icon: Grid },
    { label: 'Become Seller ✨', href: '/become-seller', icon: Store },
    { label: 'My Account', href: user ? '/account' : '/login', icon: User },
    { label: 'Contact Us', href: '/contact', icon: PhoneCall },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[999999] lg:hidden flex justify-end animate-in fade-in duration-200">
      {/* Dark Overlay Background - Clicking outside closes menu */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-In Menu Drawer from Right */}
      <div className="relative w-[85%] max-w-[360px] bg-white h-[100dvh] max-h-[100dvh] flex flex-col justify-between p-4 sm:p-5 overflow-hidden select-none shadow-2xl z-10 animate-in slide-in-from-right duration-300">
        {/* 1. TOP HEADER ROW */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <HeaderLogo />

          <button
            onClick={onClose}
            className="p-1.5 text-slate-600 hover:text-navy transition-colors cursor-pointer rounded-full hover:bg-slate-100 active:scale-95"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* 2. NAVIGATION OPTIONS */}
        <div className="flex-1 py-3 space-y-1 overflow-y-auto min-h-0 scrollbar-thin">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedItem === item.label;

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => {
                  setSelectedItem(item.label);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#183A73]/10 text-[#183A73] font-extrabold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-[#183A73]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isSelected ? 'text-[#183A73]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Link>
            );
          })}
        </div>

        {/* 3. BOTTOM CTA BUTTONS */}
        <div className="space-y-2 shrink-0 pt-3 border-t border-slate-100">
          <Link
            href="/shop?category=gents"
            onClick={onClose}
            className="w-full block bg-[#F15A25] hover:bg-[#F15A25]/90 text-white font-extrabold text-xs tracking-wider uppercase py-3 rounded-2xl text-center shadow-md transition-all active:scale-[0.98]"
          >
            EXPLORE GENTS COLLECTION
          </Link>

          <Link
            href={user ? '/account' : '/login'}
            onClick={onClose}
            className="w-full block bg-[#183A73] hover:bg-[#183A73]/90 text-white font-extrabold text-xs tracking-wider uppercase py-3 rounded-2xl text-center shadow-md transition-all active:scale-[0.98]"
          >
            {user ? `MY ACCOUNT (${user.name || 'PROFILE'})` : 'SIGN IN WITH EMAIL OTP'}
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}
