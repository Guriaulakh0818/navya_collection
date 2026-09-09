'use client';

import {
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Filter,
  Package,
  Printer,
  Search,
  Tag,
  Truck,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<any | null>(null);

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
    // Optimistic UI update
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
          shippingStatus:
            newStatus === 'SHIPPED'
              ? 'SHIPPED'
              : newStatus === 'DELIVERED'
                ? 'DELIVERED'
                : newStatus === 'PACKED' || newStatus === 'PROCESSING'
                  ? 'PROCESSING'
                  : 'PENDING',
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
            Fulfill incoming customer orders, generate shipping labels, print GST tax invoices, and
            track pickups.
          </p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by order # or item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none shadow-xs"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto max-w-full scrollbar-none pb-2 text-xs font-bold border-b border-slate-200">
        {[
          { key: 'ALL', label: 'All Orders' },
          { key: 'PENDING', label: 'Pending' },
          { key: 'PACKED', label: 'Packed' },
          { key: 'READY', label: 'Ready for Pickup' },
          { key: 'SHIPPED', label: 'Shipped' },
          { key: 'DELIVERED', label: 'Delivered' },
          { key: 'CANCELLED', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 border cursor-pointer ${
              activeTab === tab.key
                ? 'bg-amber-50 text-amber-800 border-amber-400 font-extrabold shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-600 flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span className="font-semibold text-xs">Loading vendor orders...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Package className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="font-semibold text-sm">
              No vendor orders found matching &quot;{activeTab}&quot; status.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-xs text-left text-slate-700 border-collapse">
              <thead className="bg-slate-100/90 text-navy font-extrabold uppercase border-b-2 border-slate-200 tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                    Vendor Order #
                  </th>
                  <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">Date</th>
                  <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                    Customer
                  </th>
                  <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">Items</th>
                  <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap text-right">
                    Subtotal
                  </th>
                  <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap text-right">
                    Net Payout
                  </th>
                  <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap text-center">
                    Status
                  </th>
                  <th className="px-4 py-3.5 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {orders.map((order) => {
                  const masterOrder = order.masterOrder || {};
                  const user = masterOrder.user || {};
                  const items = order.items || [];

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-4 border-r border-slate-200 whitespace-nowrap font-mono font-bold text-amber-700">
                        {order.vendorOrderNumber}
                        <span className="block text-[10px] text-slate-500 font-sans font-medium">
                          Master: {masterOrder.orderNumber}
                        </span>
                      </td>

                      <td className="px-4 py-4 border-r border-slate-200 text-slate-600 whitespace-nowrap font-medium">
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </td>

                      <td className="px-4 py-4 border-r border-slate-200 whitespace-nowrap font-bold text-navy">
                        {user.name || 'Boutique Buyer'}
                        <span className="block text-[10px] text-slate-500 font-mono font-normal">
                          📱 {user.mobile || masterOrder.address?.phone}
                        </span>
                      </td>

                      <td className="px-4 py-4 border-r border-slate-200">
                        <div className="space-y-1 max-w-xs">
                          {items.map((it: any) => (
                            <span key={it.id} className="block text-slate-800 font-medium truncate">
                              • {it.name} (x{it.quantity})
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-4 border-r border-slate-200 text-right font-extrabold text-slate-900 font-mono text-sm">
                        ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="px-4 py-4 border-r border-slate-200 text-right font-extrabold text-emerald-700 font-mono text-sm">
                        ₹{Number(order.vendorPayoutAmount || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="px-4 py-4 border-r border-slate-200 text-center whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-extrabold border ${
                            order.status === 'DELIVERED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : order.status === 'SHIPPED'
                                ? 'bg-sky-50 text-sky-800 border-sky-300'
                                : order.status === 'OUT_FOR_DELIVERY'
                                  ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                                  : order.status === 'CONFIRMED' ||
                                      order.status === 'PROCESSING' ||
                                      order.status === 'PACKED' ||
                                      order.status === 'READY'
                                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                                    : order.status === 'CANCELLED'
                                      ? 'bg-rose-50 text-rose-800 border-rose-300'
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-2">
                          {/* Status Transition Select Dropdown */}
                          <div className="relative inline-block">
                            <select
                              value={order.status || 'PENDING'}
                              disabled={updatingOrderId === order.id}
                              onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                              className="appearance-none bg-slate-900 hover:bg-slate-800 disabled:opacity-60 border border-slate-700 hover:border-amber-500 rounded-xl pl-3 pr-7 py-1.5 text-[11px] font-bold text-amber-300 focus:border-amber-500 focus:outline-none shadow-xs transition-colors cursor-pointer"
                            >
                              <option value="PENDING">Pending</option>
                              <option value="CONFIRMED">Confirmed</option>
                              <option value="PROCESSING">Processing</option>
                              <option value="PACKED">Packed</option>
                              <option value="READY">Ready for Pickup</option>
                              <option value="SHIPPED">Shipped</option>
                              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                              <option value="DELIVERED">Delivered</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400">
                              {updatingOrderId === order.id ? (
                                <div className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <svg
                                  className="w-3.5 h-3.5 text-amber-400"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>
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

                          {/* Print Label Button */}
                          <Link
                            href={`/seller/orders/${order.id}/label`}
                            target="_blank"
                            className="p-1.5 inline-flex bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-900 border border-slate-200 rounded-xl transition-colors shadow-2xs"
                            title="Print 4x6 Shipping Label"
                          >
                            <Printer className="w-4 h-4 text-indigo-600" />
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

      {/* TRACKING TIMELINE MODAL */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
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
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                      step.done
                        ? 'bg-emerald-500 text-slate-950 font-extrabold'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {step.done ? '✓' : idx + 1}
                  </div>
                  <div>
                    <h4 className={`font-bold ${step.done ? 'text-white' : 'text-slate-500'}`}>
                      {step.title}
                    </h4>
                    <p className="text-[11px] text-slate-400">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setTrackingOrder(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all"
            >
              Close Tracking Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
