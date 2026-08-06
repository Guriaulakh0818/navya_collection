'use client';

import { Printer, Truck } from 'lucide-react';
import { use, useEffect, useState } from 'react';

interface LabelPageProps {
  params: Promise<{ id: string }>;
}

export default function PrintableShippingLabelPage({ params }: LabelPageProps) {
  const { id } = use(params);
  const [order, setOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/v1/seller/orders/${id}`);
        const data = await res.json();
        if (data.success) {
          setOrder(data.data);
        }
      } catch (err) {
        console.error('Failed to load shipping label order:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-slate-900 p-8 flex items-center justify-center">
        <p className="text-sm font-semibold">Generating 4x6 Shipping Label...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white text-slate-900 p-8 text-center">
        <p className="text-sm text-red-600 font-bold">
          Order not found for Shipping Label generation.
        </p>
      </div>
    );
  }

  const shop = order.shop || {};
  const masterOrder = order.masterOrder || {};
  const address = masterOrder.address || {};
  const user = masterOrder.user || {};
  const awbCode = order.awbCode || `AWB-${order.vendorOrderNumber.slice(-8)}`;

  return (
    <div className="min-h-screen bg-white text-slate-900 p-6 flex flex-col items-center justify-center font-sans space-y-6">
      {/* Print Action Header */}
      <div className="flex items-center justify-between w-full max-w-md border-b pb-4 print:hidden">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-amber-600" />
          <h1 className="text-sm font-bold text-slate-900">4x6 Shipping Label Preview</h1>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md"
        >
          <Printer className="w-4 h-4" /> Print Label
        </button>
      </div>

      {/* 4x6 SHIPPING LABEL CONTAINER */}
      <div className="w-[380px] border-2 border-slate-900 rounded-xl p-5 space-y-4 shadow-xl bg-white font-mono text-xs">
        {/* Top Shipping Courier Badge */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
          <div>
            <span className="font-extrabold text-sm uppercase block tracking-wider">
              SHIPROCKET EXPRESS
            </span>
            <span className="text-[10px] text-slate-600 font-sans">
              Prepaid / COD Courier Dispatch
            </span>
          </div>
          <span className="px-3 py-1 bg-slate-900 text-white font-extrabold text-xs rounded">
            {masterOrder.paymentMethod || 'COD'}
          </span>
        </div>

        {/* Barcode Mock & AWB */}
        <div className="text-center py-2 border-b-2 border-slate-900 space-y-1">
          <div className="h-14 bg-slate-900 flex items-center justify-center text-white text-[10px] tracking-widest font-mono rounded">
            ||| | ||||| || |||||| | |||| ||| |||||||
          </div>
          <p className="font-extrabold text-sm tracking-wider">AWB: {awbCode}</p>
          <p className="text-[10px] text-slate-600 font-sans">Order #: {order.vendorOrderNumber}</p>
        </div>

        {/* Deliver To Address */}
        <div className="border-b-2 border-slate-900 pb-3 space-y-1 font-sans">
          <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">
            DELIVER TO:
          </span>
          <p className="font-extrabold text-slate-900 text-sm">{address.name || user.name}</p>
          <p className="text-xs text-slate-800">{address.street || address.addressLine1}</p>
          <p className="text-xs font-bold text-slate-900">
            {address.city}, {address.state} - {address.pincode}
          </p>
          <p className="text-xs text-slate-800">
            Phone: <strong>{address.phone || user.mobile}</strong>
          </p>
        </div>

        {/* Return Address / Seller Info */}
        <div className="space-y-1 font-sans text-[11px]">
          <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">
            RETURN / SHIPPER:
          </span>
          <p className="font-bold text-slate-900">{shop.name || 'Boutique Merchant'}</p>
          <p className="text-slate-600 text-[10px]">
            {shop.city || 'Hisar'}, {shop.state || 'Haryana'}, India
          </p>
        </div>
      </div>
    </div>
  );
}
