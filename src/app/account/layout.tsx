'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/features/auth/components/logout-button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores';

const navigation = [
  { name: 'My Profile', href: '/account' },
  { name: 'My Orders', href: '/account/orders' },
  { name: 'My Addresses', href: '/account/addresses' },
  { name: 'Settings', href: '/account/settings' },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1440px] px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-3xl text-navy">My Account</h1>
          <p className="text-sm text-slate-600">Welcome, {user?.name || 'Guest'}</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row">
          <aside className="md:w-56">
            <nav className="flex flex-col gap-1">
              {navigation.map((item) => {
                const isActive =
                  item.href === '/account'
                    ? pathname === '/account'
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-navy text-white'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-navy',
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-6">
              <LogoutButton />
            </div>
          </aside>

          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
