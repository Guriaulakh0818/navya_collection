'use client';

import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  IndianRupee,
  Package,
  PackageCheck,
  ShoppingBag,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function SellerAnalyticsPage() {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async (selectedPeriod: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/seller/analytics?period=${selectedPeriod}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load seller analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);

  const summary = data?.summary || {};
  const topSellingProducts = data?.topSellingProducts || [];
  const lowStockItems = data?.lowStockItems || [];
  const trendData = data?.trendData || [];

  const maxRevenueTrend = Math.max(...trendData.map((t: any) => t.revenue || 0), 1000);

  return (
    <div className="space-y-8 p-6 bg-slate-50 text-slate-900 min-h-screen font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-amber-600" />
            Merchant Sales & Revenue Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time performance metrics, inventory health, and order volume breakdowns.
          </p>
        </div>

        {/* TIME PERIOD TOGGLE BUTTONS */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-2xl shadow-xs">
          <button
            onClick={() => setPeriod('weekly')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              period === 'weekly'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly (7D)
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              period === 'monthly'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly (30D)
          </button>
          <button
            onClick={() => setPeriod('yearly')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              period === 'yearly'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Yearly (12M)
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-bold uppercase tracking-wider">Gross GMV Sales</span>
            <IndianRupee className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-700 font-mono">
            ₹{Number(summary.totalGrossRevenue || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-amber-700">Total Customer Paid GMV</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Net Seller Disbursal</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 font-mono">
            ₹{Number(summary.totalNetPayout || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-500">After Commission Deductions</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Sub-Orders Count</span>
            <Package className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-navy font-mono">
            {summary.totalOrdersCount || 0}
          </p>
          <span className="text-[10px] text-slate-500">Merchant Dispatched Sub-Orders</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">
              Average Order Value (AOV)
            </span>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-purple-700 font-mono">
            ₹{Math.round(summary.averageOrderValue || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-500">Average Spend Per Sub-Order</span>
        </div>
      </div>

      {/* REVENUE & ORDERS TREND CHART */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-navy tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" /> Disbursal & Revenue Growth Trend (
            {period.toUpperCase()})
          </h2>
          <span className="text-xs text-slate-500 font-mono">Dynamic Real-Time Aggregation</span>
        </div>

        {trendData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-500 border border-dashed border-slate-200 rounded-2xl font-medium">
            No sales data recorded for this time period.
          </div>
        ) : (
          <div className="h-56 flex items-end justify-between gap-2 pt-8 px-4 border-b border-slate-200 pb-2">
            {trendData.map((t: any, idx: number) => {
              const heightPct = Math.max(12, Math.round((t.revenue / maxRevenueTrend) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-navy text-white text-[10px] font-mono px-2 py-1 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-md">
                    ₹{t.revenue.toLocaleString('en-IN')} ({t.orders} orders)
                  </div>

                  <div
                    className="w-full max-w-[36px] bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-xl group-hover:brightness-110 transition-all shadow-xs"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[9px] text-slate-500 font-mono truncate max-w-[40px]">
                    {t.label.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TOP SELLING PRODUCTS & INVENTORY ALERT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TOP SELLING PRODUCTS LEADERBOARD */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-extrabold text-navy flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" /> Best-Selling Products Leaderboard
          </h2>

          {topSellingProducts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-medium">No product sales yet.</div>
          ) : (
            <div className="space-y-3">
              {topSellingProducts.map((p: any, idx: number) => (
                <div
                  key={p.productId}
                  className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-800 font-mono text-xs font-bold flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="font-extrabold text-navy text-xs block">{p.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Price: ₹{p.price}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-extrabold text-amber-700 text-xs font-mono block">
                      {p.totalQuantity} Sold
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ₹{p.totalRevenue.toLocaleString('en-IN')} GMV
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* INVENTORY HEALTH & LOW STOCK WARNINGS */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-extrabold text-navy flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" /> Inventory Stock Alerts (
            {lowStockItems.length})
          </h2>

          {lowStockItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-medium">
              All products have healthy inventory levels (&gt; 5 units).
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockItems.map((p: any) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3.5 bg-rose-50/50 rounded-2xl border border-rose-200"
                >
                  <div>
                    <span className="font-extrabold text-navy text-xs block">{p.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Catalog Price: ₹{p.price}
                    </span>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-extrabold font-mono ${
                      p.stock === 0
                        ? 'bg-rose-100 text-rose-700 border border-rose-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {p.stock === 0 ? 'OUT OF STOCK' : `ONLY ${p.stock} LEFT`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
