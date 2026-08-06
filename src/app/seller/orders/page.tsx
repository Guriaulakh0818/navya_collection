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
                : 'IN_TRANSIT',
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
      } else {
        alert(data.message || 'Failed to update order status.');
      }
    } catch (err) {
      console.error('Status update failed:', err);
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
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-bold border-b border-slate-200">
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
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap border cursor-pointer ${
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
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                            order.status === 'DELIVERED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : order.status === 'SHIPPED'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : order.status === 'PACKED' || order.status === 'READY'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right space-x-2 whitespace-nowrap">
                        {/* Status Transition Select */}
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-white focus:border-amber-500 focus:outline-none"
                        >
                          <option value="PENDING">Set: Pending</option>
                          <option value="PACKED">Set: Packed</option>
                          <option value="READY">Set: Ready for Pickup</option>
                          <option value="SHIPPED">Set: Shipped</option>
                          <option value="DELIVERED">Set: Delivered</option>
                          <option value="CANCELLED">Set: Cancelled</option>
                        </select>

                        {/* Print Invoice Button */}
                        <Link
                          href={`/seller/orders/${order.id}/invoice`}
                          target="_blank"
                          className="p-1.5 inline-flex bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                          title="Print Tax Invoice"
                        >
                          <FileText className="w-4 h-4 text-amber-400" />
                        </Link>

                        {/* Print Label Button */}
                        <Link
                          href={`/seller/orders/${order.id}/label`}
                          target="_blank"
                          className="p-1.5 inline-flex bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                          title="Print 4x6 Shipping Label"
                        >
                          <Printer className="w-4 h-4 text-indigo-400" />
                        </Link>

                        {/* Track Button */}
                        <button
                          onClick={() => setTrackingOrder(order)}
                          className="p-1.5 inline-flex bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                          title="Live Track Shipment"
                        >
                          <Truck className="w-4 h-4 text-emerald-400" />
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
