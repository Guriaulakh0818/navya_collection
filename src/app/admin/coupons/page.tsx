'use client';

import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Edit3,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Ticket,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

export interface CouponItem {
  id: string;
  code: string;
  title?: string | null;
  description?: string | null;
  discountType: 'PERCENTAGE' | 'FIXED' | string;
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usagePerUser?: number | null;
  usedCount: number;
  startDate?: string;
  validUntil: string;
  isActive: boolean;
  fundingType?: 'NAVYA' | 'SELLER';
  shopId?: string | null;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [fundingFilter, setFundingFilter] = useState<'ALL' | 'NAVYA' | 'SELLER'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    code: '',
    title: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscount: '',
    usageLimit: '',
    usagePerUser: 1,
    fundingType: 'NAVYA' as 'NAVYA' | 'SELLER',
    shopId: '',
    startDate: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true,
  });

  const fetchCoupons = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/v1/admin/coupons', { method: 'GET' });
      const json = await res.json();
      if (json.success && json.data) {
        setCoupons(json.data);
      } else {
        setErrorMsg(json.message || 'Failed to load coupons.');
      }
    } catch {
      setErrorMsg('Network error loading coupons.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setForm({
      code: '',
      title: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 0,
      maxDiscount: '',
      usageLimit: '',
      usagePerUser: 1,
      fundingType: 'NAVYA',
      shopId: '',
      startDate: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: CouponItem) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      title: coupon.title || '',
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount || 0,
      maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : '',
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '',
      usagePerUser: coupon.usagePerUser || 1,
      fundingType: coupon.fundingType || 'NAVYA',
      shopId: coupon.shopId || '',
      startDate: coupon.startDate
        ? new Date(coupon.startDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      validUntil: new Date(coupon.validUntil).toISOString().split('T')[0],
      isActive: coupon.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const payload = {
      code: form.code.trim().toUpperCase(),
      title: form.title.trim() || undefined,
      description: form.description.trim() || undefined,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderAmount: Number(form.minOrderAmount || 0),
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      usagePerUser: Number(form.usagePerUser || 1),
      fundingType: form.fundingType,
      shopId: form.fundingType === 'SELLER' ? form.shopId.trim() || undefined : undefined,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
      validUntil: new Date(form.validUntil).toISOString(),
      isActive: form.isActive,
    };

    try {
      const isEdit = Boolean(editingCoupon);
      const url = isEdit ? `/api/v1/admin/coupons/${editingCoupon!.id}` : '/api/v1/admin/coupons';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to save coupon');
      }

      setIsModalOpen(false);
      await fetchCoupons();
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (coupon: CouponItem) => {
    try {
      const res = await fetch(`/api/v1/admin/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        await fetchCoupons();
      }
    } catch {
      alert('Failed to update status.');
    }
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/admin/coupons/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setDeletingId(null);
        await fetchCoupons();
      } else {
        alert(json.message || 'Failed to delete coupon');
      }
    } catch {
      alert('Network error deleting coupon');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stats calculation
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter((c) => c.isActive).length;
  const totalUsedCount = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);
  const sellerFundedCount = coupons.filter((c) => c.fundingType === 'SELLER').length;
  const platformFundedCount = coupons.filter((c) => c.fundingType !== 'SELLER').length;

  // Filtered coupons
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      if (search) {
        const q = search.toLowerCase();
        const matchesCode = c.code.toLowerCase().includes(q);
        const matchesTitle = c.title ? c.title.toLowerCase().includes(q) : false;
        const matchesShop = c.shopId ? c.shopId.toLowerCase().includes(q) : false;
        if (!matchesCode && !matchesTitle && !matchesShop) return false;
      }
      if (statusFilter === 'ACTIVE' && !c.isActive) return false;
      if (statusFilter === 'INACTIVE' && c.isActive) return false;
      if (fundingFilter === 'NAVYA' && c.fundingType === 'SELLER') return false;
      if (fundingFilter === 'SELLER' && c.fundingType !== 'SELLER') return false;
      return true;
    });
  }, [coupons, search, statusFilter, fundingFilter]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner - Signature Navy & Orange */}
      <div className="bg-navy text-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold text-orange uppercase tracking-widest block mb-1">
            Promotions &amp; Discounts Desk
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Ticket className="w-7 h-7 text-orange" /> Coupon &amp; Discount Management
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-1">
            Create, monitor, and configure promotional codes, percentage and flat discounts across
            boutique stores.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchCoupons}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-colors cursor-pointer"
            title="Refresh Coupons"
            aria-label="Refresh Coupons"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-orange hover:bg-orange/90 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Coupon</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Total Coupons
            </span>
            <div className="p-2.5 rounded-2xl bg-navy/10 text-navy border border-navy/20">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-navy font-mono">{totalCoupons}</p>
          <span className="text-[11px] text-slate-500 font-medium">All configured promo codes</span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Active Codes
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600 font-mono">{activeCoupons}</p>
          <span className="text-[11px] text-slate-500 font-medium">
            Usable right now at checkout
          </span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Times Redeemed
            </span>
            <div className="p-2.5 rounded-2xl bg-orange/10 text-orange border border-orange/20">
              <Tag className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-orange font-mono">{totalUsedCount}</p>
          <span className="text-[11px] text-slate-500 font-medium">Customer orders discounted</span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Funding Split
            </span>
            <div className="p-2.5 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-navy font-mono">
            {platformFundedCount}
            <span className="text-sm font-semibold text-slate-400 mx-1.5">/</span>
            <span className="text-orange">{sellerFundedCount}</span>
          </p>
          <span className="text-[11px] text-slate-500 font-medium">JiivaaKart / Seller funded</span>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-500 hover:text-rose-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search coupon code, title, shop..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600">Funding:</span>
              <select
                value={fundingFilter}
                onChange={(e) => setFundingFilter(e.target.value as any)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-navy focus:outline-none focus:border-navy cursor-pointer"
              >
                <option value="ALL">All Funding</option>
                <option value="NAVYA">Jiivaa-Funded</option>
                <option value="SELLER">Seller-Funded</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-navy focus:outline-none focus:border-navy cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
          {isLoading ? (
            <div className="p-12 text-center text-xs font-semibold text-slate-500 animate-pulse flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-orange" />
              <span>Loading coupons registry...</span>
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Ticket className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-navy">
                {coupons.length === 0
                  ? 'No Coupons Configured Yet'
                  : 'No coupons match your search criteria'}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {coupons.length === 0
                  ? 'Create your first promotional discount code to boost marketplace sales and customer conversion.'
                  : 'Try adjusting your search terms or filters above to find what you are looking for.'}
              </p>
              {coupons.length === 0 && (
                <button
                  onClick={openCreateModal}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange hover:bg-orange/90 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Create First Coupon</span>
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-navy font-extrabold uppercase border-b-2 border-slate-200 tracking-wider">
                  <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                    Coupon Code
                  </th>
                  <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                    Funding
                  </th>
                  <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                    Discount
                  </th>
                  <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                    Min Order
                  </th>
                  <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                    Max Cap
                  </th>
                  <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                    Redeemed
                  </th>
                  <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                    Valid Until
                  </th>
                  <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-4 py-3.5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredCoupons.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Coupon Code & Title */}
                    <td className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                      <span className="font-mono text-xs font-black tracking-wider bg-slate-100 text-navy px-2.5 py-1 rounded-lg border border-slate-300 inline-block shadow-2xs">
                        {c.code}
                      </span>
                      {c.title && (
                        <p className="text-[11px] font-semibold text-slate-700 mt-1 max-w-[200px] truncate">
                          {c.title}
                        </p>
                      )}
                      {c.shopId && (
                        <p className="text-[10px] font-mono text-orange font-bold mt-0.5 flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> Shop: {c.shopId}
                        </p>
                      )}
                    </td>

                    {/* Funding Type */}
                    <td className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                      {c.fundingType === 'SELLER' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-orange/10 text-orange border border-orange/30">
                          SELLER-FUNDED
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-navy/10 text-navy border border-navy/30">
                          JIIVAA-FUNDED
                        </span>
                      )}
                    </td>

                    {/* Discount Value */}
                    <td className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap font-black text-emerald-600 text-xs font-mono">
                      {c.discountValue}
                      {c.discountType === 'PERCENTAGE' ? '%' : ' ₹'} OFF
                    </td>

                    {/* Min Order */}
                    <td className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap text-slate-700 font-semibold font-mono">
                      ₹{(c.minOrderAmount || 0).toLocaleString('en-IN')}
                    </td>

                    {/* Max Cap */}
                    <td className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap text-slate-700 font-semibold font-mono">
                      {c.maxDiscount
                        ? `₹${Number(c.maxDiscount).toLocaleString('en-IN')}`
                        : 'No Cap'}
                    </td>

                    {/* Redeemed & Limit */}
                    <td className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap text-slate-800">
                      <div className="font-bold font-mono">
                        {c.usedCount} {c.usageLimit ? `/ ${c.usageLimit}` : ''}
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium block">
                        Max {c.usagePerUser || 1}/user
                      </span>
                    </td>

                    {/* Valid Until */}
                    <td className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap text-slate-600 font-medium">
                      {new Date(c.validUntil).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Status Toggle */}
                    <td className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(c)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold border transition-colors cursor-pointer ${
                          c.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                        }`}
                        title="Click to toggle active status"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            c.isActive ? 'bg-emerald-600' : 'bg-slate-400'
                          }`}
                        />
                        {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(c)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-navy font-bold text-xs hover:bg-navy hover:text-white hover:border-navy transition-colors shadow-2xs cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingId(c.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-heading text-xl font-extrabold text-navy flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-orange" />
                  {editingCoupon ? 'Edit Discount Coupon' : 'Create New Discount Coupon'}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Configure discount mechanics, funding responsibility, and usage limits.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Coupon Code */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-navy mb-1.5">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  placeholder="e.g. WELCOME500"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  required
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono font-bold text-xs uppercase placeholder:text-slate-400 focus:bg-white focus:border-navy focus:outline-none transition-colors"
                />
              </div>

              {/* Funding Responsibility */}
              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/70 space-y-2.5">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-navy">
                  Funding Responsibility *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      form.fundingType === 'NAVYA'
                        ? 'border-navy bg-navy/10 text-navy shadow-2xs font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="fundingType"
                      value="NAVYA"
                      checked={form.fundingType === 'NAVYA'}
                      onChange={() => setForm({ ...form, fundingType: 'NAVYA' })}
                      className="mt-0.5 accent-navy"
                    />
                    <div>
                      <span className="text-xs font-bold block text-navy">JiivaaKart-Funded</span>
                      <span className="text-[10px] text-slate-500 block leading-tight font-normal mt-0.5">
                        Platform absorbs promo; seller payout unaffected.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      form.fundingType === 'SELLER'
                        ? 'border-orange bg-orange/10 text-orange shadow-2xs font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="fundingType"
                      value="SELLER"
                      checked={form.fundingType === 'SELLER'}
                      onChange={() => setForm({ ...form, fundingType: 'SELLER' })}
                      className="mt-0.5 accent-orange"
                    />
                    <div>
                      <span className="text-xs font-bold block text-orange">Seller-Funded</span>
                      <span className="text-[10px] text-slate-500 block leading-tight font-normal mt-0.5">
                        Seller absorbs discount; deducted from payout.
                      </span>
                    </div>
                  </label>
                </div>

                {form.fundingType === 'SELLER' && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-navy mb-1">
                      Applicable Seller / Shop ID *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. shop_cm123456"
                      value={form.shopId}
                      onChange={(e) => setForm({ ...form, shopId: e.target.value })}
                      required={form.fundingType === 'SELLER'}
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono text-xs font-semibold placeholder:text-slate-400 focus:border-orange focus:outline-none transition-colors"
                    />
                  </div>
                )}
              </div>

              {/* Discount Mechanics */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-navy mb-1.5">
                    Discount Type *
                  </label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:bg-white focus:border-navy focus:outline-none cursor-pointer"
                  >
                    <option value="PERCENTAGE">Percentage (% OFF)</option>
                    <option value="FIXED">Fixed Amount (₹ OFF)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-navy mb-1.5">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 10 or 200"
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                    required
                    min={1}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono text-xs font-semibold focus:bg-white focus:border-navy focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-navy mb-1.5">
                    Min Order Amount (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 999 (0 for no min)"
                    value={form.minOrderAmount}
                    onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
                    min={0}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono text-xs font-semibold focus:bg-white focus:border-navy focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-navy mb-1.5">
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Optional (e.g. 300)"
                    value={form.maxDiscount}
                    onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                    min={0}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono text-xs font-semibold focus:bg-white focus:border-navy focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-navy mb-1.5">
                    Total Global Usage Limit
                  </label>
                  <input
                    type="number"
                    placeholder="Optional (e.g. 100)"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    min={0}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono text-xs font-semibold focus:bg-white focus:border-navy focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-navy mb-1.5">
                    Usage Limit Per User *
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1"
                    value={form.usagePerUser}
                    onChange={(e) => setForm({ ...form, usagePerUser: Number(e.target.value) })}
                    min={1}
                    required
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono text-xs font-semibold focus:bg-white focus:border-navy focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-navy mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:bg-white focus:border-navy focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-navy mb-1.5">
                    Valid Until (Expiry) *
                  </label>
                  <input
                    type="date"
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    required
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:bg-white focus:border-navy focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Title / Headline */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-navy mb-1.5">
                  Coupon Title / Headline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Festive Launch Special 10% OFF"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold placeholder:text-slate-400 focus:bg-white focus:border-navy focus:outline-none transition-colors"
                />
              </div>

              {/* Active immediately checkbox */}
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 accent-navy cursor-pointer"
                />
                <label
                  htmlFor="isActiveToggle"
                  className="text-xs font-bold text-slate-800 cursor-pointer"
                >
                  Activate coupon immediately for customer checkout
                </label>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-orange hover:bg-orange/90 text-white text-xs font-bold shadow-md transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <h3 className="font-heading text-lg font-black text-navy flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-600" />
              Delete Promotional Coupon?
            </h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Are you sure you want to delete this coupon? Customers will immediately no longer be
              able to apply this discount code during checkout.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
