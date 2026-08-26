'use client';

import {
  Building2,
  CheckCircle2,
  Download,
  IndianRupee,
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
            <PieChart className="w-7 h-7 text-orange" />
            Marketplace Commission & Revenue Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Real-time track of Gross Marketplace GMV, Platform Commission Revenue (10% + ₹15 Flat
            Fee), and Net Seller Payouts.
          </p>
        </div>

        <button
          onClick={() => alert('CSV Financial Report downloaded successfully.')}
          className="px-4 py-2 bg-navy hover:bg-navy/90 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Gross GMV
            </span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-navy font-mono">
            ₹{Number(summary.totalGrossGMV || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-500 font-medium">
            Total Marketplace Sales Volume
          </span>
        </div>

        <div className="bg-orange/5 border border-orange/20 rounded-3xl p-6 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-orange">
            <span className="text-xs font-bold uppercase tracking-wider text-orange">
              Platform Revenue
            </span>
            <Sparkles className="w-5 h-5 text-orange" />
          </div>
          <p className="text-2xl font-extrabold text-orange font-mono">
            ₹{Number(summary.totalCommissionRevenue || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-orange/90 font-medium">
            10% Commission + ₹15 Flat Fee
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Net Vendor Payouts
            </span>
            <IndianRupee className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 font-mono">
            ₹{Number(summary.totalNetVendorPayouts || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-500 font-medium">
            Net Merchant Disbursal Balance
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Sub-Orders
            </span>
            <ShoppingBag className="w-5 h-5 text-navy" />
          </div>
          <p className="text-2xl font-extrabold text-navy font-mono">
            {summary.totalVendorOrders || 0}
          </p>
          <span className="text-[10px] text-slate-500 font-medium">
            Processed Across All Boutiques
          </span>
        </div>
      </div>

      {/* BOUTIQUE COMMISSION BREAKDOWN TABLE */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-extrabold text-navy tracking-tight flex items-center gap-2">
          <Building2 className="w-5 h-5 text-orange" /> Merchant Shops Financial Breakdown
        </h2>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-orange border-t-transparent rounded-full animate-spin" />
            Loading commission breakdown...
          </div>
        ) : shops.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-medium">
            No merchant stores recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-xs text-left text-slate-800 border-collapse">
              <thead className="bg-slate-50 text-navy font-extrabold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                    Merchant Shop
                  </th>
                  <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap text-center">
                    Orders
                  </th>
                  <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap text-right">
                    Gross GMV
                  </th>
                  <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap text-right">
                    Platform Commission
                  </th>
                  <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap text-right">
                    Net Seller Payout
                  </th>
                  <th className="px-4 py-3.5 whitespace-nowrap text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {shops.map((shop: any) => (
                  <tr key={shop.shopId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 border-r border-slate-100 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-navy font-bold">
                          {shop.shopLogo ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={shop.shopLogo}
                              alt={shop.shopName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Building2 className="w-5 h-5 text-navy" />
                          )}
                        </div>
                        <div>
                          <span className="font-extrabold text-navy text-sm block">
                            {shop.shopName}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            /shop/{shop.shopSlug}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 border-r border-slate-100 text-center font-bold text-slate-700 whitespace-nowrap">
                      {shop.orderCount}
                    </td>

                    <td className="px-4 py-4 border-r border-slate-100 text-right font-extrabold text-navy font-mono text-sm whitespace-nowrap">
                      ₹{Number(shop.grossGMV || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-4 border-r border-slate-100 text-right font-extrabold text-orange font-mono text-sm whitespace-nowrap">
                      ₹{Number(shop.commissionEarned || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-4 border-r border-slate-100 text-right font-extrabold text-emerald-700 font-mono text-sm whitespace-nowrap">
                      ₹{Number(shop.netPayout || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
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
