'use client';

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Edit3,
  Gift,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Truck,
  X,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

interface Offer {
  id: string;
  title: string;
  description?: string | null;
  type: string; // 'FREE_DELIVERY' | 'PERCENT_DISCOUNT' | 'FLAT_DISCOUNT'
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

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [deletingOffer, setDeletingOffer] = useState<Offer | null>(null);

  // Form State
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

  const openCreateModal = () => {
    setEditingOffer(null);
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
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (offer: Offer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title || '',
      description: offer.description || '',
      type: offer.type || 'FREE_DELIVERY',
      value: Number(offer.value || 0),
      minCartValue: Number(offer.minCartValue || 0),
      firstOrderOnly: Boolean(offer.firstOrderOnly),
      isActive: Boolean(offer.isActive),
      startDate: offer.startDate ? new Date(offer.startDate).toISOString().split('T')[0] : '',
      endDate: offer.endDate ? new Date(offer.endDate).toISOString().split('T')[0] : '',
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter an Offer Title.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      type: formData.type,
      value: Number(formData.value) || 0,
      minCartValue: Number(formData.minCartValue) || 0,
      firstOrderOnly: Boolean(formData.firstOrderOnly),
      isActive: Boolean(formData.isActive),
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
    };

    try {
      const isEdit = Boolean(editingOffer);
      const url = isEdit ? `/api/v1/admin/offers/${editingOffer!.id}` : '/api/v1/admin/offers';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || `Failed to ${isEdit ? 'update' : 'create'} offer.`);
      }

