'use client';

import { ArrowLeft, Building2, CheckCircle2, FileText, Printer } from 'lucide-react';
import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

// Indian State Codes for GST
const STATE_GST_CODES: Record<string, string> = {
  'JAMMU AND KASHMIR': '01',
  'HIMACHAL PRADESH': '02',
  PUNJAB: '03',
  CHANDIGARH: '04',
  UTTARAKHAND: '05',
  HARYANA: '06',
  DELHI: '07',
  RAJASTHAN: '08',
  'UTTAR PRADESH': '09',
  BIHAR: '10',
  SIKKIM: '11',
  'ARUNACHAL PRADESH': '12',
  NAGALAND: '13',
  MANIPUR: '14',
  MIZORAM: '15',
  TRIPURA: '16',
  MEGHALAYA: '17',
  ASSAM: '18',
  'WEST BENGAL': '19',
  JHARKHAND: '20',
  ODISHA: '21',
  CHHATTISGARH: '22',
  'MADHYA PRADESH': '23',
  GUJARAT: '24',
  MAHARASHTRA: '27',
  KARNATAKA: '29',
  GOA: '30',
  KERALA: '32',
  'TAMIL NADU': '33',
  TELANGANA: '36',
  'ANDHRA PRADESH': '37',
};

function getStateCode(stateName?: string): string {
  if (!stateName) return '06';
  const normalized = stateName.trim().toUpperCase();
  return STATE_GST_CODES[normalized] || '06';
}

