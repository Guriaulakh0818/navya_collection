/* eslint-disable @next/next/no-img-element */
'use client';

import {
  ArrowLeft,
  Boxes,
  CheckCircle2,
  Globe,
  HelpCircle,
  ImageIcon,
  Layers,
  Package,
  Percent,
  Plus,
  Save,
  Send,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  Truck,
  Upload,
  Video,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  CATEGORY_TAXONOMY,
  getFlattenedCategoryOptions,
  MainCategoryOption,
  SubCategoryOption,
} from '@/config/categories.config';
import {
  CATEGORY_ENGINE_TAXONOMY,
  resolveAttributeTemplate,
  resolveSizeSystem,
  SIZE_SYSTEMS,
} from '@/config/product-attribute-engine';
import { autoCategorizeProduct } from '@/shared/utils/auto-categorizer';

type ProductFormProps = {
  productId?: string;
  initialData?: any;
};

const COMMON_COLORS = [
  'Red',
  'Blue',
  'Black',
  'White',
  'Green',
  'Yellow',
  'Pink',
  'Maroon',
  'Gold',
  'Purple',
  'Navy Blue',
  'Beige',
  'Grey',
  'Orange',
  'Brown',
  'Multicolor',
];

type VariantMode = 'NONE' | 'SIZE_ONLY' | 'COLOR_ONLY' | 'SIZE_AND_COLOR';

