'use client';

import { Layers, Plus, Search, Tag, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Drawer } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { useToast } from '@/providers';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/v1/admin/categories', window.location.origin);
      if (search) url.searchParams.set('q', search);

      const res = await fetch(url.toString());
      const data = await res.json();

      if (data.success) {
        setCategories(data.data || []);
      } else {
        toast(data.message || 'Failed to fetch categories.', 'error');
      }
    } catch (err: any) {
      console.error('Failed to fetch admin categories:', err);
    } finally {
      setIsLoading(false);
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

  const primaryCategories = categories.filter((c) => !c.parentId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-navy flex items-center gap-2.5">
            <Layers className="h-7 w-7 text-navy" />
            Category &amp; Garment Taxonomy
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real Database Categories synced with Homepage Explore &amp; Merchant Taxonomy
          </p>
        </div>
        <Button
          className="rounded-full bg-navy hover:bg-navy-hover text-white text-xs font-extrabold gap-2 cursor-pointer shadow-md"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="h-4 w-4 text-white" /> Add New Category
        </Button>
      </div>

      <Card className="p-6 border-slate-200 shadow-sm rounded-3xl space-y-4">
        {/* Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchCategories();
          }}
          className="flex gap-2 max-w-md"
        >
          <div className="relative flex-1 max-w-md">
            <Input
              placeholder="Search categories by name or slug..."
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

        {/* Table */}
        <div className="overflow-x-auto pt-2">
          {isLoading ? (
            <div className="p-12 text-center text-slate-600 flex items-center justify-center gap-2.5">
              <div className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin" />
              <span className="font-semibold text-sm">Loading live database categories...</span>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <Tag className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-800 text-sm">No categories found.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 uppercase text-slate-400 font-bold tracking-wider">
                  <th className="pb-3 font-semibold">Category Name</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Slug / Identifier</th>
                  <th className="pb-3 font-semibold">Live Active Products</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((category) => {
                  const isPrimary = !category.parentId;

                  return (
                    <tr key={category.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-navy shrink-0 font-bold text-xs">
                            {isPrimary ? '🏷️' : '✂️'}
                          </div>
                          <div>
                            <span
                              className={`font-bold text-slate-900 ${isPrimary ? 'text-sm text-navy' : ''}`}
                            >
                              {category.name}
                            </span>
                            {category.parent && (
                              <p className="text-[10px] text-slate-400">
                                Parent: {category.parent.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full border uppercase ${
                            isPrimary
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {isPrimary ? 'Primary Category' : 'Sub-Category'}
                        </span>
                      </td>

                      <td className="py-3.5 text-slate-500 font-mono text-[11px]">
                        {category.slug}
                      </td>

                      <td className="py-3.5">
                        <Badge
                          variant="secondary"
                          className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold px-3 py-1 text-xs"
                        >
                          {category._count?.products || 0} Products
                        </Badge>
                      </td>

                      <td className="py-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-full text-rose-600 hover:text-rose-700 h-7 cursor-pointer"
                          onClick={() => handleDelete(category.id, category.name)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Add Category Drawer */}
      <Drawer
        open={isAdding}
        onClose={() => setIsAdding(false)}
        title="Add New Category"
        side="right"
      >
        <form onSubmit={handleAdd} className="space-y-4 p-2 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Category Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Traditional Accessories"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Parent Category (Optional)
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 outline-none font-semibold text-slate-700 bg-white"
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
              placeholder="Brief overview of items in this category"
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-navy hover:bg-navy-hover text-white text-xs font-extrabold mt-4 shadow-md cursor-pointer"
          >
            {isSubmitting ? 'Saving...' : 'Save Category Live'}
          </Button>
        </form>
      </Drawer>
    </div>
  );
}
