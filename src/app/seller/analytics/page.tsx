'use client';

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  IndianRupee,
  Layers,
  Loader2,
  Minus,
  Package,
  PackageCheck,
  Plus,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function SellerAnalyticsPage() {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Selected Product for Details & Stock Replenishment Modal
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [addStockAmount, setAddStockAmount] = useState<number>(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [isUpdatingStock, setIsUpdatingStock] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

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

  // Handle Quick Stock Replenishment
  const handleQuickAddStock = async (product: any, delta: number, variantId?: string) => {
    const prodId = product.id || product.productId;
    if (!prodId) return;

    setIsUpdatingStock(true);
    try {
      const res = await fetch(`/api/v1/seller/products/${prodId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockDelta: delta,
          variantId: variantId || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(
          `✅ Added +${delta} unit(s) to "${product.name}". New stock: ${json.data.stock}`,
          'success',
        );

        // Update active modal view with live new stock
        if (
          selectedProduct &&
          (selectedProduct.id === prodId || selectedProduct.productId === prodId)
        ) {
          setSelectedProduct((prev: any) => {
            if (!prev) return null;
            const updatedStock = json.data.stock;
            const updatedVariants = prev.variants?.map((v: any) =>
              variantId && v.id === variantId ? { ...v, stock: Number(v.stock) + delta } : v,
            );
            return {
              ...prev,
              stock: updatedStock,
              variants: updatedVariants || prev.variants,
            };
          });
        }

        // Refresh analytics dashboard in background
        fetchAnalytics(period);
      } else {
        showToast(json.message || 'Failed to update stock.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error updating stock.', 'error');
    } finally {
      setIsUpdatingStock(false);
    }
  };

  const summary = data?.summary || {};
  const topSellingProducts = data?.topSellingProducts || [];
  const lowStockItems = data?.lowStockItems || [];
  const trendData = data?.trendData || [];

  const maxRevenueTrend = Math.max(...trendData.map((t: any) => t.revenue || 0), 1000);

  return (
    <div className="space-y-6 sm:space-y-8 p-3.5 sm:p-6 bg-slate-50 text-slate-900 min-h-screen font-sans relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-60 px-5 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-bounce-in border transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-700'
              : 'bg-rose-600 text-white border-rose-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-navy tracking-tight flex items-center gap-2.5 sm:gap-3">
            <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-orange shrink-0" />
            Merchant Sales & Revenue Analytics
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-relaxed">
            Real-time performance metrics, inventory health, and order volume breakdowns.
          </p>
        </div>

        {/* TIME PERIOD TOGGLE BUTTONS */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-1 bg-white border border-slate-200 p-1 rounded-2xl shadow-xs">
          <button
            onClick={() => setPeriod('weekly')}
            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
              period === 'weekly'
                ? 'bg-orange text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly (7D)
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
              period === 'monthly'
                ? 'bg-orange text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly (30D)
          </button>
          <button
            onClick={() => setPeriod('yearly')}
            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
              period === 'yearly'
                ? 'bg-orange text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Yearly (12M)
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-orange/5 border border-orange/20 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 space-y-1 sm:space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-navy">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">
              Gross GMV Sales
            </span>
            <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 text-orange shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-extrabold text-orange font-mono">
            ₹{Number(summary.totalGrossRevenue || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[9px] sm:text-[10px] text-slate-500 truncate block">
            Total Customer Paid GMV
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 space-y-1 sm:space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">
              Net Disbursal
            </span>
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-extrabold text-emerald-700 font-mono">
            ₹{Number(summary.totalNetPayout || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[9px] sm:text-[10px] text-slate-500 truncate block">
            After Commission Deductions
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 space-y-1 sm:space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">
              Sub-Orders Count
            </span>
            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-extrabold text-navy font-mono">
            {summary.totalOrdersCount || 0}
          </p>
          <span className="text-[9px] sm:text-[10px] text-slate-500 truncate block">
            Merchant Dispatched Orders
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 space-y-1 sm:space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">
              Average Order (AOV)
            </span>
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-extrabold text-purple-700 font-mono">
            ₹{Math.round(summary.averageOrderValue || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[9px] sm:text-[10px] text-slate-500 truncate block">
            Average Spend Per Sub-Order
          </span>
        </div>
      </div>

      {/* REVENUE & ORDERS TREND CHART */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4">
          <h2 className="text-sm sm:text-base md:text-lg font-extrabold text-navy tracking-tight flex items-center gap-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-orange shrink-0" />
            <span>Disbursal & Revenue Growth Trend ({period.toUpperCase()})</span>
          </h2>
          <span className="text-[10px] sm:text-xs text-slate-400 font-medium self-start sm:self-auto">
            Live Insights
          </span>
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
                    className="w-full max-w-[36px] bg-gradient-to-t from-orange to-orange-400 rounded-t-xl group-hover:brightness-110 transition-all shadow-xs"
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
        {/* 1. TOP SELLING PRODUCTS LEADERBOARD */}
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
            <h2 className="text-sm sm:text-base font-extrabold text-navy flex items-center gap-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-orange shrink-0" />
              <span>Best-Selling Products Leaderboard</span>
            </h2>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium self-start sm:self-auto">
              Click product to view details
            </span>
          </div>

          {topSellingProducts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-medium">No product sales yet.</div>
          ) : (
            <div className="space-y-3">
              {topSellingProducts.map((p: any, idx: number) => (
                <div
                  key={p.productId || p.id}
                  onClick={() => {
                    setSelectedProduct(p);
                    setAddStockAmount(1);
                    setSelectedVariantId(null);
                  }}
                  className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-orange/5 rounded-2xl border border-slate-200 hover:border-orange/40 transition-all cursor-pointer group shadow-xs hover:shadow-sm"
                  title="Click to view product details and manage stock"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-orange/10 text-orange font-mono text-xs font-black flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>

                    {/* Thumbnail */}
                    <div className="w-10 h-10 rounded-xl bg-slate-200 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center relative">
                      {p.image ? (
                        <Image
                          src={p.image}
                          alt={p.name}
                          width={40}
                          height={40}
                          unoptimized
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <ShoppingBag className="w-5 h-5 text-slate-400" />
                      )}
                    </div>

                    <div>
                      <span className="font-extrabold text-navy text-xs block group-hover:text-orange transition-colors">
                        {p.name}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                        <span>Price: ₹{p.price}</span>
                        {p.stock !== undefined && (
                          <span
                            className={`px-1.5 py-0.2 rounded font-semibold ${
                              p.stock <= 5
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            Stock: {p.stock}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-extrabold text-orange text-xs font-mono block">
                        {p.totalQuantity} Sold
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ₹{Number(p.totalRevenue || 0).toLocaleString('en-IN')} GMV
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-orange group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. INVENTORY HEALTH & LOW STOCK WARNINGS */}
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
            <h2 className="text-sm sm:text-base font-extrabold text-navy flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0" />
              <span>Inventory Stock Alerts ({lowStockItems.length})</span>
            </h2>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium self-start sm:self-auto">
              Click to add stock
            </span>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-medium">
              All products have healthy inventory levels (&gt; 5 units).
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockItems.map((p: any) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedProduct(p);
                    setAddStockAmount(1);
                    setSelectedVariantId(null);
                  }}
                  className="flex items-center justify-between p-3.5 bg-rose-50/50 hover:bg-orange/5 rounded-2xl border border-rose-200 hover:border-orange/40 transition-all cursor-pointer group shadow-xs hover:shadow-sm"
                  title="Click to open product details & add stock"
                >
                  <div className="flex items-center gap-3">
                    {/* Thumbnail */}
                    <div className="w-10 h-10 rounded-xl bg-slate-200 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center relative">
                      {p.image ? (
                        <Image
                          src={p.image}
                          alt={p.name}
                          width={40}
                          height={40}
                          unoptimized
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-slate-400" />
                      )}
                    </div>

                    <div>
                      <span className="font-extrabold text-navy text-xs block group-hover:text-orange transition-colors">
                        {p.name}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                        <span>Price: ₹{p.price}</span>
                        {p.sku && <span>SKU: {p.sku}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black font-mono tracking-wider ${
                        p.stock === 0
                          ? 'bg-rose-100 text-rose-700 border border-rose-300'
                          : 'bg-orange/10 text-orange border border-orange/30'
                      }`}
                    >
                      {p.stock === 0 ? 'OUT OF STOCK' : `ONLY ${p.stock} LEFT`}
                    </span>

                    {/* Quick +1 Inline Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAddStock(p, 1);
                      }}
                      disabled={isUpdatingStock}
                      className="px-2.5 py-1 bg-white hover:bg-orange hover:text-white text-navy font-bold text-[10px] rounded-lg border border-slate-200 transition-all shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Quick add +1 unit directly"
                    >
                      <Plus className="w-3 h-3 text-orange hover:text-white" />
                      <span>+1 Stock</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. PRODUCT DETAILS & DIRECT INVENTORY STOCK REPLENISHMENT MODAL */}
      {/* ========================================================================= */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl space-y-6 p-6 sm:p-7 relative">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-orange/10 text-orange flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-navy">
                    Product Details & Stock Manager
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Inspect product specifications and replenish inventory warehouse count.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product Overview Card */}
            <div className="flex flex-col sm:flex-row items-start gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {/* Product Image */}
              <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center relative">
                {selectedProduct.image ? (
                  <Image
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    width={96}
                    height={96}
                    unoptimized
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ShoppingBag className="w-8 h-8 text-slate-400" />
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-navy/10 text-navy px-2 py-0.5 rounded-full">
                    {selectedProduct.categoryName || 'Apparel'}
                  </span>
                  {selectedProduct.sku && (
                    <span className="text-[10px] font-mono text-slate-500 font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                      SKU: {selectedProduct.sku}
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      selectedProduct.status === 'active' || !selectedProduct.status
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {selectedProduct.status || 'Active'}
                  </span>
                </div>

                <h4 className="font-extrabold text-navy text-sm sm:text-base leading-snug">
                  {selectedProduct.name}
                </h4>

                <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1">
                  <div>
                    <span className="text-slate-500 text-[10px] block">SELLING PRICE</span>
                    <span className="font-black text-navy text-sm">₹{selectedProduct.price}</span>
                  </div>
                  {selectedProduct.compareAtPrice > selectedProduct.price && (
                    <div>
                      <span className="text-slate-500 text-[10px] block">MRP</span>
                      <span className="line-through text-slate-400">
                        ₹{selectedProduct.compareAtPrice}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500 text-[10px] block">
                      CURRENT WAREHOUSE STOCK
                    </span>
                    <span
                      className={`font-black text-sm px-2 py-0.5 rounded-md inline-block ${
                        selectedProduct.stock === 0
                          ? 'bg-rose-100 text-rose-700'
                          : selectedProduct.stock <= 5
                            ? 'bg-orange/10 text-orange'
                            : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {selectedProduct.stock} Units Available
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* If product has sales analytics (Best Seller Leaderboard Item) */}
            {selectedProduct.totalQuantity !== undefined && selectedProduct.totalQuantity > 0 && (
              <div className="grid grid-cols-2 gap-3 bg-orange/5 border border-orange/20 p-3.5 rounded-2xl">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Total Volume Sold
                  </span>
                  <span className="text-base font-extrabold text-orange font-mono">
                    {selectedProduct.totalQuantity} Units
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Cumulative GMV Revenue
                  </span>
                  <span className="text-base font-extrabold text-navy font-mono">
                    ₹{Number(selectedProduct.totalRevenue || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* DIRECT STOCK REPLENISHMENT STATION (USER FEATURE REQUEST) */}
            {/* ================================================================= */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-black uppercase tracking-wider text-navy flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-orange" /> Add / Replenish Inventory Stock
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    Add units directly to prevent buyer stockout warnings on JiivaaKart.
                  </p>
                </div>

                <span className="text-xs font-extrabold text-navy font-mono bg-white border border-slate-200 px-2.5 py-1 rounded-xl shadow-2xs">
                  Current: {selectedProduct.stock}
                </span>
              </div>

              {/* If product has size/color variants */}
              {Array.isArray(selectedProduct.variants) && selectedProduct.variants.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Choose Specific Variant (Optional)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedVariantId(null)}
                      className={`p-2 rounded-xl text-xs font-bold text-left transition-all border cursor-pointer ${
                        selectedVariantId === null
                          ? 'bg-navy text-white border-navy shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-extrabold">All / General</div>
                      <div className="text-[10px] opacity-80 font-mono">
                        Total: {selectedProduct.stock} units
                      </div>
                    </button>
                    {selectedProduct.variants.map((v: any) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariantId(v.id)}
                        className={`p-2 rounded-xl text-xs font-bold text-left transition-all border cursor-pointer ${
                          selectedVariantId === v.id
                            ? 'bg-orange text-white border-orange shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="font-extrabold truncate">
                          {v.size || ''} {v.color ? `• ${v.color}` : ''}
                        </div>
                        <div className="text-[10px] opacity-80 font-mono">Stock: {v.stock}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Preset Buttons: 1, 2, 3, 5, 10, 20 */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Quick Add Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 5, 10, 20, 50].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setAddStockAmount(qty)}
                      className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-extrabold transition-all border cursor-pointer ${
                        addStockAmount === qty
                          ? 'bg-orange text-white border-orange shadow-xs ring-2 ring-orange/20'
                          : 'bg-white text-navy border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      +{qty}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Quantity Stepper */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Custom Quantity To Add
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-slate-300 rounded-2xl bg-white overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => setAddStockAmount((prev) => Math.max(1, prev - 1))}
                      className="w-10 h-10 flex items-center justify-center text-slate-700 bg-white hover:bg-slate-100 transition-colors cursor-pointer border-r border-slate-200"
                      title="Decrease quantity"
                    >
                      <Minus className="w-4 h-4 text-navy" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={addStockAmount}
                      onChange={(e) => setAddStockAmount(Math.max(1, Number(e.target.value) || 1))}
                      className="w-16 h-10 text-center font-mono font-black text-navy bg-white text-base focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      style={{ backgroundColor: '#ffffff', color: '#183a73' }}
                    />
                    <button
                      type="button"
                      onClick={() => setAddStockAmount((prev) => prev + 1)}
                      className="w-10 h-10 flex items-center justify-center text-slate-700 bg-white hover:bg-slate-100 transition-colors cursor-pointer border-l border-slate-200"
                      title="Increase quantity"
                    >
                      <Plus className="w-4 h-4 text-navy" />
                    </button>
                  </div>

                  {/* Dynamic Stock Calculation Preview */}
                  <div className="text-xs text-slate-600 font-mono bg-white border border-slate-200 px-3.5 py-2.5 rounded-2xl shadow-xs flex-1">
                    <span>Current: </span>
                    <strong className="text-navy font-bold">{selectedProduct.stock}</strong>
                    <span> + </span>
                    <strong className="text-orange font-bold">{addStockAmount}</strong>
                    <span> = </span>
                    <strong className="text-emerald-700 font-black">
                      {selectedProduct.stock + addStockAmount} units
                    </strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <Link
                  href={`/seller/products/${selectedProduct.id || selectedProduct.productId}/edit`}
                  target="_blank"
                  className="text-xs font-bold text-navy hover:text-orange flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-orange" />
                  <span>Open Full Product Editor</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </Link>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-all cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={isUpdatingStock}
                    onClick={() =>
                      handleQuickAddStock(
                        selectedProduct,
                        addStockAmount,
                        selectedVariantId || undefined,
                      )
                    }
                    className="flex-1 sm:flex-initial px-6 py-2.5 bg-orange hover:bg-orange/90 text-white font-extrabold text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingStock ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Add +{addStockAmount} Stock Units</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
