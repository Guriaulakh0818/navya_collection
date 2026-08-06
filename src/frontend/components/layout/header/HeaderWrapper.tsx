'use client';

import { Menu } from 'lucide-react';
import { useCallback, useState, type ReactNode } from 'react';

import { MobileMenu } from './MobileMenu';

type HeaderWrapperProps = {
  children: (props: { openMobile: () => void }) => ReactNode;
};

export function HeaderWrapper({ children }: HeaderWrapperProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const openMobile = useCallback(() => setIsMobileOpen(true), []);
  const closeMobile = useCallback(() => setIsMobileOpen(false), []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-brand-border bg-white/95 backdrop-blur-md shadow-card transition-all">
      {children({ openMobile })}
      <MobileMenu open={isMobileOpen} onClose={closeMobile} />
    </header>
  );
}
