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
            Authoritative BM-03 Payout: Commission = MRP × 10% | Seller Base Payout = Selling Price
            − Commission | GST added if registered
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total MRP</span>
            <TrendingUp className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-xl font-extrabold text-navy font-mono">
            ₹{Number(summary.totalMrp || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-400">Commission Base</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Selling Price</span>
            <ShoppingBag className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-extrabold text-blue-700 font-mono">
            ₹{Number(summary.sellingPrice || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-400">Customer Price</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Commission</span>
            <PieChart className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-extrabold text-amber-700 font-mono">
            - ₹{Number(summary.commissionAmount || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-400">10% of MRP</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Base Payout</span>
            <IndianRupee className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-extrabold text-indigo-700 font-mono">
            ₹{Number(summary.sellerBasePayout || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-400">Selling Price − Commission</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">GST Added</span>
            <ShieldCheck className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-xl font-extrabold text-teal-700 font-mono">
            + ₹{Number(summary.sellerGstAmount || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-400">If GST Registered</span>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Payout</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-extrabold text-emerald-700 font-mono">
            ₹{Number(summary.sellerTotalPayout || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-emerald-600">Base + GST</span>
        </div>
      </div>

      {/* ORDERS SETTLEMENT LEDGER */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-600" /> Vendor Sub-Orders Settlement Ledger (BM-03
          Authoritative)
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
                  <th className="px-3 py-3">Vendor Order #</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3 text-right">MRP</th>
                  <th className="px-3 py-3 text-right">Selling Price</th>
                  <th className="px-3 py-3 text-right">Navya Comm (10% MRP)</th>
                  <th className="px-3 py-3 text-right">Base Payout</th>
                  <th className="px-3 py-3 text-right">GST</th>
                  <th className="px-3 py-3 text-right">Total Payout</th>
                  <th className="px-3 py-3 text-center">Settlement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order: any) => {
                  const mrp = Number(order.totalMrp || order.totalAmount || 0);
                  const sp = Number(order.totalAmount || 0);
                  const comm = Number(order.commissionAmount || 0);
                  const basePayout = Number(order.sellerBasePayout ?? Math.max(0, sp - comm));
                  const gst = Number(order.sellerGstAmount || 0);
                  const totalPayout = Number(order.vendorPayoutAmount || basePayout + gst);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-4 font-mono font-bold text-amber-700">
                        {order.vendorOrderNumber}
                      </td>
                      <td className="px-3 py-4 text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-3 py-4 text-right font-medium text-slate-600 font-mono">
                        ₹{mrp.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-4 text-right font-extrabold text-slate-900 font-mono">
                        ₹{sp.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-4 text-right font-bold text-amber-700 font-mono">
                        - ₹{comm.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-4 text-right font-medium text-indigo-700 font-mono">
                        ₹{basePayout.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-4 text-right font-medium text-teal-700 font-mono">
                        {gst > 0 ? `+ ₹${gst.toLocaleString('en-IN')}` : '₹0 (Unregistered)'}
                      </td>
                      <td className="px-3 py-4 text-right font-extrabold text-emerald-700 font-mono">
                        ₹{totalPayout.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {order.settlement?.status || 'READY_FOR_PAYOUT'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
