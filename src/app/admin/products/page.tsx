'use client';

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FolderTree,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Drawer } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { CATEGORY_TAXONOMY, getFlattenedCategoryOptions } from '@/config/categories.config';
import { useToast } from '@/providers';
import { useAuthStore } from '@/stores';

export default function AdminProductsPage() {
  const user = useAuthStore((s) => s.user);

  const isOwner =
    String(user?.role) === 'OWNER' ||
    String(user?.role) === 'SUPER_ADMIN' ||
    user?.email === 'gurvindersingh0218@gmail.com';

  const isSupervisor = String(user?.role) === 'SUPERVISOR';

  const [products, setProducts] = useState<any[]>([]);
  const [counts, setCounts] = useState<any>({
    ALL: 0,
    active: 0,
    pending_approval: 0,
    draft: 0,
    archived: 0,
  });
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({ total: 0, pages: 1 });

  // Move Category Modal State
  const [editingProductCategory, setEditingProductCategory] = useState<any | null>(null);
  const [targetCategoryId, setTargetCategoryId] = useState<string>('');
  const [categoryModalSearch, setCategoryModalSearch] = useState<string>('');
  const [isMovingCategory, setIsMovingCategory] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [categoryName, setCategoryName] = useState('cat_women_sarees');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const flattenedCategories = getFlattenedCategoryOptions();

  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/v1/admin/products', window.location.origin);
      url.searchParams.set('status', activeTab);
      if (selectedCategory !== 'ALL') {
        url.searchParams.set('categoryId', selectedCategory);
      }
      url.searchParams.set('page', String(page));
      url.searchParams.set('limit', '10');
      if (search) url.searchParams.set('q', search);

      const res = await fetch(url.toString());
      const data = await res.json();

      if (data.success) {
        setProducts(data.data || []);
        if (data.pagination) setPagination(data.pagination);
        if (data.counts) setCounts(data.counts);
      } else {
        toast(data.message || 'Failed to fetch products.', 'error');
      }
    } catch (err: any) {
      console.error('Failed to fetch admin products:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, selectedCategory, page, search, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    if (isSupervisor) {
      toast('Supervisor accounts are read-only and cannot change product status.', 'error');
      return;
    }

    const nextStatus = currentStatus === 'active' ? 'draft' : 'active';
    try {
      const res = await fetch(`/api/v1/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast(data.message || 'Status updated!', 'success');
        fetchProducts();
      } else {
        toast(data.message || 'Failed to update status.', 'error');
      }
    } catch (err: any) {
      toast(err.message || 'Error updating status.', 'error');
    }
  };

  const handleDelete = async (id: string, prodName: string) => {
    if (!isOwner) {
      toast('Only the Store Owner can delete products from the catalog.', 'error');
      return;
    }

    if (!confirm(`Are you sure you want to delete product "${prodName}"?`)) return;
    try {
      const res = await fetch(`/api/v1/admin/products/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast(data.message || 'Product deleted!', 'success');
        fetchProducts();
      } else {
        toast(data.message || 'Failed to delete product.', 'error');
      }
    } catch (err: any) {
      toast(err.message || 'Error deleting product.', 'error');
    }
  };

  const handleMoveCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductCategory || !targetCategoryId) {
      toast('Please select a target category.', 'error');
      return;
    }

    setIsMovingCategory(true);
    try {
      const res = await fetch(`/api/v1/admin/products/${editingProductCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: targetCategoryId }),
      });
      const data = await res.json();
      if (data.success) {
        toast('Category updated successfully!', 'success');
        setEditingProductCategory(null);
        setTargetCategoryId('');
        setCategoryModalSearch('');
        fetchProducts();
      } else {
        toast(data.message || 'Failed to update category.', 'error');
      }
    } catch (err: any) {
      toast(err.message || 'Error updating product category.', 'error');
    } finally {
      setIsMovingCategory(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSupervisor) {
      toast('Supervisor role is read-only. Cannot create products.', 'error');
      return;
    }

    if (!name.trim() || !price) {
      toast('Please enter product title and price.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          price: Number(price),
          stock: Number(stock) || 10,
          categoryName,
          imageUrl: imageUrl.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast(data.message || 'Product created successfully!', 'success');
        setName('');
        setPrice('');
        setStock('');
        setImageUrl('');
        setIsAdding(false);
        fetchProducts();
      } else {
        toast(data.message || 'Failed to create product.', 'error');
      }
    } catch (err: any) {
      toast(err.message || 'An error occurred.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Read-Only Banner for Supervisor */}
      {isSupervisor && (
        <div className="bg-sky-50 border border-sky-200 text-sky-900 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold shadow-xs">
          <Eye className="h-5 w-5 text-sky-600 shrink-0" />
          <span>
            Supervisor Read-Only Mode: You have view access to analyze product catalog insights
            &amp; inventory metrics. Product editing and deletion are restricted to Admin and Owner
            roles.
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-navy flex items-center gap-2.5">
            <ShoppingBag className="h-7 w-7 text-navy" />
            Product Catalog Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real DB Catalog: Manage active listings, stock inventory levels, and publication
            statuses
          </p>
        </div>
        {!isSupervisor && (
          <Button
            className="rounded-full bg-navy hover:bg-navy-hover text-white text-xs font-extrabold gap-2 cursor-pointer shadow-md"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4 text-white" /> Add New Product
          </Button>
        )}
      </div>

      {/* Tabs & Filters Card */}
      <Card className="p-6 border-slate-200 shadow-sm rounded-3xl space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 max-w-full overflow-x-auto scrollbar-none">
          {[
            { id: 'ALL', label: 'All Products', count: counts.ALL },
            { id: 'active', label: 'Active', count: counts.active },
            { id: 'pending_approval', label: 'Pending Approval', count: counts.pending_approval },
            { id: 'draft', label: 'Drafts', count: counts.draft },
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
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer shrink-0 whitespace-nowrap ${
                  isActive
                    ? 'bg-navy border-navy text-white shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-navy hover:bg-slate-100'
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

        {/* Search & Category Filter Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              fetchProducts();
            }}
            className="flex gap-2 flex-1 max-w-md"
          >
            <div className="relative flex-1">
              <Input
                placeholder="Search by name, SKU, category, or shop..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-full text-xs pl-10"
              />
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            </div>
            <Button
              type="submit"
              size="sm"
              className="rounded-full bg-navy hover:bg-navy-hover text-white text-xs font-extrabold px-5 cursor-pointer"
            >
              Search
            </Button>
          </form>

          {/* Category Dropdown Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap hidden md:inline">
              Category:
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 outline-none hover:bg-white focus:border-navy cursor-pointer transition-colors max-w-xs truncate shadow-2xs"
            >
              <option value="ALL">All Categories</option>
              {flattenedCategories.map((opt: any) => (
                <option key={opt.id} value={opt.id}>
                  {opt.breadcrumb}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Table */}
        <div className="overflow-x-auto pt-2">
          {isLoading ? (
            <div className="p-12 text-center text-slate-600 flex items-center justify-center gap-2.5">
              <div className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin" />
              <span className="font-semibold text-sm">Loading live database products...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-800 text-sm">No products found in database.</p>
              <p className="text-xs text-slate-500">
                Click &quot;Add New Product&quot; to add a product to the catalog.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 uppercase text-slate-400 font-bold tracking-wider">
                  <th className="pb-3 font-semibold">Product Info</th>
                  <th className="pb-3 font-semibold">Shop / Boutique</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Price</th>
                  <th className="pb-3 font-semibold">Stock</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => {
                  const primaryImg =
                    product.images?.find((img: any) => img.isPrimary) || product.images?.[0];

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-400 select-none">
                            {primaryImg?.imageUrl ? (
                              <Image
                                src={primaryImg.imageUrl}
                                alt={product.name}
                                fill
                                className="object-cover select-none overflow-hidden [text-indent:-9999px]"
                              />
                            ) : (
                              <Tag className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 line-clamp-1">{product.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              SKU: {product.sku}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5">
                        <span className="font-bold text-navy block">
                          {product.shop?.name || 'Navya Store'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {product.shop?.owner?.name || 'Admin'}
                        </span>
                      </td>

                      <td className="py-3.5 font-medium text-slate-600">
                        {product.category?.name || 'Couture'}
                      </td>

                      <td className="py-3.5 font-extrabold text-emerald-700 font-mono">
                        ₹{Number(product.price || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 font-semibold text-slate-700">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-mono">
                          {product.stock} units
                        </span>
                      </td>

                      <td className="py-3.5">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full border uppercase ${
                            product.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : product.status === 'pending_approval'
                                ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                                : product.status === 'draft'
                                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {product.status}
                        </span>
                        {product.variants && product.variants.length > 0 ? (
                          <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 block mt-1 w-fit">
                            {product.variants.length} Variants
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Single Item
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full text-[11px] h-7 cursor-pointer"
                            onClick={() =>
                              alert(
                                `Product SKUs & Variants:\nParent SKU: ${product.sku}\nVariants:\n` +
                                  (product.variants
                                    ?.map(
                                      (v: any) =>
                                        `- ${v.name || 'Variant'}: ${v.sku} | Price: ₹${v.price} | Stock: ${v.stock}`,
                                    )
                                    .join('\n') || 'No variants'),
                              )
                            }
                            title="View Variant Details"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-600" /> Details
                          </Button>

                          {!isSupervisor && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full text-[11px] h-7 cursor-pointer text-navy border-navy/30 hover:bg-navy/5 font-bold"
                              onClick={() => {
                                setEditingProductCategory(product);
                                setTargetCategoryId(product.category?.id || 'cat_women_sarees');
                              }}
                              title="Move / Re-Categorize Product"
                            >
                              <FolderTree className="h-3.5 w-3.5 mr-1 text-[#F15A25]" /> Move
                              Category
                            </Button>
                          )}

                          {!isSupervisor && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full text-[11px] h-7 cursor-pointer"
                              onClick={() => handleToggleStatus(product.id, product.status)}
                            >
                              {product.status === 'active' ? 'Make Draft' : 'Publish Live'}
                            </Button>
                          )}

                          {/* DELETE Product Button: ONLY visible to OWNER */}
                          {isOwner && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-full text-rose-600 hover:text-rose-700 h-7 cursor-pointer"
                              onClick={() => handleDelete(product.id, product.name)}
                              title="Delete Product"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {pagination.pages > 1 && (
          <div className="p-4 bg-slate-100/90 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium rounded-b-2xl">
            <span>
              Page <strong className="text-navy">{page}</strong> of{' '}
              <strong className="text-navy">{pagination.pages}</strong> ({pagination.total} Total
              Catalog Items)
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
      </Card>

      {/* Move / Re-Categorize Product Drawer */}
      {!isSupervisor && editingProductCategory && (
        <Drawer
          open={Boolean(editingProductCategory)}
          onClose={() => {
            setEditingProductCategory(null);
            setCategoryModalSearch('');
          }}
          title={`Move Product: ${editingProductCategory.name}`}
          side="right"
        >
          <form onSubmit={handleMoveCategorySubmit} className="space-y-4 p-2 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <p className="font-bold text-slate-700">Current Category:</p>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy text-white text-xs font-black">
                <FolderTree className="h-3.5 w-3.5 text-[#F15A25]" />
                {editingProductCategory.category?.name || 'Unassigned'}
              </span>
            </div>

            {/* Quick search input */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Search Target Category</label>
              <Input
                placeholder="Type to filter e.g. Sarees, Shirts, Kurtas, T-Shirts, Lehengas..."
                value={categoryModalSearch}
                onChange={(e) => setCategoryModalSearch(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            {/* Target Category Select */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Select New Category / Sub-Category *
              </label>
              <select
                required
                value={targetCategoryId}
                onChange={(e) => setTargetCategoryId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 outline-none font-bold text-slate-800 bg-white"
                size={8}
              >
                {flattenedCategories
                  .filter((c: any) =>
                    categoryModalSearch
                      ? c.breadcrumb
                          .toLowerCase()
                          .includes(categoryModalSearch.toLowerCase().trim())
                      : true,
                  )
                  .map((opt: any) => (
                    <option
                      key={opt.id}
                      value={opt.id}
                      className="py-1.5 px-2 cursor-pointer font-medium"
                    >
                      {opt.breadcrumb}
                    </option>
                  ))}
              </select>
            </div>

            <Button
              type="submit"
              disabled={isMovingCategory}
              className="w-full rounded-full bg-navy hover:bg-navy-hover text-white text-xs font-extrabold mt-4 shadow-md cursor-pointer"
            >
              {isMovingCategory ? 'Moving Category...' : 'Confirm & Move Product'}
            </Button>
          </form>
        </Drawer>
      )}

      {/* Add Product Drawer */}
      {!isSupervisor && (
        <Drawer
          open={isAdding}
          onClose={() => setIsAdding(false)}
          title="Create New Product in Catalog"
          side="right"
        >
          <form onSubmit={handleAddProduct} className="space-y-4 p-2 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Product Title *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Royal Silk Handcrafted Saree"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Price (₹) *</label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                placeholder="4999"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Stock Quantity</label>
              <Input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="20"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Category &amp; Garment Type *
              </label>
              <select
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 outline-none font-semibold text-slate-700 bg-white"
              >
                {flattenedCategories.map((opt: any) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.breadcrumb}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Product Image URL</label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-navy hover:bg-navy-hover text-white text-xs font-extrabold mt-4 shadow-md cursor-pointer"
            >
              {isSubmitting ? 'Publishing...' : 'Save & Publish Product Live'}
            </Button>
          </form>
        </Drawer>
      )}
    </div>
  );
}
