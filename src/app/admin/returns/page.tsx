'use client';

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Filter,
  Package,
  RefreshCw,
  Search,
  Shield,
  Truck,
  UploadCloud,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/utils/format-price';

interface PackingProof {
  id: string;
  orderId: string;
  proofType: 'PRODUCT_CONDITION' | 'PACKED_PARCEL';
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  awbNumber?: string;
  createdAt: string;
  seller?: {
    id: string;
    name: string;
  };
}

interface AuditLog {
  id: string;
  action: string;
  previousStatus: string;
  newStatus: string;
  reason?: string;
  createdAt: string;
  performedBy?: {
    name: string;
    role: string;
  };
}

interface ReturnItem {
  id: string;
  quantity: number;
  reason: string;
  orderItem: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    total: number;
    imageUrl?: string;
    policyType?: string;
    returnAllowed?: boolean;
    returnWindowDays?: number;
    replacementAllowed?: boolean;
    replacementWindowDays?: number;
    deliveredAt?: string;
  };
}

interface ReturnRequestData {
  id: string;
  requestNumber: string;
  type: 'RETURN' | 'EXCHANGE';
  status: string;
  reason: string;
  detailedReason?: string;
  refundAmount?: number;
  customerEvidenceUrls: string[];
  forwardShippingCost?: number;
  reverseShippingCost?: number;
  returnShippingDeduction?: number;
  reverseAwb?: string;
  replacementAwb?: string;
  deliveryDate?: string;
  policyApplicable?: string;
  adminNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
    orderStatus: string;
    paymentStatus: string;
    createdAt: string;
    shipments?: {
      id: string;
      awb?: string;
      carrier?: string;
      actualForwardShippingCost?: number;
      actualReverseShippingCost?: number;
      returnShippingDeduction?: number;
      deliveredAt?: string;
    }[];
  };
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  shop?: {
    id: string;
    shopName: string;
    owner?: {
      name: string;
      email: string;
      phone: string;
    };
  };
  originalCommission?: number;
  commissionReversal?: number;
  sellerFinalAdjustment?: number;
  originalPaymentAmount?: number;
  refundStatus?: string;
  refundReference?: string;
  refundedAt?: string;
  customerRefund?: {
    id: string;
    refundNumber: string;
    amount: number;
    originalPayment: number;
    status: string;
    refundTransaction?: string;
    refundedAt?: string;
  };
  adjustments?: {
    id: string;
    adjustmentNumber: string;
    type: string;
    category?: string;
    amount: number;
    reason: string;
    status: string;
  }[];
  vendorOrder?: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    settlement?: {
      id: string;
      settlementNumber: string;
      status: string;
      grossProductValue: number;
      refundedProductValue?: number;
      commissionAmount: number;
      commissionReversal?: number;
      returnShippingDeduction: number;
      netSettlementAmount: number;
    };
  };
  items: ReturnItem[];
  sellerPackingProofs: PackingProof[];
  auditLogs: AuditLog[];
}

