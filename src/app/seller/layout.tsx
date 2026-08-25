'use client';

import {
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Palmtree,
  Settings,
  ShoppingBag,
  Store,
  User,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { NotificationBell } from '@/components/notifications/NotificationBell';
import { SellerStatusView } from '@/frontend/features/seller/components/SellerStatusView';
import { useAuthStore, useCartStore, useWishlistStore } from '@/stores';

const SELLER_NAV = [
  { name: 'Dashboard', href: '/seller/dashboard', icon: LayoutDashboard },
  { name: 'Sales Analytics', href: '/seller/analytics', icon: BarChart3 },
  { name: 'Financial Payouts', href: '/seller/finance/payouts', icon: Landmark },
  { name: 'Apply Leave (Vacation)', href: '/seller/shop?tab=vacation', icon: Palmtree },
  { name: 'Shop Customization', href: '/seller/shop', icon: Store },
  { name: 'Products Catalog', href: '/seller/products', icon: ShoppingBag },
  { name: 'Vendor Orders', href: '/seller/orders', icon: Package },
  { name: 'Merchant Profile', href: '/seller/profile', icon: User },
  { name: 'Settings & Bank', href: '/seller/settings', icon: Settings },
];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sellerData, setSellerData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSellerStatus = async () => {
    try {
      const res = await fetch('/api/v1/seller/status');
      const data = await res.json();
      if (data.success) {
        setSellerData(data.data);
      } else {
        setSellerData(null);
      }
    } catch {
      setSellerData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerStatus();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } catch {
      // Ignore
    }
    useAuthStore.getState().logout();
    try {
      useCartStore.getState().resetLocalCart();
    } catch {}
    try {
      useWishlistStore.getState().resetLocalWishlist();
    } catch {}
    window.location.href = '/login';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-slate-700 gap-3">
        <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold">Authenticating Merchant Portal...</span>
      </div>
    );
  }

  // If user has submitted a seller application but is pending approval
  if (sellerData && !sellerData.isApproved) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 flex flex-col justify-center items-center">
        <div className="w-full max-w-4xl">
          <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4">
            <h1 className="text-xl font-extrabold text-navy flex items-center gap-2">
              <Store className="w-6 h-6 text-amber-600" />
              Navya Collection Merchant Portal
            </h1>
            <button
              onClick={handleLogout}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-bold cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-600" /> Sign Out
            </button>
          </div>

          <SellerStatusView
            statusData={sellerData}
            onRefresh={fetchSellerStatus}
            onStartNew={() => router.push('/become-seller')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200 bg-slate-50/50">
          <Link href="/seller/dashboard" className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-navy" />
            <span className="font-extrabold text-navy text-lg tracking-tight">Merchant Portal</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-500 hover:text-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Merchant Info Pill */}
        <div className="p-4 mx-4 my-4 rounded-xl bg-slate-100/80 border border-slate-200">
          <span className="text-xs font-bold text-slate-900 block truncate">
            {sellerData?.shop?.name || 'Navya Merchant Shop'}
          </span>
          <span className="text-[10px] text-emerald-600 font-mono mt-0.5 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            VERIFIED MERCHANT
          </span>
        </div>

        <nav className="space-y-1.5 px-4">
          {SELLER_NAV.map((item) => {
            const Icon = item.icon;
            let isActive = false;
            if (item.href === '/seller/shop?tab=vacation') {
              isActive =
                pathname === '/seller/shop' &&
                typeof window !== 'undefined' &&
                window.location.search.includes('tab=vacation');
            } else if (item.href === '/seller/shop') {
              isActive =
                pathname === '/seller/shop' &&
                (typeof window === 'undefined' || !window.location.search.includes('tab=vacation'));
            } else {
              isActive =
                pathname === item.href ||
                (item.href !== '/seller/dashboard' && pathname.startsWith(item.href));
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-navy text-white shadow-md shadow-navy/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        {/* Top Merchant Header Bar */}
        <header className="h-16 bg-white/95 border-b border-slate-200 sticky top-0 z-30 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-600 font-medium">
                Store:{' '}
                <strong className="text-navy font-extrabold">
                  {sellerData?.shop?.name || 'My Boutique Shop'}
                </strong>
              </span>
              <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 ml-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ACTIVE VENDOR
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/seller/products/new"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>+ Add Product</span>
            </Link>

            <Link
              href={sellerData?.shop?.slug ? `/shop/${sellerData.shop.slug}` : '/shop'}
              target="_blank"
              className="text-xs text-navy hover:text-amber-600 font-bold hidden sm:flex items-center gap-1 transition-colors bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200"
            >
              <span>View Storefront</span> ↗
            </Link>

            <NotificationBell userId={sellerData?.userId} />

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
