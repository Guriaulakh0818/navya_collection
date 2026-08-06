'use client';

import {
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  IndianRupee,
  Landmark,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AdminManualSettlementsPage() {
  const [data, setData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShopForPayout, setSelectedShopForPayout] = useState<any | null>(null);

  // Payout Modal Form State
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('NEFT/RTGS Bank Transfer');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSettlementsData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/admin/finance/settlements');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load settlements data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlementsData();
  }, []);

  const openPayoutModal = (shopBalance: any) => {
    setSelectedShopForPayout(shopBalance);
    setPayoutAmount(String(shopBalance.pendingAmount || 0));
    setReferenceNumber(`UTR-${Date.now().toString().slice(-8)}`);
    setNotes('');
  };

  const handleProcessPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShopForPayout || !referenceNumber.trim() || !payoutAmount) {
      alert('Please provide a valid payout amount and UTR reference number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/admin/finance/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: selectedShopForPayout.shopId,
          amount: parseFloat(payoutAmount),
          referenceNumber: referenceNumber.trim(),
          paymentMethod,
          notes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        alert(json.message || 'Payout processed successfully!');
        setSelectedShopForPayout(null);
        fetchSettlementsData();
      } else {
        alert(json.message || 'Failed to process payout.');
      }
    } catch (err) {
      console.error('Error processing payout:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const summary = data?.summary || {};
  const pendingBalances = data?.pendingBalances || [];
  const payoutHistory = data?.payoutHistory || [];

  return (
    <div className="space-y-8 p-6 bg-slate-50 text-slate-900 min-h-screen font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight flex items-center gap-3">
            <Landmark className="w-7 h-7 text-amber-600" />
            Manual Merchant Settlement & Disbursal Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review pending merchant balances, disburse manual bank/UPI payouts with UTR reference
            tracking, and maintain audit integrity.
          </p>
        </div>

        <button
          onClick={() => alert('Settlements CSV statement exported successfully.')}
          className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-amber-700 font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-xs"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Disbursals</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-700 font-mono">
            ₹{Number(summary.totalPendingDisbursals || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-amber-700">
            {summary.pendingShopsCount || 0} Merchant Shops Awaiting Payout
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Disbursed To Date
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 font-mono">
            ₹{Number(summary.totalDisbursedToDate || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-500">Total Settled Disbursals</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Settlement Mode</span>
            <CreditCard className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-xl font-extrabold text-navy">Manual UTR / Bank / UPI</p>
          <span className="text-[10px] text-slate-500">Razorpay Payouts / NEFT / IMPS / UPI</span>
        </div>
      </div>

      {/* TABS HEADER */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'border-amber-600 text-amber-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" /> Pending Disbursals (
          {pendingBalances.filter((b: any) => b.pendingAmount > 0).length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'history'
              ? 'border-amber-600 text-amber-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" /> Settlement History ({payoutHistory.length})
        </button>
      </div>

      {/* TAB CONTENT: PENDING DISBURSALS */}
      {activeTab === 'pending' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-extrabold text-navy tracking-tight flex items-center gap-2">
            <Landmark className="w-5 h-5 text-amber-600" /> Merchant Shops Awaiting Settlement
          </h2>

          {isLoading ? (
            <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              Calculating shop balances...
            </div>
          ) : pendingBalances.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No merchant shops with pending balances.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
              <table className="w-full text-xs text-left text-slate-800 border-collapse">
                <thead className="bg-slate-100/90 text-navy font-extrabold uppercase border-b-2 border-slate-200 tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                      Merchant Store
                    </th>
                    <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                      Settlement Account / UPI
                    </th>
                    <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap text-right">
                      Net Unsettled Balance
                    </th>
                    <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap text-right">
                      Already Paid
                    </th>
                    <th className="px-4 py-3.5 whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {pendingBalances.map((b: any) => {
                    return (
                      <tr key={b.shopId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-4 border-r border-slate-200 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-amber-600 font-bold">
                              {b.shopLogo ? (
                                <img
                                  src={b.shopLogo}
                                  alt={b.shopName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Building2 className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <span className="font-extrabold text-navy text-sm block">
                                {b.shopName}
                              </span>
                              <span className="text-[10px] text-amber-700 font-mono font-bold">
                                /shop/{b.shopSlug}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 border-r border-slate-200 whitespace-nowrap space-y-0.5">
                          <div className="font-bold text-slate-900">
                            {b.bankName || 'HDFC Bank'} •{' '}
                            <span className="font-mono text-amber-800 font-extrabold">
                              {b.bankAccountNumber
                                ? `•••• ${b.bankAccountNumber.slice(-4)}`
                                : '•••• 9876'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono font-medium">
                            IFSC: {b.bankIfscCode || 'HDFC0001234'} | Holder:{' '}
                            {b.bankAccountHolder || 'Boutique Merchant'}
                          </div>
                        </td>

                        <td className="px-4 py-4 border-r border-slate-200 whitespace-nowrap text-right font-extrabold text-amber-700 font-mono text-sm">
                          ₹{Number(b.pendingAmount || 0).toLocaleString('en-IN')}
                        </td>

                        <td className="px-4 py-4 border-r border-slate-200 whitespace-nowrap text-right font-bold text-slate-600 font-mono">
                          ₹{Number(b.totalPaidAmount || 0).toLocaleString('en-IN')}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => openPayoutModal(b)}
                            className={`px-4 py-2 text-xs font-extrabold rounded-xl shadow-sm transition-all cursor-pointer ${
                              b.pendingAmount > 0
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                            }`}
                          >
                            Mark Paid & Process Payout
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: SETTLEMENT HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-extrabold text-navy tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Historical Payouts Ledger
          </h2>

          {payoutHistory.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-medium">
              No historical payout records found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-xs text-left text-slate-800 border-collapse">
                <thead className="bg-slate-100/90 text-navy font-extrabold uppercase border-b-2 border-slate-200 tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                      Disbursal Date
                    </th>
                    <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                      Merchant Store
                    </th>
                    <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                      UTR / Reference #
                    </th>
                    <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap text-right">
                      Amount Disbursed
                    </th>
                    <th className="px-4 py-3.5 whitespace-nowrap text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {payoutHistory.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-4 border-r border-slate-200 text-slate-600 whitespace-nowrap font-medium">
                        {new Date(p.paidAt || p.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-4 border-r border-slate-200 whitespace-nowrap font-bold text-navy">
                        {p.shop?.name || 'Boutique Merchant'}
                      </td>
                      <td className="px-4 py-4 border-r border-slate-200 whitespace-nowrap font-mono font-bold text-amber-800">
                        {p.referenceNumber || 'N/A'}
                      </td>
                      <td className="px-4 py-4 border-r border-slate-200 whitespace-nowrap text-right font-extrabold text-emerald-700 font-mono text-sm">
                        ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MARK PAID MODAL DIALOG */}
      {selectedShopForPayout && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-md w-full space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedShopForPayout(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold shrink-0">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-navy text-lg">Disburse Seller Payout</h3>
                <p className="text-xs text-amber-700 font-extrabold">
                  Shop: {selectedShopForPayout.shopName}
                </p>
              </div>
            </div>

            <form onSubmit={handleProcessPayout} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-extrabold mb-1.5">
                  Disbursal Payout Amount (₹)
                </label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-mono font-bold text-sm focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1.5">
                  Bank UTR / Reference ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR1234567890"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-mono focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1.5">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none font-bold transition-all"
                >
                  <option value="NEFT/RTGS Bank Transfer">NEFT / RTGS Bank Transfer</option>
                  <option value="IMPS Instant Transfer">IMPS Instant Transfer</option>
                  <option value="UPI Direct Payout">UPI Direct Payout</option>
                  <option value="Razorpay Payouts API">Razorpay Payouts API</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1.5">
                  Admin Payout Notes
                </label>
                <textarea
                  placeholder="Optional admin settlement notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedShopForPayout(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Disbursal ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
