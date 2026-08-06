'use client';

import {
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  Search,
  ShieldAlert,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { SellerDetailModal } from './SellerDetailModal';

export function SellerApprovalTable() {
  const [shops, setShops] = useState<any[]>([]);
  const [counts, setCounts] = useState<any>({
    ALL: 0,
    PENDING_VERIFICATION: 0,
    APPROVED: 0,
    REJECTED: 0,
    SUSPENDED: 0,
  });
  const [activeTab, setActiveTab] = useState<string>('PENDING_VERIFICATION');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedShop, setSelectedShop] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fetchSellers = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/v1/admin/sellers', window.location.origin);
      url.searchParams.set('status', activeTab);
      if (searchQuery) url.searchParams.set('q', searchQuery);

      const res = await fetch(url.toString());
      const data = await res.json();

      if (data.success) {
        setShops(data.data || []);
        if (data.counts) setCounts(data.counts);
      }
    } catch (err: any) {
      console.error('Failed to fetch sellers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchSellers();
  }, [fetchSellers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSellers();
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleApprove = async (
    shopId: string,
    commissionRate: number,
    verificationBadge: string,
  ) => {
    try {
      const res = await fetch('/api/v1/admin/sellers/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, commissionRate, verificationBadge }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Seller approved successfully!', 'success');
        fetchSellers();
      } else {
        showToast(data.message || 'Failed to approve seller.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'An error occurred.', 'error');
    }
  };

  const handleReject = async (shopId: string, rejectionReason: string) => {
    try {
      const res = await fetch('/api/v1/admin/sellers/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, rejectionReason }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Seller application rejected.', 'success');
        fetchSellers();
      } else {
        showToast(data.message || 'Failed to reject seller application.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'An error occurred.', 'error');
    }
  };

  const handleSuspend = async (shopId: string, suspensionReason: string) => {
    try {
      const res = await fetch('/api/v1/admin/sellers/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, suspensionReason }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Seller shop suspended.', 'success');
        fetchSellers();
      } else {
        showToast(data.message || 'Failed to suspend seller.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'An error occurred.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border flex items-center justify-between transition-all ${
            toastMessage.type === 'error'
              ? 'bg-rose-950/80 border-rose-500/30 text-rose-200'
              : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
          }`}
        >
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 md:p-6 shadow-sm space-y-4">
        {/* Status Pills Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
          {[
            {
              id: 'PENDING_VERIFICATION',
              label: 'Pending Approval',
              count: counts.PENDING_VERIFICATION,
              color: 'text-amber-900 border-amber-300 bg-amber-50',
            },
            {
              id: 'APPROVED',
              label: 'Approved Sellers',
              count: counts.APPROVED,
              color: 'text-emerald-900 border-emerald-300 bg-emerald-50',
            },
            {
              id: 'REJECTED',
              label: 'Rejected Applications',
              count: counts.REJECTED,
              color: 'text-rose-900 border-rose-300 bg-rose-50',
            },
            {
              id: 'SUSPENDED',
              label: 'Suspended Shops',
              count: counts.SUSPENDED,
              color: 'text-indigo-900 border-indigo-300 bg-indigo-50',
            },
            {
              id: 'ALL',
              label: 'All Merchants',
              count: counts.ALL,
              color: 'text-navy border-slate-300 bg-slate-100',
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 border cursor-pointer ${
                  isActive
                    ? `${tab.color} shadow-xs`
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-white border border-slate-200 text-amber-700 font-mono">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Search Form */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by shop name, owner email, GSTIN, PAN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-amber-500 focus:outline-none font-semibold"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-navy hover:bg-navy-hover text-white font-extrabold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Main Responsive Data Table with Row/Column Borders */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-600 flex items-center justify-center gap-2 font-semibold text-xs">
            <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            Loading seller records...
          </div>
        ) : shops.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Store className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="font-semibold text-sm">No seller records match the selected filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full text-left text-xs text-slate-800 border-collapse">
              <thead className="bg-slate-100/90 text-navy uppercase font-extrabold tracking-wider border-b-2 border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 border-r border-slate-200 whitespace-nowrap">
                    Boutique / Shop
                  </th>
                  <th className="py-3.5 px-4 border-r border-slate-200 whitespace-nowrap">
                    Owner & Legal Name
                  </th>
                  <th className="py-3.5 px-4 border-r border-slate-200 whitespace-nowrap">
                    GSTIN / PAN
                  </th>
                  <th className="py-3.5 px-4 border-r border-slate-200 whitespace-nowrap">
                    Location
                  </th>
                  <th className="py-3.5 px-4 border-r border-slate-200 whitespace-nowrap text-center">
                    Status
                  </th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-right">Governance Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {shops.map((shop) => {
                  const owner = shop.owner || {};
                  const profile = shop.sellerProfile || {};

                  return (
                    <tr key={shop.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Shop Info */}
                      <td className="py-3.5 px-4 border-r border-slate-200 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-extrabold text-navy block text-sm">
                              {shop.name}
                            </span>
                            <span className="text-[10px] text-amber-700 font-mono font-bold">
                              slug: {shop.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Owner & Legal Name */}
                      <td className="py-3.5 px-4 border-r border-slate-200 whitespace-nowrap">
                        <span className="font-bold text-slate-900 block">
                          {owner.name || 'N/A'}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {owner.email}
                        </span>
                        {profile.legalName && (
                          <span className="text-[10px] text-slate-500 block font-medium">
                            Legal: {profile.legalName}
                          </span>
                        )}
                      </td>

                      {/* GSTIN / PAN */}
                      <td className="py-3.5 px-4 border-r border-slate-200 whitespace-nowrap font-mono text-[11px]">
                        <div>
                          PAN:{' '}
                          <span className="text-amber-800 font-extrabold">
                            {shop.panNumber || profile.panNumber || 'N/A'}
                          </span>
                        </div>
                        <div>
                          GSTIN:{' '}
                          <span className="text-slate-700 font-bold">
                            {shop.gstin || profile.gstin || 'N/A'}
                          </span>
                        </div>
                      </td>

                      {/* City & State */}
                      <td className="py-3.5 px-4 border-r border-slate-200 whitespace-nowrap">
                        <span className="font-bold text-slate-900 block">
                          {shop.city || profile.city || 'Chandigarh'}
                        </span>
                        <span className="text-slate-500 text-[11px] font-medium">
                          {shop.state || profile.state || 'Punjab'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 border-r border-slate-200 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                            shop.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : shop.status === 'PENDING_VERIFICATION'
                                ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                                : shop.status === 'REJECTED'
                                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                                  : 'bg-indigo-50 text-indigo-800 border-indigo-300'
                          }`}
                        >
                          {shop.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
                          {shop.status === 'PENDING_VERIFICATION' && <Clock className="w-3 h-3" />}
                          {shop.status === 'REJECTED' && <ShieldAlert className="w-3 h-3" />}
                          {shop.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedShop(shop);
                            setIsModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspect & Action
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

      {/* Seller Detail Modal */}
      <SellerDetailModal
        shop={selectedShop}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApprove={handleApprove}
        onReject={handleReject}
        onSuspend={handleSuspend}
      />
    </div>
  );
}