const STATUS_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  REQUESTED: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' },
  UNDER_REVIEW: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300' },
  APPROVED: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300' },
  REJECTED: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-300' },
  PICKUP_PENDING: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-300' },
  IN_TRANSIT: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-300' },
  RECEIVED: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-300' },
  VERIFIED: { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-300' },
  REFUND_PENDING: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-300' },
  REFUNDED: { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-400' },
  REPLACEMENT_PENDING: { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-400' },
  REPLACED: { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-400' },
  CLOSED: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
  CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' },
};

export default function AdminReturnsPage() {
  const [requests, setRequests] = useState<ReturnRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Detail Modal state
  const [selectedRequest, setSelectedRequest] = useState<ReturnRequestData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Form actions in Modal
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [forwardCost, setForwardCost] = useState<number>(0);
  const [reverseCost, setReverseCost] = useState<number>(0);
  const [adminNote, setAdminNote] = useState<string>('');
  const [reverseAwb, setReverseAwb] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (typeFilter !== 'ALL') params.append('type', typeFilter);

      const res = await fetch(`/api/v1/admin/returns?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setRequests(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load returns', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchReturns();
    }, 300);
    return () => clearTimeout(t);
  }, [fetchReturns]);

  const openReviewModal = (req: ReturnRequestData) => {
    setSelectedRequest(req);
    setTargetStatus(req.status);
    setForwardCost(
      req.forwardShippingCost ?? req.order?.shipments?.[0]?.actualForwardShippingCost ?? 0,
    );
    setReverseCost(
      req.reverseShippingCost ?? req.order?.shipments?.[0]?.actualReverseShippingCost ?? 0,
    );
    setAdminNote(req.adminNotes || '');
    setReverseAwb(req.reverseAwb || '');
    setFeedbackMsg(null);
    setModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedRequest) return;
    setIsSubmitting(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch(`/api/v1/admin/returns/${selectedRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          adminNotes: adminNote,
          forwardShippingCost: Number(forwardCost),
          reverseShippingCost: Number(reverseCost),
          reverseAwb: reverseAwb || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setFeedbackMsg({ type: 'success', text: json.message || 'Updated successfully!' });
        await fetchReturns();
        // Update selected request in modal
        setSelectedRequest((prev) => (prev ? { ...prev, ...json.data } : null));
      } else {
        setFeedbackMsg({ type: 'error', text: json.message || 'Update failed.' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Network error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics
  const totalCount = requests.length;
  const pendingCount = requests.filter((r) =>
    ['REQUESTED', 'UNDER_REVIEW'].includes(r.status),
  ).length;
  const approvedCount = requests.filter((r) => r.status === 'APPROVED').length;
  const totalDeductions = requests.reduce((acc, r) => acc + (r.returnShippingDeduction || 0), 0);

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
            Returns & Replacements Management
          </h1>
          <p className="text-sm text-gray-600">
            Review customer claims, verify seller packing proof side-by-side, enforce 3/7-day
            windows, and coordinate return shipping deductions.
          </p>
        </div>
        <Button
          onClick={fetchReturns}
          variant="outline"
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total Requests
            </span>
            <Package className="h-5 w-5 text-gray-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{totalCount}</p>
          <p className="mt-1 text-xs text-gray-500">Across all marketplace sellers</p>
        </Card>

        <Card className="border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              Action Required
            </span>
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-900">{pendingCount}</p>
          <p className="mt-1 text-xs text-amber-700">Requested or Under Review</p>
        </Card>

        <Card className="border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Approved Claims
            </span>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-900">{approvedCount}</p>
          <p className="mt-1 text-xs text-emerald-700">Settlements adjusted or on hold</p>
        </Card>

        <Card className="border border-purple-200 bg-purple-50/50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-800">
              Return Shipping Deductions
            </span>
            <Truck className="h-5 w-5 text-purple-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-purple-900">{formatPrice(totalDeductions)}</p>
          <p className="mt-1 text-xs text-purple-700">Actual Forward + Reverse Shipping</p>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card className="border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Request #, Order #, Customer, Seller, or Shop..."
              className="pl-9 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
              <Filter className="h-3.5 w-3.5" />
              <span>Type:</span>
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter return requests by type"
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm focus:border-amber-500 focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="RETURN">Return Only</option>
              <option value="EXCHANGE">Replacement Only</option>
            </select>

            <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
              <span>Status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter return requests by status"
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm focus:border-amber-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="REQUESTED">REQUESTED</option>
              <option value="UNDER_REVIEW">UNDER_REVIEW</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="PICKUP_PENDING">PICKUP_PENDING</option>
              <option value="IN_TRANSIT">IN_TRANSIT</option>
              <option value="RECEIVED">RECEIVED</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="REFUND_PENDING">REFUND_PENDING</option>
              <option value="REFUNDED">REFUNDED</option>
              <option value="REPLACEMENT_PENDING">REPLACEMENT_PENDING</option>
              <option value="REPLACED">REPLACED</option>
              <option value="CLOSED">CLOSED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Requests Table */}
      <Card className="overflow-hidden border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
            <thead className="bg-gray-50 font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Request / Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Seller / Shop</th>
                <th className="px-4 py-3">Item & Policy</th>
                <th className="px-4 py-3">Shipping Deductions</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">
                    <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-gray-400" />
                    Loading requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">
                    No return or replacement requests found matching filters.
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const badge = STATUS_BADGES[req.status] || {
                    bg: 'bg-gray-100',
                    text: 'text-gray-700',
                    border: 'border-gray-300',
                  };
                  const primaryItem = req.items?.[0]?.orderItem;
                  const totalDeduction =
                    (req.forwardShippingCost || 0) + (req.reverseShippingCost || 0);

                  return (
                    <tr key={req.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Request / Order */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-gray-900">
                          {req.requestNumber || req.id.slice(0, 10)}
                        </div>
                        <div className="text-gray-500">Order: {req.order?.orderNumber}</div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              req.type === 'RETURN'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {req.type}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-gray-900">
                          {req.user?.name || 'Customer'}
                        </div>
                        <div className="text-gray-500">{req.user?.phone || req.user?.email}</div>
                      </td>

                      {/* Seller / Shop */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-gray-900">
                          {req.shop?.shopName || 'Marketplace Seller'}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {req.shop?.owner?.name ? `Owner: ${req.shop.owner.name}` : ''}
                        </div>
                        {req.vendorOrder?.settlement && (
                          <div className="mt-1">
                            <span className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-700">
                              Settlement: {req.vendorOrder.settlement.status}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Item & Policy */}
                      <td className="px-4 py-3.5">
                        <div
                          className="max-w-[200px] truncate font-medium text-gray-900"
                          title={primaryItem?.name}
                        >
                          {primaryItem?.name || 'Product'}
                        </div>
                        <div className="text-gray-500">
                          Qty: {req.items?.[0]?.quantity || 1} &times;{' '}
                          {formatPrice(primaryItem?.price || 0)}
                        </div>
                        <div className="mt-1">
                          <span className="rounded bg-gray-50 border border-gray-200 px-1.5 py-0.5 text-[10px] text-gray-600">
                            Policy: {primaryItem?.policyType || req.policyApplicable || 'STANDARD'}
                          </span>
                        </div>
                      </td>

                      {/* Shipping Deductions */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-gray-900">
                          {formatPrice(req.returnShippingDeduction || totalDeduction)}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Fwd: {formatPrice(req.forwardShippingCost || 0)} + Rev:{' '}
                          {formatPrice(req.reverseShippingCost || 0)}
                        </div>
                        <div className="text-[10px] text-purple-700 font-medium">
                          Seller Liability (Section 7)
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {req.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <Button
                          size="sm"
                          onClick={() => openReviewModal(req)}
                          className="bg-gray-900 text-xs text-white hover:bg-black"
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          Review & Decide
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Review & Decision Modal (Section 5, 7, 10) */}
      {modalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-950">
                    Return Request: {selectedRequest.requestNumber || selectedRequest.id}
                  </h2>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                      STATUS_BADGES[selectedRequest.status]?.bg || 'bg-gray-100'
                    } ${STATUS_BADGES[selectedRequest.status]?.text || 'text-gray-800'}`}
                  >
                    {selectedRequest.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Raised on {new Date(selectedRequest.createdAt).toLocaleString()} for Order #
                  {selectedRequest.order?.orderNumber}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            {feedbackMsg && (
              <div
                className={`p-3 rounded-md text-xs font-medium ${
                  feedbackMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-50 text-rose-800 border border-rose-300'
                }`}
              >
                {feedbackMsg.text}
              </div>
            )}

            {/* Grid of Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Order & Customer */}
              <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-2">
                <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-gray-500" />
                  Order & Customer Context
                </h3>
                <div className="grid grid-cols-2 gap-2 text-gray-600">
                  <div>
                    <span className="font-semibold text-gray-700">Customer:</span>{' '}
                    {selectedRequest.user?.name}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Phone:</span>{' '}
                    {selectedRequest.user?.phone || 'N/A'}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Email:</span>{' '}
                    {selectedRequest.user?.email}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Delivery Date:</span>{' '}
                    {selectedRequest.deliveryDate
                      ? new Date(selectedRequest.deliveryDate).toLocaleDateString()
                      : 'Unknown'}
                  </div>
                </div>
                <div className="mt-2 text-gray-700">
                  <span className="font-semibold">Reason:</span> {selectedRequest.reason}
                </div>
                {selectedRequest.detailedReason && (
                  <div className="text-gray-600 bg-white p-2 rounded border border-gray-200 mt-1 italic">
                    &quot;{selectedRequest.detailedReason}&quot;
                  </div>
                )}
              </div>

              {/* Seller & Settlement Liability */}
              <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-2">
                <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-amber-600" />
                  Seller & Settlement Safety
                </h3>
                <div className="grid grid-cols-2 gap-2 text-gray-600">
                  <div>
                    <span className="font-semibold text-gray-700">Shop:</span>{' '}
                    {selectedRequest.shop?.shopName}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Seller:</span>{' '}
                    {selectedRequest.shop?.owner?.name || 'N/A'}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Settlement:</span>{' '}
                    <span className="font-bold text-amber-800">
                      {selectedRequest.vendorOrder?.settlement?.status || 'PENDING'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Product Value:</span>{' '}
                    {formatPrice(selectedRequest.vendorOrder?.settlement?.grossProductValue || 0)}
                  </div>
                </div>
                <div className="rounded border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-900">
                  <strong>Return Rule (Section 1, 2, 7):</strong> Commission is 100% reversed.
                  Seller bears actual forward + reverse shipping cost.
                </div>
              </div>
            </div>

            {/* Transparent Financial Breakdown (Section 1, 2, 6, 15) */}
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-indigo-200/60 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  Final Approved Return Financial Breakdown (Section 15)
                </h3>
                <span className="text-[10px] font-semibold text-indigo-700">
                  Idempotent & Auditable Ledger Entries
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* 1. Customer Refund */}
                <div className="rounded-lg bg-white border border-indigo-100 p-2.5 space-y-1">
                  <div className="text-[10px] font-semibold text-gray-500 uppercase">
                    Customer Refund
                  </div>
                  <div className="text-sm font-black text-emerald-700">
                    {formatPrice(
                      selectedRequest.customerRefund?.amount || selectedRequest.refundAmount || 0,
                    )}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    Status:{' '}
                    <strong className="text-emerald-800 uppercase">
                      {selectedRequest.customerRefund?.status ||
                        selectedRequest.refundStatus ||
                        'PENDING'}
                    </strong>
                  </div>
                  {selectedRequest.customerRefund?.refundNumber && (
                    <div className="text-[9px] text-gray-400 font-mono">
                      Ref: {selectedRequest.customerRefund.refundNumber}
                    </div>
                  )}
                </div>

                {/* 2. Navya Platform Commission */}
                <div className="rounded-lg bg-white border border-indigo-100 p-2.5 space-y-1">
                  <div className="text-[10px] font-semibold text-gray-500 uppercase">
                    Commission Reversal
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-gray-500">Original:</span>
                    <span className="font-semibold text-gray-700">
                      {formatPrice(
                        selectedRequest.originalCommission ||
                          selectedRequest.vendorOrder?.settlement?.commissionAmount ||
                          0,
                      )}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-rose-700 font-bold">
                    <span>Reversal:</span>
                    <span>
                      -
                      {formatPrice(
                        selectedRequest.commissionReversal ||
                          selectedRequest.originalCommission ||
                          0,
                      )}
                    </span>
                  </div>
                  <div className="text-[10px] text-indigo-700 font-medium">
                    Navya retains: ₹0.00 (100% reversed)
                  </div>
                </div>

                {/* 3. Actual Shipping Liability */}
                <div className="rounded-lg bg-white border border-indigo-100 p-2.5 space-y-1">
                  <div className="text-[10px] font-semibold text-gray-500 uppercase">
                    Return Shipping Liability
                  </div>
                  <div className="flex items-baseline justify-between text-[11px] text-gray-600">
                    <span>Forward:</span>
                    <span>
                      {formatPrice(selectedRequest.forwardShippingCost ?? forwardCost ?? 0)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-[11px] text-gray-600">
                    <span>Reverse:</span>
                    <span>
                      {formatPrice(selectedRequest.reverseShippingCost ?? reverseCost ?? 0)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between font-bold text-purple-950 pt-0.5 border-t border-gray-100">
                    <span>Liability:</span>
                    <span>
                      {formatPrice(
                        selectedRequest.returnShippingDeduction ||
                          (selectedRequest.forwardShippingCost ?? forwardCost ?? 0) +
                            (selectedRequest.reverseShippingCost ?? reverseCost ?? 0),
                      )}
                    </span>
                  </div>
                </div>

                {/* 4. Seller Settlement Impact / Final Adjustment */}
                <div className="rounded-lg bg-white border border-indigo-100 p-2.5 space-y-1">
                  <div className="text-[10px] font-semibold text-gray-500 uppercase">
                    Seller Final Impact
                  </div>
                  <div className="text-[11px] text-gray-600">
                    Settlement:{' '}
                    <strong className="text-amber-800">
                      {selectedRequest.vendorOrder?.settlement?.status || 'PENDING'}
                    </strong>
                  </div>
                  <div className="text-sm font-black text-rose-700">
                    Adjustment: -
                    {formatPrice(
                      selectedRequest.returnShippingDeduction ||
                        (selectedRequest.forwardShippingCost ?? forwardCost ?? 0) +
                          (selectedRequest.reverseShippingCost ?? reverseCost ?? 0),
                    )}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {selectedRequest.vendorOrder?.settlement?.status === 'SETTLED'
                      ? 'Separate debit adjustment created'
                      : 'Recalculated before payout'}
                  </div>
                </div>
              </div>
            </div>

            {/* Side-by-side Evidence Comparison (Section 10) */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-950 flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-600" />
                Evidence Comparison: Customer vs Seller Packing Proof (Section 10)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Evidence */}
                <div className="rounded-lg border border-rose-200 bg-rose-50/30 p-3 space-y-2">
                  <span className="font-bold text-xs text-rose-900">
                    Customer Proofs ({selectedRequest.customerEvidenceUrls?.length || 0})
                  </span>
                  {selectedRequest.customerEvidenceUrls?.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-400">
                      No customer media submitted yet (discussion ongoing via WhatsApp).
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {selectedRequest.customerEvidenceUrls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block relative group aspect-square rounded overflow-hidden border border-gray-200"
                        >
                          {url.endsWith('.mp4') || url.endsWith('.webm') ? (
                            <video src={url} className="w-full h-full object-cover" controls />
                          ) : (
                            <Image
                              src={url}
                              alt={`Customer Evidence ${i + 1}`}
                              fill
                              sizes="(max-width: 768px) 50vw, 25vw"
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          )}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Seller Packing Proofs */}
                <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-3 space-y-2">
                  <span className="font-bold text-xs text-blue-900">
                    Seller Packing Proofs ({selectedRequest.sellerPackingProofs?.length || 0})
                  </span>
                  {selectedRequest.sellerPackingProofs?.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-400">
                      No packing proof captured before dispatch for this order.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {selectedRequest.sellerPackingProofs.map((proof) => (
                        <div
                          key={proof.id}
                          className="relative group aspect-square rounded overflow-hidden border border-gray-200 bg-black/5"
                        >
                          {proof.mediaType === 'VIDEO' ? (
                            <video
                              src={proof.mediaUrl}
                              className="w-full h-full object-cover"
                              controls
                            />
                          ) : (
                            <a href={proof.mediaUrl} target="_blank" rel="noopener noreferrer">
                              <Image
                                src={proof.mediaUrl}
                                alt={proof.proofType}
                                fill
                                sizes="(max-width: 768px) 50vw, 25vw"
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                            </a>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1.5 py-0.5 text-[9px] text-white">
                            {proof.proofType === 'PRODUCT_CONDITION'
                              ? 'Product Condition'
                              : 'Packed Parcel'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Shipping Cost Inputs & Decision Controls (Section 7, 5) */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Action & Settlement Adjustment (Section 5 & 7)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Actual Forward Shipping (₹)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={forwardCost}
                    onChange={(e) => setForwardCost(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 51.00"
                  />
                  <p className="mt-1 text-[10px] text-gray-500">
                    From Shiprocket / courier manifest
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Actual Reverse Shipping (₹)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={reverseCost}
                    onChange={(e) => setReverseCost(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 65.00"
                  />
                  <p className="mt-1 text-[10px] text-gray-500">Reverse pickup fee</p>
                </div>

                <div>
                  <label className="block font-semibold text-purple-900 mb-1">
                    Total Return Deduction
                  </label>
                  <div className="h-9 flex items-center px-3 rounded-md bg-purple-50 border border-purple-200 font-bold text-purple-950">
                    {formatPrice((Number(forwardCost) || 0) + (Number(reverseCost) || 0))}
                  </div>
                  <p className="mt-1 text-[10px] text-purple-700">
                    Forward + Reverse deducted from seller
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Update Status</label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    aria-label="Update return request status"
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-800 shadow-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value="REQUESTED">REQUESTED</option>
                    <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                    <option value="APPROVED">APPROVED (Applies Shipping Deductions)</option>
                    <option value="REJECTED">REJECTED (Releases Settlement Hold)</option>
                    <option value="PICKUP_PENDING">PICKUP_PENDING</option>
                    <option value="IN_TRANSIT">IN_TRANSIT</option>
                    <option value="RECEIVED">RECEIVED</option>
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="REFUND_PENDING">REFUND_PENDING</option>
                    <option value="REFUNDED">REFUNDED</option>
                    <option value="REPLACEMENT_PENDING">REPLACEMENT_PENDING</option>
                    <option value="REPLACED">REPLACED</option>
                    <option value="CLOSED">CLOSED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Reverse / Pickup AWB
                  </label>
                  <Input
                    value={reverseAwb}
                    onChange={(e) => setReverseAwb(e.target.value)}
                    placeholder="e.g. 143249021980"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1 text-xs">
                  Auditable Admin Notes / Rejection Reason
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Provide audit rationale for this decision..."
                  rows={2}
                  className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-xs text-gray-900 shadow-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Close
                </Button>
                <Button
                  onClick={handleUpdateStatus}
                  disabled={isSubmitting}
                  className="bg-emerald-700 text-white hover:bg-emerald-800 font-semibold"
                >
                  {isSubmitting ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Save & Apply Status Transition
                </Button>
              </div>
            </div>

            {/* Audit Logs Trail (Section 23) */}
            {selectedRequest.auditLogs && selectedRequest.auditLogs.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-gray-400" />
                  Auditable History Trail (Section 23)
                </h4>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {selectedRequest.auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start justify-between rounded bg-gray-50 p-2 text-[11px] text-gray-600"
                    >
                      <div>
                        <span className="font-semibold text-gray-900">{log.action}: </span>
                        <span>{log.reason || 'Status changed'}</span>
                        <span className="ml-2 text-[10px] text-gray-400">
                          by {log.performedBy?.name || 'System'} ({log.performedBy?.role || 'AUTO'})
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
