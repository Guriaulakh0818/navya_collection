'use client';

import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Package,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminShippingPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'SHIPMENTS' | 'SHOPS'>('SHIPMENTS');
  const [stats, setStats] = useState<any>({
    totalShipments: 0,
    inTransitCount: 0,
    deliveredCount: 0,
    rtoCount: 0,
    totalPickupLocations: 0,
    connectedPickupLocations: 0,
  });
  const [shiprocketHealth, setShiprocketHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [selectedShipment, setSelectedShipment] = useState<any | null>(null);
  const [isSyncingPickups, setIsSyncingPickups] = useState(false);
  const [syncingShopId, setSyncingShopId] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const fetchShippingData = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/v1/admin/shipping', window.location.origin);
      if (searchQuery) url.searchParams.set('q', searchQuery);
      if (statusFilter !== 'ALL') url.searchParams.set('status', statusFilter);
      if (paymentFilter !== 'ALL') url.searchParams.set('paymentMethod', paymentFilter);

      const res = await fetch(url.toString());
      const json = await res.json();
      if (json.success && json.data) {
        setShipments(json.data.shipments || []);
        setShops(json.data.shops || []);
        setStats(json.data.stats || {});
        setShiprocketHealth(json.data.shiprocketHealth || null);
      }
    } catch (err) {
      console.error('Failed to fetch admin shipping data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, paymentFilter]);

  const handleSyncPickupLocations = async () => {
    setIsSyncingPickups(true);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/v1/admin/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SYNC_ALL_PICKUP_LOCATIONS' }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncFeedback(data.message || 'All pickup locations synced successfully!');
      } else {
        setSyncFeedback(data.message || 'Failed to sync some pickup locations.');
      }
      await fetchShippingData();
    } catch (err: any) {
      setSyncFeedback(err.message || 'Error syncing pickup locations.');
    } finally {
      setIsSyncingPickups(false);
    }
  };

  const handlePushSingleShop = async (shopId: string, shopName: string) => {
    setSyncingShopId(shopId);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/v1/admin/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'PUSH_SHOP_PICKUP_LOCATION', shopId }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncFeedback(
          `✅ ${shopName}: ${data.message || 'Pickup location registered with Shiprocket successfully!'}`,
        );
      } else {
        setSyncFeedback(`❌ ${shopName}: ${data.message || 'Failed to push pickup location.'}`);
      }
      await fetchShippingData();
    } catch (err: any) {
      setSyncFeedback(`Error pushing ${shopName}: ${err.message}`);
    } finally {
      setSyncingShopId(null);
    }
  };

  useEffect(() => {
    fetchShippingData();
  }, [fetchShippingData]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-navy tracking-tight flex items-center gap-3">
            <Truck className="w-7 h-7 text-amber-600" />
            Marketplace Shipping & Logistics Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Monitor multi-seller shipments, track Shiprocket courier dispatches, inspect pickup
            locations, and audit AWBs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncPickupLocations}
            disabled={isSyncingPickups}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPickups ? 'animate-spin' : ''}`} />
            {isSyncingPickups ? 'Syncing All with Shiprocket...' : '⚡ Push All to Shiprocket'}
          </button>

          <button
            onClick={fetchShippingData}
            disabled={isLoading}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs">
          <span>{syncFeedback}</span>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-amber-700 hover:text-amber-950 font-bold ml-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Shipments
          </p>
          <p className="text-2xl font-extrabold text-navy mt-1">{stats.totalShipments || 0}</p>
        </div>

        <div className="bg-white border border-sky-200 rounded-2xl p-4 shadow-sm bg-sky-50/20">
          <p className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">
            In Transit / Out
          </p>
          <p className="text-2xl font-extrabold text-sky-800 mt-1">{stats.inTransitCount || 0}</p>
        </div>

        <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-sm bg-emerald-50/20">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            Delivered
          </p>
          <p className="text-2xl font-extrabold text-emerald-800 mt-1">
            {stats.deliveredCount || 0}
          </p>
        </div>

        <div className="bg-white border border-rose-200 rounded-2xl p-4 shadow-sm bg-rose-50/20">
          <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
            Cancelled / RTO
          </p>
          <p className="text-2xl font-extrabold text-rose-800 mt-1">{stats.rtoCount || 0}</p>
        </div>

        <div
          onClick={() => setActiveTab('SHOPS')}
          className="bg-white border border-amber-200 rounded-2xl p-4 shadow-sm bg-amber-50/20 cursor-pointer hover:bg-amber-50/40 transition-all"
        >
          <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-between">
            <span>Pickup Hubs</span>
            <span className="text-[10px] text-amber-600 underline">View</span>
          </p>
          <p className="text-2xl font-extrabold text-amber-900 mt-1">
            {stats.connectedPickupLocations || 0} / {stats.totalPickupLocations || 0}
          </p>
        </div>
      </div>

      {/* Shiprocket Connection Health Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-white">
                Shiprocket API Multi-Seller Engine
              </h3>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                  shiprocketHealth?.isConfigured
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {shiprocketHealth?.status || 'PENDING_CREDENTIALS'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated multi-pickup token caching, rate limiting (100 req/min), AWB generation &
              webhook receiver active.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <button
            onClick={handleSyncPickupLocations}
            disabled={isSyncingPickups}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPickups ? 'animate-spin' : ''}`} />
            {isSyncingPickups ? 'Registering...' : 'Push All Pickup Hubs'}
          </button>
          <div className="text-right">
            <p className="text-slate-400 text-[11px]">Webhook Endpoint</p>
            <code className="text-amber-300 font-mono text-[11px]">
              /api/v1/webhooks/shiprocket
            </code>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('SHIPMENTS')}
          className={`pb-3 px-2 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'SHIPMENTS'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Customer Shipments & Orders</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-bold">
            {shipments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('SHOPS')}
          className={`pb-3 px-2 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'SHOPS'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Shops & Pickup Hubs (Shiprocket Addresses)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
            {shops.length}
          </span>
        </button>
      </div>

      {/* TAB 1: SHOPS & PICKUP HUBS TABLE */}
      {activeTab === 'SHOPS' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
              <div>
                <h2 className="font-extrabold text-navy text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  Registered Boutique Shops & Shiprocket Pickup Locations
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  View seller addresses, contact persons, registered Shiprocket pickup nicknames,
                  and push them individually to Shiprocket.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-xl border border-slate-200">
                Total Shops: {shops.length}
              </span>
            </div>

            {shops.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No seller shops found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                      <th className="p-4">Shop Name & Code</th>
                      <th className="p-4">Contact Person / Owner</th>
                      <th className="p-4">Pickup Warehouse Address</th>
                      <th className="p-4">Shiprocket Pickup Nickname</th>
                      <th className="p-4">Shiprocket Status</th>
                      <th className="p-4 text-right">Direct Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {shops.map((shop) => {
                      const primaryLocation =
                        shop.pickupLocations?.find((p: any) => p.isPrimary) ||
                        shop.pickupLocations?.[0];
                      const contactName =
                        primaryLocation?.contactName ||
                        shop.bankAccountHolder ||
                        shop.sellerProfile?.legalName ||
                        shop.owner?.name ||
                        'Store Manager';
                      const contactPhone =
                        primaryLocation?.contactPhone ||
                        shop.phone ||
                        shop.owner?.mobile ||
                        '9991983125';
                      const contactEmail =
                        primaryLocation?.contactEmail ||
                        shop.email ||
                        shop.owner?.email ||
                        'seller@navyacollection.store';
                      const locationCode =
                        primaryLocation?.locationCode ||
                        shop.shiprocketPickupName ||
                        `${shop.shopCode || 'SHOP'}-PKP1`;
                      const shiprocketStatus = primaryLocation?.shiprocketStatus || 'PENDING';
                      const isConnected = shiprocketStatus === 'CONNECTED';
                      const isPushing = syncingShopId === shop.id;

                      return (
                        <tr key={shop.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4">
                            <div className="font-extrabold text-navy flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-amber-600" />
                              {shop.name}
                            </div>
                            <div className="text-[11px] text-amber-800 font-mono font-bold mt-0.5">
                              {shop.shopCode || `NAVYA-SHOP-${shop.id.slice(-6).toUpperCase()}`}
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="font-bold text-slate-800">{contactName}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {contactPhone}
                            </div>
                            <div className="text-[10px] text-slate-400">{contactEmail}</div>
                          </td>

                          <td className="p-4 max-w-xs">
                            <div
                              className="font-semibold text-slate-800 truncate"
                              title={shop.fullAddress || primaryLocation?.addressLine1}
                            >
                              {primaryLocation?.addressLine1 ||
                                shop.fullAddress ||
                                'Main Market Road'}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {primaryLocation?.city || shop.city || 'Hisar'},{' '}
                              {primaryLocation?.state || shop.state || 'Haryana'} -{' '}
                              <span className="font-bold font-mono text-slate-700">
                                {primaryLocation?.pincode || shop.pincode || '125001'}
                              </span>
                            </div>
                          </td>

                          <td className="p-4 font-mono">
                            <div className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-lg inline-block text-[11px] border border-slate-200">
                              {locationCode}
                            </div>
                          </td>

                          <td className="p-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold flex items-center gap-1 w-fit ${
                                isConnected
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                  : shiprocketStatus === 'FAILED'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-300'
                                    : 'bg-amber-50 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {isConnected ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Clock className="w-3 h-3 text-amber-600" />
                              )}
                              {shiprocketStatus}
                            </span>
                          </td>

                          <td className="p-4 text-right">
                            <button
                              onClick={() => handlePushSingleShop(shop.id, shop.name)}
                              disabled={isPushing}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all flex items-center gap-1.5 ml-auto cursor-pointer shadow-xs ${
                                isConnected
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                                  : 'bg-amber-600 hover:bg-amber-700 text-white'
                              } disabled:opacity-50`}
                            >
                              <RefreshCw className={`w-3 h-3 ${isPushing ? 'animate-spin' : ''}`} />
                              {isPushing
                                ? 'Pushing...'
                                : isConnected
                                  ? 'Re-Sync with Shiprocket'
                                  : '⚡ Push to Shiprocket'}
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
        </div>
      )}

      {/* TAB 2: CUSTOMER SHIPMENTS & DISPATCHES */}
      {activeTab === 'SHIPMENTS' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by Shipment #, AWB, Shop Code, Order #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="CREATED">Created</option>
                <option value="PACKED">Packed</option>
                <option value="READY_TO_SHIP">Ready to Ship</option>
                <option value="PICKUP_SCHEDULED">Pickup Scheduled</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Payments</option>
                <option value="RAZORPAY">Prepaid (Razorpay)</option>
                <option value="COD">Cash on Delivery</option>
              </select>
            </div>
          </div>

          {/* Shipments Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-slate-500">
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-xs font-bold">Loading marketplace shipments...</span>
              </div>
            ) : shipments.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <Package className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No shipments found</p>
                <p className="text-xs text-slate-400">
                  Shipments created from customer orders will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                      <th className="p-4">Shipment # / Order</th>
                      <th className="p-4">Boutique & Hub</th>
                      <th className="p-4">Destination</th>
                      <th className="p-4">Courier / AWB</th>
                      <th className="p-4">Weight</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {shipments.map((shp) => {
                      const pickupSnap: any = shp.pickupAddressSnapshot || {};
                      const deliverySnap: any = shp.deliveryAddressSnapshot || {};

                      return (
                        <tr key={shp.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4">
                            <div className="font-extrabold text-navy">{shp.shipmentNumber}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              Master: {shp.masterOrder?.orderNumber}
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="font-bold text-slate-800 flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-amber-600" />
                              {shp.shop?.name || pickupSnap.shopName || 'Shop'}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {shp.shop?.shopCode && (
                                <span className="font-mono text-amber-700 mr-1">
                                  {shp.shop.shopCode}
                                </span>
                              )}
                              {pickupSnap.city || shp.shop?.city},{' '}
                              {pickupSnap.state || shp.shop?.state}
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="font-bold text-slate-800">
                              {deliverySnap.fullName || 'Customer'}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {deliverySnap.city}, {deliverySnap.pincode}
                            </div>
                          </td>

                          <td className="p-4 font-mono">
                            <div className="font-bold text-slate-800">
                              {shp.courierName || 'Pending'}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {shp.awbCode || 'No AWB'}
                            </div>
                          </td>

                          <td className="p-4 font-mono text-slate-600">
                            {shp.packageWeight} kg ({shp.itemCount} items)
                          </td>

                          <td className="p-4">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                shp.paymentMethod === 'COD'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {shp.paymentMethod}
                            </span>
                          </td>

                          <td className="p-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                                shp.status === 'DELIVERED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                  : shp.status === 'CANCELLED'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-300'
                                    : shp.status === 'IN_TRANSIT' || shp.status === 'SHIPPED'
                                      ? 'bg-sky-50 text-sky-700 border border-sky-300'
                                      : 'bg-amber-50 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {shp.status}
                            </span>
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {shp.awbCode && (
                                <a
                                  href={`https://shiprocket.co/tracking/${shp.awbCode}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                                  title="Live Track on Shiprocket"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button
                                onClick={() => setSelectedShipment(shp)}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-extrabold cursor-pointer"
                              >
                                Details
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
        </div>
      )}

      {/* Shipment Details Modal */}
      {selectedShipment && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-xl w-full space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedShipment(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-900 rounded-full bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <Truck className="w-6 h-6 text-amber-600" />
              <div>
                <h3 className="font-extrabold text-navy text-base">
                  Shipment {selectedShipment.shipmentNumber}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Master Order: #{selectedShipment.masterOrder?.orderNumber}
                </p>
              </div>
            </div>

            {/* Address Snapshots Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl space-y-1">
                <p className="font-extrabold text-amber-800">Pickup Origin Snapshot</p>
                <p className="font-bold text-slate-800">
                  {(selectedShipment.pickupAddressSnapshot as any)?.shopName}
                </p>
                <p className="text-slate-600">
                  {(selectedShipment.pickupAddressSnapshot as any)?.addressLine1}
                </p>
                <p className="text-slate-600">
                  {(selectedShipment.pickupAddressSnapshot as any)?.city},{' '}
                  {(selectedShipment.pickupAddressSnapshot as any)?.pincode}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl space-y-1">
                <p className="font-extrabold text-sky-800">Delivery Destination Snapshot</p>
                <p className="font-bold text-slate-800">
                  {(selectedShipment.deliveryAddressSnapshot as any)?.fullName}
                </p>
                <p className="text-slate-600">
                  {(selectedShipment.deliveryAddressSnapshot as any)?.addressLine1}
                </p>
                <p className="text-slate-600">
                  {(selectedShipment.deliveryAddressSnapshot as any)?.city},{' '}
                  {(selectedShipment.deliveryAddressSnapshot as any)?.pincode}
                </p>
              </div>
            </div>

            {/* Package Items */}
            <div className="space-y-2">
              <p className="font-extrabold text-xs text-navy">
                Package Items ({(selectedShipment.items || []).length})
              </p>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl p-2 max-h-40 overflow-y-auto">
                {(selectedShipment.items || []).map((itm: any) => (
                  <div key={itm.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{itm.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        SKU: {itm.sku} {itm.size && `• Size: ${itm.size}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">
                        ₹{Number(itm.price) * itm.quantity}
                      </p>
                      <p className="text-[11px] text-slate-500">Qty: {itm.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedShipment(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
