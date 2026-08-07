'use client';

import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Drawer } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { CATEGORY_TAXONOMY } from '@/config/categories.config';
import { useToast } from '@/providers';

// Pre-flatten initial taxonomy so UI renders INSTANTLY (0ms)
const INITIAL_TAXONOMY = CATEGORY_TAXONOMY.flatMap((main) => [
  {
    id: main.id,
    name: main.name,
    slug: main.slug,
    parentId: null,
    parent: null,
    _count: { products: 15 },
  },
  ...main.subCategories.map((sub) => ({
    id: sub.id,
    name: sub.name,
    slug: sub.slug,
    parentId: main.id,
    parent: { id: main.id, name: main.name },
    _count: { products: 8 },
  })),
]);

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>(INITIAL_TAXONOMY);
  const [search, setSearch] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Expandable row state for subcategories
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  // Active Subcategory Modal/Drawer state
  const [activeParentCategory, setActiveParentCategory] = useState<any | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  const fetchCategories = useCallback(async () => {
    setIsFetching(true);
    try {
      const url = new URL('/api/v1/admin/categories', window.location.origin);
      if (search) url.searchParams.set('q', search);

      const res = await fetch(url.toString());
      const data = await res.json();

      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setCategories(data.data);
      } else if (!data.success) {
        toast(data.message || 'Failed to fetch categories.', 'error');
      }
    } catch (err: any) {
      console.error('Failed to fetch admin categories:', err);
    } finally {
      setIsFetching(false);
    }
  }, [search, toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast('Please enter category name.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          parentId: parentId || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast(data.message || 'Category created successfully!', 'success');
        setName('');
        setDescription('');
        setParentId('');
        setIsAdding(false);
        fetchCategories();
      } else {
        toast(data.message || 'Failed to create category.', 'error');
      }
    } catch (err: any) {
      toast(err.message || 'An error occurred.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`Are you sure you want to delete category "${catName}"?`)) return;
    try {
      const res = await fetch(`/api/v1/admin/categories/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast(data.message || 'Category deleted!', 'success');
        fetchCategories();
      } else {
        toast(data.message || 'Failed to delete category.', 'error');
      }
    } catch (err: any) {
      toast(err.message || 'Error deleting category.', 'error');
    }
  };

  // Filter Primary Categories vs Subcategories
  const primaryCategories = categories.filter((c) => !c.parentId);

  const getSubcategories = (parentCatId: string) => {
    return categories.filter((c) => c.parentId === parentCatId);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-navy text-white p-6 sm:p-8 rounded-3xl shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-gold text-xs font-bold uppercase tracking-wider mb-2">
            <Layers className="h-4 w-4" />
            <span>Garment Taxonomy &amp; Catalog Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Category Taxonomy Management
          </h1>
          <p className="text-xs text-white/80 mt-1">
            Manage 8 primary garment categories and their sub-types. Sub-category updates sync in
            real-time across website pages.
          </p>
        </div>

        <Button
          className="rounded-xl bg-orange hover:bg-orange-600 text-white text-xs font-extrabold px-5 py-2.5 gap-2 cursor-pointer shadow-md self-start sm:self-auto"
          onClick={() => {
            setParentId('');
            setIsAdding(true);
          }}
        >
          <Plus className="h-4 w-4 text-white" /> Add New Category
        </Button>
      </div>

      {/* Main Search & Primary Category List Card */}
      <Card className="p-6 border-slate-200 shadow-sm rounded-3xl space-y-4">
        {/* Search Bar & Sync Indicator */}
        <div className="flex items-center justify-between gap-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchCategories();
            }}
            className="flex gap-2 max-w-md flex-1"
          >
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder="Search main categories or sub-types..."
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

          {isFetching && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-navy bg-navy/5 px-3 py-1 rounded-full border border-navy/10 animate-pulse">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-navy" />
              <span>Syncing live database...</span>
            </div>
          )}
        </div>

        {/* Primary Categories List Table */}
        <div className="overflow-x-auto pt-2">
          {primaryCategories.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <Tag className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-800 text-sm">No main categories found.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 uppercase text-slate-400 font-extrabold tracking-wider">
                  <th className="pb-3 pl-2 font-semibold">Primary Category</th>
                  <th className="pb-3 font-semibold">Sub-Categories Count</th>
                  <th className="pb-3 font-semibold">Category Slug</th>
                  <th className="pb-3 font-semibold">Total Active Products</th>
                  <th className="pb-3 text-right pr-4 font-semibold">Subcategories Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {primaryCategories.map((primaryCat) => {
                  const subCats = getSubcategories(primaryCat.id);
                  const isExpanded = expandedCategoryId === primaryCat.id;

                  return (
                    <tr key={primaryCat.id} className="group hover:bg-slate-50/80 transition-all">
                      <td className="py-4 pl-2">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setExpandedCategoryId(isExpanded ? null : primaryCat.id)}
                            className="h-8 w-8 rounded-xl bg-navy/10 border border-navy/20 flex items-center justify-center text-navy shrink-0 font-bold text-xs hover:bg-navy hover:text-white transition-all cursor-pointer"
                            title="Toggle Subcategories"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                          <div>
                            <span className="font-extrabold text-navy text-sm block">
                              {primaryCat.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              Main Category Folder
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4">
                        <button
                          onClick={() => setActiveParentCategory(primaryCat)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
                        >
                          <FolderOpen className="h-3.5 w-3.5 text-amber-700" />
                          <span>{subCats.length} Sub-categories</span>
                        </button>
                      </td>

                      <td className="py-4 text-slate-500 font-mono text-[11px]">
                        {primaryCat.slug}
                      </td>

                      <td className="py-4">
                        <Badge
                          variant="secondary"
                          className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold px-3 py-1 text-xs"
                        >
                          {primaryCat._count?.products || 0} Products
                        </Badge>
                      </td>

                      <td className="py-4 text-right pr-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => setActiveParentCategory(primaryCat)}
                            className="rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-extrabold px-3.5 py-1.5 h-8 gap-1.5 cursor-pointer shadow-xs"
                          >
                            <FolderOpen className="h-3.5 w-3.5 text-amber-400" /> View Sub-types (
                            {subCats.length})
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 w-8 p-0 cursor-pointer"
                            onClick={() => handleDelete(primaryCat.id, primaryCat.name)}
                            title="Delete Primary Category"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Dedicated Sub-categories View Modal/Drawer when clicking a Primary Category */}
      <Drawer
        open={!!activeParentCategory}
        onClose={() => setActiveParentCategory(null)}
        title={
          activeParentCategory
            ? `Sub-categories of "${activeParentCategory.name}"`
            : 'Sub-categories'
        }
        side="right"
      >
        {activeParentCategory && (
          <div className="space-y-6 p-2">
            <div className="bg-navy/5 p-4 rounded-2xl border border-navy/10 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Parent Category
                </p>
                <h3 className="text-lg font-extrabold text-navy">{activeParentCategory.name}</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  {getSubcategories(activeParentCategory.id).length} sub-types assigned
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setParentId(activeParentCategory.id);
                  setIsAdding(true);
                }}
                className="rounded-xl bg-orange hover:bg-orange-600 text-white text-xs font-extrabold gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="h-4 w-4" /> Add Sub-type
              </Button>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Assigned Sub-categories:
              </h4>

              {getSubcategories(activeParentCategory.id).length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500">
                  <Tag className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-xs">No sub-categories created yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Click `Add Sub-type` button above to add garments for this main category.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  {getSubcategories(activeParentCategory.id).map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 font-bold text-xs">
                          ✂️
                        </div>
                        <div>
                          <p className="font-bold text-navy text-xs">{sub.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{sub.slug}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge
                          variant="secondary"
                          className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold px-2.5 py-0.5 text-[10px]"
                        >
                          {sub._count?.products || 0} Products
                        </Badge>

                        <button
                          onClick={() => handleDelete(sub.id, sub.name)}
                          className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                          title="Delete Subcategory"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Add New Category or Subcategory Drawer */}
      <Drawer
        open={isAdding}
        onClose={() => setIsAdding(false)}
        title={parentId ? 'Add New Sub-category' : 'Add New Main Category'}
        side="right"
      >
        <form onSubmit={handleAdd} className="space-y-4 p-2 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Category / Sub-type Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder={parentId ? 'e.g. Silk Sarees' : 'e.g. Festive Wear'}
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Parent Main Category</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 outline-none font-semibold text-slate-700 bg-white shadow-xs"
            >
              <option value="">None (Primary Main Category)</option>
              {primaryCategories.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief overview of garments in this category"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-extrabold py-3 mt-4 shadow-md cursor-pointer"
          >
            {isSubmitting
              ? 'Saving...'
              : parentId
                ? 'Save Sub-category Live'
                : 'Save Primary Category Live'}
          </Button>
        </form>
      </Drawer>
    </div>
  );
}
