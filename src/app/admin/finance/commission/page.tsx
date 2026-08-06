'use client';

import {
  Building2,
  CheckCircle2,
  DollarSign,
  Download,
  FileText,
  IndianRupee,
  Percent,
  PieChart,
  ShoppingBag,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AdminCommissionAnalyticsPage() {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCommissionReport = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/admin/finance/commission');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load admin commission analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissionReport();
  }, []);

  const summary = data?.summary || {};
  const shops = data?.shops || [];

  return (
    <div className="space-y-8 p-6 bg-slate-50 text-slate-900 min-h-screen font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight flex items-center gap-3">
            <PieChart className="w-7 h-7 text-amber-600" />
            Marketplace Commission & Revenue Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time track of Gross Marketplace GMV, Platform Commission Revenue (10% + ₹15 Flat
            Fee), and Net Seller Payouts.
          </p>
        </div>

        <button
          onClick={() => alert('CSV Financial Report downloaded successfully.')}
          className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-amber-700 font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-xs"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Gross GMV</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-navy font-mono">
            ₹{Number(summary.totalGrossGMV || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-500">Total Marketplace Sales Volume</span>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-bold uppercase tracking-wider">Platform Revenue</span>
            <Sparkles className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-700 font-mono">
            ₹{Number(summary.totalCommissionRevenue || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-amber-700">10% Commission + ₹15 Flat Fee</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Net Vendor Payouts</span>
            <IndianRupee className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-indigo-700 font-mono">
            ₹{Number(summary.totalNetVendorPayouts || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-500">Net Merchant Disbursal Balance</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Sub-Orders</span>
            <ShoppingBag className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-navy font-mono">
            {summary.totalVendorOrders || 0}
          </p>
          <span className="text-[10px] text-slate-500">Processed Across All Boutiques</span>
        </div>
      </div>

      {/* BOUTIQUE COMMISSION BREAKDOWN TABLE */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-extrabold text-navy tracking-tight flex items-center gap-2">
          <Building2 className="w-5 h-5 text-amber-600" /> Merchant Shops Financial Breakdown
        </h2>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            Loading commission breakdown...
          </div>
        ) : shops.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No merchant stores recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-mono border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Merchant Shop</th>
                  <th className="px-4 py-3 text-center">Orders</th>
                  <th className="px-4 py-3 text-right">Gross GMV</th>
                  <th className="px-4 py-3 text-right">Platform Commission</th>
                  <th className="px-4 py-3 text-right">Net Seller Payout</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {shops.map((shop: any) => (
                  <tr key={shop.shopId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-amber-400">
                          {shop.shopLogo ? (
                            <img
                              src={shop.shopLogo}
                              alt={shop.shopName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Building2 className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-white text-sm block">
                            {shop.shopName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            /shop/{shop.shopSlug}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center font-bold text-slate-200">
                      {shop.orderCount}
                    </td>

                    <td className="px-4 py-4 text-right font-extrabold text-white font-mono">
                      ₹{Number(shop.grossGMV || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-4 text-right font-extrabold text-amber-400 font-mono">
                      ₹{Number(shop.commissionEarned || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-4 text-right font-extrabold text-emerald-400 font-mono">
                      ₹{Number(shop.netPayout || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {shop.status}
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