export function SellerProductForm({ productId, initialData }: ProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingQueue, setUploadingQueue] = useState<
    { id: string; file: File; previewUrl: string }[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedMainCat, setSelectedMainCat] = useState<string>('group_women');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [categorySearch, setCategorySearch] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Multi-Category Selection State
  const initialCategoryIds: string[] = [];
  if (initialData?.categoryId) initialCategoryIds.push(initialData.categoryId);
  if (initialData?.category?.slug) initialCategoryIds.push(initialData.category.slug);
  if (initialData?.metaKeywords) {
    const parts = initialData.metaKeywords
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);
    parts.forEach((p: string) => {
      if (!initialCategoryIds.includes(p)) initialCategoryIds.push(p);
    });
  }

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    Array.from(new Set(initialCategoryIds.length > 0 ? initialCategoryIds : ['cat_women_sarees'])),
  );

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    brand: initialData?.brand || '',
    sku: initialData?.sku || '',
    barcode: initialData?.barcode || '',
    description: initialData?.description || '',
    videoUrl: initialData?.videoUrl || '',
    productType: initialData?.productType || '',
    price: initialData?.price ? Number(initialData.price) : 0,
    compareAtPrice: initialData?.compareAtPrice ? Number(initialData.compareAtPrice) : 0,
    costPrice: initialData?.costPrice ? Number(initialData.costPrice) : 0,
    taxGstRate: initialData?.taxGstRate ? Number(initialData.taxGstRate) : 5,
    hsnCode: initialData?.hsnCode || '6204',
    stock: initialData?.stock ? Number(initialData.stock) : 10,
    lowStockThreshold: initialData?.lowStockThreshold ? Number(initialData.lowStockThreshold) : 5,
    weight: initialData?.weight ? Number(initialData.weight) : 500,
    packageLength: initialData?.packageLength ? Number(initialData.packageLength) : 30,
    packageWidth: initialData?.packageWidth ? Number(initialData.packageWidth) : 25,
    packageHeight: initialData?.packageHeight ? Number(initialData.packageHeight) : 5,
    countryOfOrigin: initialData?.countryOfOrigin || 'India',
    manufacturerDetails:
      initialData?.manufacturerDetails || 'Navya Collection Artisan Partner, India',
    status: initialData?.status || 'active',
    categoryId: initialData?.categoryId || '',
    metaTitle: initialData?.metaTitle || '',
    metaDescription: initialData?.metaDescription || '',
    metaKeywords: initialData?.metaKeywords || '',
    focusKeyword: initialData?.focusKeyword || '',
    occasion: initialData?.occasion || '',
    color: initialData?.color || '',
    fabric: initialData?.fabric || '',
    fit: initialData?.fit || '',
    pattern: initialData?.pattern || '',
    sleeve: initialData?.sleeve || '',
    neck: initialData?.neck || '',
    attributes: initialData?.attributes || {},
    images: initialData?.images || [],
    variants: (initialData?.variants || []).map((v: any) => ({
      ...v,
      imageUrl: v.attributes?.imageUrl || v.imageUrl || v.image || '',
    })),
  });

  // Variant management state
  const initialVariants = initialData?.variants || [];
  let initialMode: VariantMode = 'NONE';
  if (initialVariants.length > 0) {
    const hasSize = initialVariants.some((v: any) => v.size && v.size !== '');
    const hasColor = initialVariants.some((v: any) => v.color && v.color !== '');
    if (hasSize && hasColor) initialMode = 'SIZE_AND_COLOR';
    else if (hasSize) initialMode = 'SIZE_ONLY';
    else if (hasColor) initialMode = 'COLOR_ONLY';
  }

  const [variantMode, setVariantMode] = useState<VariantMode>(initialMode);
  const [selectedColors, setSelectedColors] = useState<string[]>(
    Array.from(new Set(initialVariants.map((v: any) => v.color).filter(Boolean))),
  );
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    Array.from(new Set(initialVariants.map((v: any) => v.size).filter(Boolean))),
  );
  const [customColorInput, setCustomColorInput] = useState('');
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [variantUploadingIndex, setVariantUploadingIndex] = useState<number | null>(null);

  const allFlattenedCategories = getFlattenedCategoryOptions();

  // Active Category & Attribute Template Resolution
  const primaryCategoryId = selectedCategoryIds[0] || formData.categoryId || 'cat_women_sarees';
  const activeTemplate = useMemo(() => {
    return resolveAttributeTemplate(primaryCategoryId, formData.productType);
  }, [primaryCategoryId, formData.productType]);

  const activeSizeOptions = useMemo(() => {
    return resolveSizeSystem(primaryCategoryId, formData.productType);
  }, [primaryCategoryId, formData.productType]);

  // Live Auto-calculated Discount %
  const discountPercent = useMemo(() => {
    const mrp = Number(formData.compareAtPrice);
    const selling = Number(formData.price);
    if (mrp > 0 && mrp > selling) {
      return Math.round(((mrp - selling) / mrp) * 100);
    }
    return 0;
  }, [formData.compareAtPrice, formData.price]);

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

  const toggleCategory = (catId: string) => {
    setSelectedCategoryIds((prev) => {
      const next = prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId];
      if (next.length > 0) {
        setFormData((fd) => ({ ...fd, categoryId: next[0] }));
      } else {
        setFormData((fd) => ({ ...fd, categoryId: '' }));
      }
      return next;
    });
  };

  const removeCategory = (catId: string) => {
    setSelectedCategoryIds((prev) => {
      const next = prev.filter((id) => id !== catId);
      if (next.length > 0) {
        setFormData((fd) => ({ ...fd, categoryId: next[0] }));
      } else {
        setFormData((fd) => ({ ...fd, categoryId: '' }));
      }
      return next;
    });
  };

  const handleAutoDetectCategories = () => {
    if (!formData.name.trim()) {
      showToast('Please enter a Product Name first to auto-detect categories.', 'error');
      return;
    }
    const res = autoCategorizeProduct({
      name: formData.name,
      description: formData.description,
      price: Number(formData.price),
      compareAtPrice: formData.compareAtPrice ? Number(formData.compareAtPrice) : undefined,
      fabric: formData.fabric,
      occasion: formData.occasion,
    });
    setSelectedCategoryIds(res.categoryIds);
    if (res.categoryIds.length > 0) {
      setFormData((fd) => ({ ...fd, categoryId: res.categoryIds[0] }));
    }
    showToast(
      `⚡ Auto-detected ${res.categoryIds.length} categories (${res.matchedLabels.slice(0, 3).join(', ')}...)`,
      'success',
    );
  };

  const handleMainCategoryChange = (mainId: string) => {
    setSelectedMainCat(mainId);
    const found = CATEGORY_TAXONOMY.find((c) => c.id === mainId);
    if (found && found.sections.length > 0) {
      setSelectedSectionId(found.sections[0].id);
    }
  };

  const handleUploadMultipleImages = async (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    const newQueueItems = imageFiles.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setUploadingQueue((prev) => [...prev, ...newQueueItems]);

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

  // Upload photo specifically for a variant
  const handleVariantImageUpload = async (index: number, file: File) => {
    if (!file) return;
    setVariantUploadingIndex(index);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      const res = await fetch('/api/v1/upload?folder=seller_products', {
        method: 'POST',
        body: uploadData,
      });
      const data = await res.json();
      if (data.success && data.data?.secure_url) {
        const uploadedUrl = data.data.secure_url;
        const targetVariant = formData.variants[index];
        const targetColor = targetVariant?.color;

        setFormData((prev) => {
          const updatedVariants = prev.variants.map((v: any, i: number) => {
            if (i === index) return { ...v, imageUrl: uploadedUrl };
            if (targetColor && v.color === targetColor && !v.imageUrl) {
              return { ...v, imageUrl: uploadedUrl };
            }
            return v;
          });

          const hasInGallery = prev.images.some((img: any) => img.imageUrl === uploadedUrl);
          const updatedImages = hasInGallery
            ? prev.images
            : [...prev.images, { imageUrl: uploadedUrl, isPrimary: prev.images.length === 0 }];

          return {
            ...prev,
            variants: updatedVariants,
            images: updatedImages,
          };
        });

        showToast('Variant photo uploaded successfully!', 'success');
      } else {
        showToast(data.message || 'Failed to upload variant image', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to upload variant photo', 'error');
    } finally {
      setVariantUploadingIndex(null);
    }
  };

  const handleAssignGalleryImageToVariant = (index: number, imageUrl: string) => {
    const targetVariant = formData.variants[index];
    const targetColor = targetVariant?.color;

    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((v: any, i: number) => {
        if (i === index) return { ...v, imageUrl };
        if (targetColor && v.color === targetColor && !v.imageUrl) {
          return { ...v, imageUrl };
        }
        return v;
      }),
    }));
  };

  const handleApplyImageToAllColorVariants = (color: string, imageUrl: string) => {
    if (!color || !imageUrl) return;
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((v: any) => (v.color === color ? { ...v, imageUrl } : v)),
    }));
    showToast(`Applied photo to all ${color} variants!`, 'success');
  };

  // Re-build variant combinations
  const rebuildVariants = (
    mode: VariantMode,
    colors: string[],
    sizes: string[],
    basePrice: number,
    baseStock: number,
  ) => {
    if (mode === 'NONE') {
      setFormData((prev) => ({ ...prev, variants: [] }));
      return;
    }

    const newVariants: any[] = [];

    if (mode === 'SIZE_ONLY') {
      sizes.forEach((sz) => {
        const existing = formData.variants.find((v: any) => v.size === sz && !v.color);
        newVariants.push({
          size: sz,
          color: '',
          price: existing?.price ?? basePrice ?? 0,
          stock: existing?.stock ?? baseStock ?? 10,
          sku: existing?.sku || '',
          imageUrl: existing?.imageUrl || '',
        });
      });
    } else if (mode === 'COLOR_ONLY') {
      colors.forEach((clr) => {
        const existing = formData.variants.find((v: any) => v.color === clr && !v.size);
        newVariants.push({
          size: '',
          color: clr,
          price: existing?.price ?? basePrice ?? 0,
          stock: existing?.stock ?? baseStock ?? 10,
          sku: existing?.sku || '',
          imageUrl: existing?.imageUrl || '',
        });
      });
    } else if (mode === 'SIZE_AND_COLOR') {
      colors.forEach((clr) => {
        const colorExisting = formData.variants.find((v: any) => v.color === clr && v.imageUrl);
        sizes.forEach((sz) => {
          const existing = formData.variants.find((v: any) => v.color === clr && v.size === sz);
          newVariants.push({
            size: sz,
            color: clr,
            price: existing?.price ?? basePrice ?? 0,
            stock: existing?.stock ?? baseStock ?? 10,
            sku: existing?.sku || '',
            imageUrl: existing?.imageUrl || colorExisting?.imageUrl || '',
          });
        });
      });
    }

    const totalStock = newVariants.reduce((sum, v) => sum + Number(v.stock || 0), 0);

    setFormData((prev) => ({
      ...prev,
      variants: newVariants,
      stock: totalStock > 0 ? totalStock : prev.stock,
    }));
  };

  const handleToggleColor = (color: string) => {
    const updated = selectedColors.includes(color)
      ? selectedColors.filter((c) => c !== color)
      : [...selectedColors, color];
    setSelectedColors(updated);
    rebuildVariants(variantMode, updated, selectedSizes, formData.price, formData.stock);
  };

  const handleToggleSize = (size: string) => {
    const updated = selectedSizes.includes(size)
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size];
    setSelectedSizes(updated);
    rebuildVariants(variantMode, selectedColors, updated, formData.price, formData.stock);
  };

  const handleAddCustomColor = () => {
    if (!customColorInput.trim()) return;
    const clean = customColorInput.trim();
    if (!selectedColors.includes(clean)) {
      const updated = [...selectedColors, clean];
      setSelectedColors(updated);
      rebuildVariants(variantMode, updated, selectedSizes, formData.price, formData.stock);
    }
    setCustomColorInput('');
  };

  const handleAddCustomSize = () => {
    if (!customSizeInput.trim()) return;
    const clean = customSizeInput.trim();
    if (!selectedSizes.includes(clean)) {
      const updated = [...selectedSizes, clean];
      setSelectedSizes(updated);
      rebuildVariants(variantMode, selectedColors, updated, formData.price, formData.stock);
    }
    setCustomSizeInput('');
  };

  const handleVariantModeChange = (mode: VariantMode) => {
    setVariantMode(mode);
    rebuildVariants(mode, selectedColors, selectedSizes, formData.price, formData.stock);
  };

  const handleRemoveVariantRow = (index: number) => {
    const updated = formData.variants.filter((_: any, i: number) => i !== index);
    const totalStock = updated.reduce((sum: number, v: any) => sum + Number(v.stock || 0), 0);
    setFormData((prev) => ({
      ...prev,
      variants: updated,
      stock: totalStock,
    }));
  };

  const handleDynamicAttributeChange = (id: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [id]: value,
      attributes: {
        ...prev.attributes,
        [id]: value,
      },
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent,
    explicitStatus?: 'draft' | 'pending_approval' | 'active',
  ) => {
    e.preventDefault();
    const effectiveCategoryId = selectedCategoryIds[0] || formData.categoryId;
    if (!formData.name || !effectiveCategoryId) {
      showToast('Please fill in mandatory fields: Product Name & Category.', 'error');
      return;
    }

    if (formData.images.length === 0) {
      showToast('Please upload at least 1 product image.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = productId
        ? `/api/v1/seller/products/${productId}`
        : '/api/v1/seller/products';
      const method = productId ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        status: explicitStatus || formData.status,
        categoryId: effectiveCategoryId,
        categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : [effectiveCategoryId],
        price: Number(formData.price),
        compareAtPrice: formData.compareAtPrice ? Number(formData.compareAtPrice) : undefined,
        costPrice: formData.costPrice ? Number(formData.costPrice) : undefined,
        stock: Number(formData.stock),
      };

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  // Group dynamic attributes by group
  const groupedAttributes = useMemo(() => {
    const groups: Record<string, any[]> = {
      'Styling & Fit': [],
      'Fabric & Material': [],
      'Details & Work': [],
      Specifications: [],
      'Care & Details': [],
    };

    activeTemplate.attributes.forEach((attr) => {
      const grp = attr.group || 'Styling & Fit';
      if (!groups[grp]) groups[grp] = [];
      groups[grp].push(attr);
    });

    return groups;
  }, [activeTemplate]);

  return (
    <form
      onSubmit={(e) => handleSubmit(e, 'pending_approval')}
      className="space-y-8 max-w-6xl mx-auto pb-16"
    >
      {/* Header & Sticky Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs sticky top-4 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/seller/products"
            className="p-2 text-slate-500 hover:text-navy hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-navy tracking-tight">
              {productId ? 'Edit Product' : 'Add New Product'}
            </h1>
            <p className="text-xs text-slate-500">
              Template: <strong className="text-amber-700">{activeTemplate.name}</strong> • Size
              System:{' '}
              <span className="font-mono text-slate-700 font-bold">
                {SIZE_SYSTEMS[activeTemplate.sizeSystemId]?.name}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={(e) => handleSubmit(e, 'draft')}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
          >
            <Save className="w-4 h-4" /> Save as Draft
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-navy hover:bg-navy-hover text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            {isSubmitting ? (
              <span>Saving...</span>
            ) : (
              <>
                <Send className="w-4 h-4 text-amber-400" /> Submit for Approval
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast Alert */}
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

      {/* SECTION 1: COMMON PRODUCT INFORMATION */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-navy flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-600" /> Section 1: Common Product Information
          </h2>
          <span className="text-[11px] font-bold text-slate-400">Step 1 of 5</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div className="md:col-span-2">
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Product Name / Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Royal Blue Banarasi Silk Saree with Gold Zari Border"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:border-navy focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Brand Name
            </label>
            <input
              type="text"
              placeholder="e.g. Navya Couture, Boutique Edition, Self Manufactured"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:border-navy focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Product Type / Specific Category
            </label>
            <select
              value={formData.productType || activeTemplate.id}
              onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:border-navy focus:bg-white focus:outline-none transition-all cursor-pointer"
            >
              {CATEGORY_ENGINE_TAXONOMY.map((dept) => (
                <optgroup key={dept.id} label={`── ${dept.name.toUpperCase()} ──`}>
                  {dept.subCategories.map((sub) =>
                    sub.productTypes.map((pt) => (
                      <option key={pt.id} value={pt.id}>
                        {dept.name} ▸ {sub.name} ▸ {pt.name}
                      </option>
                    )),
                  )}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Multi-Category Assignment Component */}
          <div className="md:col-span-2 space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <label className="block font-extrabold text-slate-800 uppercase tracking-wider text-xs">
                  Category Mapping & Visibility <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  Select all categories where this product should appear in store filters.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAutoDetectCategories}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-[11px] rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" /> Auto-Detect Categories
              </button>
            </div>

            {/* Selected Category Tags Chips */}
            <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-white rounded-xl border border-slate-200">
              {selectedCategoryIds.length === 0 ? (
                <span className="text-slate-400 text-[11px] italic">
                  No categories selected yet.
                </span>
              ) : (
                selectedCategoryIds.map((catId) => {
                  const item = allFlattenedCategories.find((c: any) => c.id === catId);
                  return (
                    <span
                      key={catId}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-navy/5 text-navy font-bold text-[11px] rounded-lg border border-navy/10 shadow-2xs"
                    >
                      {item ? `${item.mainGroupName} ▸ ${item.name}` : catId}
                      <button
                        type="button"
                        onClick={() => removeCategory(catId)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })
              )}
            </div>

            {/* Category Browser Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {CATEGORY_TAXONOMY.map((mainCat) => (
                <button
                  key={mainCat.id}
                  type="button"
                  onClick={() => handleMainCategoryChange(mainCat.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                    selectedMainCat === mainCat.id
                      ? 'bg-navy text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {mainCat.name}
                </button>
              ))}
            </div>

            {/* Subcategory Checkbox Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 bg-white p-3 rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
              {allFlattenedCategories
                .filter((c: any) => c.mainGroupId === selectedMainCat)
                .map((cat: any) => {
                  const isChecked = selectedCategoryIds.includes(cat.id);
                  return (
                    <label
                      key={cat.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-navy bg-navy/5 text-navy font-bold'
                          : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCategory(cat.id)}
                        className="rounded text-navy focus:ring-navy h-3.5 w-3.5"
                      />
                      <span className="truncate">{cat.name}</span>
                    </label>
                  );
                })}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Product Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe the fabric, craftsmanship, wash care instructions, stitching details and styling tips..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 font-medium focus:border-navy focus:bg-white focus:outline-none transition-all leading-relaxed"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-rose-500" /> Product Video URL (Optional)
            </label>
            <input
              type="url"
              placeholder="e.g. https://youtu.be/xxx or Cloudinary video link"
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:border-navy focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Search Tags / Keywords (Comma Separated)
            </label>
            <input
              type="text"
              placeholder="e.g. banarasi saree, silk saree, wedding wear, zari work"
              value={formData.metaKeywords}
              onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:border-navy focus:bg-white focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Product Images Drag & Drop Gallery */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-xs">
              Product Images Gallery <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-500 font-medium">
              {formData.images.length} photos uploaded (Click star to set main display photo)
            </span>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.length)
                handleUploadMultipleImages(Array.from(e.dataTransfer.files));
            }}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              isDragging
                ? 'border-navy bg-navy/5'
                : 'border-slate-300 bg-slate-50 hover:bg-slate-100/50'
            }`}
          >
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">
              Drag & drop high-resolution product photos here
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Supports JPG, PNG, WebP up to 10MB each
            </p>
            <label className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-navy hover:bg-navy-hover text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-all">
              Browse Files
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.length)
                    handleUploadMultipleImages(Array.from(e.target.files));
                }}
                className="hidden"
              />
            </label>
          </div>

          {/* Uploading Queue Progress */}
          {uploadingQueue.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {uploadingQueue.map((q) => (
                <div
                  key={q.id}
                  className="relative aspect-3/4 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center"
                >
                  <img
                    src={q.previewUrl}
                    alt="Uploading"
                    className="w-full h-full object-cover opacity-50"
                  />
                  <span className="absolute text-[10px] font-bold text-navy bg-white/90 px-2 py-0.5 rounded-full shadow-xs">
                    Uploading...
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Uploaded Gallery Grid */}
          {formData.images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
              {formData.images.map((img: any, idx: number) => (
                <div
                  key={idx}
                  className={`group relative aspect-3/4 rounded-2xl overflow-hidden border-2 transition-all bg-white shadow-xs ${
                    img.isPrimary
                      ? 'border-amber-500 ring-2 ring-amber-500/20'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <img
                    src={img.imageUrl}
                    alt={`Product ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {img.isPrimary && (
                    <span className="absolute top-2 left-2 bg-amber-500 text-slate-950 font-black text-[9px] uppercase px-2 py-0.5 rounded-full shadow-xs">
                      Main Photo
                    </span>
                  )}
                  <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!img.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryImage(idx)}
                        className="p-1.5 bg-white text-navy hover:text-amber-600 rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                        title="Set as Main Photo"
                      >
                        ★
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="p-1.5 bg-rose-600 text-white rounded-lg text-xs shadow-xs hover:bg-rose-700 cursor-pointer"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: DYNAMIC CATEGORY ATTRIBUTES ENGINE */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-navy flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" /> Section 2: Dynamic Category Attributes
            </h2>
            <p className="text-[11px] text-slate-500">
              Active Category Template:{' '}
              <strong className="text-amber-700">{activeTemplate.name}</strong>
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-400">Step 2 of 5</span>
        </div>

        <div className="space-y-6 text-xs">
          {Object.entries(groupedAttributes).map(([groupTitle, attributes]) => {
            if (attributes.length === 0) return null;
            return (
              <div
                key={groupTitle}
                className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-200"
              >
                <h3 className="font-extrabold uppercase tracking-wider text-[11px] text-navy">
                  {groupTitle}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {attributes.map((attr) => {
                    const currentValue =
                      (formData as any)[attr.id] || formData.attributes?.[attr.id] || '';

                    return (
                      <div key={attr.id} className="space-y-1">
                        <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                          {attr.label} {attr.required && <span className="text-rose-500">*</span>}
                        </label>

                        {attr.type === 'select' && attr.options ? (
                          <select
                            value={currentValue}
                            onChange={(e) => handleDynamicAttributeChange(attr.id, e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-navy focus:outline-none transition-all cursor-pointer"
                          >
                            <option value="">Select {attr.label}...</option>
                            {attr.options.map((opt: string) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder={attr.placeholder || `Enter ${attr.label}...`}
                            value={currentValue}
                            onChange={(e) => handleDynamicAttributeChange(attr.id, e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-navy focus:outline-none transition-all"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: PRICING, TAXATION & INVENTORY */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-navy flex items-center gap-2">
            <Percent className="w-4 h-4 text-amber-600" /> Section 3: Pricing, GST Taxation &
            Inventory
          </h2>
          <span className="text-[11px] font-bold text-slate-400">Step 3 of 5</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200 space-y-1">
            <label className="block font-bold text-amber-950 uppercase tracking-wider text-[10px]">
              Selling Price (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              min={1}
              placeholder="e.g. 1499"
              value={formData.price || ''}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-navy font-mono font-extrabold text-base focus:outline-none"
            />
            <p className="text-[10px] text-amber-800">Final price customer pays</p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Maximum Retail Price (MRP)
            </label>
            <input
              type="number"
              placeholder="e.g. 2999"
              value={formData.compareAtPrice || ''}
              onChange={(e) => setFormData({ ...formData, compareAtPrice: Number(e.target.value) })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-mono font-bold text-base focus:outline-none"
            />
            {discountPercent > 0 ? (
              <p className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                ⚡ {discountPercent}% OFF Customer Savings
              </p>
            ) : (
              <p className="text-[10px] text-slate-400">Printed tag MRP</p>
            )}
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Cost Price (Private Seller Only)
            </label>
            <input
              type="number"
              placeholder="e.g. 750"
              value={formData.costPrice || ''}
              onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-600 font-mono font-medium text-sm focus:outline-none"
            />
            <p className="text-[10px] text-slate-400">Used for your profit calculations</p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              GST Rate & HSN Code
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={formData.taxGstRate}
                onChange={(e) => setFormData({ ...formData, taxGstRate: Number(e.target.value) })}
                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-slate-800 font-bold focus:outline-none"
              >
                <option value={0}>0% GST</option>
                <option value={5}>5% GST (Apparel)</option>
                <option value={12}>12% GST</option>
                <option value={18}>18% GST</option>
              </select>
              <input
                type="text"
                placeholder="HSN (6204)"
                value={formData.hsnCode}
                onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-slate-800 font-mono text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1 sm:col-span-2">
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Total Stock Quantity
            </label>
            <input
              type="number"
              min={0}
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-navy font-mono font-bold focus:outline-none"
            />
            <p className="text-[10px] text-slate-500">
              {formData.variants.length > 0
                ? `⚡ Auto-calculated from sum of variant stocks (${formData.stock} units)`
                : 'Direct stock count for standalone item'}
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1 sm:col-span-2">
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Low Stock Alert Threshold
            </label>
            <input
              type="number"
              min={1}
              value={formData.lowStockThreshold}
              onChange={(e) =>
                setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })
              }
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:outline-none"
            />
            <p className="text-[10px] text-slate-500">
              Triggers &quot;Only {formData.lowStockThreshold} left in stock!&quot; badge for
              buyers.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 4: SHIPPING & PACKAGE SPECIFICATIONS */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-navy flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-600" /> Section 4: Shipping & Packaging
            Specifications
          </h2>
          <span className="text-[11px] font-bold text-slate-400">Step 4 of 5</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[10px]">
              Dead Weight (Grams) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              placeholder="e.g. 450"
              value={formData.weight || ''}
              onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-mono font-bold focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[10px]">
              Package Length (cm)
            </label>
            <input
              type="number"
              placeholder="e.g. 30"
              value={formData.packageLength || ''}
              onChange={(e) => setFormData({ ...formData, packageLength: Number(e.target.value) })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-mono focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[10px]">
              Package Width (cm)
            </label>
            <input
              type="number"
              placeholder="e.g. 25"
              value={formData.packageWidth || ''}
              onChange={(e) => setFormData({ ...formData, packageWidth: Number(e.target.value) })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-mono focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[10px]">
              Package Height (cm)
            </label>
            <input
              type="number"
              placeholder="e.g. 5"
              value={formData.packageHeight || ''}
              onChange={(e) => setFormData({ ...formData, packageHeight: Number(e.target.value) })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-mono focus:bg-white focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[10px]">
              Country of Origin
            </label>
            <input
              type="text"
              value={formData.countryOfOrigin}
              onChange={(e) => setFormData({ ...formData, countryOfOrigin: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[10px]">
              Manufacturer / Packer Details
            </label>
            <input
              type="text"
              value={formData.manufacturerDetails}
              onChange={(e) => setFormData({ ...formData, manufacturerDetails: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* SECTION 5: COLOR-FIRST PRODUCT VARIANT SYSTEM */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-navy flex items-center gap-2">
              <Boxes className="w-4 h-4 text-amber-600" /> Section 5: Dynamic Product Variant Matrix
            </h2>
            <p className="text-[11px] text-slate-500">
              Color-first grouped matrix with variant-specific photos and category sizes (
              {SIZE_SYSTEMS[activeTemplate.sizeSystemId]?.name}).
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-400">Step 5 of 5</span>
        </div>

        {/* Variant Mode Selection */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {[
            { id: 'NONE', label: 'Single Product (No Variants)' },
            { id: 'SIZE_ONLY', label: 'Size Only Variants' },
            { id: 'COLOR_ONLY', label: 'Color Only Variants' },
            { id: 'SIZE_AND_COLOR', label: 'Color + Size Matrix' },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => handleVariantModeChange(mode.id as VariantMode)}
              className={`p-3 rounded-2xl border text-left font-bold transition-all cursor-pointer ${
                variantMode === mode.id
                  ? 'border-navy bg-navy text-white shadow-xs ring-2 ring-navy/20'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{mode.label}</span>
                {variantMode === mode.id && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
              </div>
            </button>
          ))}
        </div>

        {variantMode !== 'NONE' && (
          <div className="space-y-6 pt-2">
            {/* 1. Color Picker (for Color & Matrix modes) */}
            {(variantMode === 'COLOR_ONLY' || variantMode === 'SIZE_AND_COLOR') && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="block font-bold text-navy uppercase tracking-wider text-xs">
                  Step 1: Select Available Colors
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_COLORS.map((clr) => {
                    const isSelected = selectedColors.includes(clr);
                    return (
                      <button
                        key={clr}
                        type="button"
                        onClick={() => handleToggleColor(clr)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-navy text-white shadow-xs ring-2 ring-navy/20'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {clr} {isSelected ? '✓' : '+'}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Add custom color (e.g. Rust Orange, Teal Green)"
                    value={customColorInput}
                    onChange={(e) => setCustomColorInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && (e.preventDefault(), handleAddCustomColor())
                    }
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-medium focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomColor}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Add Color
                  </button>
                </div>
              </div>
            )}

            {/* 2. Category Dynamic Size Picker */}
            {(variantMode === 'SIZE_ONLY' || variantMode === 'SIZE_AND_COLOR') && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-navy uppercase tracking-wider text-xs">
                    Step 2: Select Available Sizes (
                    {SIZE_SYSTEMS[activeTemplate.sizeSystemId]?.name})
                  </label>
                  <span className="text-[11px] text-amber-800 font-bold">
                    System: {activeTemplate.sizeSystemId}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {activeSizeOptions.map((sz) => {
                    const isSelected = selectedSizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => handleToggleSize(sz)}
                        className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 shadow-xs ring-2 ring-amber-500/20 font-black'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {sz} {isSelected ? '✓' : '+'}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Custom size (e.g. Free Size, Plus 46)"
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && (e.preventDefault(), handleAddCustomSize())
                    }
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-medium focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSize}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Add Size
                  </button>
                </div>
              </div>
            )}

            {/* 3. Generated Variant Matrix Table */}
            {formData.variants.length > 0 && (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Color Photo</th>
                      {(variantMode === 'COLOR_ONLY' || variantMode === 'SIZE_AND_COLOR') && (
                        <th className="p-3">Color</th>
                      )}
                      {(variantMode === 'SIZE_ONLY' || variantMode === 'SIZE_AND_COLOR') && (
                        <th className="p-3">Size</th>
                      )}
                      <th className="p-3">Price (₹)</th>
                      <th className="p-3">Stock Units</th>
                      <th className="p-3">Auto SKU</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {formData.variants.map((v: any, idx: number) => {
                      const isUploadingThis = variantUploadingIndex === idx;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {v.imageUrl ? (
                                <div className="relative w-12 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                                  <img
                                    src={v.imageUrl}
                                    alt="Variant"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-14 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                  <ImageIcon className="w-5 h-5 opacity-40" />
                                </div>
                              )}

                              <div className="flex flex-col gap-1">
                                <label className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-navy border border-slate-200 rounded-lg text-[10px] font-bold cursor-pointer transition-colors shadow-2xs">
                                  {isUploadingThis ? (
                                    <span>Uploading...</span>
                                  ) : (
                                    <>
                                      <Upload className="w-3 h-3 text-amber-600" />
                                      <span>{v.imageUrl ? 'Change' : 'Upload'}</span>
                                    </>
                                  )}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    disabled={isUploadingThis}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleVariantImageUpload(idx, file);
                                    }}
                                    className="hidden"
                                  />
                                </label>

                                {formData.images.length > 0 && !v.imageUrl && (
                                  <select
                                    defaultValue=""
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        handleAssignGalleryImageToVariant(idx, e.target.value);
                                        e.target.value = '';
                                      }
                                    }}
                                    className="text-[9px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded px-1 py-0.5 max-w-[90px] outline-none cursor-pointer"
                                  >
                                    <option value="" disabled>
                                      From Gallery ▾
                                    </option>
                                    {formData.images.map((img: any, iIdx: number) => (
                                      <option key={iIdx} value={img.imageUrl}>
                                        Photo {iIdx + 1} {img.isPrimary ? '(Main)' : ''}
                                      </option>
                                    ))}
                                  </select>
                                )}

                                {v.color && v.imageUrl && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleApplyImageToAllColorVariants(v.color, v.imageUrl)
                                    }
                                    className="text-[9px] font-bold text-amber-700 hover:text-amber-900 underline text-left cursor-pointer"
                                  >
                                    Apply to all {v.color}
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>

                          {(variantMode === 'COLOR_ONLY' || variantMode === 'SIZE_AND_COLOR') && (
                            <td className="p-3 font-bold text-navy">{v.color || '-'}</td>
                          )}
                          {(variantMode === 'SIZE_ONLY' || variantMode === 'SIZE_AND_COLOR') && (
                            <td className="p-3 font-bold text-slate-800">{v.size || '-'}</td>
                          )}
                          <td className="p-3">
                            <input
                              type="number"
                              min={1}
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
                              className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-navy font-mono font-bold focus:border-navy focus:bg-white focus:outline-none"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              min={0}
                              value={v.stock}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 0;
                                setFormData((prev) => {
                                  const newVariants = prev.variants.map(
                                    (varItem: any, i: number) =>
                                      i === idx ? { ...varItem, stock: val } : varItem,
                                  );
                                  const total = newVariants.reduce(
                                    (sum: number, item: any) => sum + Number(item.stock || 0),
                                    0,
                                  );
                                  return {
                                    ...prev,
                                    variants: newVariants,
                                    stock: total,
                                  };
                                });
                              }}
                              className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono font-bold focus:border-navy focus:bg-white focus:outline-none"
                            />
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-500 uppercase">
                            {v.sku ||
                              `NVC-${(v.color || 'CLR').substring(0, 3).toUpperCase()}-${v.size || 'V'}`}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveVariantRow(idx)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 6: ENTERPRISE SEO SEARCH ENGINE METADATA */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-navy flex items-center gap-2">
          <Globe className="w-4 h-4 text-navy" /> Section 6: Enterprise SEO & Search Engine Keywords
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
