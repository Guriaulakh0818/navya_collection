'use client';

import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit3,
  Minus,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { DefaultProfileAvatarSilhouette } from '@/frontend/components/ui/default-profile-avatar';

import { useSellerLanguage } from '../context/SellerLanguageContext';

interface Variant {
  id: string;
  name: string | null;
  sku: string;
  size: string | null;
  color: string | null;
  stock: number;
  price?: number;
}

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  sku: string;
  stock: number;
  price: number;
  status: string;
  category?: { name: string; slug: string };
  images?: { id: string; imageUrl: string; isPrimary: boolean }[];
  variants?: Variant[];
}

export function SellerInventoryManager() {
  const { t } = useSellerLanguage();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [counts, setCounts] = useState<{
    ALL: number;
    active: number;
    draft: number;
    pending_approval: number;
    archived: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  }>({
    ALL: 0,
    active: 0,
    draft: 0,
    pending_approval: 0,
    archived: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
  });

  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [pagination, setPagination] = useState<{ total: number; pages: number }>({
    total: 0,
    pages: 1,
  });

  // Local editing states
  const [stockInputs, setStockInputs] = useState<Record<string, number>>({});
  const [savingStockIds, setSavingStockIds] = useState<Record<string, boolean>>({});
  const [savedTickIds, setSavedTickIds] = useState<Record<string, boolean>>({});
  const [expandedVariants, setExpandedVariants] = useState<Record<string, boolean>>({});
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/v1/seller/products', window.location.origin);
      url.searchParams.set('page', String(page));
      url.searchParams.set('limit', '20');

      if (activeTab === 'in_stock') {
        url.searchParams.set('stockFilter', 'in_stock');
      } else if (activeTab === 'low_stock') {
        url.searchParams.set('stockFilter', 'low_stock');
      } else if (activeTab === 'out_of_stock') {
        url.searchParams.set('stockFilter', 'out_of_stock');
      } else if (activeTab === 'archived') {
        url.searchParams.set('status', 'archived');
      } else if (activeTab !== 'ALL') {
        url.searchParams.set('status', activeTab);
      }

      if (searchQuery) url.searchParams.set('q', searchQuery);

      const res = await fetch(url.toString(), { cache: 'no-store' });
      const data = await res.json();

      if (data.success) {
        const items: ProductItem[] = data.data || [];
        setProducts(items);
        if (data.pagination) setPagination(data.pagination);
        if (data.counts) setCounts(data.counts);

        // Pre-fill local stock inputs
        const initialInputs: Record<string, number> = {};
        items.forEach((p) => {
          initialInputs[p.id] = p.stock;
          p.variants?.forEach((v) => {
            initialInputs[v.id] = v.stock;
          });
        });
        setStockInputs((prev) => ({ ...initialInputs, ...prev }));
      } else {
        setProducts([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch inventory:', err);
      showToast(err.message || 'Error loading inventory', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, page, searchQuery]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Adjust stock for product
  const handleUpdateStock = async (productId: string, newStockVal: number) => {
    const finalStock = Math.max(0, newStockVal);
    setSavingStockIds((prev) => ({ ...prev, [productId]: true }));

    try {
      const res = await fetch(`/api/v1/seller/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStock: finalStock }),
      });
      const data = await res.json();

      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, stock: finalStock } : p)),
        );
        setStockInputs((prev) => ({ ...prev, [productId]: finalStock }));
        setSavedTickIds((prev) => ({ ...prev, [productId]: true }));
        setTimeout(() => {
          setSavedTickIds((prev) => ({ ...prev, [productId]: false }));
        }, 2000);
        showToast(`Stock updated to ${finalStock} units`, 'success');
      } else {
        showToast(data.message || 'Failed to update stock', 'error');
      }
    } catch {
      showToast('Network error while updating stock', 'error');
    } finally {
      setSavingStockIds((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // Adjust stock for variant
  const handleUpdateVariantStock = async (
    productId: string,
    variantId: string,
    newStockVal: number,
  ) => {
    const finalStock = Math.max(0, newStockVal);
    setSavingStockIds((prev) => ({ ...prev, [variantId]: true }));

    try {
      const res = await fetch(`/api/v1/seller/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, newStock: finalStock }),
      });
      const data = await res.json();

      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id !== productId) return p;
            const updatedVariants = (p.variants || []).map((v) =>
              v.id === variantId ? { ...v, stock: finalStock } : v,
            );
            const totalStock = updatedVariants.reduce((sum, v) => sum + Number(v.stock), 0);
            return { ...p, stock: totalStock, variants: updatedVariants };
          }),
        );
        setStockInputs((prev) => ({ ...prev, [variantId]: finalStock }));
        setSavedTickIds((prev) => ({ ...prev, [variantId]: true }));
        setTimeout(() => {
          setSavedTickIds((prev) => ({ ...prev, [variantId]: false }));
        }, 2000);
        showToast(`Variant stock updated to ${finalStock} units`, 'success');
      } else {
        showToast(data.message || 'Failed to update variant stock', 'error');
      }
    } catch {
      showToast('Network error while updating variant stock', 'error');
    } finally {
      setSavingStockIds((prev) => ({ ...prev, [variantId]: false }));
    }
  };

  // Archive / Unarchive product toggle
  const handleToggleArchive = async (product: ProductItem) => {
    const isCurrentlyArchived = product.status === 'archived';
    const nextStatus = isCurrentlyArchived ? 'active' : 'archived';
    const actionLabel = isCurrentlyArchived ? 'unarchive and activate' : 'archive and hide';

    if (!confirm(`Are you sure you want to ${actionLabel} "${product.name}"?`)) return;

    setActionInProgressId(product.id);
    try {
      const res = await fetch(`/api/v1/seller/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();

      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, status: nextStatus } : p)),
        );
        showToast(
          isCurrentlyArchived
            ? `"${product.name}" is now live on your storefront!`
            : `"${product.name}" has been archived and hidden from buyers.`,
          'success',
        );
        fetchInventory();
      } else {
        showToast(data.message || 'Failed to update status', 'error');
      }
    } catch {
      showToast('Network error while updating status', 'error');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Delete product
  const handleDeleteProduct = async (product: ProductItem) => {
    if (
      !confirm(
        `Are you sure you want to delete "${product.name}"? This will remove the listing from your boutique.`,
      )
    )
      return;

    setActionInProgressId(product.id);
    try {
      const res = await fetch(`/api/v1/seller/products/${product.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        showToast(`"${product.name}" deleted successfully`, 'success');
        fetchInventory();
      } else {
        showToast(data.message || 'Failed to delete product', 'error');
      }
    } catch {
      showToast('Network error while deleting product', 'error');
    } finally {
      setActionInProgressId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold border flex items-center justify-between transition-all shadow-sm ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 font-black cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-orange shrink-0" />
            <span>{t('nav.inventory', 'Inventory & Stock Manager')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Easily increase or decrease live stock quantities, archive off-season products, or
            delete unwanted listings in 1 click.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => fetchInventory()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-navy font-bold rounded-xl text-xs transition-colors cursor-pointer"
            title="Refresh Inventory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/seller/products"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-navy font-bold rounded-xl text-xs transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Full Catalog</span>
          </Link>

          <Link
            href="/seller/products/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-orange hover:bg-orange/90 text-white font-extrabold rounded-xl text-xs transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Product</span>
          </Link>
        </div>
      </div>

      {/* Quick Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Total */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Listings
          </span>
          <span className="text-xl sm:text-2xl font-black text-navy mt-1 block">
            {counts.ALL || 0}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">All shop items</span>
        </div>

        {/* Card 2: Healthy Stock */}
        <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 shadow-2xs bg-gradient-to-br from-white to-emerald-50/30">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
            In Stock
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-700 mt-1 block">
            {counts.inStock || 0}
          </span>
          <span className="text-[10px] text-emerald-600 font-medium">Ready for dispatch</span>
        </div>

        {/* Card 3: Low Stock */}
        <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-2xs bg-gradient-to-br from-white to-amber-50/40">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
            Low Stock (≤5)
          </span>
          <span className="text-xl sm:text-2xl font-black text-amber-700 mt-1 block">
            {counts.lowStock || 0}
          </span>
          <span className="text-[10px] text-amber-600 font-medium">Needs refill soon</span>
        </div>

        {/* Card 4: Out of Stock */}
        <div className="bg-white border border-rose-200 rounded-2xl p-4 shadow-2xs bg-gradient-to-br from-white to-rose-50/40">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
            Out of Stock (0)
          </span>
          <span className="text-xl sm:text-2xl font-black text-rose-700 mt-1 block">
            {counts.outOfStock || 0}
          </span>
          <span className="text-[10px] text-rose-600 font-medium">Purchases paused</span>
        </div>

        {/* Card 5: Archived */}
        <div className="bg-white border border-slate-300 rounded-2xl p-4 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Archived
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-700 mt-1 block">
            {counts.archived || 0}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Hidden from buyers</span>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 border-b border-slate-100">
          {[
            { id: 'ALL', label: 'All Products', count: counts.ALL },
            { id: 'in_stock', label: 'In Stock', count: counts.inStock },
            { id: 'low_stock', label: 'Low Stock (≤5)', count: counts.lowStock },
            { id: 'out_of_stock', label: 'Out of Stock (0)', count: counts.outOfStock },
            { id: 'archived', label: 'Archived', count: counts.archived },
            { id: 'draft', label: 'Drafts', count: counts.draft },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-navy text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, SKU, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-navy placeholder-slate-400 focus:bg-white focus:border-navy focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Inventory Workstation Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-500">Loading stock & inventory...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <Boxes className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-base font-extrabold text-navy">No products match this filter</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You can adjust stock, archive, or add products anytime from here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 border-r border-slate-200">Product</th>
                  <th className="py-3.5 px-4 border-r border-slate-200">SKU / Price</th>
                  <th className="py-3.5 px-4 border-r border-slate-200">Status</th>
                  <th className="py-3.5 px-6 border-r border-slate-200 min-w-[280px]">
                    Live Quantity (Inventory)
                  </th>
                  <th className="py-3.5 px-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.map((product) => {
                  const primaryImg =
                    product.images?.find((img) => img.isPrimary) || product.images?.[0];
                  const currentStockVal =
                    stockInputs[product.id] !== undefined ? stockInputs[product.id] : product.stock;
                  const isSaving = savingStockIds[product.id];
                  const isSaved = savedTickIds[product.id];
                  const isActionBusy = actionInProgressId === product.id;
                  const isArchived = product.status === 'archived';
                  const hasVariants = Boolean(product.variants && product.variants.length > 0);
                  const isExpanded = expandedVariants[product.id];

                  return (
                    <React.Fragment key={product.id}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        {/* Product Info */}
                        <td className="py-4 px-4 border-r border-slate-200">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative flex items-center justify-center">
                              {primaryImg?.imageUrl ? (
                                <Image
                                  src={primaryImg.imageUrl}
                                  alt={product.name}
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                />
                              ) : (
                                <DefaultProfileAvatarSilhouette />
                              )}
                            </div>
                            <div className="min-w-0 max-w-xs">
                              <span className="font-bold text-navy text-sm block truncate">
                                {product.name}
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {product.category?.name || 'Boutique Collection'}
                              </span>
                              {hasVariants && (
                                <div className="mt-2 space-y-1.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                                      Variants Stock:
                                    </span>
                                    {product.variants?.map((v) => {
                                      const vStock =
                                        stockInputs[v.id] !== undefined
                                          ? stockInputs[v.id]
                                          : v.stock;
                                      return (
                                        <span
                                          key={v.id}
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border transition-colors ${
                                            vStock <= 0
                                              ? 'bg-rose-50 text-rose-700 border-rose-300'
                                              : vStock <= 5
                                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                          }`}
                                          title={`SKU: ${v.sku} | Price: ₹${v.price}`}
                                        >
                                          <span className="font-sans font-bold">
                                            {v.size || v.color || 'Variant'}:
                                          </span>
                                          <span className="font-black">{vStock}</span>
                                        </span>
                                      );
                                    })}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedVariants((prev) => ({
                                        ...prev,
                                        [product.id]: !prev[product.id],
                                      }))
                                    }
                                    className="inline-flex items-center gap-1 text-[11px] text-orange hover:text-orange/80 font-black cursor-pointer"
                                  >
                                    {isExpanded ? (
                                      <>
                                        <ChevronUp className="w-3.5 h-3.5" /> Hide Variant Details (
                                        {product.variants?.length})
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-3.5 h-3.5" /> Adjust Individual
                                        Variant Stocks ({product.variants?.length})
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* SKU / Price */}
                        <td className="py-4 px-4 border-r border-slate-200 font-mono">
                          <div className="text-slate-800 font-bold text-xs truncate max-w-[120px]">
                            {product.sku || 'N/A'}
                          </div>
                          <div className="text-emerald-700 font-black text-sm mt-0.5">
                            ₹{Number(product.price || 0).toLocaleString('en-IN')}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 border-r border-slate-200 whitespace-nowrap">
                          {isArchived ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-300">
                              <Archive className="w-3 h-3 text-amber-600" /> Archived
                            </span>
                          ) : product.stock === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-300">
                              <AlertTriangle className="w-3 h-3 text-rose-600" /> Out of Stock
                            </span>
                          ) : product.stock <= 5 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-300">
                              Low Stock ({product.stock})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active (
                              {product.stock})
                            </span>
                          )}
                        </td>

                        {/* Live Stock Quantity Controller */}
                        <td className="py-4 px-6 border-r border-slate-200">
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                              {/* Minus 1 Button */}
                              <button
                                type="button"
                                disabled={isSaving || currentStockVal <= 0}
                                onClick={() =>
                                  handleUpdateStock(product.id, Math.max(0, currentStockVal - 1))
                                }
                                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-black flex items-center justify-center transition-all cursor-pointer disabled:opacity-40"
                                title="Decrease stock by 1"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>

                              {/* Numeric Input */}
                              <input
                                type="number"
                                min="0"
                                value={currentStockVal}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  setStockInputs((prev) => ({
                                    ...prev,
                                    [product.id]: isNaN(val) ? 0 : val,
                                  }));
                                }}
                                onBlur={() => handleUpdateStock(product.id, currentStockVal)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.currentTarget.blur();
                                  }
                                }}
                                className="w-20 text-center py-1.5 bg-slate-50 border border-slate-300 focus:bg-white focus:border-navy focus:outline-none rounded-xl font-mono font-black text-sm text-navy transition-all"
                              />

                              {/* Plus 1 Button */}
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => handleUpdateStock(product.id, currentStockVal + 1)}
                                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-black flex items-center justify-center transition-all cursor-pointer disabled:opacity-40"
                                title="Increase stock by 1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>

                              {/* Quick Save indicator */}
                              {isSaving ? (
                                <RefreshCw className="w-3.5 h-3.5 text-orange animate-spin ml-1" />
                              ) : isSaved ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 ml-1" />
                              ) : null}
                            </div>

                            {/* Quick Refill Pills */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {[
                                { label: '+5', add: 5 },
                                { label: '+10', add: 10 },
                                { label: '+25', add: 25 },
                              ].map((pill) => (
                                <button
                                  key={pill.label}
                                  type="button"
                                  disabled={isSaving}
                                  onClick={() =>
                                    handleUpdateStock(product.id, currentStockVal + pill.add)
                                  }
                                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  {pill.label}
                                </button>
                              ))}

                              {/* Out of Stock (0) Button */}
                              <button
                                type="button"
                                disabled={isSaving || currentStockVal === 0}
                                onClick={() => handleUpdateStock(product.id, 0)}
                                className="px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-extrabold transition-all cursor-pointer disabled:opacity-40"
                              >
                                Mark 0 (Out of stock)
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Quick Actions: Archive, Delete, Edit */}
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Archive / Unarchive Button */}
                            <button
                              type="button"
                              disabled={isActionBusy}
                              onClick={() => handleToggleArchive(product)}
                              className={`p-2 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                                isArchived
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                              }`}
                              title={
                                isArchived
                                  ? 'Unarchive product and activate on storefront'
                                  : 'Archive product and hide from buyers'
                              }
                            >
                              {isArchived ? (
                                <>
                                  <ArchiveRestore className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline text-[11px]">Unarchive</span>
                                </>
                              ) : (
                                <>
                                  <Archive className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline text-[11px]">Archive</span>
                                </>
                              )}
                            </button>

                            {/* Full Edit Page */}
                            <Link
                              href={`/seller/products/${product.id}/edit`}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-navy hover:text-white text-slate-700 border border-slate-200 transition-all"
                              title="Full Product Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </Link>

                            {/* Delete Product */}
                            <button
                              type="button"
                              disabled={isActionBusy}
                              onClick={() => handleDeleteProduct(product)}
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 transition-all cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Variant Sub-Rows (for sizes/colors) */}
                      {hasVariants && isExpanded && (
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <td colSpan={5} className="py-4 px-6">
                            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black text-navy uppercase tracking-wider block">
                                  Variant Inventory Breakdown ({product.variants?.length} Options):
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  Each size/color variant has its own independent live stock.
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {product.variants?.map((v) => {
                                  const vStock =
                                    stockInputs[v.id] !== undefined ? stockInputs[v.id] : v.stock;
                                  const isVUpdating = savingStockIds[v.id];
                                  const isVSaved = savedTickIds[v.id];

                                  return (
                                    <div
                                      key={v.id}
                                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all space-y-2.5"
                                    >
                                      {/* Variant Info & Current Stock Badge */}
                                      <div className="flex items-start justify-between gap-2">
                                        <div>
                                          <span className="text-xs font-black text-navy block">
                                            {v.size ? `Size: ${v.size}` : v.name || 'Standard'}
                                            {v.color ? ` • ${v.color}` : ''}
                                          </span>
                                          <span className="text-[9px] text-slate-400 font-mono block">
                                            SKU: {v.sku}
                                          </span>
                                        </div>

                                        {/* Stock Level Badge */}
                                        <div>
                                          {vStock <= 0 ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-300">
                                              Out of Stock
                                            </span>
                                          ) : vStock <= 5 ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-300">
                                              Low ({vStock})
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-300">
                                              In Stock ({vStock})
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Counter + Input */}
                                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            type="button"
                                            disabled={isVUpdating || vStock <= 0}
                                            onClick={() =>
                                              handleUpdateVariantStock(
                                                product.id,
                                                v.id,
                                                Math.max(0, vStock - 1),
                                              )
                                            }
                                            className="w-7 h-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-xs font-black text-slate-700 cursor-pointer disabled:opacity-40"
                                            title="Decrease variant stock by 1"
                                          >
                                            <Minus className="w-3 h-3" />
                                          </button>
                                          <input
                                            type="number"
                                            min="0"
                                            value={vStock}
                                            onChange={(e) => {
                                              const val = parseInt(e.target.value, 10);
                                              setStockInputs((prev) => ({
                                                ...prev,
                                                [v.id]: isNaN(val) ? 0 : val,
                                              }));
                                            }}
                                            onBlur={() =>
                                              handleUpdateVariantStock(product.id, v.id, vStock)
                                            }
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') e.currentTarget.blur();
                                            }}
                                            className="w-16 text-center py-1 bg-white border border-slate-300 focus:border-navy focus:outline-none rounded-lg text-xs font-black font-mono text-navy"
                                          />
                                          <button
                                            type="button"
                                            disabled={isVUpdating}
                                            onClick={() =>
                                              handleUpdateVariantStock(product.id, v.id, vStock + 1)
                                            }
                                            className="w-7 h-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-xs font-black text-slate-700 cursor-pointer disabled:opacity-40"
                                            title="Increase variant stock by 1"
                                          >
                                            <Plus className="w-3 h-3" />
                                          </button>

                                          {isVUpdating ? (
                                            <RefreshCw className="w-3 h-3 text-orange animate-spin ml-1" />
                                          ) : isVSaved ? (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-1" />
                                          ) : null}
                                        </div>

                                        {/* Quick Variant Refill Chips */}
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            disabled={isVUpdating}
                                            onClick={() =>
                                              handleUpdateVariantStock(product.id, v.id, vStock + 5)
                                            }
                                            className="px-1.5 py-0.5 rounded bg-white hover:bg-slate-200 text-slate-600 text-[9px] font-bold border border-slate-200 cursor-pointer"
                                          >
                                            +5
                                          </button>
                                          <button
                                            type="button"
                                            disabled={isVUpdating}
                                            onClick={() =>
                                              handleUpdateVariantStock(
                                                product.id,
                                                v.id,
                                                vStock + 10,
                                              )
                                            }
                                            className="px-1.5 py-0.5 rounded bg-white hover:bg-slate-200 text-slate-600 text-[9px] font-bold border border-slate-200 cursor-pointer"
                                          >
                                            +10
                                          </button>
                                          <button
                                            type="button"
                                            disabled={isVUpdating || vStock === 0}
                                            onClick={() =>
                                              handleUpdateVariantStock(product.id, v.id, 0)
                                            }
                                            className="px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-[9px] font-extrabold border border-rose-200 cursor-pointer disabled:opacity-40"
                                          >
                                            Set 0
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.pages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
            <span>
              Showing Page <strong className="text-navy">{page}</strong> of{' '}
              <strong className="text-navy">{pagination.pages}</strong> ({pagination.total} Total
              Products)
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-bold hover:bg-slate-100 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page >= pagination.pages}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-bold hover:bg-slate-100 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
