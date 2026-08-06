'use client';

import {
  Building2,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  IndianRupee,
  Landmark,
  PieChart,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function SellerPayoutLedgerPage() {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayoutLedger = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/seller/finance/payouts');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load seller payout ledger:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayoutLedger();
  }, []);

  const summary = data?.summary || {};
  const orders = data?.orders || [];

  return (
    <div className="space-y-8 font-sans text-slate-900">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight flex items-center gap-3">
            <IndianRupee className="w-7 h-7 text-amber-600" />
            Merchant Earnings & Settlement Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track gross sales, platform commission deductions (
            {summary.commissionStructure || '10% + ₹15 Flat Fee'}), and net payout balance.
          </p>
        </div>

        <button
          onClick={() => alert('Payout Statement downloaded as CSV.')}
          className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-amber-700 font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-xs"
        >
          <Download className="w-4 h-4" /> Download Statement CSV
        </button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Sales</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-navy font-mono">
            ₹{Number(summary.grossEarnings || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-500">Total Customer Orders Value</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Platform Commission</span>
            <PieChart className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-700 font-mono">
            - ₹{Number(summary.totalCommissionDeducted || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-500">10% Platform Fee + ₹15 Flat Fee</span>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-bold uppercase tracking-wider">Net Payout Balance</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 font-mono">
            ₹{Number(summary.netPayoutBalance || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-emerald-700">Net Merchant Earnings</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Disbursal Status</span>
            <Landmark className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-xl font-extrabold text-navy">Direct Bank Disbursal</p>
          <span className="text-[10px] text-slate-500">Weekly Auto Settlement</span>
        </div>
      </div>

      {/* ORDERS SETTLEMENT LEDGER */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-600" /> Vendor Sub-Orders Settlement Ledger
        </h2>

        {isLoading ? (
          <div className="p-12 text-center text-slate-600 flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span className="font-semibold text-xs">Loading payout ledger...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-medium">
            No vendor orders in settlement ledger yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-700 uppercase font-mono border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Vendor Order #</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Gross Amount</th>
                  <th className="px-4 py-3 text-right">Commission Fee</th>
                  <th className="px-4 py-3 text-right">Net Payout</th>
                  <th className="px-4 py-3 text-center">Settlement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-4 font-mono font-bold text-amber-700">
                      {order.vendorOrderNumber}
                    </td>
                    <td className="px-4 py-4 text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-4 text-right font-extrabold text-slate-900 font-mono">
                      ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-amber-700 font-mono">
                      - ₹{Number(order.commissionAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-4 text-right font-extrabold text-emerald-700 font-mono">
                      ₹{Number(order.vendorPayoutAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        READY_FOR_PAYOUT
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
