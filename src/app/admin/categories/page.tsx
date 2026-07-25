'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CATEGORIES } from '@/features/categories/constants/category.constants';
import type { Category } from '@/features/categories/types/category.types';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const filtered = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = () => {
    if (!newName.trim()) return;
    const newCategory: Category = {
      id: `${Date.now()}`,
      name: newName.trim(),
      slug: newName.trim().toLowerCase().replace(/\s+/g, '-'),
      description: '',
      productCount: 0,
      accent: 'from-navy to-[#234b8f]',
    };
    setCategories((prev) => [...prev, newCategory]);
    setNewName('');
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-3xl text-navy">Categories</h1>
          <p className="text-sm text-slate-600 mt-1">Manage your product categories</p>
        </div>
        <Button className="rounded-full" onClick={() => setIsAdding(true)}>
          Add Category
        </Button>
      </div>

      <Card className="p-6">
        {isAdding && (
          <div className="mb-6 flex items-center gap-4">
            <Input
              placeholder="Category name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="max-w-md"
            />
            <Button className="rounded-full" onClick={handleAdd}>
              Save
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        )}

        <div className="flex items-center gap-4 mb-6">
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 font-semibold text-navy">Name</th>
                <th className="pb-3 font-semibold text-navy">Slug</th>
                <th className="pb-3 font-semibold text-navy">Products</th>
                <th className="pb-3 font-semibold text-navy text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((category) => (
                <tr key={category.id} className="hover:bg-slate-50">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-lg bg-gradient-to-br ${category.accent || 'from-navy to-[#234b8f]'}`}
                      />
                      <span className="font-semibold text-navy">{category.name}</span>
                    </div>
                  </td>
                  <td className="py-4 text-slate-600">{category.slug}</td>
                  <td className="py-4">
                    <Badge variant="secondary">{category.productCount || 0}</Badge>
                  </td>
                  <td className="py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-error hover:text-error"
                      onClick={() => handleDelete(category.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
