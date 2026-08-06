'use client';

import { Building2, Printer } from 'lucide-react';
import { use, useEffect, useState } from 'react';

interface InvoicePageProps {
  params: Promise<{ id: string }>;
}

export default function PrintableInvoicePage({ params }: InvoicePageProps) {
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
        console.error('Failed to load invoice order:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-slate-900 p-8 flex items-center justify-center">
        <p className="text-sm font-semibold">Generating Tax Invoice PDF...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white text-slate-900 p-8 text-center">
        <p className="text-sm text-red-600 font-bold">
          Order not found for Tax Invoice generation.
        </p>
      </div>
    );
  }

  const shop = order.shop || {};
  const sellerProfile = shop.sellerProfile || {};
  const masterOrder = order.masterOrder || {};
  const address = masterOrder.address || {};
  const user = masterOrder.user || {};
  const items = order.items || [];

  const subtotal = Number(order.totalAmount || 0);
  const gstRate = 0.05; // 5% GST on Textiles/Garments
  const cgst = subtotal * (gstRate / 2);
  const sgst = subtotal * (gstRate / 2);
  const grandTotal = subtotal;

  return (
    <div className="min-h-screen bg-white text-slate-900 p-6 sm:p-10 font-sans max-w-4xl mx-auto space-y-8">
      {/* Print Action Header */}
      <div className="flex items-center justify-between border-b pb-4 print:hidden">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-amber-600" />
          <h1 className="text-lg font-bold text-slate-900">GST Tax Invoice Preview</h1>
        </div>

        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md"
        >
          <Printer className="w-4 h-4" /> Print Tax Invoice
        </button>
      </div>

      {/* INVOICE CONTENT */}
      <div className="border border-slate-300 rounded-2xl p-8 space-y-6 shadow-xs">
        {/* Top Branding & Invoice Title */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {shop.name || 'Boutique Merchant'}
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-xs">
              {sellerProfile.businessAddress || 'Hisar, Haryana, India'}
            </p>
            <p className="text-xs text-slate-600 font-mono mt-1">
              GSTIN: <strong>{sellerProfile.gstin || '06AAAAA0000A1Z5'}</strong>
            </p>
          </div>

          <div className="text-right">
            <span className="px-3 py-1 bg-slate-100 text-slate-800 text-xs font-extrabold uppercase rounded-md border border-slate-200 block mb-2">
              TAX INVOICE
            </span>
            <p className="text-xs text-slate-600 font-mono">
              Invoice #: <strong>INV-{order.vendorOrderNumber}</strong>
            </p>
            <p className="text-xs text-slate-600 font-mono">
              Date: <strong>{new Date(order.createdAt).toLocaleDateString('en-IN')}</strong>
            </p>
            <p className="text-xs text-slate-600 font-mono">
              Order #: <strong>{masterOrder.orderNumber}</strong>
            </p>
          </div>
        </div>

        {/* Addresses Grid */}
        <div className="grid grid-cols-2 gap-8 text-xs border-b border-slate-200 pb-6">
          <div>
            <h3 className="font-bold uppercase tracking-wider text-[10px] text-slate-500 mb-1">
              Billed & Shipped To:
            </h3>
            <p className="font-extrabold text-slate-900 text-sm">{address.name || user.name}</p>
            <p className="text-slate-600 mt-1">{address.street || address.addressLine1}</p>
            <p className="text-slate-600">
              {address.city}, {address.state} - {address.pincode}
            </p>
            <p className="text-slate-600 mt-1">
              Phone: <strong>{address.phone || user.mobile}</strong>
            </p>
          </div>

          <div className="text-right">
            <h3 className="font-bold uppercase tracking-wider text-[10px] text-slate-500 mb-1">
              Fulfillment Details:
            </h3>
            <p className="text-slate-700">
              Fulfillment: <strong>Shiprocket Express</strong>
            </p>
            <p className="text-slate-700">
              Payment Method: <strong>{masterOrder.paymentMethod || 'COD'}</strong>
            </p>
            <p className="text-slate-700">
              Payment Status: <strong>{masterOrder.paymentStatus}</strong>
            </p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">Item Description</th>
              <th className="py-2.5 px-3">SKU</th>
              <th className="py-2.5 px-3 text-right">Qty</th>
              <th className="py-2.5 px-3 text-right">Unit Price</th>
              <th className="py-2.5 px-3 text-right">Total (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item: any, index: number) => (
              <tr key={item.id}>
                <td className="py-3 px-3 font-mono">{index + 1}</td>
                <td className="py-3 px-3">
                  <span className="font-bold text-slate-900 block">{item.name}</span>
                  {item.variant && (
                    <span className="text-[10px] text-slate-500">
                      Size: {item.variant.size} | Color: {item.variant.color}
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 font-mono text-slate-600">{item.sku}</td>
                <td className="py-3 px-3 text-right font-bold">{item.quantity}</td>
                <td className="py-3 px-3 text-right font-mono">
                  ₹{Number(item.price).toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-3 text-right font-extrabold font-mono">
                  ₹{Number(item.total).toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Tax Summary & Totals */}
        <div className="flex justify-between items-start pt-4 border-t border-slate-200 text-xs">
          <div className="space-y-1 text-slate-600 max-w-xs">
            <p className="font-bold text-slate-900">Declaration:</p>
            <p className="text-[10px]">
              We declare that this invoice shows the actual price of goods described and that all
              particulars are true and correct.
            </p>
          </div>

          <div className="w-64 space-y-2 text-right">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>CGST (2.5%):</span>
              <span className="font-mono">₹{cgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>SGST (2.5%):</span>
              <span className="font-mono">₹{sgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-300">
              <span>Grand Total:</span>
              <span className="font-mono text-amber-700">
                ₹{grandTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Signature */}
        <div className="pt-8 flex justify-end text-right">
          <div>
            <div className="h-12 w-36 border-b border-slate-400 mb-1" />
            <span className="text-[10px] font-bold uppercase text-slate-500 block">
              Authorized Signatory
            </span>
            <span className="text-xs font-bold text-slate-900">{shop.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