function numberToWords(num: number): string {
  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = Math.round(num);
  if (n === 0) return 'Zero';

  function convert(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '')
      );
    if (n < 100000)
      return (
        convert(Math.floor(n / 1000)) +
        ' Thousand' +
        (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '')
      );
    if (n < 10000000)
      return (
        convert(Math.floor(n / 100000)) +
        ' Lakh' +
        (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '')
      );
    return (
      convert(Math.floor(n / 10000000)) +
      ' Crore' +
      (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '')
    );
  }

  return 'Rupees ' + convert(n) + ' Only';
}

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
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-orange border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Generating GST Tax Invoice...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white text-slate-900 p-8 flex items-center justify-center">
        <div className="text-center max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-navy mb-2">Invoice Unavailable</h2>
          <p className="text-xs text-slate-500 mb-6">
            The requested invoice could not be located or you do not have permission to view it.
          </p>
          <Button asChild className="rounded-xl bg-orange hover:bg-orange/90 text-white text-xs">
            <Link href="/seller/orders">Back to Vendor Orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  const shop = order.shop || {};
  const sellerProfile = shop.sellerProfile || {};
  const masterOrder = order.masterOrder || {};
  const address = masterOrder.address || {};
  const user = masterOrder.user || {};
  const items = order.items || [];

  const invoiceNumber = `INV-${order.vendorOrderNumber || order.id}`;
  const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const customerState = address.state || 'Haryana';
  const customerStateCode = getStateCode(customerState);
  // Seller and marketplace platform are registered in Haryana (06)
  const isInterState = customerStateCode !== '06';

  const subtotal = Number(order.totalAmount || 0);
  const gstRate = 0.05; // 5% GST on Apparel/Textiles
  const taxableAmount = Math.round((subtotal / (1 + gstRate)) * 100) / 100;
  const totalTax = Math.round((subtotal - taxableAmount) * 100) / 100;
  const cgstAmount = isInterState ? 0 : Math.round((totalTax / 2) * 100) / 100;
  const sgstAmount = isInterState ? 0 : Math.round((totalTax / 2) * 100) / 100;
  const igstAmount = isInterState ? totalTax : 0;
  const grandTotal = subtotal;

  const customerName = address.fullName || address.name || user.name || 'Valued Customer';
  const customerPhone = address.mobile || address.phone || user.mobile || 'N/A';
  const addressLine1 = address.addressLine1 || address.street || address.line1 || '';
  const addressLine2 = address.addressLine2 || address.line2 || '';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 print:p-0 print:bg-white text-slate-900 font-sans">
      {/* Top Control Bar (Hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between gap-3 print:hidden">
        <Link
          href="/seller/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-navy transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vendor Orders
        </Link>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => window.print()}
            className="bg-navy hover:bg-navy/90 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print Tax Invoice
          </Button>
        </div>
      </div>

      {/* Printable Tax Invoice Container */}
      <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-sm print:shadow-none print:border-none print:p-0 space-y-8">
        {/* Header & Marketplace Info */}
        <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-2xl font-black text-navy tracking-tight">
                Jiivaa<span className="text-orange">Kart</span>
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-orange/10 text-orange rounded-md tracking-wider">
                Official Marketplace
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-700 mt-1">JiivaaKart Private Limited</p>
            <p className="text-[11px] text-slate-500">Main Market, Fatehabad, Haryana - 125050</p>
            <p className="text-[11px] text-slate-500">
              GSTIN: <span className="font-mono font-bold text-slate-800">06AABCN1234F1Z8</span> |
              State: Haryana (06)
            </p>
            <p className="text-[11px] text-slate-500">
              Email: helpdesk@jiivaakart.com | WhatsApp: +91 9053883125
            </p>
          </div>

          <div className="sm:text-right">
            <h1 className="text-xl font-black tracking-tight text-navy uppercase">
              Tax Invoice / Bill of Supply
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Issued Under Section 31 of CGST Act, 2017
            </p>
            <div className="mt-3 space-y-0.5 text-xs">
              <p>
                <span className="text-slate-500">Invoice No:</span>{' '}
                <span className="font-mono font-bold text-slate-900">{invoiceNumber}</span>
              </p>
              <p>
                <span className="text-slate-500">Invoice Date:</span>{' '}
                <span className="font-semibold text-slate-900">{invoiceDate}</span>
              </p>
              <p>
                <span className="text-slate-500">Order Ref:</span>{' '}
                <span className="font-mono font-semibold text-slate-900">
                  #{masterOrder.orderNumber || order.vendorOrderNumber}
                </span>
              </p>
              <p>
                <span className="text-slate-500">Place of Supply:</span>{' '}
                <span className="font-semibold text-slate-900">
                  {customerState} ({customerStateCode})
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Sold By & Billed To Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 border border-slate-100 rounded-2xl p-5">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
              Sold By (Merchant / Supplier)
            </p>
            <p className="text-sm font-bold text-navy">{shop.name || 'Navya Collection'}</p>
            <p className="text-xs text-slate-600 mt-0.5">
              {sellerProfile.businessAddress || 'Mandi Adampur, Haryana - 125052'}
            </p>
            <p className="text-xs text-slate-600 font-mono mt-0.5">
              GSTIN: <strong>{sellerProfile.gstin || '06AAAAA0000A1Z5'}</strong> | State: Haryana
              (06)
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Fulfillment: <strong>Shiprocket Express</strong>
            </p>
          </div>

          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
              Billed & Shipped To (Customer)
            </p>
            <p className="text-sm font-bold text-navy">{customerName}</p>
            <p className="text-xs text-slate-600 mt-0.5">
              Phone: <strong>{customerPhone}</strong>
            </p>
            <p className="text-xs text-slate-600">
              {addressLine1}
              {addressLine2 ? `, ${addressLine2}` : ''}
            </p>
            <p className="text-xs text-slate-600">
              {address.city}, {customerState} - {address.pincode}
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 pt-1 border-t border-slate-200/60">
              <span>
                Payment: <strong>{masterOrder.paymentMethod || 'COD'}</strong>
              </span>
              <span>•</span>
              <span>
                Status: <strong>{masterOrder.paymentStatus || 'PENDING'}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Itemized Goods Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3">Description of Goods</th>
                <th className="py-2.5 px-3 text-center">HSN</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Gross (₹)</th>
                <th className="py-2.5 px-3 text-right">Taxable (₹)</th>
                {isInterState ? (
                  <th className="py-2.5 px-3 text-right">IGST 5% (₹)</th>
                ) : (
                  <>
                    <th className="py-2.5 px-3 text-right">CGST 2.5% (₹)</th>
                    <th className="py-2.5 px-3 text-right">SGST 2.5% (₹)</th>
                  </>
                )}
                <th className="py-2.5 px-3 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item: any, idx: number) => {
                const itemGross = Number(item.total || item.price * item.quantity);
                const itemTaxable = Math.round((itemGross / (1 + gstRate)) * 100) / 100;
                const itemTax = Math.round((itemGross - itemTaxable) * 100) / 100;
                const itemCgst = isInterState ? 0 : Math.round((itemTax / 2) * 100) / 100;
                const itemSgst = isInterState ? 0 : Math.round((itemTax / 2) * 100) / 100;
                const itemIgst = isInterState ? itemTax : 0;
                const hsnCode =
                  item.hsn || (item.name?.toLowerCase().includes('shirt') ? '6205' : '6204');

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        SKU: {item.sku}{' '}
                        {item.variant
                          ? `| Size: ${item.variant.size || 'Free'} | Color: ${item.variant.color || 'Standard'}`
                          : ''}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600">{hsnCode}</td>
                    <td className="py-3 px-3 text-center font-bold">{item.quantity}</td>
                    <td className="py-3 px-3 text-right font-semibold">₹{itemGross.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-semibold">
                      ₹{itemTaxable.toFixed(2)}
                    </td>
                    {isInterState ? (
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        ₹{itemIgst.toFixed(2)}
                      </td>
                    ) : (
                      <>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          ₹{itemCgst.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          ₹{itemSgst.toFixed(2)}
                        </td>
                      </>
                    )}
                    <td className="py-3 px-3 text-right font-bold text-navy">
                      ₹{itemGross.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Calculation Summary */}
        <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row justify-between gap-6">
          <div className="space-y-3 max-w-sm">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Amount in Words:
              </p>
              <p className="text-xs font-bold text-navy italic">{numberToWords(grandTotal)}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] space-y-1">
              <p>
                <span className="text-slate-500">Payment Mode:</span>{' '}
                <span className="font-bold text-slate-800">
                  {masterOrder.paymentMethod || 'COD'}
                </span>
              </p>
              <p>
                <span className="text-slate-500">Payment Status:</span>{' '}
                <span
                  className={`font-bold ${masterOrder.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-orange'}`}
                >
                  {masterOrder.paymentStatus || 'PENDING'}
                </span>
              </p>
              <p>
                <span className="text-slate-500">Fulfillment Partner:</span>{' '}
                <span className="font-semibold text-slate-700">Shiprocket Express</span>
              </p>
            </div>
          </div>

          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal (Gross):</span>
              <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Taxable Value:</span>
              <span className="font-semibold">₹{taxableAmount.toFixed(2)}</span>
            </div>
            {isInterState ? (
              <div className="flex justify-between text-slate-600">
                <span>Integrated GST (5.0%):</span>
                <span className="font-semibold">₹{igstAmount.toFixed(2)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>Central GST (2.5%):</span>
                  <span className="font-semibold">₹{cgstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>State GST (2.5%):</span>
                  <span className="font-semibold">₹{sgstAmount.toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Shipping & Handling:</span>
              <span className="font-semibold text-emerald-600">FREE</span>
            </div>
            <div className="border-t-2 border-slate-900 pt-2 flex justify-between text-sm font-black text-navy">
              <span>Grand Total (INR):</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Legal Signatory & Disclaimer */}
        <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="text-[10px] text-slate-400 space-y-0.5 max-w-md">
            <p className="font-bold text-slate-600">Declaration & Terms:</p>
            <p>
              1. We declare that this invoice shows the actual price of goods described and that all
              particulars are true and correct.
            </p>
            <p>
              2. Goods sold are covered under JiivaaKart standard return and replacement guidelines.
            </p>
            <p>3. Subject to Fatehabad (Haryana) jurisdiction only.</p>
            <p className="italic mt-1">
              This is a system generated tax invoice and requires no physical signature.
            </p>
          </div>

          <div className="text-center sm:text-right border border-slate-200 rounded-2xl p-4 bg-slate-50/50 min-w-44">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Authorized Signatory
            </p>
            <div className="my-2 h-7 flex items-center justify-center">
              <span className="font-heading font-black text-navy text-sm italic tracking-tight">
                JiivaaKart Private Limited
              </span>
            </div>
            <p className="text-[9px] font-semibold text-emerald-600">
              ✓ Digitally Verified Invoice
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
