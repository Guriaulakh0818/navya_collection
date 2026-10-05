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
  const [economics, setEconomics] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const [commRes, econRes] = await Promise.all([
        fetch('/api/v1/admin/finance/commission'),
        fetch('/api/v1/admin/finance/unit-economics'),
      ]);

      const [commJson, econJson] = await Promise.all([commRes.json(), econRes.json()]);

      if (commJson.success) setData(commJson.data);
      if (econJson.success) setEconomics(econJson);
    } catch (err) {
      console.error('Failed to load admin finance analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const summary = data?.summary || {};
  const shops = data?.shops || [];
  const econSummary = economics?.summary || {};

  const handleDownloadCsv = () => {
    if (!shops || shops.length === 0) return;

    const headers = [
      'Shop ID',
      'Boutique Name',
      'Order Count',
      'Gross GMV (₹)',
      'Commission Earned (₹)',
      'Net Payout (₹)',
    ];

    const rows = shops.map((s: any) => [
      `"${s.shopId}"`,
      `"${s.shopName.replace(/"/g, '""')}"`,
      s.orderCount,
      s.grossGMV.toFixed(2),
      s.commissionEarned.toFixed(2),
      s.netPayout.toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `navya_commission_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 p-6 bg-slate-50 text-slate-900 min-h-screen font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight flex items-center gap-3">
            <PieChart className="w-7 h-7 text-orange" />
            Marketplace Commission & Unit Economics
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Real-time track of Gross GMV, Platform Commission (10% on Product MRP per BM-02),
            Variable Costs, and Net Navya Contribution Margin.
          </p>
        </div>

        <button
          onClick={handleDownloadCsv}
          disabled={isLoading || shops.length === 0}
          className="px-4 py-2 bg-navy hover:bg-navy/90 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
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
              Platform Commission
            </span>
            <Sparkles className="w-5 h-5 text-orange" />
          </div>
          <p className="text-2xl font-extrabold text-orange font-mono">
            ₹{Number(summary.totalCommissionRevenue || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-orange/90 font-medium">
            10% Commission Base on MRP (BM-02)
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Variable Costs
            </span>
            <IndianRupee className="w-5 h-5 text-rose-600" />
          </div>
          <p className="text-2xl font-extrabold text-rose-600 font-mono">
            ₹{Number(econSummary.totalVariableCosts || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-500 font-medium">
            Gateway, Subsidies & Freight
          </span>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Navya Contribution
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-800 font-mono">
            ₹{Number(econSummary.totalContribution || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-emerald-600 font-bold">
            Margin: {econSummary.overallMarginPercent ?? 0}%
          </span>
        </div>
      </div>

      {/* BOUTIQUE / SELLER BREAKDOWN TABLE */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-navy" />
            <h2 className="text-base font-bold text-navy">Boutique Commission & Performance</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {shops.length} Partner Boutiques Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-4 px-6">Boutique</th>
                <th className="py-4 px-6 text-center">Orders</th>
                <th className="py-4 px-6 text-right">Gross GMV</th>
                <th className="py-4 px-6 text-right">Commission (10% MRP)</th>
                <th className="py-4 px-6 text-right">Net Payout</th>
                <th className="py-4 px-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading commission & economics telemetry...
                  </td>
                </tr>
              ) : shops.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No vendor orders found for evaluation.
                  </td>
                </tr>
              ) : (
                shops.map((shop: any) => (
                  <tr key={shop.shopId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-navy flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                        {shop.shopName?.charAt(0) || 'B'}
                      </div>
                      <div>
                        <div>{shop.shopName}</div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          ID: {shop.shopId}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center font-semibold text-slate-600">
                      {shop.orderCount}
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-bold text-slate-900">
                      ₹{Number(shop.grossGMV || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-bold text-orange">
                      ₹{Number(shop.commissionEarned || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-bold text-emerald-600">
                      ₹{Number(shop.netPayout || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Settled / Clean
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
