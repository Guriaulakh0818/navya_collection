'use client';

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Plus,
  Search,
  ShoppingBag,
  Tag,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export function SellerProductList() {
  const [products, setProducts] = useState<any[]>([]);
  const [counts, setCounts] = useState<any>({
    ALL: 0,
    active: 0,
    draft: 0,
    pending_approval: 0,
    archived: 0,
  });
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [pagination, setPagination] = useState<any>({ total: 0, pages: 1 });
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/v1/seller/products', window.location.origin);
      url.searchParams.set('status', activeTab);
      url.searchParams.set('page', String(page));
      url.searchParams.set('limit', '10');
      if (searchQuery) url.searchParams.set('q', searchQuery);

      const res = await fetch(url.toString());
      const data = await res.json();

      if (data.success) {
        setProducts(data.data || []);
        if (data.pagination) setPagination(data.pagination);
        if (data.counts) setCounts(data.counts);
      }
    } catch (err: any) {
      console.error('Failed to fetch seller products:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, page, searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(products.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDeleteSingle = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete product "${name}"?`)) return;
    try {
      const res = await fetch(`/api/v1/seller/products/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Product deleted successfully!', 'success');
        fetchProducts();
      } else {
        showToast(data.message || 'Failed to delete product.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'An error occurred.', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected products?`))
      return;

    setIsDeleting(true);
    try {
      const res = await fetch('/api/v1/seller/products/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: selectedIds }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Selected products deleted successfully!', 'success');
        setSelectedIds([]);
        fetchProducts();
      } else {
        showToast(data.message || 'Failed to delete products.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'An error occurred.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border flex items-center justify-between transition-all ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-navy" />
            Seller Product Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your boutique products, variants, prices, inventory stock levels, and publication
            status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected ({selectedIds.length})
            </button>
          )}

          <Link
            href="/seller/products/new"
            className="px-5 py-2.5 bg-navy hover:bg-navy/90 text-white font-bold text-xs rounded-xl shadow-md shadow-navy/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add New Product
          </Link>
        </div>
      </div>

      {/* Status Tabs & Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
          {[
            { id: 'ALL', label: 'All Products', count: counts.ALL },
            { id: 'active', label: 'Active', count: counts.active },
            { id: 'draft', label: 'Drafts', count: counts.draft },
            { id: 'pending_approval', label: 'Pending Approval', count: counts.pending_approval },
            { id: 'archived', label: 'Archived', count: counts.archived },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                  isActive
                    ? 'bg-navy border-navy text-white shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            fetchProducts();
          }}
          className="flex gap-2 max-w-md"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by product name, SKU, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-navy focus:bg-white focus:outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-navy hover:bg-navy/90 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
          >
            Search
          </button>
        </form>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-600 flex items-center justify-center gap-2.5">
            <div className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin" />
            <span className="font-semibold text-sm">Loading catalog products...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-800 text-sm">No products found in this category.</p>
            <p className="text-xs text-slate-500">
              Click &quot;Add New Product&quot; to create your boutique listing.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-[10px] text-slate-500 font-bold">
                <tr>
                  <th className="py-4 px-4 w-10">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedIds.length === products.length && products.length > 0}
                      className="rounded border-slate-300 text-navy focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-4 px-6">Product Item</th>
                  <th className="py-4 px-6">SKU / Category</th>
                  <th className="py-4 px-6">Selling Price</th>
                  <th className="py-4 px-6">Inventory Stock</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  const primaryImg = p.images?.find((img: any) => img.isPrimary) || p.images?.[0];

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50 transition-all ${isSelected ? 'bg-slate-50/80' : ''}`}
                    >
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(p.id)}
                          className="rounded border-slate-300 text-navy focus:ring-0 cursor-pointer"
                        />
                      </td>

                      <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-navy font-bold">
                          {primaryImg?.imageUrl ? (
                            <Image
                              src={primaryImg.imageUrl}
                              alt={p.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Tag className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <span className="block text-sm font-bold text-slate-900 line-clamp-1">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            slug: {p.slug}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6 font-mono">
                        <div>
                          SKU:{' '}
                          <span className="text-slate-800 font-semibold">{p.sku || 'N/A'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-sans">
                          {p.category?.name || 'Couture'}
                        </div>
                      </td>

                      <td className="py-4 px-6 font-bold text-emerald-600 font-mono text-sm">
                        ₹{Number(p.price || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-4 px-6 font-semibold font-mono">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                            p.stock <= 5
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {p.stock} Units
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                            p.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : p.status === 'draft'
                                ? 'bg-slate-100 text-slate-700 border-slate-200'
                                : p.status === 'pending_approval'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/seller/products/${p.id}/edit`}
                            className="p-2 bg-slate-100 hover:bg-navy hover:text-white text-slate-700 rounded-lg border border-slate-200 transition-all"
                            title="Edit Product"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteSingle(p.id, p.name)}
                            className="p-2 bg-slate-100 hover:bg-rose-600 hover:text-white text-rose-600 rounded-lg border border-slate-200 transition-all"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Pagination Footer */}
        {pagination.pages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
            <span>
              Showing Page <strong className="text-slate-900">{page}</strong> of{' '}
              <strong className="text-slate-900">{pagination.pages}</strong> ({pagination.total}{' '}
              Total Items)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg disabled:opacity-50 flex items-center gap-1 font-semibold transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg disabled:opacity-50 flex items-center gap-1 font-semibold transition-all"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