      setIsModalOpen(false);
      setSuccessMessage(
        `Offer "${json.data?.title || formData.title}" ${isEdit ? 'updated' : 'created'} successfully!`,
      );
      setTimeout(() => setSuccessMessage(null), 4000);
      await fetchOffers();
    } catch (err: any) {
      setErrorMessage(err.message || 'Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const handleDeleteOffer = async () => {
    if (!deletingOffer) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/admin/offers/${deletingOffer.id}`, {
        method: 'DELETE',
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setOffers((prev) => prev.filter((o) => o.id !== deletingOffer.id));
        setSuccessMessage(`Offer "${deletingOffer.title}" deleted successfully.`);
        setTimeout(() => setSuccessMessage(null), 4000);
        setDeletingOffer(null);
      } else {
        setErrorMessage(json.message || 'Failed to delete offer.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error deleting offer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics
  const totalOffers = offers.length;
  const activeOffersCount = offers.filter((o) => o.isActive).length;
  const firstOrderOffersCount = offers.filter((o) => o.firstOrderOnly && o.isActive).length;
  const freeDeliveryCount = offers.filter((o) => o.type === 'FREE_DELIVERY' && o.isActive).length;

  // Filtered list
  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      if (search) {
        const q = search.toLowerCase();
        const matchesTitle = offer.title.toLowerCase().includes(q);
        const matchesDesc = offer.description ? offer.description.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesDesc) return false;
      }
      if (typeFilter !== 'ALL' && offer.type !== typeFilter) return false;
      if (statusFilter === 'ACTIVE' && !offer.isActive) return false;
      if (statusFilter === 'INACTIVE' && offer.isActive) return false;
      return true;
    });
  }, [offers, search, typeFilter, statusFilter]);

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* Header Banner - Signature Navy & Orange Theme */}
      <div className="bg-navy text-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold text-orange uppercase tracking-widest block mb-1">
            Promotions &amp; Store Discounts Desk
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Gift className="w-7 h-7 text-orange" /> Offers &amp; Promotions Management
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-1">
            Create, toggle, and configure site-wide promotions, free delivery rules, and first-order
            customer offers.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchOffers}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-colors cursor-pointer"
            title="Refresh Offers"
            aria-label="Refresh Offers"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-orange hover:bg-orange/90 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Offer</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Total Offers
            </span>
            <div className="p-2.5 rounded-2xl bg-navy/10 text-navy border border-navy/20">
              <Gift className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-navy font-mono">{totalOffers}</p>
          <span className="text-[11px] text-slate-500 font-medium">All configured offers</span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Active Offers
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600 font-mono">{activeOffersCount}</p>
          <span className="text-[11px] text-slate-500 font-medium">Live on storefront</span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              First-Order Deals
            </span>
            <div className="p-2.5 rounded-2xl bg-orange/10 text-orange border border-orange/20">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-orange font-mono">{firstOrderOffersCount}</p>
          <span className="text-[11px] text-slate-500 font-medium">New buyer incentives</span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Free Delivery Rules
            </span>
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-blue-600 font-mono">{freeDeliveryCount}</p>
          <span className="text-[11px] text-slate-500 font-medium">Active shipping discounts</span>
        </div>
      </div>

      {/* Main Card: Configured Promotions & Rules */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search promotion title, rule..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-navy focus:outline-none focus:border-navy cursor-pointer"
              >
                <option value="ALL">All Types</option>
                <option value="FREE_DELIVERY">Free Delivery</option>
                <option value="PERCENT_DISCOUNT">Percentage Discount</option>
                <option value="FLAT_DISCOUNT">Flat Amount Discount</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-navy focus:outline-none focus:border-navy cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content List */}
        {isLoading ? (
          <div className="p-12 text-center text-xs font-semibold text-slate-500 animate-pulse flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-orange" />
            <span>Loading store promotional offers...</span>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Gift className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-navy">
              {offers.length === 0
                ? 'No Promotional Offers Configured'
                : 'No matching offers found'}
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {offers.length === 0
                ? 'Create a free delivery or store discount rule to reward first-order and returning shoppers.'
                : 'Try adjusting your search query or filters above.'}
            </p>
            {offers.length === 0 && (
              <button
                onClick={openCreateModal}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange hover:bg-orange/90 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Create First Offer</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3.5">
            {filteredOffers.map((offer) => {
              const isFreeDel = offer.type === 'FREE_DELIVERY';
              const isPercent = offer.type === 'PERCENT_DISCOUNT';
              const isFlat = offer.type === 'FLAT_DISCOUNT';

              return (
                <div
                  key={offer.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs ${
                    offer.isActive
                      ? 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                      : 'border-slate-200 bg-slate-50/70 opacity-70'
                  }`}
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-navy text-sm sm:text-base">
                        {offer.title}
                      </span>

                      {/* Type Badge */}
                      {isFreeDel && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300">
                          <Truck className="h-3 w-3" /> Free Delivery
                        </span>
                      )}
                      {isPercent && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-navy/10 text-navy border border-navy/30">
                          <Percent className="h-3 w-3" /> {offer.value}% Discount
                        </span>
                      )}
                      {isFlat && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-orange/10 text-orange border border-orange/30">
                          <Tag className="h-3 w-3" /> ₹{offer.value} Flat Off
                        </span>
                      )}

                      {/* First Order Badge */}
                      {offer.firstOrderOnly && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                          ⭐ First Order Only
                        </span>
                      )}

                      {/* Active Status Pill */}
                      {offer.isActive ? (
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          LIVE
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                          INACTIVE
                        </span>
                      )}
                    </div>

                    {offer.description && (
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        {offer.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                      <span>
                        Min Cart:{' '}
                        <strong className="text-slate-800 font-bold">
                          {offer.minCartValue ? `₹${offer.minCartValue}` : 'No Minimum'}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Applies To:{' '}
                        <strong className="text-slate-800 font-bold">
                          {offer.firstOrderOnly ? 'New Users (First Order)' : 'All Orders'}
                        </strong>
                      </span>
                      {(offer.startDate || offer.endDate) && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {offer.startDate
                              ? new Date(offer.startDate).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'Now'}{' '}
                            —{' '}
                            {offer.endDate
                              ? new Date(offer.endDate).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'Ongoing'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    {/* Toggle Active Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(offer)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer ${
                        offer.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                      }`}
                      title="Click to toggle active status"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          offer.isActive ? 'bg-emerald-600' : 'bg-slate-400'
                        }`}
                      />
                      <span>{offer.isActive ? 'Active (ON)' : 'Inactive (OFF)'}</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => openEditModal(offer)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-navy font-bold text-xs hover:bg-navy hover:text-white hover:border-navy transition-colors shadow-2xs cursor-pointer"
                      title="Edit Offer Details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => setDeletingOffer(offer)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer"
                      title="Delete Offer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="text-xl font-black text-navy flex items-center gap-2">
                  <Gift className="h-5 w-5 text-orange" />
                  {editingOffer ? 'Edit Promotional Offer' : 'Create Promotional Offer'}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Configure discount rules, order eligibility thresholds, and delivery subsidies.
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

            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Title */}
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-navy">
                  Offer Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Free Delivery on First Order"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold text-xs focus:bg-white focus:border-navy focus:outline-none transition-colors"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-navy">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 100% free delivery across India on your very first order at JiivaaKart!"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold text-xs focus:bg-white focus:border-navy focus:outline-none transition-colors"
                />
              </div>

              {/* Offer Type */}
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-navy">
                  Offer Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold text-xs focus:bg-white focus:border-navy focus:outline-none cursor-pointer"
                >
                  <option value="FREE_DELIVERY">FREE DELIVERY (₹0 Shipping Fee)</option>
                  <option value="PERCENT_DISCOUNT">PERCENTAGE DISCOUNT (% OFF)</option>
                  <option value="FLAT_DISCOUNT">FLAT DISCOUNT (₹ OFF)</option>
                </select>
              </div>

              {/* Discount Value (if not free delivery) */}
              {formData.type !== 'FREE_DELIVERY' && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-navy">
                    Discount Value ({formData.type === 'PERCENT_DISCOUNT' ? '%' : '₹'}) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={formData.type === 'PERCENT_DISCOUNT' ? 100 : undefined}
                    placeholder="e.g. 10 or 150"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono font-semibold text-xs focus:bg-white focus:border-navy focus:outline-none transition-colors"
                  />
                </div>
              )}

              {/* Minimum Cart Value */}
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-navy">
                  Minimum Cart Value (₹) (0 for no limit)
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="e.g. 999"
                  value={formData.minCartValue}
                  onChange={(e) =>
                    setFormData({ ...formData, minCartValue: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono font-semibold text-xs focus:bg-white focus:border-navy focus:outline-none transition-colors"
                />
              </div>

              {/* First Order Only Checkbox Card */}
              <div className="rounded-2xl border border-orange/30 bg-orange/5 p-4 space-y-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.firstOrderOnly}
                    onChange={(e) => setFormData({ ...formData, firstOrderOnly: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 accent-orange cursor-pointer"
                  />
                  <span className="text-xs font-bold text-orange">First Order Only</span>
                </label>
                <p className="text-[11px] text-slate-600 pl-6 leading-tight">
                  Only applies if the user is authenticated and has never placed an order before
                  (completed order count == 0).
                </p>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveOfferToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 accent-navy cursor-pointer"
                />
                <label
                  htmlFor="isActiveOfferToggle"
                  className="text-xs font-bold text-slate-800 cursor-pointer"
                >
                  Activate offer immediately for live storefront
                </label>
              </div>

              {/* Start and End Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-navy">
                    Start Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold text-xs focus:bg-white focus:border-navy focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-navy">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold text-xs focus:bg-white focus:border-navy focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Modal Footer Actions */}
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
                  {isSubmitting ? 'Saving...' : editingOffer ? 'Update Offer' : 'Create Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <h3 className="font-heading text-lg font-black text-navy flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-600" />
              Delete Promotional Offer?
            </h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Are you sure you want to permanently delete the offer{' '}
              <strong className="text-slate-900 font-bold">
                &quot;{deletingOffer.title}&quot;
              </strong>
              ? Shoppers will immediately no longer be eligible for this promotion at checkout.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingOffer(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteOffer}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Offer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
