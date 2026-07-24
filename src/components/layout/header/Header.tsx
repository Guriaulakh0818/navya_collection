'use client';

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
      <HeaderLogo />
      <HeaderSearch className="hidden md:block flex-1 max-w-md" />
      <HeaderNavigation />
      <HeaderActions className="hidden md:flex" />
      {children}
    </HeaderWrapper>
  );
}
