'use client';

import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  ShieldAlert,
  ShoppingBag,
  Tag,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';

import { ProductInspectionModal } from './ProductInspectionModal';

export function AdminProductApprovalTable() {
  const [products, setProducts] = useState<any[]>([]);
  const [counts, setCounts] = useState<any>({
    ALL: 0,
    pending_approval: 0,
    active: 0,
    draft: 0,
    archived: 0,
  });
  const [activeTab, setActiveTab] = useState<string>('pending_approval');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [pagination, setPagination] = useState<any>({ total: 0, pages: 1 });
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fetchApprovals = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/v1/admin/products/approvals', window.location.origin);
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
      console.error('Failed to fetch product approvals queue:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, page, searchQuery]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleApproveProduct = async (productId: string) => {
    try {
      const res = await fetch('/api/v1/admin/products/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Product approved and published live!', 'success');
        fetchApprovals();
      } else {
        showToast(data.message || 'Failed to approve product.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'An error occurred.', 'error');
    }
  };

  const handleRejectProduct = async (productId: string, reason: string) => {
    try {
      const res = await fetch('/api/v1/admin/products/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, reason }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Product submission rejected.', 'success');
        fetchApprovals();
      } else {
        showToast(data.message || 'Failed to reject product.', 'error');
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

      {/* Top Banner Header */}
      <div className="bg-navy text-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">
            <ShoppingBag className="w-3.5 h-3.5" />
            Catalog Moderation
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Seller Product Approval Queue & Quality Moderation
          </h1>
          <p className="text-xs md:text-sm text-slate-300 font-medium mt-1">
            Review vendor submitted products, inspect pricing, variants, and Cloudinary gallery
            assets before publishing live.
          </p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 md:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-4 max-w-full overflow-x-auto scrollbar-none">
          {[
            {
              id: 'pending_approval',
              label: 'Pending Approvals',
              count: counts.pending_approval,
              color: 'text-amber-900 border-amber-300 bg-amber-50',
            },
            {
              id: 'active',
              label: 'Approved Live',
              count: counts.active,
              color: 'text-emerald-900 border-emerald-300 bg-emerald-50',
            },
            {
              id: 'archived',
              label: 'Rejected / Archived',
              count: counts.archived,
              color: 'text-rose-900 border-rose-300 bg-rose-50',
            },
            {
              id: 'ALL',
              label: 'All Products',
              count: counts.ALL,
              color: 'text-navy border-slate-300 bg-slate-100',
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(1);
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 border cursor-pointer shrink-0 whitespace-nowrap ${
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

        {/* Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            fetchApprovals();
          }}
          className="flex gap-2 max-w-md"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search product name, SKU, or shop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-amber-500 focus:outline-none font-semibold"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-navy hover:bg-navy-hover text-white font-extrabold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Filter Queue
          </button>
        </form>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-600 flex items-center justify-center gap-2 font-semibold text-xs">
            <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            Loading moderation queue...
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="font-semibold text-sm">No products in this queue tab.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full text-left text-xs text-slate-800 border-collapse">
              <thead className="bg-slate-100/90 text-navy uppercase font-extrabold tracking-wider border-b-2 border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 border-r border-slate-200 whitespace-nowrap">
                    Product Details
                  </th>
                  <th className="py-3.5 px-4 border-r border-slate-200 whitespace-nowrap">
                    Merchant Shop
                  </th>
                  <th className="py-3.5 px-4 border-r border-slate-200 whitespace-nowrap">
                    SKU / Category
                  </th>
                  <th className="py-3.5 px-4 border-r border-slate-200 whitespace-nowrap">
                    Price & Stock
                  </th>
                  <th className="py-3.5 px-4 border-r border-slate-200 whitespace-nowrap text-center">
                    Status
                  </th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {products.map((p) => {
                  const primaryImg = p.images?.find((img: any) => img.isPrimary) || p.images?.[0];

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 border-r border-slate-200 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="relative w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-amber-600 font-bold">
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
                            <span className="block text-sm font-extrabold text-navy line-clamp-1">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {p.variants?.length || 0} Variant(s) Matrix
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 border-r border-slate-200 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                          <Building2 className="w-3.5 h-3.5 text-amber-600" />
                          {p.shop?.name || 'Boutique Store'}
                        </div>
                        <span className="text-[10px] text-slate-500 block font-medium">
                          Owner: {p.shop?.owner?.name}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 border-r border-slate-200 whitespace-nowrap font-mono text-[11px]">
                        <div>
                          SKU: <span className="text-amber-800 font-extrabold">{p.sku}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {p.category?.name || 'Couture'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 border-r border-slate-200 whitespace-nowrap font-mono">
                        <div className="font-extrabold text-slate-900 text-sm">
                          ₹{Number(p.price || 0).toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {p.stock} Units in Stock
                        </span>
                      </td>

                      <td className="py-3.5 px-4 border-r border-slate-200 whitespace-nowrap text-center">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full border ${
                            p.status === 'active'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : p.status === 'pending_approval'
                                ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedProduct(p)}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-extrabold transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> Inspect Details
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
          <div className="p-4 bg-slate-100/90 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
            <span>
              Page <strong className="text-navy">{page}</strong> of{' '}
              <strong className="text-navy">{pagination.pages}</strong> ({pagination.total} Total
              Queue Items)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-bold disabled:opacity-50 flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage(page + 1)}
                className="px-3.5 py-1.5 bg-navy hover:bg-navy-hover text-white rounded-xl font-extrabold disabled:opacity-50 flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Inspection Modal */}
      {selectedProduct && (
        <ProductInspectionModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onApprove={handleApproveProduct}
          onReject={handleRejectProduct}
        />
      )}
    </div>
  );
}
