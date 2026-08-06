'use client';

import { DesktopNav } from './DesktopNav';

export function Navbar() {
  return (
    <div className="border-b border-border bg-white">
      <div className="mx-auto max-w-[1440px] px-4 md:px-6">
        <DesktopNav />
      </div>
    </div>
  );
}
