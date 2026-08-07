'use client';

import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  Eye,
  Layers,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tag,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export interface AdminDashboardData {
  stats: {
    totalRevenue: number;
    adminCommissionEarned: number;
    pendingSellersCount: number;
    pendingProductsCount: number;
    activeShopsCount: number;
    totalOrdersCount: number;
    totalCustomersCount: number;
    pendingPayoutsAmount: number;
  };
  pendingSellers: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    createdAt: string;
    ownerName: string;
    ownerEmail: string;
    ownerMobile?: string;
    city?: string;
  }>;
  pendingProducts: Array<{
    id: string;
    title: string;
    price: number;
    category?: string;
    shopName: string;
    createdAt: string;
    imageUrl?: string;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    shopName: string;
    totalAmount: number;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    createdAt: string;
  }>;
  recentShops: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    ownerName: string;
    createdAt: string;
  }>;
}

interface AdminDashboardClientProps {
  initialData: AdminDashboardData;
}

export function AdminDashboardClient({ initialData }: AdminDashboardClientProps) {
  const [data, setData] = useState<AdminDashboardData>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'moderation' | 'financials' | 'orders' | 'modules'>(
    'moderation',
  );
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/v1/admin/dashboard/stats', { cache: 'no-store' });
      if (res.ok) {
        const fresh = await res.json();
        if (fresh.success && fresh.data) {
          setData(fresh.data);
        }
      }
    } catch (e) {
      console.error('Failed to refresh dashboard stats:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleQuickApproveSeller = async (shopId: string, shopName: string) => {
    try {
      const res = await fetch('/api/v1/admin/sellers/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, commissionRate: 10 }),
      });
      if (res.ok) {
        setActionSuccessMessage(`Shop "${shopName}" approved successfully!`);
        setData((prev) => ({
          ...prev,
          stats: {
            ...prev.stats,
            pendingSellersCount: Math.max(0, prev.stats.pendingSellersCount - 1),
            activeShopsCount: prev.stats.activeShopsCount + 1,
          },
          pendingSellers: prev.pendingSellers.filter((s) => s.id !== shopId),
        }));
        setTimeout(() => setActionSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error('Failed to approve seller:', err);
    }
  };

  const handleQuickApproveProduct = async (productId: string, productTitle: string) => {
    try {
      const res = await fetch('/api/v1/admin/products/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, action: 'APPROVE' }),
      });
      if (res.ok) {
        setActionSuccessMessage(`Product "${productTitle}" approved!`);
        setData((prev) => ({
          ...prev,
          stats: {
            ...prev.stats,
            pendingProductsCount: Math.max(0, prev.stats.pendingProductsCount - 1),
          },
          pendingProducts: prev.pendingProducts.filter((p) => p.id !== productId),
        }));
        setTimeout(() => setActionSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error('Failed to approve product:', err);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* SUCCESS TOAST ALERT */}
      {actionSuccessMessage && (
        <div className="bg-emerald-500 text-slate-950 px-4 py-3 rounded-2xl shadow-xl font-bold text-sm flex items-center justify-between animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-slate-950/70 hover:text-slate-950"
          >
            ✕
          </button>
        </div>
      )}

      {/* HEADER BANNER - Deep Navy & Amber Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-navy border border-slate-200 p-6 md:p-8 text-white shadow-lg">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Navya Governance Suite
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Synchronization
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight mt-3 text-white">
              Executive Governance Command Center
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl font-medium">
              Monitor multi-vendor marketplace revenue, seller onboarding approvals, catalog quality
              moderation, and financial payouts in real time.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2 backdrop-blur-md cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              <span>{isRefreshing ? 'Updating...' : 'Sync Data'}</span>
            </button>

            <Link
              href="/"
              target="_blank"
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2"
            >
              <span>View Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* URGENT GOVERNANCE ALERT BAR */}
      {(data.stats.pendingSellersCount > 0 || data.stats.pendingProductsCount > 0) && (
        <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-amber-900 dark:text-amber-300">
                Action Required: Pending Approvals in Queue
              </h4>
              <p className="text-xs text-amber-800/80 dark:text-amber-400/80 mt-0.5">
                {data.stats.pendingSellersCount > 0 &&
                  `${data.stats.pendingSellersCount} Seller Application(s)`}
                {data.stats.pendingSellersCount > 0 &&
                  data.stats.pendingProductsCount > 0 &&
                  ' and '}
                {data.stats.pendingProductsCount > 0 &&
                  `${data.stats.pendingProductsCount} Product Catalog Upload(s)`}{' '}
                await administrative review.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('moderation')}
            className="px-4 py-2 bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl hover:bg-amber-400 transition-all shrink-0"
          >
            Review Now →
          </button>
        </div>
      )}

      {/* 6 TOP KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Gross GMV */}
        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3 relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Gross GMV
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">
              ₹{data.stats.totalRevenue.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> +14.2% GMV Volume
            </p>
          </div>
        </div>

        {/* Net Commission */}
        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3 relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Net Commission
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">
              ₹{data.stats.adminCommissionEarned.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] font-semibold text-indigo-600 mt-1">Platform Revenue</p>
          </div>
        </div>

        {/* Pending Sellers */}
        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3 relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Seller Queue
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-slate-900">{data.stats.pendingSellersCount}</p>
              {data.stats.pendingSellersCount > 0 && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-extrabold">
                  Action Needed
                </span>
              )}
            </div>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">Applications Pending</p>
          </div>
        </div>

        {/* Pending Products */}
        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3 relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Product Queue
            </span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-slate-900">
                {data.stats.pendingProductsCount}
              </p>
              {data.stats.pendingProductsCount > 0 && (
                <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded-full text-[10px] font-extrabold">
                  Review
                </span>
              )}
            </div>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">Products Pending</p>
          </div>
        </div>

        {/* Active Boutiques */}
        <Link
          href="/admin/shops"
          className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3 relative overflow-hidden group hover:border-slate-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Stores
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{data.stats.activeShopsCount}</p>
            <p className="text-[11px] font-semibold text-purple-600 mt-1">
              View All Shops ({data.stats.activeShopsCount}) →
            </p>
          </div>
        </Link>

        {/* Registered Customers */}
        <Link
          href="/admin/users"
          className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3 relative overflow-hidden group hover:border-slate-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Registered Users
            </span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{data.stats.totalCustomersCount}</p>
            <p className="text-[11px] font-semibold text-rose-600 mt-1">View Users Directory →</p>
          </div>
        </Link>
      </div>

      {/* INTERACTIVE TAB NAVIGATION */}
      <div className="border-b border-slate-200 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('moderation')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'moderation'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Moderation & Onboarding Queue</span>
          {(data.stats.pendingSellersCount > 0 || data.stats.pendingProductsCount > 0) && (
            <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-extrabold rounded-full">
              {data.stats.pendingSellersCount + data.stats.pendingProductsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('financials')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'financials'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Financials & Payouts</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Recent Marketplace Orders</span>
        </button>

        <button
          onClick={() => setActiveTab('modules')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'modules'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Governance Modules & Tools</span>
        </button>
      </div>

      {/* TAB 1: MODERATION & ONBOARDING QUEUE */}
      {activeTab === 'moderation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PENDING SELLER APPLICATIONS */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Pending Seller Registrations
                </h3>
              </div>
              <Link
                href="/admin/sellers"
                className="text-xs font-bold text-amber-600 hover:underline"
              >
                View All ({data.pendingSellers.length}) →
              </Link>
            </div>

            {data.pendingSellers.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/40" />
                <p className="text-xs font-bold text-slate-600">No Pending Seller Applications</p>
                <p className="text-[11px]">
                  All seller onboardings have been verified and processed.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.pendingSellers.map((seller) => (
                  <div
                    key={seller.id}
                    className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 truncate">
                          {seller.name}
                        </span>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md uppercase">
                          {seller.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        Owner: {seller.ownerName} ({seller.ownerEmail})
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Submitted: {new Date(seller.createdAt).toLocaleDateString('en-IN')}{' '}
                        {seller.city && `| ${seller.city}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleQuickApproveSeller(seller.id, seller.name)}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-xs"
                      >
                        Approve
                      </button>
                      <Link
                        href={`/admin/sellers/${seller.id}`}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1"
                      >
                        <span>Inspect</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PENDING PRODUCT CATALOG APPROVALS */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-sky-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Pending Product Moderation
                </h3>
              </div>
              <Link
                href="/admin/products"
                className="text-xs font-bold text-sky-600 hover:underline"
              >
                Manage Catalog →
              </Link>
            </div>

            {data.pendingProducts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/40" />
                <p className="text-xs font-bold text-slate-600">Catalog Fully Moderated</p>
                <p className="text-[11px]">No products currently awaiting moderation.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.pendingProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {prod.imageUrl ? (
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                          <Image
                            src={prod.imageUrl}
                            alt={prod.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0">
                          PROD
                        </div>
                      )}
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-bold text-xs text-slate-900 truncate">{prod.title}</p>
                        <p className="text-[11px] text-amber-700 font-extrabold">
                          ₹{prod.price.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">Shop: {prod.shopName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleQuickApproveProduct(prod.id, prod.title)}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-xs"
                      >
                        Approve
                      </button>
                      <Link
                        href="/admin/products"
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-all"
                      >
                        Inspect
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: FINANCIALS & PAYOUTS */}
      {activeTab === 'financials' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-lg text-navy">Platform Financial Summary</h3>
              <p className="text-xs text-slate-500 font-medium">
                Marketplace sales volume, admin commissions, and seller settlement balances.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/finance/commission"
                className="px-4 py-2 bg-amber-50 text-amber-900 border border-amber-300 font-extrabold text-xs rounded-xl hover:bg-amber-100 transition-all cursor-pointer shadow-2xs"
              >
                Commission Rates
              </Link>
              <Link
                href="/admin/finance/settlements"
                className="px-4 py-2 bg-navy hover:bg-navy-hover text-white font-extrabold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Manage Payouts →
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-2 hover:border-amber-300 transition-all shadow-xs">
              <p className="text-xs text-navy font-extrabold uppercase tracking-wider">
                Gross Platform Sales (GMV)
              </p>
              <p className="text-3xl font-black text-amber-600 font-mono">
                ₹{data.stats.totalRevenue.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Total gross value processed across all boutiques.
              </p>
            </div>

            <div className="p-6 bg-emerald-50/60 border border-emerald-200 rounded-3xl space-y-2 hover:border-emerald-300 transition-all shadow-xs">
              <p className="text-xs text-emerald-900 font-extrabold uppercase tracking-wider">
                Net Admin Commission Revenue
              </p>
              <p className="text-3xl font-black text-emerald-700 font-mono">
                ₹{data.stats.adminCommissionEarned.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-emerald-700/80 font-medium">
                Net platform fee retained after vendor settlement payouts.
              </p>
            </div>

            <div className="p-6 bg-amber-50/60 border border-amber-200 rounded-3xl space-y-2 hover:border-amber-300 transition-all shadow-xs">
              <p className="text-xs text-amber-900 font-extrabold uppercase tracking-wider">
                Pending Seller Payout Balance
              </p>
              <p className="text-3xl font-black text-amber-700 font-mono">
                ₹{data.stats.pendingPayoutsAmount.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-amber-700/80 font-medium">
                Balance queued for bi-weekly merchant bank transfer payouts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RECENT MARKETPLACE ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Recent Marketplace Orders Stream
              </h3>
              <p className="text-xs text-slate-500">
                Live order fulfillment stream across all verified boutique shops.
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-extrabold text-amber-600 hover:underline"
            >
              View All Orders →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-extrabold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Boutique Shop</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Fulfillment Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-navy">{ord.orderNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{ord.customerName}</td>
                    <td className="py-3 px-4 text-slate-600">{ord.shopName}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ₹{ord.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-extrabold rounded-md">
                        {ord.paymentMethod} ({ord.paymentStatus})
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full ${
                          ord.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'SHIPPED'
                              ? 'bg-sky-100 text-sky-800'
                              : ord.status === 'CANCELLED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(ord.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: GOVERNANCE MODULES & SHORTCUTS */}
      {activeTab === 'modules' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/sellers"
            className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-amber-500 hover:shadow-lg transition-all space-y-3 group"
          >
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl w-fit group-hover:scale-110 transition-transform">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-amber-600 transition-colors">
                Seller Onboarding & Directory
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Review merchant KYC documents, approve shops, manage commission tiers.
              </p>
            </div>
          </Link>

          <Link
            href="/admin/products"
            className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-sky-500 hover:shadow-lg transition-all space-y-3 group"
          >
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl w-fit group-hover:scale-110 transition-transform">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-sky-600 transition-colors">
                Product Catalog Moderation
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Inspect new catalog listings, verify images, approve or reject products.
              </p>
            </div>
          </Link>

          <Link
            href="/admin/finance/commission"
            className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 hover:shadow-lg transition-all space-y-3 group"
          >
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">
                Commission Rates & Rules
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Set category commission percentages and special boutique pricing rules.
              </p>
            </div>
          </Link>

          <Link
            href="/admin/finance/settlements"
            className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-purple-500 hover:shadow-lg transition-all space-y-3 group"
          >
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl w-fit group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-purple-600 transition-colors">
                Payout Settlements
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Process vendor settlement balances, transfer funds to seller bank accounts.
              </p>
            </div>
          </Link>

          <Link
            href="/admin/categories"
            className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-lg transition-all space-y-3 group"
          >
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                Category Architecture
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Manage main categories, sub-categories, attributes, and navigation trees.
              </p>
            </div>
          </Link>

          <Link
            href="/admin/coupons"
            className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-rose-500 hover:shadow-lg transition-all space-y-3 group"
          >
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl w-fit group-hover:scale-110 transition-transform">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-rose-600 transition-colors">
                Promotions & Coupons
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Create discount codes, festive sale campaigns, and minimum cart rules.
              </p>
            </div>
          </Link>

          <Link
            href="/admin/reviews"
            className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-amber-500 hover:shadow-lg transition-all space-y-3 group"
          >
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl w-fit group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-amber-600 transition-colors">
                Customer Reviews & Ratings
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Moderate customer reviews, flag inappropriate content, verify purchase badges.
              </p>
            </div>
          </Link>

          <Link
            href="/admin/team"
            className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-teal-500 hover:shadow-lg transition-all space-y-3 group"
          >
            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl w-fit group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-teal-600 transition-colors">
                Team Roles & Security
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Manage admin team members, assign access permissions, view security audit logs.
              </p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
