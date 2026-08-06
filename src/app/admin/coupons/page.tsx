'use client';

import React, { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  createdAt: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter((c) => c.isActive).length;
  const totalUsedCount = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy dark:text-slate-100">
            Coupon & Discount Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create, monitor, and configure promo codes and percentage/fixed discounts.
          </p>
        </div>

        <Button onClick={openCreateModal} className="rounded-full text-xs font-semibold px-5">
          + Create New Coupon
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white dark:bg-slate-900 p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Coupons
          </p>
          <p className="font-heading text-3xl font-bold text-navy dark:text-slate-100 mt-1">
            {totalCoupons}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white dark:bg-slate-900 p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active Promo Codes
          </p>
          <p className="font-heading text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {activeCoupons}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white dark:bg-slate-900 p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Times Redeemed
          </p>
          <p className="font-heading text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {totalUsedCount}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Coupons Table */}
      <div className="rounded-2xl border border-border bg-white dark:bg-slate-900 shadow-premium overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-500 animate-pulse">
            Loading coupons...
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-base font-semibold text-navy dark:text-slate-200">
              No Coupons Available
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Create your first promo code to boost customer conversion.
            </p>
            <Button onClick={openCreateModal} className="mt-4 rounded-full text-xs">
              + Create Coupon
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-border">
                <tr>
                  <th className="py-3.5 px-4">Coupon Code</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4">Min Order</th>
                  <th className="py-3.5 px-4">Max Cap</th>
                  <th className="py-3.5 px-4">Redeemed</th>
                  <th className="py-3.5 px-4">Valid Until</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {coupons.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
                  >
                    <td className="py-3.5 px-4 font-bold text-navy dark:text-slate-100">
                      <span className="font-mono text-sm tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {c.code}
                      </span>
                      {c.title && (
                        <p className="text-xs font-normal text-slate-500 mt-0.5">{c.title}</p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                      {c.discountValue}
                      {c.discountType === 'PERCENTAGE' ? '%' : ' ₹'} OFF
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      ₹{(c.minOrderAmount || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {c.maxDiscount
                        ? `₹${Number(c.maxDiscount).toLocaleString('en-IN')}`
                        : 'No Cap'}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {c.usedCount} {c.usageLimit ? `/ ${c.usageLimit}` : ''}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {new Date(c.validUntil).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(c)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition ${
                          c.isActive
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-xs h-7 px-3"
                        onClick={() => openEditModal(c)}
                      >
                        Edit
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full text-xs h-7 px-2 text-red-500 hover:text-red-700"
                        onClick={() => setDeletingId(c.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-heading text-xl text-navy dark:text-slate-100">
              {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Coupon Code *
                </label>
                <Input
                  placeholder="e.g. SUMMER500"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-medium focus:ring-2 focus:ring-navy"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Discount Value *
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 10 or 200"
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Min Order Amount (₹)
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 999"
                    value={form.minOrderAmount}
                    onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Max Discount Cap (₹)
                  </label>
                  <Input
                    type="number"
                    placeholder="Optional (e.g. 300)"
                    value={form.maxDiscount}
                    onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Total Usage Limit
                  </label>
                  <Input
                    type="number"
                    placeholder="Optional total limit"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Valid Until *
                  </label>
                  <Input
                    type="date"
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Title / Headline
                </label>
                <Input
                  placeholder="e.g. Festive Special 10% OFF"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded accent-navy"
                />
                <label
                  htmlFor="isActiveToggle"
                  className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Activate coupon immediately
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" className="rounded-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="font-heading text-lg font-bold text-navy dark:text-slate-100">
              Delete Promo Code?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Are you sure you want to delete this coupon? Customers will no longer be able to
              redeem it.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setDeletingId(null)}
              >
                Cancel
              </Button>
              <Button
                className="rounded-full bg-red-600 hover:bg-red-700 text-white"
                onClick={() => handleDelete(deletingId)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete Coupon'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
