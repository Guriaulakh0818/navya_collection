'use client';

import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  HelpCircle,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  Package,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Truck,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/features/auth/components/protected-route';

const NAVYA_WHATSAPP_NUMBER = '919053883125';

interface ReturnRequestItem {
  id: string;
  requestNumber: string;
  type: 'RETURN' | 'EXCHANGE';
  status: string;
  reason: string;
  detailedReason?: string;
  refundAmount?: number;
  refundStatus?: string;
  refundReference?: string;
  customerRefund?: {
    id: string;
    refundNumber: string;
    amount: number;
    status: string;
    refundTransaction?: string;
    refundedAt?: string;
  };
  customerEvidenceUrls: string[];
  createdAt: string;
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId =
    typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  const [order, setOrder] = useState<any | null>(null);
  const [returnRequests, setReturnRequests] = useState<ReturnRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  // Return / Replacement Modal State
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedItemForReturn, setSelectedItemForReturn] = useState<any | null>(null);
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [requestType, setRequestType] = useState<'RETURN' | 'EXCHANGE'>('RETURN');
  const [returnReason, setReturnReason] = useState('Damaged or Defective Item');
  const [detailedReason, setDetailedReason] = useState('');
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [refundMethod, setRefundMethod] = useState<'BANK' | 'UPI'>('UPI');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnSuccessMsg, setReturnSuccessMsg] = useState<{
    msg: string;
    whatsappUrl: string;
  } | null>(null);
  const [returnErrorMsg, setReturnErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }

    async function fetchOrderDetail() {
      try {
        const [orderRes, returnsRes] = await Promise.all([
          fetch(`/api/v1/orders/${orderId}`),
          fetch(`/api/v1/orders/${orderId}/return`),
        ]);

        const orderJson = await orderRes.json();
        if (orderJson.success && orderJson.data) {
          setOrder(orderJson.data);
        } else {
          setOrder(null);
        }

        const returnsJson = await returnsRes.json();
        if (returnsJson.success && returnsJson.data) {
          setReturnRequests(returnsJson.data);
        }
      } catch (err) {
        console.error('Failed to fetch order detail:', err);
        setOrder(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrderDetail();
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!order) return;
    const confirmed = window.confirm('Are you sure you want to cancel this order?');
    if (!confirmed) return;
    setIsCancelling(true);
    try {
      if (order.shipments && order.shipments.length > 0) {
        for (const shp of order.shipments) {
          await fetch('/api/v1/seller/orders', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shipmentId: shp.id, action: 'CANCEL' }),
          });
        }
      }
      setOrder((prev: any) => (prev ? { ...prev, status: 'Cancelled' } : null));
    } catch (err) {
      console.error('Failed to cancel order:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  const openReturnModal = (item: any) => {
    setSelectedItemForReturn(item);
    setReturnQuantity(1);
    // Set default requestType depending on policy
    if (item.policyType === 'REPLACEMENT_ONLY' || !item.returnAllowed) {
      setRequestType('EXCHANGE');
    } else {
      setRequestType('RETURN');
    }
    setReturnReason('Damaged or Defective Item');
    setDetailedReason('');
    setEvidenceUrls([]);
    setRefundMethod('UPI');
    setBankAccountNumber('');
    setBankIfsc('');
    setAccountHolderName('');
    setUpiId('');
    setReturnSuccessMsg(null);
    setReturnErrorMsg(null);
    setReturnModalOpen(true);
  };

  const handleUploadEvidence = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploaded: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        formData.append('folder', 'return_evidence');

        const res = await fetch('/api/v1/upload', {
          method: 'POST',
          body: formData,
        });
        const json = await res.json();
        if (json.success && json.data?.url) {
          uploaded.push(json.data.url);
        }
      }
      setEvidenceUrls((prev) => [...prev, ...uploaded]);
    } catch (err) {
      console.error('Failed to upload evidence', err);
      alert('Failed to upload photo evidence.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForReturn || !order) return;

    setIsSubmittingReturn(true);
    setReturnErrorMsg(null);
    setReturnSuccessMsg(null);

    try {
      const isCodReturn = order.paymentMethod === 'COD' && requestType === 'RETURN';
      const payload: any = {
        orderItemId: selectedItemForReturn.id,
        quantity: returnQuantity,
        requestType,
        reason: returnReason,
        detailedReason,
        customerEvidenceUrls: evidenceUrls,
      };

      if (isCodReturn) {
        payload.refundMethod = refundMethod;
        if (refundMethod === 'BANK') {
          payload.bankAccountNumber = bankAccountNumber.trim();
          payload.bankIfsc = bankIfsc.trim().toUpperCase();
          payload.accountHolderName = accountHolderName.trim();
        } else {
          payload.upiId = upiId.trim();
        }
      }

      const res = await fetch(`/api/v1/orders/${order.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setReturnSuccessMsg({
          msg: json.message,
          whatsappUrl: json.data?.whatsAppUrl,
        });
        // Refresh return requests
        const retRes = await fetch(`/api/v1/orders/${order.id}/return`);
        const retJson = await retRes.json();
        if (retJson.success) {
          setReturnRequests(retJson.data);
        }
      } else {
        setReturnErrorMsg(json.message || 'Failed to submit request.');
      }
    } catch (err: any) {
      setReturnErrorMsg(err.message || 'Network error submitting request.');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Loading order details...</p>
        </div>
      </ProtectedRoute>
    );
  }

  if (!order) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-heading text-2xl text-navy mb-2">Order Not Found</p>
          <p className="text-sm text-slate-600 mb-6">
            The order you are looking for does not exist or has been removed.
          </p>
          <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl">
            <Link href="/account/orders">Back to My Orders</Link>
          </Button>
        </div>
      </ProtectedRoute>
    );
  }

  const isDelivered =
    order.status === 'Delivered' || order.shipments?.some((s: any) => s.status === 'DELIVERED');
  const canCancel = order.status === 'Processing';
  const hasMultipleShipments = (order.shipments || []).length > 1;

  // Calculate return & replacement window dates based on delivery
  const calculateEligibility = (item: any) => {
    const matchedShipment = order.shipments?.find((s: any) =>
      s.items?.some((i: any) => i.id === item.id || i.name === item.name),
    );
    const deliveredAt = item.deliveredAt || matchedShipment?.deliveredAt;

    if (!isDelivered && !deliveredAt) {
      return {
        isDelivered: false,
        returnEligible: false,
        replacementEligible: false,
        returnDeadline: null,
        replacementDeadline: null,
        policyNotice:
          item.policyType === 'NONE'
            ? 'Final Sale (No Returns/Replacements)'
            : 'Eligible after delivery',
      };
    }

    const deliveryTime = new Date(deliveredAt || order.date).getTime();
    const now = Date.now();

    const returnWindowDays = item.returnWindowDays ?? 3;
    const replacementWindowDays = item.replacementWindowDays ?? 7;

    const returnDeadline = new Date(deliveryTime + returnWindowDays * 24 * 60 * 60 * 1000);
    const replacementDeadline = new Date(
      deliveryTime + replacementWindowDays * 24 * 60 * 60 * 1000,
    );

    const returnAllowedByPolicy =
      item.returnAllowed !== false &&
      item.policyType !== 'REPLACEMENT_ONLY' &&
      item.policyType !== 'NONE';
    const replacementAllowedByPolicy =
      item.replacementAllowed !== false && item.policyType !== 'NONE';

    const returnEligible = returnAllowedByPolicy && now <= returnDeadline.getTime();
    const replacementEligible = replacementAllowedByPolicy && now <= replacementDeadline.getTime();

    return {
      isDelivered: true,
      deliveredAt: new Date(deliveryTime),
      returnEligible,
      replacementEligible,
      returnAllowedByPolicy,
      replacementAllowedByPolicy,
      returnDeadline,
      replacementDeadline,
      policyNotice:
        item.policyType === 'NONE'
          ? 'Final Sale - Returns & Replacements not allowed'
          : item.policyType === 'REPLACEMENT_ONLY'
            ? 'Replacement Only (Within 7 Days)'
            : 'Return (3 Days) & Replacement (7 Days)',
    };
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'My Account', href: '/account' },
            { label: 'My Orders', href: '/account/orders' },
            { label: `Order #${order.orderNumber}` },
          ]}
        />

        {/* Order Header Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-xl md:text-2xl font-black text-navy">
                Order #{order.orderNumber}
              </h1>
              <span
                className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                  order.status === 'Delivered'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                    : order.status === 'Cancelled'
                      ? 'bg-rose-50 text-rose-700 border border-rose-300'
                      : order.status === 'RTO' || order.status === 'Returned'
                        ? 'bg-purple-50 text-purple-700 border border-purple-300'
                        : 'bg-amber-50 text-amber-800 border border-amber-300'
                }`}
              >
                {order.status === 'RTO' ? 'Returned to Origin' : order.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Placed on{' '}
              {new Date(order.date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canCancel && (
              <Button
                variant="outline"
                className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold"
                onClick={handleCancelOrder}
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Order'}
              </Button>
            )}
          </div>
        </div>

        {/* RTO Consignment Notification (BM-09 AC-21) */}
        {(order.status === 'RTO' ||
          order.shipments?.some((s: any) => (s.status || '').startsWith('RTO'))) && (
          <div className="rounded-3xl border border-purple-200 bg-purple-50/70 p-5 space-y-2">
            <h3 className="font-bold text-purple-950 text-sm flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-purple-700" />
              Consignment Return to Origin (RTO)
            </h3>
            <p className="text-xs text-purple-900 leading-relaxed">
              {order.paymentMethod === 'COD'
                ? 'Delivery could not be completed and the consignment is being returned to the boutique. Since this was a Cash on Delivery order, no payment was collected.'
                : 'Delivery could not be completed and the package was returned to origin. A full refund for the undelivered items has been automatically processed to your original payment method.'}
            </p>
          </div>
        )}

        {/* Active Return Requests Notice (Section 4, 5) */}
        {returnRequests.length > 0 && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50/60 p-5 space-y-3">
            <h3 className="font-bold text-amber-950 text-sm flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-700" />
              Active Return & Replacement Requests ({returnRequests.length})
            </h3>
            <div className="space-y-2">
              {returnRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-2xl border border-amber-200 bg-white p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-navy">{req.requestNumber || req.id}</span>
                      <span className="rounded bg-amber-100 text-amber-900 px-2 py-0.5 text-[10px] font-extrabold">
                        {req.type}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-800">
                        {req.status}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1">Reason: {req.reason}</p>
                    {/* Customer Refund Display (Section 3 & 15) */}
                    {(req.refundAmount || req.customerRefund?.amount) && (
                      <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-medium text-emerald-900">
                        <span className="font-bold">
                          Refund: ₹
                          {Number(req.customerRefund?.amount || req.refundAmount).toLocaleString(
                            'en-IN',
                          )}
                        </span>
                        <span className="text-emerald-700">•</span>
                        <span>
                          Status:{' '}
                          <strong className="uppercase">
                            {req.customerRefund?.status || req.refundStatus || 'Processing'}
                          </strong>
                        </span>
                        {req.refundReference && (
                          <span className="text-[10px] text-emerald-600 font-mono">
                            Ref: {req.refundReference}
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">
                      Raised on {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <a
                    href={`https://wa.me/${NAVYA_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                      `Hi Navya Collection, regarding my Return/Replacement Request #${req.requestNumber || req.id} for Order #${order.orderNumber}.`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 text-xs shadow-xs self-start sm:self-auto"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Continue on WhatsApp
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Multi-Seller Shipments Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-navy flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-600" />
              {hasMultipleShipments
                ? `Order Shipments (${order.shipments.length} Packages from Multiple Boutiques)`
                : 'Shipment & Delivery Details'}
            </h2>
          </div>

          {order.shipments && order.shipments.length > 0 ? (
            order.shipments.map((shipment: any, idx: number) => (
              <div
                key={shipment.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6"
              >
                {/* Shipment Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center font-bold text-amber-800 text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-navy text-sm">
                          {shipment.shipmentNumber}
                        </h3>
                        <span className="text-[11px] font-bold text-slate-400">•</span>
                        <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {shipment.shopName} ({shipment.pickupCity})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Courier: <strong className="text-slate-700">{shipment.courierName}</strong>
                        {shipment.awbCode && ` | AWB: ${shipment.awbCode}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${
                        shipment.status === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                          : shipment.status === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-300'
                            : shipment.status === 'RTO_DELIVERED' || shipment.status === 'RTO'
                              ? 'bg-purple-50 text-purple-700 border border-purple-300'
                              : shipment.status === 'RTO_INITIATED' ||
                                  shipment.status === 'RTO_IN_TRANSIT'
                                ? 'bg-orange-50 text-orange-700 border border-orange-300'
                                : shipment.status === 'UNDELIVERED'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-300'
                                  : shipment.status === 'IN_TRANSIT' ||
                                      shipment.status === 'SHIPPED'
                                    ? 'bg-sky-50 text-sky-700 border border-sky-300'
                                    : 'bg-amber-50 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {shipment.status === 'RTO_INITIATED'
                        ? 'RTO Initiated'
                        : shipment.status === 'RTO_IN_TRANSIT'
                          ? 'Returning to Boutique'
                          : shipment.status === 'RTO_DELIVERED'
                            ? 'Returned to Boutique'
                            : shipment.status === 'UNDELIVERED'
                              ? 'Delivery Attempted'
                              : shipment.status}
                    </span>
                    {shipment.awbCode && (
                      <a
                        href={
                          shipment.trackingUrl ||
                          `https://shiprocket.co/tracking/${shipment.awbCode}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors inline-flex items-center gap-1 text-xs font-bold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Track
                      </a>
                    )}
                  </div>
                </div>

                {/* Shipment Items List with Return / Replacement CTAs (Section 4, 17) */}
                <div className="divide-y divide-slate-100">
                  {(shipment.items || []).map((item: any) => {
                    const matchedOrderItem =
                      order.items?.find((i: any) => i.id === item.id || i.name === item.name) ||
                      item;
                    const elig = calculateEligibility(matchedOrderItem);

                    return (
                      <div
                        key={item.id}
                        className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-amber-50/50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <Package className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-navy">{item.name}</p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              SKU: {item.sku} {item.size && `• Size: ${item.size}`}{' '}
                              {item.color && `• Color: ${item.color}`}
                            </p>
                            {/* Policy & Eligibility Display (Section 17) */}
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                {elig.policyNotice}
                              </span>
                              {elig.isDelivered && (
                                <>
                                  {elig.returnEligible ? (
                                    <span className="text-[10px] font-bold text-emerald-700">
                                      Return available until{' '}
                                      {elig.returnDeadline?.toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                      })}
                                    </span>
                                  ) : elig.returnAllowedByPolicy ? (
                                    <span className="text-[10px] text-slate-400">
                                      Return window has expired.
                                    </span>
                                  ) : null}

                                  {elig.replacementEligible ? (
                                    <span className="text-[10px] font-bold text-blue-700">
                                      Replacement available until{' '}
                                      {elig.replacementDeadline?.toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                      })}
                                    </span>
                                  ) : elig.replacementAllowedByPolicy ? (
                                    <span className="text-[10px] text-slate-400">
                                      Replacement window has expired.
                                    </span>
                                  ) : null}
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-4">
                          <div className="text-right">
                            <p className="text-xs font-bold text-navy">
                              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                            </p>
                            <p className="text-[11px] text-slate-500">Qty: {item.quantity}</p>
                          </div>

                          {/* Return / Replacement CTA Button (Section 4, 17) */}
                          {isDelivered && (elig.returnEligible || elig.replacementEligible) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openReturnModal(matchedOrderItem)}
                              className="rounded-xl border-amber-300 text-amber-900 hover:bg-amber-50 text-xs font-bold"
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-1" />
                              Return / Replacement
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="font-heading text-lg text-navy mb-4">Order Items</h3>
              <div className="divide-y divide-slate-100">
                {order.items.map((item: any) => {
                  const elig = calculateEligibility(item);
                  return (
                    <div
                      key={item.id}
                      className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 border border-slate-100 flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-navy">{item.name}</p>
                          <p className="text-[11px] text-slate-500">Qty: {item.quantity}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              {elig.policyNotice}
                            </span>
                            {elig.isDelivered && (
                              <>
                                {elig.returnEligible ? (
                                  <span className="text-[10px] font-bold text-emerald-700">
                                    Return until{' '}
                                    {elig.returnDeadline?.toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                    })}
                                  </span>
                                ) : elig.returnAllowedByPolicy ? (
                                  <span className="text-[10px] text-slate-400">
                                    Return window expired.
                                  </span>
                                ) : null}

                                {elig.replacementEligible ? (
                                  <span className="text-[10px] font-bold text-blue-700">
                                    Replacement until{' '}
                                    {elig.replacementDeadline?.toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                    })}
                                  </span>
                                ) : elig.replacementAllowedByPolicy ? (
                                  <span className="text-[10px] text-slate-400">
                                    Replacement window expired.
                                  </span>
                                ) : null}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-4">
                        <p className="text-xs font-bold text-navy">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </p>
                        {isDelivered && (elig.returnEligible || elig.replacementEligible) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openReturnModal(item)}
                            className="rounded-xl border-amber-300 text-amber-900 hover:bg-amber-50 text-xs font-bold"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" />
                            Return / Replacement
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Delivery & Summary Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Delivery Address */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="font-heading text-base font-bold text-navy flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              Customer Delivery Address
            </h3>
            {order.address && (
              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-bold text-navy text-sm">{order.address.name}</p>
                <p>{order.address.mobile}</p>
                <p>
                  {order.address.line1}
                  {order.address.line2 ? `, ${order.address.line2}` : ''}
                </p>
                <p>
                  {order.address.city}, {order.address.state} -{' '}
                  <strong>{order.address.pincode}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Payment & Order Summary */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="font-heading text-base font-bold text-navy flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Payment & Order Summary
            </h3>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Payment Method</span>
                <strong className="text-navy">{order.paymentMethod}</strong>
              </div>
              <div className="flex justify-between">
                <span>Payment Status</span>
                <span className="font-bold text-emerald-700">{order.paymentStatus}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span>{order.shipping === 0 ? 'FREE' : `₹${order.shipping}`}</span>
              </div>
              <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-navy text-sm">
                <span>Grand Total</span>
                <span className="text-amber-800">₹{order.total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Return / Replacement Modal (Section 4, 17, 18) */}
        {returnModalOpen && selectedItemForReturn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
            <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-heading text-lg font-black text-navy flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-amber-600" />
                  Raise Return / Replacement Request
                </h3>
                <button
                  onClick={() => setReturnModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {returnSuccessMsg ? (
                <div className="space-y-4 py-3">
                  <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs text-emerald-900 space-y-2">
                    <p className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Request Submitted Successfully!
                    </p>
                    <p>{returnSuccessMsg.msg}</p>
                    <p className="text-[11px] text-emerald-700">
                      Our customer verification team will review your claim and compare it against
                      the seller&apos;s dispatch packing records.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-xs text-slate-700">
                    <p className="font-bold text-navy">
                      Connect Directly on WhatsApp (Section 4, 18)
                    </p>
                    <p className="text-slate-500">
                      Continue discussing your order with the Navya support team. We have pre-filled
                      your order details:
                    </p>
                    <a
                      href={returnSuccessMsg.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 text-xs transition-colors shadow-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Open WhatsApp with Navya Support
                    </a>
                  </div>

                  <Button
                    onClick={() => setReturnModalOpen(false)}
                    variant="outline"
                    className="w-full rounded-xl text-xs font-bold"
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmitReturn} className="space-y-4 text-xs">
                  {returnErrorMsg && (
                    <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-rose-800 text-xs font-medium">
                      {returnErrorMsg}
                    </div>
                  )}

                  <div className="rounded-2xl bg-amber-50/50 border border-amber-100 p-3 flex items-center gap-3">
                    <Package className="w-8 h-8 text-amber-600 shrink-0" />
                    <div>
                      <p className="font-bold text-navy text-xs">{selectedItemForReturn.name}</p>
                      <p className="text-slate-500 text-[11px]">
                        Order #{order.orderNumber} • Qty: {selectedItemForReturn.quantity} • ₹
                        {selectedItemForReturn.price}
                      </p>
                    </div>
                  </div>

                  {/* Quantity Selector for Partial Returns (BM-08 Section 15) */}
                  {selectedItemForReturn.quantity > 1 && (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Return Quantity (Max {selectedItemForReturn.quantity})
                      </label>
                      <select
                        value={returnQuantity}
                        onChange={(e) => setReturnQuantity(Number(e.target.value))}
                        aria-label="Select quantity to return"
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-none"
                      >
                        {Array.from(
                          { length: selectedItemForReturn.quantity },
                          (_, i) => i + 1,
                        ).map((q) => (
                          <option key={q} value={q}>
                            {q} {q === 1 ? 'unit' : 'units'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Request Type Selector (Enforcing Option A / B / C) */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Request Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={
                          selectedItemForReturn.policyType === 'REPLACEMENT_ONLY' ||
                          !selectedItemForReturn.returnAllowed
                        }
                        onClick={() => setRequestType('RETURN')}
                        className={`rounded-xl border p-2.5 text-center font-bold transition-colors ${
                          requestType === 'RETURN'
                            ? 'border-amber-600 bg-amber-50 text-amber-900'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        } ${
                          selectedItemForReturn.policyType === 'REPLACEMENT_ONLY' ||
                          !selectedItemForReturn.returnAllowed
                            ? 'opacity-40 cursor-not-allowed'
                            : ''
                        }`}
                      >
                        Return for Refund (Max 3 Days)
                      </button>

                      <button
                        type="button"
                        disabled={
                          selectedItemForReturn.policyType === 'NONE' ||
                          !selectedItemForReturn.replacementAllowed
                        }
                        onClick={() => setRequestType('EXCHANGE')}
                        className={`rounded-xl border p-2.5 text-center font-bold transition-colors ${
                          requestType === 'EXCHANGE'
                            ? 'border-amber-600 bg-amber-50 text-amber-900'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        } ${
                          selectedItemForReturn.policyType === 'NONE' ||
                          !selectedItemForReturn.replacementAllowed
                            ? 'opacity-40 cursor-not-allowed'
                            : ''
                        }`}
                      >
                        Replacement (Max 7 Days)
                      </button>
                    </div>
                    {selectedItemForReturn.policyType === 'REPLACEMENT_ONLY' && (
                      <p className="mt-1 text-[10px] text-amber-700">
                        * Seller policy allows Replacement Only for this product.
                      </p>
                    )}
                  </div>

                  {/* Reason Selector */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Reason for Request
                    </label>
                    <select
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      aria-label="Reason for return or replacement request"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-none"
                    >
                      <option value="Damaged or Defective Item">Damaged or Defective Item</option>
                      <option value="Wrong Item or Size Received">
                        Wrong Item or Size Received
                      </option>
                      <option value="Item Not as Described / Quality Issue">
                        Item Not as Described / Quality Issue
                      </option>
                      <option value="Missing Parts or Accessories">
                        Missing Parts or Accessories
                      </option>
                      <option value="Size Fitting Issue">Size Fitting Issue</option>
                    </select>
                  </div>

                  {/* Detailed Description */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Detailed Description
                    </label>
                    <textarea
                      value={detailedReason}
                      onChange={(e) => setDetailedReason(e.target.value)}
                      rows={3}
                      placeholder="Please describe the issue in detail..."
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* COD Refund Destination Details (BM-08 Section 6) */}
                  {order.paymentMethod === 'COD' && requestType === 'RETURN' && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 space-y-3">
                      <div>
                        <p className="font-bold text-navy text-xs">COD Refund Destination</p>
                        <p className="text-slate-500 text-[11px]">
                          Please provide your Bank Account or UPI ID for direct refund disbursement
                          via Razorpay Payouts upon inspection.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRefundMethod('UPI')}
                          className={`rounded-lg border p-2 text-center font-bold text-xs transition-colors ${
                            refundMethod === 'UPI'
                              ? 'border-amber-600 bg-white text-amber-900 shadow-sm'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                          }`}
                        >
                          UPI ID
                        </button>
                        <button
                          type="button"
                          onClick={() => setRefundMethod('BANK')}
                          className={`rounded-lg border p-2 text-center font-bold text-xs transition-colors ${
                            refundMethod === 'BANK'
                              ? 'border-amber-600 bg-white text-amber-900 shadow-sm'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                          }`}
                        >
                          Bank Transfer
                        </button>
                      </div>

                      {refundMethod === 'UPI' ? (
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                            UPI ID
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. mobile@upi or name@okaxis"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            required
                            className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none bg-white"
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                              Account Holder Name
                            </label>
                            <input
                              type="text"
                              placeholder="Name as per bank account"
                              value={accountHolderName}
                              onChange={(e) => setAccountHolderName(e.target.value)}
                              required
                              className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none bg-white"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                              Bank Account Number
                            </label>
                            <input
                              type="text"
                              placeholder="Enter bank account number"
                              value={bankAccountNumber}
                              onChange={(e) => setBankAccountNumber(e.target.value)}
                              required
                              className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none bg-white"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                              IFSC Code
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. HDFC0001234"
                              value={bankIfsc}
                              onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                              required
                              className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none bg-white uppercase"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Evidence Upload */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Upload Photos / Proof (Recommended)
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploading ? 'Uploading...' : 'Choose Photos'}</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleUploadEvidence}
                          className="hidden"
                          disabled={isUploading}
                        />
                      </label>
                      <span className="text-[10px] text-slate-400">
                        {evidenceUrls.length} file(s) attached
                      </span>
                    </div>

                    {evidenceUrls.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {evidenceUrls.map((url, i) => (
                          <div
                            key={i}
                            className="relative w-12 h-12 rounded-lg border overflow-hidden"
                          >
                            <Image
                              src={url}
                              alt={`Evidence ${i + 1}`}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setReturnModalOpen(false)}
                      disabled={isSubmittingReturn}
                      className="rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmittingReturn || isUploading}
                      className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                    >
                      {isSubmittingReturn ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <RotateCcw className="w-4 h-4 mr-1" />
                      )}
                      Submit Request
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
