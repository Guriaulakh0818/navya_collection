'use client';

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Gift,
  Percent,
  Plus,
  Sparkles,
  Tag,
  Trash2,
  Truck,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

interface Offer {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  value: number;
  minCartValue?: number | null;
  firstOrderOnly: boolean;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Create Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'FREE_DELIVERY',
    value: 0,
    minCartValue: 0,
    firstOrderOnly: true,
    isActive: true,
    startDate: '',
    endDate: '',
  });

  const fetchOffers = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/v1/admin/offers');
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setOffers(json.data);
      } else {
        setErrorMessage(json.message || 'Failed to load offers.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error loading offers.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleToggleActive = async (offer: Offer) => {
    try {
      const nextActive = !offer.isActive;
      // Optimistic update
      setOffers((prev) =>
        prev.map((o) => (o.id === offer.id ? { ...o, isActive: nextActive } : o)),
      );

      const res = await fetch(`/api/v1/admin/offers/${offer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextActive }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        // Revert on error
        setOffers((prev) =>
          prev.map((o) => (o.id === offer.id ? { ...o, isActive: offer.isActive } : o)),
        );
        setErrorMessage(json.message || 'Failed to update offer status.');
      } else {
        setSuccessMessage(
          `Offer "${offer.title}" ${nextActive ? 'activated' : 'deactivated'} successfully!`,
        );
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error updating offer.');
    }
  };

  const handleDeleteOffer = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete the offer "${title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/offers/${id}`, {
        method: 'DELETE',
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setOffers((prev) => prev.filter((o) => o.id !== id));
        setSuccessMessage(`Offer "${title}" deleted successfully.`);
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(json.message || 'Failed to delete offer.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error deleting offer.');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter an Offer Title.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/v1/admin/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          value: Number(formData.value) || 0,
          minCartValue: Number(formData.minCartValue) || 0,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setOffers((prev) => [json.data, ...prev]);
        setShowCreateModal(false);
        setSuccessMessage(`🎉 Offer "${json.data.title}" created successfully!`);
        setTimeout(() => setSuccessMessage(null), 4000);
        // Reset form
        setFormData({
          title: '',
          description: '',
          type: 'FREE_DELIVERY',
          value: 0,
          minCartValue: 0,
          firstOrderOnly: true,
          isActive: true,
          startDate: '',
          endDate: '',
        });
      } else {
        setErrorMessage(json.message || 'Failed to create offer.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error creating offer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics
  const totalOffers = offers.length;
  const activeOffersCount = offers.filter((o) => o.isActive).length;
  const firstOrderOffersCount = offers.filter((o) => o.firstOrderOnly && o.isActive).length;
  const freeDeliveryCount = offers.filter((o) => o.type === 'FREE_DELIVERY' && o.isActive).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy flex items-center gap-2.5">
            <Gift className="h-7 w-7 text-navy" /> Offers & Promotions Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create, toggle, and manage site-wide promotions, free delivery rules, and first-order
            customer offers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="rounded-full bg-navy hover:bg-navy/90 text-white font-bold text-xs sm:text-sm px-5 py-2.5 flex items-center gap-2 shadow-md"
          >
            <Plus className="h-4 w-4" /> Create New Offer
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-card space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Offers
          </span>
          <p className="text-2xl font-black text-navy">{totalOffers}</p>
          <span className="text-[11px] text-slate-400 font-medium">All time configured</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-card space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Active Offers
          </span>
          <p className="text-2xl font-black text-emerald-600">{activeOffersCount}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Currently live on site</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-card space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            First-Order Promotions
          </span>
          <p className="text-2xl font-black text-indigo-600">{firstOrderOffersCount}</p>
          <span className="text-[11px] text-indigo-600 font-medium">Targets new buyers</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-card space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Free Delivery Rules
          </span>
          <p className="text-2xl font-black text-orange">{freeDeliveryCount}</p>
          <span className="text-[11px] text-orange font-medium">Active shipping discounts</span>
        </div>
      </div>

      {/* Offers List */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" /> Configured Promotions & Rules
          </h2>
          <span className="text-xs font-medium text-slate-500">
            {offers.length} {offers.length === 1 ? 'offer' : 'offers'} found
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 animate-pulse space-y-3">
            <div className="h-10 w-48 bg-slate-100 rounded-full mx-auto" />
            <p className="text-xs">Loading promotional offers...</p>
          </div>
        ) : offers.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-4 border border-dashed border-slate-200 rounded-2xl p-6">
            <Gift className="h-12 w-12 text-slate-300 mx-auto" />
            <div>
              <p className="font-bold text-navy text-base">No Promotional Offers Configured</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Create a promotional offer to provide free delivery or special discounts for your
                shoppers.
              </p>
            </div>
            <Button
              onClick={() => {
                setFormData({
                  title: 'Free Delivery on First Order',
                  description:
                    'Get 100% free delivery across India on your very first order at Navya Collection!',
                  type: 'FREE_DELIVERY',
                  value: 0,
                  minCartValue: 0,
                  firstOrderOnly: true,
                  isActive: true,
                  startDate: '',
                  endDate: '',
                });
                setShowCreateModal(true);
              }}
              className="rounded-full bg-navy text-white text-xs font-semibold px-5 py-2"
            >
              Seed First-Order Free Delivery Offer
            </Button>
          </div>
        ) : (
          <div className="grid gap-3.5">
            {offers.map((offer) => {
              const isFreeDel = offer.type === 'FREE_DELIVERY';
              const isPercent = offer.type === 'PERCENT_DISCOUNT';
              const isFlat = offer.type === 'FLAT_DISCOUNT';

              return (
                <div
                  key={offer.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    offer.isActive
                      ? 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                      : 'border-slate-100 bg-slate-50/60 opacity-60'
                  }`}
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-navy text-base">{offer.title}</span>

                      {/* Type Badge */}
                      {isFreeDel && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Truck className="h-3 w-3" /> Free Delivery
                        </span>
                      )}
                      {isPercent && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          <Percent className="h-3 w-3" /> {offer.value}% Discount
                        </span>
                      )}
                      {isFlat && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          <Tag className="h-3 w-3" /> ₹{offer.value} Flat Off
                        </span>
                      )}

                      {/* First Order Badge */}
                      {offer.firstOrderOnly && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          ⭐ First Order Only
                        </span>
                      )}

                      {/* Active Status Badge */}
                      {offer.isActive ? (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          LIVE / ACTIVE
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                          INACTIVE / OFF
                        </span>
                      )}
                    </div>

                    {offer.description && (
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        {offer.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      {offer.minCartValue ? (
                        <span>
                          Min Cart: <strong>₹{offer.minCartValue}</strong>
                        </span>
                      ) : (
                        <span>
                          Min Cart: <strong>No Minimum</strong>
                        </span>
                      )}
                      <span>•</span>
                      <span>
                        Applies To:{' '}
                        <strong>
                          {offer.firstOrderOnly ? 'New Users (First Order)' : 'All Orders'}
                        </strong>
                      </span>
                      {(offer.startDate || offer.endDate) && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {offer.startDate
                              ? new Date(offer.startDate).toLocaleDateString()
                              : 'Now'}{' '}
                            —{' '}
                            {offer.endDate
                              ? new Date(offer.endDate).toLocaleDateString()
                              : 'Forever'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    {/* Toggle Active Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(offer)}
                      className={`rounded-full px-4 py-2 text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                        offer.isActive
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      {offer.isActive ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Active (ON)
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5" /> Inactive (OFF)
                        </>
                      )}
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteOffer(offer.id, offer.title)}
                      className="p-2 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Delete Offer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Offer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xl font-extrabold text-navy flex items-center gap-2">
                <Gift className="h-5 w-5 text-navy" /> Create Promotional Offer
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs sm:text-sm">
              {/* Title */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Offer Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Free Delivery on First Order"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-navy/20"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 100% free delivery across India on your very first order!"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-navy/20"
                />
              </div>

              {/* Offer Type */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Offer Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-navy/20"
                >
                  <option value="FREE_DELIVERY">🚚 FREE DELIVERY (₹0 Shipping Fee)</option>
                  <option value="PERCENT_DISCOUNT">🏷️ PERCENTAGE DISCOUNT (% off order)</option>
                  <option value="FLAT_DISCOUNT">💰 FLAT DISCOUNT (₹ off order)</option>
                </select>
              </div>

              {/* Value (Only for percent/flat) */}
              {formData.type !== 'FREE_DELIVERY' && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    {formData.type === 'PERCENT_DISCOUNT'
                      ? 'Discount Percentage (%)'
                      : 'Flat Discount Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={formData.type === 'PERCENT_DISCOUNT' ? '100' : '50000'}
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-navy/20"
                  />
                </div>
              )}

              {/* Minimum Cart Value */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  Minimum Cart Value (₹) (0 for no limit)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.minCartValue}
                  onChange={(e) =>
                    setFormData({ ...formData, minCartValue: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-navy/20"
                />
              </div>

              {/* First Order Only Checkbox */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="firstOrderOnly"
                  checked={formData.firstOrderOnly}
                  onChange={(e) => setFormData({ ...formData, firstOrderOnly: e.target.checked })}
                  className="h-4 w-4 rounded accent-indigo-600 mt-0.5 cursor-pointer"
                />
                <label htmlFor="firstOrderOnly" className="cursor-pointer space-y-0.5">
                  <p className="font-bold text-indigo-950 text-xs sm:text-sm">First Order Only</p>
                  <p className="text-[11px] text-indigo-700 leading-relaxed font-medium">
                    Only applies if the user is authenticated and has never placed an order before
                    (completed order count == 0).
                  </p>
                </label>
              </div>

              {/* Active Immediately Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                />
                <label
                  htmlFor="isActive"
                  className="font-bold text-slate-700 text-xs sm:text-sm cursor-pointer"
                >
                  Activate Offer Immediately
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-full text-xs font-semibold px-4 py-2"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full bg-navy hover:bg-navy/90 text-white font-bold text-xs px-6 py-2.5 shadow-md"
                >
                  {isSubmitting ? 'Creating...' : 'Save & Publish Offer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
