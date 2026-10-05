'use client';

import {
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Filter,
  Package,
  Printer,
  RefreshCw,
  Search,
  ShieldAlert,
  Tag,
  Truck,
  UploadCloud,
  Video,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { formatPrice } from '@/utils/format-price';

interface PackingProof {
  id: string;
  orderId: string;
  proofType: 'PRODUCT_CONDITION' | 'PACKED_PARCEL';
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  createdAt: string;
}

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<any | null>(null);

  // Packing Proof Modal State (Section 9, 16)
  const [proofOrder, setProofOrder] = useState<any | null>(null);
  const [proofsList, setProofsList] = useState<PackingProof[]>([]);
  const [isLoadingProofs, setIsLoadingProofs] = useState(false);
  const [selectedProofType, setSelectedProofType] = useState<'PRODUCT_CONDITION' | 'PACKED_PARCEL'>(
    'PRODUCT_CONDITION',
  );
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [proofNotes, setProofNotes] = useState('');

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/v1/seller/orders', window.location.origin);
      if (activeTab !== 'ALL') url.searchParams.set('status', activeTab);
      if (searchQuery) url.searchParams.set('q', searchQuery);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success && data.data) {
        setOrders(data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch vendor orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleUpdateStatus = async (vendorOrderId: string, newStatus: string) => {
    setUpdatingOrderId(vendorOrderId);
    setOrders((prev) =>
      prev.map((o) => (o.id === vendorOrderId ? { ...o, status: newStatus } : o)),
    );

    try {
      const res = await fetch('/api/v1/seller/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorOrderId,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Failed to update order status.');
      }
      fetchOrders();
    } catch (err) {
      console.error('Status update failed:', err);
      fetchOrders();
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const openPackingProofModal = async (order: any) => {
    setProofOrder(order);
    setIsLoadingProofs(true);
    setProofNotes('');
    try {
      const res = await fetch(`/api/v1/seller/orders/${order.id}/packing-proof`);
      const json = await res.json();
      if (json.success && json.data) {
        setProofsList(json.data);
      } else {
        setProofsList([]);
      }
    } catch (err) {
      console.error('Failed to load packing proofs', err);
      setProofsList([]);
    } finally {
      setIsLoadingProofs(false);
    }
  };

  const handleUploadProofFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !proofOrder) return;

    setIsUploadingProof(true);
    try {
      // 1. Upload to Cloudinary via /api/v1/upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'packing_proofs');

      const uploadRes = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadJson = await uploadRes.json();

      if (!uploadJson.success || !uploadJson.data?.url) {
        throw new Error(uploadJson.message || 'Upload to storage failed.');
      }

      const mediaUrl = uploadJson.data.url;
      const mediaType = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';

      // 2. Persist in SellerPackingProof DB
      const saveRes = await fetch(`/api/v1/seller/orders/${proofOrder.id}/packing-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proofType: selectedProofType,
          mediaUrl,
          mediaType,
          notes: proofNotes || undefined,
        }),
      });

      const saveJson = await saveRes.json();
      if (!saveJson.success) {
        throw new Error(saveJson.message || 'Failed to record packing proof in database.');
      }

      // Add to current proofs list
      setProofsList((prev) => [saveJson.data, ...prev]);
      alert('Packing proof recorded successfully!');
    } catch (err: any) {
      console.error('Packing proof upload error', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsUploadingProof(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-navy tracking-tight flex items-center gap-3">
            <Package className="w-6 h-6 text-amber-600" />
            Vendor Orders & Dispatch Center
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Fulfill orders, record required packing proofs (photos/videos) before dispatch, track
            7-day settlement eligibility, and monitor shipping deductions.
          </p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search Order # or Buyer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-navy focus:bg-white focus:border-amber-500 focus:outline-none transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </form>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { label: 'All Orders', value: 'ALL' },
          { label: 'Pending', value: 'PENDING' },
          { label: 'Confirmed', value: 'CONFIRMED' },
          { label: 'Processing', value: 'PROCESSING' },
          { label: 'Shipped', value: 'SHIPPED' },
          { label: 'Delivered', value: 'DELIVERED' },
          { label: 'Cancelled', value: 'CANCELLED' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.value
                ? 'bg-navy text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Table Container */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-500">Loading orders & settlements...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-extrabold text-navy">No Orders Found</p>
            <p className="text-xs text-slate-400 mt-1">There are no orders matching this filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3.5 border-r border-slate-200">Order #</th>
                  <th className="px-4 py-3.5 border-r border-slate-200">Date</th>
                  <th className="px-4 py-3.5 border-r border-slate-200">Customer</th>
                  <th className="px-4 py-3.5 border-r border-slate-200">Items & Policy</th>
                  <th className="px-4 py-3.5 border-r border-slate-200">Commercial & 10% Comm.</th>
                  <th className="px-4 py-3.5 border-r border-slate-200">
                    Settlement (Delivery+7d)
                  </th>
                  <th className="px-4 py-3.5 border-r border-slate-200 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {orders.map((order) => {
                  const masterOrder = order.masterOrder || {};
                  const user = masterOrder.user || {};
                  const items = order.items || [];
                  const settlement = order.settlement;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Order Number */}
                      <td className="px-4 py-4 border-r border-slate-200 whitespace-nowrap">
                        <span className="font-extrabold text-navy block">
                          {order.vendorOrderNumber || order.id.slice(0, 8)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Master: #{masterOrder.orderNumber}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 border-r border-slate-200 text-slate-600 whitespace-nowrap font-medium">
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-4 border-r border-slate-200 whitespace-nowrap font-bold text-navy">
                        {user.name || 'Buyer'}
                        <span className="block text-[10px] text-slate-500 font-mono font-normal">
                          {user.mobile || masterOrder.address?.phone || ''}
                        </span>
                      </td>

                      {/* Items & Policy */}
                      <td className="px-4 py-4 border-r border-slate-200">
                        <div className="space-y-1 max-w-xs">
                          {items.map((it: any) => (
                            <div key={it.id} className="text-slate-800 font-medium">
                              <span className="truncate block font-semibold">
                                • {it.name} (x{it.quantity})
                              </span>
                              <span className="inline-block rounded bg-slate-100 px-1.5 py-0.2 text-[9px] text-slate-600">
                                Policy: {it.product?.returnPolicyType || 'STANDARD'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Commercial & 10% Commission (Section 1) */}
                      <td className="px-4 py-4 border-r border-slate-200 font-mono text-xs">
                        <div className="text-slate-900 font-bold">
                          Gross:{' '}
                          {formatPrice(settlement?.grossProductValue || order.totalAmount || 0)}
                        </div>
                        <div className="text-amber-800 text-[11px]">
                          Commission (10% MRP): -
                          {formatPrice(
                            settlement?.commissionAmount ??
                              order.commissionAmount ??
                              (order.totalMrp || order.totalAmount || 0) * 0.1,
                          )}
                        </div>
                        {settlement && settlement.returnShippingDeduction > 0 && (
                          <div className="text-rose-700 text-[10px] font-bold">
                            Return Deduct: -{formatPrice(settlement.returnShippingDeduction)}
                          </div>
                        )}
                      </td>

                      {/* Settlement & Delivery + 7d (Section 2, 16) */}
                      <td className="px-4 py-4 border-r border-slate-200 text-xs">
                        <div className="font-black text-emerald-800 font-mono">
                          Net:{' '}
                          {formatPrice(
                            settlement?.netSettlementAmount ??
                              order.vendorPayoutAmount ??
                              Math.max(0, (order.totalAmount || 0) - (order.commissionAmount || 0)),
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Status:{' '}
                          <span
                            className={`font-bold ${
                              settlement?.status === 'ELIGIBLE_FOR_SETTLEMENT'
                                ? 'text-emerald-700'
                                : settlement?.status === 'ON_HOLD'
                                  ? 'text-rose-700'
                                  : 'text-amber-700'
                            }`}
                          >
                            {settlement?.status || 'PENDING'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Eligible:{' '}
                          {settlement?.settlementEligibilityDate
                            ? new Date(settlement.settlementEligibilityDate).toLocaleDateString()
                            : 'Delivery + 7d'}
                        </div>
                        {settlement?.holdReason && (
                          <div className="text-[9px] text-rose-600 italic max-w-[150px]">
                            {settlement.holdReason}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 border-r border-slate-200 text-center whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                            order.status === 'DELIVERED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : order.status === 'SHIPPED'
                                ? 'bg-sky-50 text-sky-800 border-sky-300'
                                : order.status === 'CONFIRMED'
                                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                                  : order.status === 'PROCESSING'
                                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                                    : order.status === 'CANCELLED'
                                      ? 'bg-rose-50 text-rose-800 border-rose-300'
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {/* Packing Proof Button (Section 9) */}
                          <button
                            onClick={() => openPackingProofModal(order)}
                            className="p-1.5 inline-flex bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 rounded-xl transition-colors shadow-2xs"
                            title="Upload/View Packing Proof (Photo/Video)"
                          >
                            <Camera className="w-4 h-4 text-amber-700" />
                          </button>

                          {/* Status Transition Select Dropdown */}
                          <div className="relative inline-block">
                            <select
                              value={order.status || 'PENDING'}
                              disabled={updatingOrderId === order.id}
                              onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                              aria-label="Update vendor order status"
                              className="appearance-none bg-navy hover:bg-slate-800 disabled:opacity-60 border border-slate-700 hover:border-amber-500 rounded-xl pl-2.5 pr-6 py-1.5 text-[11px] font-bold text-amber-300 focus:border-amber-500 focus:outline-none shadow-xs transition-colors cursor-pointer"
                            >
                              <option value="PENDING" className="bg-slate-900 text-white">
                                Pending
                              </option>
                              <option value="CONFIRMED" className="bg-slate-900 text-white">
                                Confirmed
                              </option>
                              <option value="PROCESSING" className="bg-slate-900 text-white">
                                Processing
                              </option>
                              <option value="SHIPPED" className="bg-slate-900 text-white">
                                Shipped
                              </option>
                              <option value="DELIVERED" className="bg-slate-900 text-white">
                                Delivered
                              </option>
                              <option value="CANCELLED" className="bg-slate-900 text-white">
                                Cancelled
                              </option>
                            </select>
                          </div>

                          {/* Print Invoice Button */}
                          <Link
                            href={`/seller/orders/${order.id}/invoice`}
                            target="_blank"
                            className="p-1.5 inline-flex bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 rounded-xl transition-colors shadow-2xs"
                            title="Print Tax Invoice"
                          >
                            <FileText className="w-4 h-4 text-amber-600" />
                          </Link>

                          {/* Track Button */}
                          <button
                            onClick={() => setTrackingOrder(order)}
                            className="p-1.5 inline-flex bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 rounded-xl transition-colors shadow-2xs cursor-pointer"
                            title="Live Track Shipment"
                          >
                            <Truck className="w-4 h-4 text-emerald-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PACKING PROOF MODAL (Section 9, 16) */}
      {proofOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-xl w-full space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-navy text-base">
                  Packing Proof Evidence — Order #
                  {proofOrder.vendorOrderNumber || proofOrder.id.slice(0, 8)}
                </h3>
              </div>
              <button
                onClick={() => setProofOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Per Navya marketplace safety policy (Section 9), capture product condition and packed
              parcel proof before dispatch. This protects you in customer return disputes.
            </p>

            {/* Proof Type Selector */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedProofType('PRODUCT_CONDITION')}
                className={`p-3 rounded-2xl border font-bold text-center transition-colors ${
                  selectedProofType === 'PRODUCT_CONDITION'
                    ? 'border-amber-600 bg-amber-50 text-amber-950'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                1. Product Condition Proof
                <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                  Item state before packaging
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedProofType('PACKED_PARCEL')}
                className={`p-3 rounded-2xl border font-bold text-center transition-colors ${
                  selectedProofType === 'PACKED_PARCEL'
                    ? 'border-amber-600 bg-amber-50 text-amber-950'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                2. Packed Parcel Proof
                <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                  Sealed box/bag with shipping label
                </span>
              </button>
            </div>

            {/* Upload Area */}
            <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/40 p-4 text-center space-y-2">
              <div className="mx-auto w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-navy">Upload Photo or Video (Up to 50MB)</p>
              <p className="text-[10px] text-slate-500">
                Supports JPG, PNG, WEBP, MP4, MOV, WEBM stored securely via Cloudinary
              </p>

              <div className="pt-2">
                <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 text-xs shadow-xs transition-colors">
                  {isUploadingProof ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Uploading & Storing...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      Select Photo / Video File
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*,video/*"
                    disabled={isUploadingProof}
                    onChange={handleUploadProofFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* List of Existing Uploaded Proofs */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-navy flex items-center justify-between">
                <span>Recorded Evidence ({proofsList.length})</span>
                {isLoadingProofs && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                )}
              </h4>

              {proofsList.length === 0 ? (
                <div className="text-center py-6 border rounded-2xl bg-slate-50 text-xs text-slate-400">
                  No proofs recorded yet for this order.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {proofsList.map((proof) => (
                    <div
                      key={proof.id}
                      className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-black/5"
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
                            sizes="(max-width: 768px) 33vw, 20vw"
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        </a>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/75 px-1 py-0.5 text-[8px] text-white truncate">
                        {proof.proofType === 'PRODUCT_CONDITION' ? 'Condition' : 'Packed Parcel'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <Button
                variant="outline"
                onClick={() => setProofOrder(null)}
                className="rounded-xl text-xs font-bold"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TRACKING TIMELINE MODAL */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-6 shadow-2xl relative">
            <button
              onClick={() => setTrackingOrder(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-full bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <Truck className="w-6 h-6 text-amber-400" />
              <div>
                <h3 className="font-extrabold text-white text-base">Shipment Tracking Timeline</h3>
                <p className="text-xs text-slate-400 font-mono">
                  AWB: {trackingOrder.awbCode || `AWB-${trackingOrder.vendorOrderNumber.slice(-8)}`}
                </p>
              </div>
            </div>

            {/* Step-by-Step Progress Bar */}
            <div className="space-y-4 text-xs">
              {[
                {
                  title: 'Order Placed & Confirmed',
                  desc: 'Customer placed multi-vendor order',
                  done: true,
                },
                {
                  title: 'Boutique Packed',
                  desc: 'Merchant packed items for dispatch',
                  done: trackingOrder.status !== 'PENDING',
                },
                {
                  title: 'Shiprocket Pickup',
                  desc: 'Courier picked up package from warehouse',
                  done: trackingOrder.status === 'SHIPPED' || trackingOrder.status === 'DELIVERED',
                },
                {
                  title: 'Delivered to Customer',
                  desc: 'Package delivered at buyer destination',
                  done: trackingOrder.status === 'DELIVERED',
                },
              ].map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                      step.done
                        ? 'bg-emerald-500 text-white shadow-xs shadow-emerald-500/50'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {step.done ? '✓' : idx + 1}
                  </div>
                  <div>
                    <p className={`font-bold ${step.done ? 'text-white' : 'text-slate-400'}`}>
                      {step.title}
                    </p>
                    <p className="text-slate-500 text-[11px]">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <Button
                variant="outline"
                onClick={() => setTrackingOrder(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700 text-xs rounded-xl"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
