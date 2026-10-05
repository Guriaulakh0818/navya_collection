'use client';

import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  Filter,
  IndianRupee,
  Landmark,
  Package,
  Play,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Truck,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/utils/format-price';

const SETTLEMENT_STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  PENDING_SETTLEMENT: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' },
  ELIGIBLE_FOR_SETTLEMENT: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
  },
  ON_HOLD: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-300' },
  SETTLED: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300' },
  ADJUSTED: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-300' },
  CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' },
};

export default function AdminManualSettlementsPage() {
  const [data, setData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'order-settlements' | 'pending' | 'history'>(
    'order-settlements',
  );
  const [isLoading, setIsLoading] = useState(true);
  const [settlementStatusFilter, setSettlementStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [cronRunning, setCronRunning] = useState(false);
  const [cronResult, setCronResult] = useState<string | null>(null);

  // Payout Modal Form State
  const [selectedShopForPayout, setSelectedShopForPayout] = useState<any | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('NEFT/RTGS Bank Transfer');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSettlementsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (settlementStatusFilter !== 'ALL')
        params.append('settlementStatus', settlementStatusFilter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/v1/admin/finance/settlements?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load settlements data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [settlementStatusFilter, search]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchSettlementsData();
    }, 300);
    return () => clearTimeout(t);
  }, [fetchSettlementsData]);

  const handleRunCron = async () => {
    setCronRunning(true);
    setCronResult(null);
    try {
      const res = await fetch('/api/v1/admin/finance/settlements/cron', {
        method: 'POST',
      });
      const json = await res.json();
      if (json.success) {
        setCronResult(json.message);
        await fetchSettlementsData();
      } else {
        setCronResult(`Error: ${json.message}`);
      }
    } catch (err: any) {
      setCronResult(`Network error: ${err.message}`);
    } finally {
      setCronRunning(false);
    }
  };

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
        alert(json.message || 'Payout recorded successfully!');
        setSelectedShopForPayout(null);
        await fetchSettlementsData();
      } else {
        alert(json.message || 'Payout failed.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error processing payout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const summary = data?.summary || {};
  const sellerSettlements = data?.sellerSettlements || [];
  const pendingBalances = data?.pendingBalances || [];
  const payoutHistory = data?.payoutHistory || [];

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
            Seller Settlements & Commercial Operations
          </h1>
          <p className="text-sm text-gray-600">
            Enforces 10% commission, delivery + 7 calendar days hold window, return shipping
            deductions, and bank payouts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleRunCron}
            disabled={cronRunning}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
          >
            {cronRunning ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5 fill-current" />
            )}
            Run 7-Day Eligibility Job
          </Button>
          <Button
            onClick={fetchSettlementsData}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {cronResult && (
        <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-medium flex items-center justify-between">
          <span>{cronResult}</span>
          <button
            onClick={() => setCronResult(null)}
            className="text-indigo-400 hover:text-indigo-700"
          >
            &times;
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            Eligible for Settlement
          </span>
          <p className="mt-1 text-2xl font-black text-emerald-950">
            {formatPrice(summary.totalEligibleSettlement || 0)}
          </p>
          <p className="mt-1 text-[11px] text-emerald-700">7-day hold passed, no returns</p>
        </Card>

        <Card className="border border-amber-200 bg-amber-50/40 p-4 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
            Pending 7-Day Hold
          </span>
          <p className="mt-1 text-2xl font-black text-amber-950">
            {formatPrice(summary.totalPendingSettlement || 0)}
          </p>
          <p className="mt-1 text-[11px] text-amber-700">delivery + 7 days window</p>
        </Card>

        <Card className="border border-rose-200 bg-rose-50/40 p-4 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
            On Hold (Safety)
          </span>
          <p className="mt-1 text-2xl font-black text-rose-950">
            {formatPrice(summary.totalOnHoldSettlement || 0)}
          </p>
          <p className="mt-1 text-[11px] text-rose-700">Active Return / Dispute blocking</p>
        </Card>

        <Card className="border border-purple-200 bg-purple-50/40 p-4 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800">
            Return Shipping Deductions
          </span>
          <p className="mt-1 text-2xl font-black text-purple-950">
            {formatPrice(summary.totalReturnShippingDeductions || 0)}
          </p>
          <p className="mt-1 text-[11px] text-purple-700">Actual Forward + Reverse</p>
        </Card>

        <Card className="border border-blue-200 bg-blue-50/40 p-4 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
            Total Settled
          </span>
          <p className="mt-1 text-2xl font-black text-blue-950">
            {formatPrice(summary.totalSettled || 0)}
          </p>
          <p className="mt-1 text-[11px] text-blue-700">Historical payouts completed</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('order-settlements')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'order-settlements'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Order Settlements (10% & Delivery+7d) ({sellerSettlements.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Shop Bank Payout Balances ({pendingBalances.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Payout Audit History ({payoutHistory.length})
        </button>
      </div>

      {/* Tab 1: Order-by-Order Settlements */}
      {activeTab === 'order-settlements' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <Card className="border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by Settlement #, Order #, Shop name, or Seller..."
                  className="pl-9 text-xs"
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-500">Status:</span>
                <select
                  value={settlementStatusFilter}
                  onChange={(e) => setSettlementStatusFilter(e.target.value)}
                  aria-label="Filter settlements by status"
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING_SETTLEMENT">PENDING_SETTLEMENT (Within 7d)</option>
                  <option value="ELIGIBLE_FOR_SETTLEMENT">ELIGIBLE_FOR_SETTLEMENT (Ready)</option>
                  <option value="ON_HOLD">ON_HOLD (Return Dispute)</option>
                  <option value="SETTLED">SETTLED (Paid)</option>
                  <option value="ADJUSTED">ADJUSTED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Table */}
          <Card className="overflow-hidden border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                <thead className="bg-gray-50 font-semibold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Settlement / Order</th>
                    <th className="px-4 py-3">Seller / Shop</th>
                    <th className="px-4 py-3">Delivery & Eligibility</th>
                    <th className="px-4 py-3">Commercial Breakdown</th>
                    <th className="px-4 py-3">Net Settlement</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                        <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-gray-400" />
                        Loading settlement records...
                      </td>
                    </tr>
                  ) : sellerSettlements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                        No settlement records found matching filters.
                      </td>
                    </tr>
                  ) : (
                    sellerSettlements.map((set: any) => {
                      const badge = SETTLEMENT_STATUS_STYLE[set.status] || {
                        bg: 'bg-gray-100',
                        text: 'text-gray-700',
                        border: 'border-gray-300',
                      };

                      return (
                        <tr key={set.id} className="hover:bg-gray-50/80 transition-colors">
                          {/* Settlement / Order */}
                          <td className="px-4 py-3">
                            <div className="font-bold text-gray-900">{set.settlementNumber}</div>
                            <div className="text-gray-500">
                              Order: {set.masterOrder?.orderNumber || set.vendorOrder?.orderNumber}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              Created: {new Date(set.createdAt).toLocaleDateString()}
                            </div>
                          </td>

                          {/* Seller / Shop */}
                          <td className="px-4 py-3">
                            <div className="font-semibold text-gray-900">
                              {set.shop?.shopName || 'Shop'}
                            </div>
                            <div className="text-gray-500">{set.seller?.name}</div>
                            {set.shop?.bankAccountNumber && (
                              <div className="text-[10px] text-gray-400">
                                A/C: ••••{set.shop.bankAccountNumber.slice(-4)} (
                                {set.shop.bankIfscCode})
                              </div>
                            )}
                          </td>

                          {/* Delivery & Eligibility */}
                          <td className="px-4 py-3">
                            <div className="text-gray-700">
                              <span className="font-semibold">Delivered:</span>{' '}
                              {set.deliveryDate
                                ? new Date(set.deliveryDate).toLocaleDateString()
                                : 'Pending'}
                            </div>
                            <div className="text-indigo-900 font-semibold mt-0.5">
                              <span>Eligible:</span>{' '}
                              {set.settlementEligibilityDate
                                ? new Date(set.settlementEligibilityDate).toLocaleDateString()
                                : 'Pending Delivery'}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              Rule: delivery + 7 calendar days
                            </div>
                          </td>

                          {/* Commercial Breakdown (Section 1, 2, 7, 11, 15) */}
                          <td className="px-4 py-3">
                            <div className="space-y-0.5">
                              <div className="flex justify-between gap-4 text-gray-700">
                                <span>Gross Product:</span>
                                <span className="font-semibold">
                                  {formatPrice(set.grossProductValue)}
                                </span>
                              </div>
                              <div className="flex justify-between gap-4 text-amber-700">
                                <span>Navya Commission (10%):</span>
                                <span>-{formatPrice(set.commissionAmount)}</span>
                              </div>
                              {Number(set.commissionReversal || 0) > 0 && (
                                <div className="flex justify-between gap-4 text-emerald-700 font-bold">
                                  <span>Commission Reversal:</span>
                                  <span>+{formatPrice(set.commissionReversal)}</span>
                                </div>
                              )}
                              {Number(set.refundedProductValue || 0) > 0 && (
                                <div className="flex justify-between gap-4 text-rose-700">
                                  <span>Refunded Product:</span>
                                  <span>-{formatPrice(set.refundedProductValue)}</span>
                                </div>
                              )}
                              {Number(set.forwardShippingActual || 0) > 0 && (
                                <div className="flex justify-between gap-4 text-slate-500 text-[11px]">
                                  <span>Forward Shipping:</span>
                                  <span>-{formatPrice(set.forwardShippingActual)}</span>
                                </div>
                              )}
                              {Number(set.reverseShippingActual || 0) > 0 && (
                                <div className="flex justify-between gap-4 text-slate-500 text-[11px]">
                                  <span>Reverse Shipping:</span>
                                  <span>-{formatPrice(set.reverseShippingActual)}</span>
                                </div>
                              )}
                              {Number(set.returnShippingDeduction || 0) > 0 && (
                                <div className="flex justify-between gap-4 text-rose-700 font-bold border-t border-gray-100 pt-0.5">
                                  <span>Return Shipping Liability:</span>
                                  <span>-{formatPrice(set.returnShippingDeduction)}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Net Settlement */}
                          <td className="px-4 py-3">
                            <div className="text-sm font-black text-gray-950">
                              {formatPrice(set.netSettlementAmount)}
                            </div>
                            {set.adjustmentsList?.length > 0 && (
                              <div className="text-[10px] text-purple-700 font-medium">
                                {set.adjustmentsList.length} adjustment(s) (
                                {formatPrice(
                                  set.adjustmentsList.reduce(
                                    (acc: number, a: any) =>
                                      acc +
                                      (a.type === 'DEBIT' ? -Number(a.amount) : Number(a.amount)),
                                    0,
                                  ),
                                )}
                                )
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badge.bg} ${badge.text} ${badge.border}`}
                            >
                              {set.status}
                            </span>
                            {set.holdReason && (
                              <div className="mt-1 max-w-[180px] text-[10px] text-rose-700 italic">
                                {set.holdReason}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Pending Shop Balances (for batch bank disbursal) */}
      {activeTab === 'pending' && (
        <Card className="overflow-hidden border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">Shop</th>
                  <th className="px-4 py-3">Bank Details</th>
                  <th className="px-4 py-3">Total Orders</th>
                  <th className="px-4 py-3">Gross GMV</th>
                  <th className="px-4 py-3">Commission (10%)</th>
                  <th className="px-4 py-3">Total Disbursed</th>
                  <th className="px-4 py-3">Pending Disbursal</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {pendingBalances.map((shop: any) => (
                  <tr key={shop.shopId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-gray-900">{shop.shopName}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {shop.bankAccountNumber ? (
                        <div>
                          <div>{shop.bankName}</div>
                          <div className="text-[11px]">A/C: {shop.bankAccountNumber}</div>
                          <div className="text-[10px] text-gray-400">IFSC: {shop.bankIfscCode}</div>
                        </div>
                      ) : (
                        <span className="text-rose-500">Missing Bank Info</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{shop.totalOrdersCount}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {formatPrice(shop.totalGrossGMV)}
                    </td>
                    <td className="px-4 py-3 text-amber-700">
                      -{formatPrice(shop.totalCommissionDeducted)}
                    </td>
                    <td className="px-4 py-3 text-blue-700">{formatPrice(shop.totalPaidAmount)}</td>
                    <td className="px-4 py-3 text-sm font-black text-emerald-800">
                      {formatPrice(shop.pendingAmount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        disabled={shop.pendingAmount <= 0}
                        onClick={() => openPayoutModal(shop)}
                        className="bg-emerald-700 text-xs text-white hover:bg-emerald-800"
                      >
                        Process Payout
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: Historical Payouts */}
      {activeTab === 'history' && (
        <Card className="overflow-hidden border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">Shop</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Reference / UTR</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Disbursed Date</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {payoutHistory.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-900">{p.shop?.name}</td>
                    <td className="px-4 py-3 font-black text-emerald-800">
                      {formatPrice(p.amount)}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700">{p.referenceNumber}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {p.paidAt ? new Date(p.paidAt).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Payout Modal */}
      {selectedShopForPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-950">Record Seller Payout</h3>
              <button
                onClick={() => setSelectedShopForPayout(null)}
                className="text-gray-400 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleProcessPayout} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Shop Name</label>
                <Input value={selectedShopForPayout.shopName} disabled className="bg-gray-50" />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Payout Amount (₹)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Bank UTR / Reference #
                </label>
                <Input
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. UTR-982341908"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Payment Method</label>
                <Input value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Internal Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional audit notes..."
                  rows={2}
                  className="w-full rounded-md border border-gray-300 p-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedShopForPayout(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                >
                  {isSubmitting ? 'Recording...' : 'Confirm & Disburse'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
