'use client';

import {
  AlertCircle,
  Award,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Flame,
  Percent,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
  UserCheck,
  UserMinus,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface FoundingMember {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  state: string | null;
  slotNumber: number;
  joinedAt: string;
  deliveredOrders: number;
  currentRate: number;
  tierLabel: string;
  status: string;
  ownerName: string;
  ownerContact: string | null;
}

interface EligibleShop {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  state: string | null;
  phone: string | null;
  ownerName: string;
}

interface AdminOverviewData {
  totalSlots: number;
  slotsAllocated: number;
  slotsRemaining: number;
  isProgramOpen: boolean;
  eligibleShops?: EligibleShop[];
  members: FoundingMember[];
}

export default function AdminFounding50Page() {
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'SUSPENDED'>(
    'ALL',
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal & Action states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/v1/admin/founding-50');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load Founding 50 records:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleEnrollShop = async () => {
    if (!selectedShopId) return;
    try {
      setActionLoading(true);
      const res = await fetch('/api/v1/admin/founding-50', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ENROLL_SHOP', shopId: selectedShopId }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({ type: 'success', message: json.message });
        setIsAddModalOpen(false);
        setSelectedShopId('');
        fetchOverview();
      } else {
        setFeedback({ type: 'error', message: json.message || 'Failed to enroll shop.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error executing enrollment.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAutoEnrollAll = async () => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/v1/admin/founding-50', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'AUTO_ENROLL_ALL' }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({ type: 'success', message: json.message });
        fetchOverview();
      } else {
        setFeedback({ type: 'error', message: json.message || 'Failed to auto-enroll shops.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error during auto-enrollment.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveShop = async (shop: FoundingMember) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove "${shop.name}" from Founding 50?\n\nThis will vacate Slot #${shop.slotNumber} and reset their commission to the standard 10%.`,
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);
      const res = await fetch('/api/v1/admin/founding-50', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REMOVE_SHOP', shopId: shop.id }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({ type: 'success', message: json.message });
        fetchOverview();
      } else {
        setFeedback({ type: 'error', message: json.message || 'Failed to remove shop.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error removing shop.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (
    shopId: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'COMPLETED',
  ) => {
    try {
      setOpenStatusMenuId(null);
      setActionLoading(true);
      const res = await fetch('/api/v1/admin/founding-50', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_STATUS', shopId, status }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({ type: 'success', message: json.message });
        fetchOverview();
      } else {
        setFeedback({ type: 'error', message: json.message || 'Failed to update status.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error updating status.' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredMembers = (data?.members || []).filter((member) => {
    const matchesStatus =
      statusFilter === 'ALL' ? true : member.status.toUpperCase() === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      member.name.toLowerCase().includes(q) ||
      (member.ownerName && member.ownerName.toLowerCase().includes(q)) ||
      (member.city && member.city.toLowerCase().includes(q)) ||
      (member.ownerContact && member.ownerContact.toLowerCase().includes(q)) ||
      String(member.slotNumber).includes(q);

    return matchesStatus && matchesSearch;
  });

  const eligibleCount = data?.eligibleShops?.length || 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-300 text-amber-900 text-xs font-black uppercase tracking-wider mb-2">
            <Award className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
            Official Seller Acquisition Program
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span>Founding 50 Sellers Record</span>
            <span className="text-sm font-bold text-amber-700 bg-amber-100 px-3 py-0.5 rounded-full border border-amber-200">
              Max 50 Boutiques
            </span>
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Live master ledger of fashion boutiques onboarded under the JiivaaKart Founding 50
            policy. Tracks slot reservations, promotional delivered order milestones, and active
            commission tiers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Add Boutique Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            disabled={actionLoading || (data?.slotsRemaining ?? 0) <= 0}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add Boutique
          </button>

          {/* Auto Enroll Button (shown if eligible shops exist) */}
          {eligibleCount > 0 && (
            <button
              onClick={handleAutoEnrollAll}
              disabled={actionLoading}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Automatically enroll all approved boutiques"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Auto-Enroll All ({eligibleCount})
            </button>
          )}

          <button
            onClick={fetchOverview}
            disabled={isRefreshing}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/admin/sellers"
            className="px-4 py-2 bg-navy hover:bg-navy/90 text-white rounded-xl text-xs font-bold shadow-md shadow-navy/20 flex items-center gap-2 transition-all"
          >
            <Store className="w-3.5 h-3.5" />
            Approve Boutiques
          </Link>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-bold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Program Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Allocated Slots Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Allocated Slots
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
              👑
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {data?.slotsAllocated ?? 0}
            </span>
            <span className="text-sm font-bold text-slate-400">/ 50 Max</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, ((data?.slotsAllocated || 0) / 50) * 100)}%`,
              }}
            />
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            First-come, first-served allocation upon seller approval.
          </p>
        </div>

        {/* Remaining Slots Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Remaining Open Slots
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
              <Flame className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 font-mono">
              {data?.slotsRemaining ?? 50}
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {data?.isProgramOpen ? 'Program Open' : 'Capacity Reached'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            New approvals automatically grant next slot until 50 is reached.
          </p>
        </div>

        {/* Tier 1 Rate */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tier 1 Commission
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange flex items-center justify-center font-bold text-xs">
              <Percent className="w-4 h-4 text-orange" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-orange font-mono">5.0%</span>
            <span className="text-xs font-bold text-slate-500">Orders 1 – 10</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            50% discount against 10% standard commission for first 10 delivered orders.
          </p>
        </div>

        {/* Tier 2 Rate */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tier 2 Commission
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
              <Percent className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-600 font-mono">7.5%</span>
            <span className="text-xs font-bold text-slate-500">Orders 11 – 20</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Transition tier before returning to standard 10% commission on order #21+.
          </p>
        </div>
      </div>

      {/* Official Policy Tier Matrix Notice */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Founding 50 Policy Milestone Matrix (Version 1.0)
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            Promotional commission applies strictly to <strong>successfully delivered</strong>{' '}
            orders. Cancelled, RTO, and fully refunded orders do not consume promotional quota. Once
            a boutique reaches 20 delivered orders, the system permanently settles subsequent orders
            at standard 10% commission.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            1–10: <strong>5%</strong>
          </span>
          <span className="text-slate-400">→</span>
          <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            11–20: <strong>7.5%</strong>
          </span>
          <span className="text-slate-400">→</span>
          <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            21+: <strong>10%</strong>
          </span>
        </div>
      </div>

      {/* Table Section with Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search boutique name, owner, city, slot #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-navy focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            {(['ALL', 'ACTIVE', 'COMPLETED', 'SUSPENDED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-navy text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Directory Records Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 sm:px-6">Slot #</th>
                <th className="py-3.5 px-4">Boutique & Location</th>
                <th className="py-3.5 px-4">Merchant / Owner</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4">Delivered Milestone</th>
                <th className="py-3.5 px-4">Active Rate</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Storefront</th>
                <th className="py-3.5 px-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                    Loading Founding 50 records...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No Founding 50 seller records match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Slot # */}
                    <td className="py-4 px-4 sm:px-6">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-900 border border-amber-300 font-black font-mono text-xs shadow-2xs">
                        👑 #{member.slotNumber}
                      </span>
                    </td>

                    {/* Boutique Name & Location */}
                    <td className="py-4 px-4">
                      <div className="font-extrabold text-slate-900 text-sm">{member.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {member.city ? `${member.city}, ${member.state || ''}` : 'Location on file'}
                      </div>
                    </td>

                    {/* Merchant / Owner */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-800">{member.ownerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {member.ownerContact || 'No phone'}
                      </div>
                    </td>

                    {/* Joined Date */}
                    <td className="py-4 px-4 text-slate-600 font-medium">
                      {member.joinedAt
                        ? new Date(member.joinedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>

                    {/* Delivered Milestone Progress */}
                    <td className="py-4 px-4 min-w-[180px]">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                        <span>{member.deliveredOrders} / 20 orders</span>
                        <span className="text-amber-800 font-medium">
                          {member.deliveredOrders >= 20
                            ? 'Completed'
                            : `${20 - member.deliveredOrders} left`}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (member.deliveredOrders / 20) * 100)}%`,
                          }}
                        />
                      </div>
                    </td>

                    {/* Active Commission Rate */}
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-full font-black text-xs bg-orange-50 text-orange border border-orange/20">
                        {member.currentRate}%
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          member.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : member.status === 'COMPLETED'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>

                    {/* Storefront Link */}
                    <td className="py-4 px-4 text-center">
                      <Link
                        href={`/shop/${member.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-slate-500 hover:text-navy font-bold text-xs p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>

                    {/* Actions Column */}
                    <td className="py-4 px-4 text-right pr-6 relative">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Status Toggle Menu */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenStatusMenuId(openStatusMenuId === member.id ? null : member.id)
                            }
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            title="Update Status"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>

                          {openStatusMenuId === member.id && (
                            <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20 text-left">
                              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Set Status
                              </div>
                              <button
                                onClick={() => handleToggleStatus(member.id, 'ACTIVE')}
                                className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                              >
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                Active
                              </button>
                              <button
                                onClick={() => handleToggleStatus(member.id, 'SUSPENDED')}
                                className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                              >
                                <span className="w-2 h-2 rounded-full bg-rose-500" />
                                Suspend
                              </button>
                              <button
                                onClick={() => handleToggleStatus(member.id, 'COMPLETED')}
                                className="w-full px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 flex items-center gap-2 cursor-pointer"
                              >
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                Completed
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Remove from Founding 50 */}
                        <button
                          type="button"
                          onClick={() => handleRemoveShop(member)}
                          disabled={actionLoading}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove from Founding 50 (Free Slot)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Add Boutique Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full text-xs font-bold border border-amber-200 mb-1">
                  <Award className="w-3.5 h-3.5" />
                  Manual Enrollment
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Add Boutique to Founding 50
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enroll an approved seller into the Founding 50 program to grant them 5% Tier 1
                  promotional commission.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setSelectedShopId('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            {eligibleCount === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <Store className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">
                  All Approved Boutiques Are Already Enrolled!
                </h4>
                <p className="text-xs text-slate-500">
                  There are currently no unenrolled approved boutiques. When you approve new seller
                  applications in the Sellers panel, they will automatically be eligible or enrolled
                  here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Select Boutique ({eligibleCount} available)
                  </label>
                  <select
                    value={selectedShopId}
                    onChange={(e) => setSelectedShopId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-navy focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="">-- Choose an approved boutique --</option>
                    {(data?.eligibleShops || []).map((shop) => (
                      <option key={shop.id} value={shop.id}>
                        {shop.name} {shop.city ? `(${shop.city})` : ''} — Owner: {shop.ownerName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Offer Preview Card */}
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="font-extrabold text-amber-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Promotional Tier Allocation
                  </div>
                  <ul className="text-amber-900 space-y-1 text-[11px] list-disc list-inside">
                    <li>
                      Will receive next available open slot number (
                      <strong>Slot #{(data?.slotsAllocated ?? 0) + 1}</strong>).
                    </li>
                    <li>
                      <strong>Orders 1–10:</strong> 5.0% commission (50% promotional discount).
                    </li>
                    <li>
                      <strong>Orders 11–20:</strong> 7.5% commission transition tier.
                    </li>
                    <li>
                      Standard 10% commission applies on order 21+ and non-promotional categories.
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setSelectedShopId('');
                }}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              {eligibleCount > 0 && (
                <button
                  type="button"
                  onClick={handleEnrollShop}
                  disabled={!selectedShopId || actionLoading}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5" />
                  )}
                  Enroll in Founding 50
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
