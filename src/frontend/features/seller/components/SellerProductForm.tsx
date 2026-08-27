/* eslint-disable @next/next/no-img-element */
'use client';

import {
  ArrowLeft,
  CheckCircle2,
  Globe,
  ImageIcon,
  Layers,
  Plus,
  Save,
  ShoppingBag,
  Tag,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  CATEGORY_TAXONOMY,
  MainCategoryOption,
  SubCategoryOption,
} from '@/config/categories.config';

type ProductFormProps = {
  productId?: string;
  initialData?: any;
};

const AVAILABLE_SIZES = ['Free Size', 'S', 'M', 'L', 'XL', 'XXL', 'Custom Stitching'];

export function SellerProductForm({ productId, initialData }: ProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingQueue, setUploadingQueue] = useState<
    { id: string; file: File; previewUrl: string }[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedMainCat, setSelectedMainCat] = useState<string>('cat_women');
  const [subCategories, setSubCategories] = useState<SubCategoryOption[]>(
    CATEGORY_TAXONOMY[0].subCategories,
  );
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleMainCategoryChange = (mainId: string) => {
    setSelectedMainCat(mainId);
    const found = CATEGORY_TAXONOMY.find((c: MainCategoryOption) => c.id === mainId);
    const subs = found?.subCategories || [];
    setSubCategories(subs);
    if (subs.length > 0) {
      setFormData((prev) => ({ ...prev, categoryId: subs[0].id }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadMultipleImages(Array.from(e.dataTransfer.files));
    }
  };

  const handleUploadMultipleImages = async (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    // Generate local preview items immediately for visual loading feedback
    const newQueueItems = imageFiles.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setUploadingQueue((prev) => [...prev, ...newQueueItems]);

    // Process all images in parallel
    await Promise.all(
      newQueueItems.map(async (item) => {
        try {
          const uploadFormData = new FormData();
          uploadFormData.append('file', item.file);

          const res = await fetch('/api/v1/upload?folder=seller_products', {
            method: 'POST',
            body: uploadFormData,
          });

          const data = await res.json();
          if (!data.success || !data.data?.[0]?.secureUrl) {
            throw new Error(data.message || `Failed to upload ${item.file.name}`);
          }

          const uploadRes = data.data[0];
          const secureUrl = uploadRes.secureUrl;

          setFormData((prev) => {
            const isFirstImage = prev.images.length === 0;
            return {
              ...prev,
              images: [
                ...prev.images,
                {
                  imageUrl: secureUrl,
                  publicId: uploadRes.publicId,
                  isPrimary: isFirstImage,
                  sortOrder: prev.images.length,
                },
              ],
            };
          });

          showToast(`Uploaded "${item.file.name}" successfully!`, 'success');
        } catch (err: any) {
          showToast(err.message || `Error uploading ${item.file.name}`, 'error');
        } finally {
          URL.revokeObjectURL(item.previewUrl);
          setUploadingQueue((prev) => prev.filter((q) => q.id !== item.id));
        }
      }),
    );
  };

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    sku: initialData?.sku || '',
    barcode: initialData?.barcode || '',
    description: initialData?.description || '',
    price: initialData?.price ? Number(initialData.price) : 0,
    compareAtPrice: initialData?.compareAtPrice ? Number(initialData.compareAtPrice) : 0,
    costPrice: initialData?.costPrice ? Number(initialData.costPrice) : 0,
    stock: initialData?.stock ? Number(initialData.stock) : 0,
    status: initialData?.status || 'active',
    categoryId: initialData?.categoryId || '',
    metaTitle: initialData?.metaTitle || '',
    metaDescription: initialData?.metaDescription || '',
    metaKeywords: initialData?.metaKeywords || '',
    focusKeyword: initialData?.focusKeyword || '',
    occasion: initialData?.occasion || '',
    color: initialData?.color || '',
    fabric: initialData?.fabric || '',
    work: initialData?.work || '',
    images: initialData?.images || [],
    variants: initialData?.variants || [],
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/v1/categories');
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setCategories(data.data);
          setFormData((prev) =>
            prev.categoryId ? prev : { ...prev, categoryId: data.data[0].id },
          );
        }
      } catch (err: any) {
        console.error('Failed to fetch categories:', err);
      }
    };

    fetchCategories();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => {
      const newImages = prev.images.filter((_: any, i: number) => i !== index);
      if (newImages.length > 0 && !newImages.some((img: any) => img.isPrimary)) {
        newImages[0].isPrimary = true;
      }
      return { ...prev, images: newImages };
    });
  };

  const handleSetPrimaryImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img: any, i: number) => ({
        ...img,
        isPrimary: i === index,
      })),
    }));
  };

  const handleGenerateVariants = (size: string, colorParam?: string) => {
    const color = colorParam || formData.color || 'Standard';
    const cleanSize = size.replace(/\s+/g, '');
    const variantSku = `${formData.sku || 'SKU'}-${cleanSize}-${color.toUpperCase().substring(0, 3)}`;
    const exists = formData.variants.some((v: any) => v.size === size && v.color === color);

    if (exists) {
      showToast(`Variant for Size "${size}" and Color "${color}" already exists.`, 'error');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          sku: variantSku,
          size,
          color,
          price: prev.price || 0,
          stock: prev.stock || 0,
        },
      ],
    }));
    showToast(`Added variant: Size ${size}`, 'success');
  };

  const handleRemoveVariant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_: any, i: number) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku || !formData.categoryId) {
      showToast('Please fill in all mandatory fields (Name, SKU, Category).', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const method = productId ? 'PUT' : 'POST';
      const endpoint = productId
        ? `/api/v1/seller/products/${productId}`
        : '/api/v1/seller/products';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Product saved successfully!', 'success');
        setTimeout(() => {
          router.push('/seller/products');
        }, 1500);
      } else {
        showToast(data.message || 'Failed to save product.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'An error occurred while saving product.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
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

      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-navy" />
            {productId ? 'Edit Product Listing' : 'Create New Boutique Product'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure product details, Cloudinary images, Size/Color variants, stock inventory, and
            SEO.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-navy hover:bg-navy/90 text-white font-bold text-xs rounded-xl shadow-md shadow-navy/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {isSubmitting
            ? 'Saving Product...'
            : productId
              ? 'Update Product ✓'
              : 'Publish Product ✓'}
        </button>
      </div>

      {/* SECTION 1: BASIC INFORMATION & CATEGORY */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-navy flex items-center gap-2">
          <Tag className="w-4 h-4 text-navy" /> Section 1: Basic Information & Category
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Product Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Royal Banarasi Silk Zari Saree"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-navy focus:bg-white focus:outline-none font-bold transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Product SKU (Unique ID) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. NAV-BS-001"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-mono uppercase focus:border-navy focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Barcode / HSN Code (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 52083100"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-mono focus:border-navy focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
              Primary Category *
            </label>
            <select
              value={selectedMainCat}
              onChange={(e) => handleMainCategoryChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-navy focus:bg-white focus:outline-none transition-all cursor-pointer font-extrabold"
            >
              {CATEGORY_TAXONOMY.map((main: MainCategoryOption) => (
                <option key={main.id} value={main.id}>
                  {main.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
              Garment Type / Sub-Category *
            </label>
            <select
              required
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-navy focus:bg-white focus:outline-none transition-all cursor-pointer font-bold"
            >
              <option value="">Select Sub-Category / Garment Type</option>
              {categories.length > 0
                ? categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))
                : subCategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Publication Status *
            </label>
            <select
              value={formData.status}
              onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-navy focus:bg-white focus:outline-none transition-all cursor-pointer font-medium"
            >
              <option value="active">Active (Published)</option>
              <option value="draft">Draft (Private)</option>
              <option value="pending_approval">Pending Admin Approval</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Detailed Description *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Hand-woven pure Banarasi silk saree with gold zari embroidery work."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-navy focus:bg-white focus:outline-none transition-all font-normal"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: PRICING & STOCK */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-navy flex items-center gap-2">
          <Tag className="w-4 h-4 text-amber-600" /> Section 2: Pricing & Inventory Stock
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs items-end">
          <div className="flex flex-col justify-between">
            <label className="flex text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 min-h-[32px] items-end">
              Selling Price (₹) *
            </label>
            <input
              type="number"
              required
              min={1}
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-emerald-700 font-extrabold font-mono focus:border-amber-500 focus:bg-white focus:outline-none transition-all shadow-xs"
            />
          </div>

          <div className="flex flex-col justify-between">
            <label className="flex text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 min-h-[32px] items-end">
              MRP / Compare Price (₹)
            </label>
            <input
              type="number"
              value={formData.compareAtPrice}
              onChange={(e) =>
                setFormData({ ...formData, compareAtPrice: parseFloat(e.target.value) || 0 })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-mono font-bold focus:border-amber-500 focus:bg-white focus:outline-none transition-all shadow-xs"
            />
          </div>

          <div className="flex flex-col justify-between">
            <label className="flex text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 min-h-[32px] items-end">
              Cost Price per Item (₹)
            </label>
            <input
              type="number"
              value={formData.costPrice}
              onChange={(e) =>
                setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-mono font-bold focus:border-amber-500 focus:bg-white focus:outline-none transition-all shadow-xs"
            />
          </div>

          <div className="flex flex-col justify-between">
            <label className="flex text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 min-h-[32px] items-end">
              Base Inventory Stock *
            </label>
            <input
              type="number"
              required
              min={0}
              value={formData.stock}
              onChange={(e) =>
                setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-navy font-mono font-extrabold focus:border-amber-500 focus:bg-white focus:outline-none transition-all shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: CLOUDINARY MULTI-IMAGE GALLERY */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-navy flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-navy" /> Section 3: Cloudinary Product Gallery
          </h2>
          <label className="px-4 py-2 bg-navy hover:bg-navy/90 text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-md shadow-navy/20">
            <Upload className="w-4 h-4" />
            {uploadingQueue.length > 0
              ? `Uploading (${uploadingQueue.length})...`
              : 'Upload Images'}
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  handleUploadMultipleImages(Array.from(e.target.files));
                }
              }}
            />
          </label>
        </div>

        {/* Interactive Drag & Drop Box */}
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`block p-8 text-center rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
            isDragging
              ? 'border-navy bg-navy/10 ring-4 ring-navy/20 scale-[0.99]'
              : 'border-slate-300 bg-slate-50 hover:bg-slate-100/80 hover:border-navy/50'
          }`}
        >
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                handleUploadMultipleImages(Array.from(e.target.files));
              }
            }}
          />

          {formData.images.length === 0 && uploadingQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-4">
              <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-navy mb-1">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-extrabold text-slate-900">
                Drag & drop product images here, or{' '}
                <span className="text-navy underline">browse files</span>
              </p>
              <p className="text-xs text-slate-500">
                Supports JPEG, PNG, WEBP high-resolution boutique photos (Drag or select multiple
                files)
              </p>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5">
                <Upload className="w-4 h-4 text-navy" />
                {uploadingQueue.length > 0
                  ? `Uploading ${uploadingQueue.length} photo(s)... Drop more anytime!`
                  : 'Drag & drop more images here or click to add files'}
              </p>
            </div>
          )}
        </label>

        {/* Image Grid: Uploaded Images + Live Uploading Queue Skeletons */}
        {(formData.images.length > 0 || uploadingQueue.length > 0) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            {/* Uploaded Images */}
            {formData.images.map((img: any, idx: number) => (
              <div
                key={idx}
                className={`relative aspect-[3/4] bg-slate-100 border rounded-xl overflow-hidden group transition-all ${
                  img.isPrimary ? 'border-navy ring-2 ring-navy/30' : 'border-slate-200'
                }`}
              >
                <img
                  src={img.imageUrl}
                  alt=""
                  className="w-full h-full object-cover select-none overflow-hidden [text-indent:-9999px]"
                />

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-between p-3 transition-all">
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="p-1.5 bg-rose-600 text-white rounded-lg self-end cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetPrimaryImage(idx)}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                      img.isPrimary
                        ? 'bg-navy text-white border-navy'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-navy'
                    }`}
                  >
                    {img.isPrimary ? 'Primary Image ✓' : 'Set as Primary'}
                  </button>
                </div>
              </div>
            ))}

            {/* Live Uploading Queue Skeleton Cards */}
            {uploadingQueue.map((item) => (
              <div
                key={item.id}
                className="relative aspect-[3/4] bg-slate-100 border-2 border-dashed border-navy/40 rounded-xl overflow-hidden shadow-sm animate-pulse select-none"
              >
                <img
                  src={item.previewUrl}
                  alt=""
                  className="w-full h-full object-cover opacity-50 blur-[1px] select-none overflow-hidden [text-indent:-9999px]"
                />

                <div className="absolute inset-0 bg-navy/30 backdrop-blur-[2px] flex flex-col items-center justify-center p-3 text-center">
                  <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin mb-2 shadow-md" />
                  <span className="text-[10px] font-extrabold text-navy bg-white px-2.5 py-1 rounded-full shadow-xs truncate max-w-[95%]">
                    Uploading...
                  </span>
                  <span className="text-[9px] text-white truncate max-w-[90%] mt-1 font-mono font-medium drop-shadow-sm">
                    {item.file.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 4: SIZE & COLOR VARIANTS MATRIX */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-navy flex items-center gap-2">
          <Layers className="w-4 h-4 text-navy" /> Section 4: Size & Color Variant Matrix
        </h2>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
          <span className="font-semibold text-slate-700 block">Quick Variant Generator:</span>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_SIZES.map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => handleGenerateVariants(sz, formData.color)}
                className="px-3 py-1.5 bg-white hover:bg-navy hover:text-white text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                + Add Size {sz}
              </button>
            ))}
          </div>
        </div>

        {formData.variants.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-xs font-medium">
            No variants created. Single variant product will use base price & stock.
          </div>
        ) : (
          <div className="space-y-3">
            {formData.variants.map((v: any, idx: number) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="font-bold text-navy">Size: {v.size || 'Free Size'}</span>

                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 font-medium">Color:</span>
                    <input
                      type="text"
                      value={v.color || ''}
                      placeholder="e.g. Red, Gold"
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          variants: prev.variants.map((varItem: any, i: number) =>
                            i === idx ? { ...varItem, color: val } : varItem,
                          ),
                        }));
                      }}
                      className="w-24 bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 font-medium text-xs focus:border-navy focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 font-medium">SKU:</span>
                    <input
                      type="text"
                      value={v.sku || ''}
                      placeholder="e.g. NAV-FS-RED"
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setFormData((prev) => ({
                          ...prev,
                          variants: prev.variants.map((varItem: any, i: number) =>
                            i === idx ? { ...varItem, sku: val } : varItem,
                          ),
                        }));
                      }}
                      className="w-36 bg-white border border-slate-200 rounded px-2 py-1 text-slate-900 font-mono font-bold text-xs uppercase focus:border-navy focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 font-medium">Price: ₹</span>
                    <input
                      type="number"
                      value={v.price}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setFormData((prev) => ({
                          ...prev,
                          variants: prev.variants.map((varItem: any, i: number) =>
                            i === idx ? { ...varItem, price: val } : varItem,
                          ),
                        }));
                      }}
                      className="w-20 bg-white border border-slate-200 rounded px-2 py-1 text-emerald-600 font-mono font-bold text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 font-medium">Stock:</span>
                    <input
                      type="number"
                      value={v.stock}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        setFormData((prev) => ({
                          ...prev,
                          variants: prev.variants.map((varItem: any, i: number) =>
                            i === idx ? { ...varItem, stock: val } : varItem,
                          ),
                        }));
                      }}
                      className="w-16 bg-white border border-slate-200 rounded px-2 py-1 text-slate-900 font-mono font-bold text-xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(idx)}
                    className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 5: ENTERPRISE SEO SEARCH ENGINE METADATA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-navy flex items-center gap-2">
          <Globe className="w-4 h-4 text-navy" /> Section 5: Enterprise SEO & Search Engine Keywords
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              SEO Meta Title
            </label>
            <input
              type="text"
              placeholder="e.g. Royal Banarasi Silk Saree | Navya Collection"
              value={formData.metaTitle}
              onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-navy focus:bg-white focus:outline-none transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Primary Focus Keyword
            </label>
            <input
              type="text"
              placeholder="e.g. Pure Banarasi Silk Saree"
              value={formData.focusKeyword}
              onChange={(e) => setFormData({ ...formData, focusKeyword: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-navy focus:bg-white focus:outline-none transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              SEO Target Keywords (Comma Separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Banarasi Saree, Silk Saree, Bridal Ethnic Wear, Designer Suit"
              value={formData.metaKeywords}
              onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-navy focus:bg-white focus:outline-none transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Product Tags / Occasion Labels
            </label>
            <input
              type="text"
              placeholder="e.g. Wedding, Festive, Party Wear, Traditional"
              value={formData.occasion}
              onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-navy focus:bg-white focus:outline-none transition-all font-medium"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              SEO Meta Description
            </label>
            <textarea
              rows={2}
              placeholder="Handcrafted pure Banarasi silk saree with gold embroidery. Free shipping across India."
              value={formData.metaDescription}
              onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-navy focus:bg-white focus:outline-none transition-all font-medium"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
