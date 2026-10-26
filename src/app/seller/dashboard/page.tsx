'use client';

import {
  Building2,
  CheckCircle2,
  Clock,
  IndianRupee,
  Package,
  Plus,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Truck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const CACHE_KEY = 'navya_seller_dashboard_cache_v3';

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-slate-200">
        <div className="space-y-2">
          <div className="h-5 w-44 bg-slate-200/80 rounded-full" />
          <div className="h-8 w-60 bg-slate-200/80 rounded-xl" />
          <div className="h-4 w-96 max-w-full bg-slate-100 rounded" />
        </div>
        <div className="h-10 w-36 bg-slate-200/80 rounded-xl" />
      </div>

      {/* 4 Summary Metric Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-20 bg-slate-200/80 rounded" />
              <div className="w-8 h-8 rounded-xl bg-slate-100" />
            </div>
            <div className="h-7 w-24 bg-slate-200/80 rounded-lg" />
            <div className="h-3 w-28 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Analytics Charts & Trends Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-4 w-52 bg-slate-200/80 rounded" />
            <div className="h-5 w-20 bg-slate-100 rounded-full" />
          </div>
          <div className="h-48 flex items-end justify-between gap-4 border-b border-slate-100 pb-2">
            {[45, 70, 50, 85, 60, 75].map((h, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div style={{ height: `${h}%` }} className="w-full bg-slate-200/70 rounded-t-lg" />
                <div className="h-3 w-6 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="h-4 w-44 bg-slate-200/80 rounded" />
          <div className="space-y-4 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-3 w-24 bg-slate-200/80 rounded" />
                  <div className="h-3 w-8 bg-slate-200/80 rounded" />
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Vendor Orders Table Skeleton */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-44 bg-slate-200/80 rounded" />
          <div className="h-3.5 w-24 bg-slate-200/80 rounded" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-slate-50 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SellerDashboardPage() {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/v1/seller/dashboard');
      const result = await res.json();
      if (result.success && result.data) {
        setData(result.data);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(result.data));
        } catch {
          // Ignore storage errors
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch seller metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 1. Immediately hydrate with cached data if available (zero-second load)
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          setData(parsed);
          setIsLoading(false);
        }
      }
    } catch {
      // Ignore cache parse error
    }

    // 2. Fetch fresh live analytics in background
    fetchDashboardData();
  }, []);

  if (isLoading && !data) {
    return <DashboardSkeleton />;
  }

  const metrics = data?.metrics || {
    totalProducts: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalInventoryStock: 0,
  };

  const shop = data?.shop || {};
  const recentOrders = data?.recentOrders || [];
  const monthlyRevenue = data?.monthlyRevenue || [];
  const fulfillment = data?.fulfillment || {
    total: 0,
    delivered: { count: 0, percentage: 0 },
    pendingDispatch: { count: 0, percentage: 0 },
    returns: { count: 0, percentage: 0 },
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-navy/10 border border-navy/20 text-navy text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-navy" />
            Merchant Control Center
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5 sm:gap-3">
            <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-navy shrink-0" />
            <span>{shop.name || 'Merchant Dashboard'}</span>
          </h1>
          <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 mt-1 leading-relaxed">
            Real-time analytics overview, inventory stock levels, and order fulfillment status.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/seller/products"
            className="w-full sm:w-auto justify-center px-4 py-2 sm:py-2.5 bg-navy hover:bg-navy/90 text-white font-bold text-xs rounded-xl shadow-md shadow-navy/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add New Product
          </Link>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Products */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 hover:border-navy/30 transition-all shadow-sm">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
              Total Products
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-navy/10 border border-navy/20 flex items-center justify-center text-navy shrink-0">
              <ShoppingBag className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
            {metrics.totalProducts}
          </div>
          <p className="text-[9px] sm:text-[11px] text-slate-500 mt-1 truncate">
            Active boutique items
          </p>
        </div>

        {/* Card 2: Pending Orders */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 hover:border-navy/30 transition-all shadow-sm">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
              Pending Orders
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-orange/10 border border-orange/30 flex items-center justify-center text-orange shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-orange tracking-tight font-mono">
            {metrics.pendingOrders}
          </div>
          <p className="text-[9px] sm:text-[11px] text-slate-500 mt-1 truncate">
            Awaiting dispatch
          </p>
        </div>

        {/* Card 3: Total Revenue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 hover:border-navy/30 transition-all shadow-sm">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
              Net Revenue
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 shrink-0">
              <IndianRupee className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-emerald-600 tracking-tight font-mono">
            ₹{Number(metrics.totalRevenue || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[9px] sm:text-[11px] text-slate-500 mt-1 truncate">Net settlements</p>
        </div>

        {/* Card 4: Inventory Stock */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 hover:border-navy/30 transition-all shadow-sm">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
              Inventory Units
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-navy/10 border border-navy/20 flex items-center justify-center text-navy shrink-0">
              <Package className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
            {metrics.totalInventoryStock}
          </div>
          <p className="text-[9px] sm:text-[11px] text-slate-500 mt-1 truncate">Warehouse stock</p>
        </div>
      </div>

      {/* Analytics Charts & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Analytics Chart Bar */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-navy shrink-0" />
              <span>Monthly Sales Performance (6-Month Trend)</span>
            </h3>
            <span className="text-[10px] sm:text-xs text-navy font-semibold bg-navy/10 px-2.5 py-0.5 sm:py-1 rounded-full border border-navy/20 self-start sm:self-auto">
              Live Metrics
            </span>
          </div>

          <div className="h-48 pt-6 flex items-end justify-between gap-4 border-b border-slate-200 pb-2">
            {monthlyRevenue.map((item: any, idx: number) => {
              const maxRev = Math.max(...monthlyRevenue.map((m: any) => m.revenue), 1000);
              const heightPct =
                item.revenue > 0 ? Math.max(12, Math.min(100, (item.revenue / maxRev) * 100)) : 4;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div
                    className={`text-[10px] font-mono font-bold transition-all ${
                      item.revenue > 0
                        ? 'text-navy opacity-80 group-hover:opacity-100 group-hover:scale-110'
                        : 'text-slate-300 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    ₹{Number(item.revenue || 0).toLocaleString('en-IN')}
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t-lg transition-all group-hover:brightness-110 ${
                      item.revenue > 0
                        ? 'bg-gradient-to-t from-navy/40 via-navy/80 to-navy'
                        : 'bg-slate-100'
                    }`}
                  />
                  <span className="text-[10px] text-slate-500 font-semibold">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fulfillment Summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-navy shrink-0" />
              <span>Order Fulfillment Status</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              {fulfillment.total} Total Orders
            </span>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">Delivered Orders</span>
                <span className="text-emerald-600 font-bold">
                  {fulfillment.delivered.percentage}%
                  <span className="text-slate-400 font-normal ml-1">
                    ({fulfillment.delivered.count})
                  </span>
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${fulfillment.delivered.percentage}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">Pending Dispatch</span>
                <span className="text-orange font-bold">
                  {fulfillment.pendingDispatch.percentage}%
                  <span className="text-slate-400 font-normal ml-1">
                    ({fulfillment.pendingDispatch.count})
                  </span>
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-orange h-full rounded-full transition-all duration-500"
                  style={{ width: `${fulfillment.pendingDispatch.percentage}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">Returns & Exchanges</span>
                <span className="text-rose-600 font-bold">
                  {fulfillment.returns.percentage}%
                  <span className="text-slate-400 font-normal ml-1">
                    ({fulfillment.returns.count})
                  </span>
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${fulfillment.returns.percentage}%` }}
                />
              </div>
            </div>

            {fulfillment.total === 0 && (
              <p className="text-[11px] text-slate-400 pt-1 text-center font-medium">
                Live fulfillment percentages will automatically update as customer orders are placed
                and processed.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Vendor Orders Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-4">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-navy" />
            Recent Vendor Orders
          </h3>
          <Link
            href="/seller/orders"
            className="text-xs text-navy hover:text-navy/80 font-bold underline underline-offset-4"
          >
            View All Orders →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No recent vendor orders recorded yet. When customers order your shop products, orders
            will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-[10px] text-slate-500">
                <tr>
                  <th className="py-3.5 px-6 font-bold">Order Ref</th>
                  <th className="py-3.5 px-6 font-bold">Customer</th>
                  <th className="py-3.5 px-6 font-bold">Items Count</th>
                  <th className="py-3.5 px-6 font-bold">Total Amount</th>
                  <th className="py-3.5 px-6 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-all">
                    <td className="py-3.5 px-6 font-mono text-navy font-semibold">
                      {order.vendorOrderNumber ||
                        order.masterOrder?.orderNumber ||
                        order.id.substring(0, 10)}
                    </td>
                    <td className="py-3.5 px-6 font-medium text-slate-900">
                      {order.masterOrder?.user?.name || 'Customer'}
                    </td>
                    <td className="py-3.5 px-6">{order.items?.length || 1} Item(s)</td>
                    <td className="py-3.5 px-6 font-semibold text-emerald-600 font-mono">
                      ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-orange/10 text-orange border border-orange/30">
                        {order.status || 'PENDING'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
