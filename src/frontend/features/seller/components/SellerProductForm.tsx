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
  RotateCcw,
  Send,
  ShieldCheck,
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

import { CommissionService } from '@/backend/services/commission.service';
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
import { AiStudioEnhancerModal } from '@/frontend/features/seller/components/AiStudioEnhancerModal';
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

const COLOR_HEX_MAP: Record<string, string> = {
  Red: '#ef4444',
  Blue: '#3b82f6',
  Black: '#1e293b',
  White: '#f8fafc',
  Green: '#22c55e',
  Yellow: '#eab308',
  Pink: '#ec4899',
  Maroon: '#881337',
  Gold: '#d97706',
  Purple: '#a855f7',
  'Navy Blue': '#1e3a8a',
  Beige: '#d4b996',
  Grey: '#64748b',
  Orange: '#f97316',
  Brown: '#78350f',
  Multicolor: '#6366f1',
};

type VariantMode = 'NONE' | 'SIZE_ONLY' | 'COLOR_ONLY' | 'SIZE_AND_COLOR';

/**
 * Automatically compresses an image file on the client before upload.
 * Reduces 5MB-15MB DSLR / Phone camera photos to ~300KB-500KB WebP,
 * ensuring fast uploads and never exceeding Vercel's 4.5MB request limit.
 */
async function compressImageFile(file: File, maxDim = 1500, quality = 0.8): Promise<File> {
  if (typeof window === 'undefined' || !file || !file.type.startsWith('image/')) {
    return file;
  }
  // If file is already small (under 750KB), no need to compress
  if (file.size <= 750 * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          if (file.size > 3.8 * 1024 * 1024) {
            reject(
              new Error(
                `Photo "${file.name}" is too large and cannot be processed by browser canvas.`,
              ),
            );
            return;
          }
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              if (file.size > 3.8 * 1024 * 1024) {
                reject(new Error(`Photo "${file.name}" is too large to upload.`));
                return;
              }
              resolve(file);
              return;
            }
            const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
            const compressedFile = new File([blob], cleanName, {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/webp',
          quality,
        );
      };
      img.onerror = () => {
        if (file.size > 3.8 * 1024 * 1024) {
          reject(new Error(`Photo "${file.name}" exceeds allowed 4MB upload size.`));
        } else {
          resolve(file);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      if (file.size > 3.8 * 1024 * 1024) {
        reject(new Error(`Photo "${file.name}" exceeds allowed 4MB upload size.`));
      } else {
        resolve(file);
      }
    };
    reader.readAsDataURL(file);
  });
}

export function SellerProductForm({ productId, initialData }: ProductFormProps) {
  const router = useRouter();
  const [isLoadingProduct, setIsLoadingProduct] = useState(Boolean(productId && !initialData));
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

  // AI Studio Photo Enhancer (Powered by Bria AI)
  const [isAiStudioModalOpen, setIsAiStudioModalOpen] = useState(false);
  const [aiStudioTargetUrl, setAiStudioTargetUrl] = useState<string | undefined>(undefined);

  const handleOpenAiStudioModal = (imageUrl?: string) => {
    setAiStudioTargetUrl(imageUrl);
    setIsAiStudioModalOpen(true);
  };

  const handleApplyStudioEnhancedPhoto = async (file: File) => {
    await handleUploadMultipleImages([file]);
    showToast('✨ Studio photo uploaded and added to gallery!', 'success');
  };

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
    manufacturerDetails: initialData?.manufacturerDetails || 'JiivaaKart Artisan Partner, India',
    status: initialData?.status || 'active',
    returnPolicyType: initialData?.returnPolicyType || 'RETURN_AND_REPLACEMENT',
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
    images: (initialData?.images || []).map((img: any, idx: number) => ({
      ...img,
      imageUrl:
        typeof img === 'string' ? img : (img.imageUrl || img.secureUrl || img.url || '').trim(),
      isPrimary: Boolean(img.isPrimary !== undefined ? img.isPrimary : idx === 0),
      sortOrder: img.sortOrder ?? idx,
    })),
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
  const [colorPhotos, setColorPhotos] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    (initialVariants || []).forEach((v: any) => {
      const img = v.attributes?.imageUrl || v.imageUrl || v.image;
      if (v.color && img && !initial[v.color]) {
        initial[v.color] = img;
      }
    });
    return initial;
  });
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    Array.from(new Set(initialVariants.map((v: any) => v.size).filter(Boolean))),
  );
  const [customColorInput, setCustomColorInput] = useState('');
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [variantUploadingIndex, setVariantUploadingIndex] = useState<number | null>(null);
  const [colorUploading, setColorUploading] = useState<string | null>(null);

  const allFlattenedCategories = getFlattenedCategoryOptions();

  // Active Category & Attribute Template Resolution
  const primaryCategoryId = selectedCategoryIds[0] || formData.categoryId || 'cat_women_sarees';
  const activeTemplate = useMemo(() => {
    return resolveAttributeTemplate(primaryCategoryId, formData.productType);
  }, [primaryCategoryId, formData.productType]);

  const activeSizeOptions = useMemo(() => {
    return resolveSizeSystem(primaryCategoryId, formData.productType);
  }, [primaryCategoryId, formData.productType]);

  // Derive initial department and subcategory from activeTemplate
  const currentHierarchy = useMemo(() => {
    for (const dept of CATEGORY_ENGINE_TAXONOMY) {
      for (const sub of dept.subCategories) {
        if (sub.productTypes.some((pt) => pt.id === activeTemplate.id)) {
          return { deptId: dept.id, subId: sub.id };
        }
      }
    }
    return {
      deptId: CATEGORY_ENGINE_TAXONOMY[0].id,
      subId: CATEGORY_ENGINE_TAXONOMY[0].subCategories[0].id,
    };
  }, [activeTemplate.id]);

  const [activeDeptId, setActiveDeptId] = useState<string>(currentHierarchy.deptId);
  const [activeSubId, setActiveSubId] = useState<string>(currentHierarchy.subId);

  useEffect(() => {
    setActiveDeptId(currentHierarchy.deptId);
    setActiveSubId(currentHierarchy.subId);
  }, [currentHierarchy.deptId, currentHierarchy.subId]);

  const currentDepartmentDef = useMemo(() => {
    return (
      CATEGORY_ENGINE_TAXONOMY.find((d) => d.id === activeDeptId) || CATEGORY_ENGINE_TAXONOMY[0]
    );
  }, [activeDeptId]);

  const currentSubCategoryDef = useMemo(() => {
    return (
      currentDepartmentDef.subCategories.find((s) => s.id === activeSubId) ||
      currentDepartmentDef.subCategories[0]
    );
  }, [currentDepartmentDef, activeSubId]);

  const handleProductTypeChange = (newPtId: string, silent = false) => {
    const targetTemplate = resolveAttributeTemplate(undefined, newPtId);
    const targetSizes = resolveSizeSystem(undefined, newPtId);

    setFormData((prev) => ({
      ...prev,
      productType: newPtId,
    }));

    // Auto sync with main category & subcategories
    const matchingCat = allFlattenedCategories.find(
      (c: any) =>
        c.id.toLowerCase() === `cat_${newPtId}` ||
        c.id.toLowerCase().includes(newPtId.replace(/^(men_|women_|kids_)/, '')) ||
        newPtId.includes(c.id.replace('cat_', '')),
    );
    if (matchingCat) {
      setSelectedCategoryIds((prev) => Array.from(new Set([matchingCat.id, ...prev])));
      setFormData((prev) => ({ ...prev, categoryId: matchingCat.id }));
    }

    // Refresh selected sizes to align with newly selected category's size system
    setSelectedSizes((prev) => {
      return prev.filter((sz) => targetSizes.includes(sz));
    });

    if (!silent) {
      showToast(`Attribute Template loaded: ${targetTemplate.name}`, 'success');
    }
  };

  // Live Pricing Floors & Auto-calculated Discount %
  const pricingFloors = useMemo(() => {
    const mrp = Number(formData.compareAtPrice);
    if (mrp > 0) {
      return CommissionService.calculatePricingFloors(mrp);
    }
    return null;
  }, [formData.compareAtPrice]);

  const discountDetails = useMemo(() => {
    const mrp = Number(formData.compareAtPrice);
    const selling = Number(formData.price);
    if (mrp > 0 && selling > 0 && mrp >= selling) {
      const disc = CommissionService.calculateDiscount(mrp, selling);
      const isIntegerPercent = disc.discountPercent % 1 === 0;
      const formattedPercent = isIntegerPercent
        ? `${disc.discountPercent}%`
        : `${disc.discountPercent.toFixed(2)}%`;
      return {
        ...disc,
        formattedPercent,
      };
    }
    return null;
  }, [formData.compareAtPrice, formData.price]);

  const discountPercent = discountDetails ? discountDetails.displayDiscountPercent : 0;

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

  // Sync form state when initialData is provided (e.g. from Server Component)
  useEffect(() => {
    if (!initialData) return;
    const loadedVariants = (initialData.variants || []).map((v: any) => ({
      ...v,
      imageUrl: v.imageUrl || (v.attributes as any)?.imageUrl || v.image || '',
    }));

    const inferredProductType =
      initialData.productType ||
      initialData.attributes?.productType ||
      resolveAttributeTemplate(initialData.categoryId, undefined).id;

    setFormData((prev) => ({
      ...prev,
      name: initialData.name || '',
      brand: initialData.brand || '',
      sku: initialData.sku || '',
      barcode: initialData.barcode || '',
      description: initialData.description || '',
      videoUrl: initialData.videoUrl || '',
      productType: inferredProductType,
      price: Number(initialData.price || 0),
      compareAtPrice: initialData.compareAtPrice ? Number(initialData.compareAtPrice) : 0,
      costPrice: initialData.costPrice ? Number(initialData.costPrice) : 0,
      taxGstRate: initialData.taxGstRate
        ? Number(initialData.taxGstRate)
        : initialData.taxRate
          ? Number(initialData.taxRate)
          : 5,
      hsnCode: initialData.hsnCode || '6204',
      stock: Number(initialData.stock || 0),
      lowStockThreshold: Number(initialData.lowStockThreshold || 5),
      weight: initialData.weight ? Number(initialData.weight) : 500,
      packageLength: initialData.packageLength ? Number(initialData.packageLength) : 30,
      packageWidth: initialData.packageWidth ? Number(initialData.packageWidth) : 25,
      packageHeight: initialData.packageHeight ? Number(initialData.packageHeight) : 5,
      countryOfOrigin: initialData.countryOfOrigin || 'India',
      manufacturerDetails: initialData.manufacturerDetails || 'JiivaaKart Artisan Partner, India',
      status: initialData.status || 'active',
      returnPolicyType: initialData.returnPolicyType || 'RETURN_AND_REPLACEMENT',
      categoryId: initialData.categoryId || '',
      metaTitle: initialData.metaTitle || '',
      metaDescription: initialData.metaDescription || '',
      metaKeywords: initialData.metaKeywords || '',
      focusKeyword: initialData.focusKeyword || '',
      occasion: initialData.occasion || initialData.attributes?.occasion || '',
      color: initialData.color || '',
      fabric: initialData.fabric || initialData.attributes?.fabric || '',
      fit: initialData.fit || initialData.attributes?.fit || '',
      pattern: initialData.pattern || initialData.attributes?.pattern || '',
      sleeve: initialData.sleeve || initialData.attributes?.sleeve || '',
      neck: initialData.neck || initialData.attributes?.neck || '',
      attributes: initialData.attributes || {},
      images: (initialData.images || []).map((img: any, idx: number) => ({
        ...img,
        imageUrl:
          typeof img === 'string' ? img : (img.imageUrl || img.secureUrl || img.url || '').trim(),
        isPrimary: Boolean(img.isPrimary !== undefined ? img.isPrimary : idx === 0),
        sortOrder: img.sortOrder ?? idx,
      })),
      variants: loadedVariants,
    }));

    const catIds: string[] = [];
    if (initialData.categoryId) catIds.push(initialData.categoryId);
    if (initialData.category?.slug) catIds.push(initialData.category.slug);
    if (initialData.metaKeywords) {
      const parts = initialData.metaKeywords
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
      parts.forEach((p: string) => {
        if (!catIds.includes(p)) catIds.push(p);
      });
    }
    if (catIds.length > 0) {
      setSelectedCategoryIds(Array.from(new Set(catIds)));
    }

    if (loadedVariants.length > 0) {
      const hasSize = loadedVariants.some((v: any) => v.size && v.size !== '');
      const hasColor = loadedVariants.some((v: any) => v.color && v.color !== '');
      if (hasSize && hasColor) setVariantMode('SIZE_AND_COLOR');
      else if (hasSize) setVariantMode('SIZE_ONLY');
      else if (hasColor) setVariantMode('COLOR_ONLY');

      setSelectedColors(
        Array.from(new Set(loadedVariants.map((v: any) => v.color).filter(Boolean))),
      );
      setSelectedSizes(Array.from(new Set(loadedVariants.map((v: any) => v.size).filter(Boolean))));
      const loadedColorPhotos: Record<string, string> = {};
      loadedVariants.forEach((v: any) => {
        if (v.color && v.imageUrl && !loadedColorPhotos[v.color]) {
          loadedColorPhotos[v.color] = v.imageUrl;
        }
      });
      setColorPhotos(loadedColorPhotos);
    }
    setIsLoadingProduct(false);
  }, [initialData]);

  // Fetch product data if editing an existing product and initialData was not provided
  useEffect(() => {
    if (!productId || initialData) return;
    const fetchProductDetails = async () => {
      setIsLoadingProduct(true);
      try {
        const res = await fetch(`/api/v1/seller/products/${productId}`);
        const data = await res.json();
        if (data.success && data.data) {
          const prod = data.data;
          const loadedVariants = (prod.variants || []).map((v: any) => ({
            ...v,
            imageUrl: v.imageUrl || (v.attributes as any)?.imageUrl || v.image || '',
          }));

          const inferredProductType =
            prod.productType ||
            prod.attributes?.productType ||
            resolveAttributeTemplate(prod.categoryId, undefined).id;

          setFormData((prev) => ({
            ...prev,
            name: prod.name || '',
            brand: prod.brand || '',
            sku: prod.sku || '',
            barcode: prod.barcode || '',
            description: prod.description || '',
            videoUrl: prod.videoUrl || '',
            productType: inferredProductType,
            price: Number(prod.price || 0),
            compareAtPrice: prod.compareAtPrice ? Number(prod.compareAtPrice) : 0,
            costPrice: prod.costPrice ? Number(prod.costPrice) : 0,
            taxGstRate: prod.taxGstRate
              ? Number(prod.taxGstRate)
              : prod.taxRate
                ? Number(prod.taxRate)
                : 5,
            hsnCode: prod.hsnCode || '6204',
            stock: Number(prod.stock || 0),
            lowStockThreshold: Number(prod.lowStockThreshold || 5),
            weight: prod.weight ? Number(prod.weight) : 500,
            packageLength: prod.packageLength ? Number(prod.packageLength) : 30,
            packageWidth: prod.packageWidth ? Number(prod.packageWidth) : 25,
            packageHeight: prod.packageHeight ? Number(prod.packageHeight) : 5,
            countryOfOrigin: prod.countryOfOrigin || 'India',
            manufacturerDetails: prod.manufacturerDetails || 'JiivaaKart Artisan Partner, India',
            status: prod.status || 'active',
            returnPolicyType: prod.returnPolicyType || 'RETURN_AND_REPLACEMENT',
            categoryId: prod.categoryId || '',
            metaTitle: prod.metaTitle || '',
            metaDescription: prod.metaDescription || '',
            metaKeywords: prod.metaKeywords || '',
            focusKeyword: prod.focusKeyword || '',
            occasion: prod.occasion || prod.attributes?.occasion || '',
            color: prod.color || '',
            fabric: prod.fabric || prod.attributes?.fabric || '',
            fit: prod.fit || prod.attributes?.fit || '',
            pattern: prod.pattern || prod.attributes?.pattern || '',
            sleeve: prod.sleeve || prod.attributes?.sleeve || '',
            neck: prod.neck || prod.attributes?.neck || '',
            attributes: prod.attributes || {},
            images: (prod.images || []).map((img: any, idx: number) => ({
              ...img,
              imageUrl:
                typeof img === 'string'
                  ? img
                  : (img.imageUrl || img.secureUrl || img.url || '').trim(),
              isPrimary: Boolean(img.isPrimary !== undefined ? img.isPrimary : idx === 0),
              sortOrder: img.sortOrder ?? idx,
            })),
            variants: loadedVariants,
          }));

          const catIds: string[] = [];
          if (prod.categoryId) catIds.push(prod.categoryId);
          if (prod.category?.slug) catIds.push(prod.category.slug);
          if (prod.metaKeywords) {
            const parts = prod.metaKeywords
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean);
            parts.forEach((p: string) => {
              if (!catIds.includes(p)) catIds.push(p);
            });
          }
          if (catIds.length > 0) {
            setSelectedCategoryIds(Array.from(new Set(catIds)));
          }

          if (loadedVariants.length > 0) {
            const hasSize = loadedVariants.some((v: any) => v.size && v.size !== '');
            const hasColor = loadedVariants.some((v: any) => v.color && v.color !== '');
            if (hasSize && hasColor) setVariantMode('SIZE_AND_COLOR');
            else if (hasSize) setVariantMode('SIZE_ONLY');
            else if (hasColor) setVariantMode('COLOR_ONLY');

            setSelectedColors(
              Array.from(new Set(loadedVariants.map((v: any) => v.color).filter(Boolean))),
            );
            setSelectedSizes(
              Array.from(new Set(loadedVariants.map((v: any) => v.size).filter(Boolean))),
            );
            const loadedColorPhotos: Record<string, string> = {};
            loadedVariants.forEach((v: any) => {
              if (v.color && v.imageUrl && !loadedColorPhotos[v.color]) {
                loadedColorPhotos[v.color] = v.imageUrl;
              }
            });
            setColorPhotos(loadedColorPhotos);
          }
        } else {
          showToast(data.message || 'Could not load product details.', 'error');
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
        showToast('Failed to load product details.', 'error');
      } finally {
        setIsLoadingProduct(false);
      }
    };
    fetchProductDetails();
  }, [productId, initialData]);

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
      if (typeof document !== 'undefined') {
        const titleInput = document.querySelector<HTMLInputElement>(
          'input[placeholder*="Royal Blue"]',
        );
        titleInput?.focus();
      }
      return;
    }

    // Determine user's active department choice:
    let userSelectedGender: 'men' | 'women' | 'kids' = 'women';
    if (activeDeptId === 'dept_men' || selectedMainCat === 'group_men') {
      userSelectedGender = 'men';
    } else if (activeDeptId === 'dept_kids' || selectedMainCat === 'group_kids') {
      userSelectedGender = 'kids';
    } else {
      userSelectedGender = 'women';
    }

    const res = autoCategorizeProduct({
      name: formData.name,
      description: formData.description,
      price: Number(formData.price),
      compareAtPrice: formData.compareAtPrice ? Number(formData.compareAtPrice) : undefined,
      fabric: formData.fabric,
      occasion: formData.occasion,
      gender: userSelectedGender,
    });

    // 1. Assign auto-detected categories
    setSelectedCategoryIds(res.categoryIds);
    if (res.categoryIds.length > 0) {
      setFormData((fd) => ({ ...fd, categoryId: res.primaryCategoryId || res.categoryIds[0] }));
    }

    // 2. Synchronize Department Tab in Category Mapping Browser so seller sees checked items
    const deptGroup =
      res.departmentGroup ||
      (userSelectedGender === 'men'
        ? 'group_men'
        : userSelectedGender === 'kids'
          ? 'group_kids'
          : 'group_women');
    setSelectedMainCat(deptGroup);
    const found = CATEGORY_TAXONOMY.find((c) => c.id === deptGroup);
    if (found && found.sections.length > 0) {
      setSelectedSectionId(found.sections[0].id);
    }

    // Synchronize Step 1 Department in Category Engine
    if (deptGroup === 'group_men') {
      setActiveDeptId('dept_men');
    } else if (deptGroup === 'group_kids') {
      setActiveDeptId('dept_kids');
    } else {
      setActiveDeptId('dept_women');
    }

    // 3. Synchronize Category Engine: Department, Subcategory, Product Type & Attribute Template
    if (res.suggestedProductType) {
      handleProductTypeChange(res.suggestedProductType, true);
    }

    showToast(
      `⚡ Auto-detected ${res.categoryIds.length} categories for ${
        deptGroup === 'group_men' ? 'Men' : deptGroup === 'group_kids' ? 'Kids' : 'Women'
      } & set template to "${res.matchedLabels[0] || 'Garment'}"`,
      'success',
    );
  };

  const handleMainCategoryChange = (mainId: string) => {
    setSelectedMainCat(mainId);
    const found = CATEGORY_TAXONOMY.find((c) => c.id === mainId);
    if (found && found.sections.length > 0) {
      setSelectedSectionId(found.sections[0].id);
    }
    // Synchronize Step 1 Department in Category Engine
    if (mainId === 'group_men') {
      setActiveDeptId('dept_men');
      const dept = CATEGORY_ENGINE_TAXONOMY.find((d) => d.id === 'dept_men');
      if (dept && dept.subCategories.length > 0) {
        setActiveSubId(dept.subCategories[0].id);
        if (dept.subCategories[0].productTypes.length > 0) {
          handleProductTypeChange(dept.subCategories[0].productTypes[0].id, true);
        }
      }
    } else if (mainId === 'group_kids') {
      setActiveDeptId('dept_kids');
      const dept = CATEGORY_ENGINE_TAXONOMY.find((d) => d.id === 'dept_kids');
      if (dept && dept.subCategories.length > 0) {
        setActiveSubId(dept.subCategories[0].id);
        if (dept.subCategories[0].productTypes.length > 0) {
          handleProductTypeChange(dept.subCategories[0].productTypes[0].id, true);
        }
      }
    } else if (mainId === 'group_women') {
      setActiveDeptId('dept_women');
      const dept = CATEGORY_ENGINE_TAXONOMY.find((d) => d.id === 'dept_women');
      if (dept && dept.subCategories.length > 0) {
        setActiveSubId(dept.subCategories[0].id);
        if (dept.subCategories[0].productTypes.length > 0) {
          handleProductTypeChange(dept.subCategories[0].productTypes[0].id, true);
        }
      }
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
          const fileToUpload = await compressImageFile(item.file);
          const uploadFormData = new FormData();
          uploadFormData.append('file', fileToUpload);

          const res = await fetch('/api/v1/upload?folder=seller_products', {
            method: 'POST',
            body: uploadFormData,
          });

          const rawText = await res.text();
          let data: any;
          try {
            data = JSON.parse(rawText);
          } catch {
            if (res.status === 413 || rawText.toLowerCase().includes('request entity too large')) {
              throw new Error(
                `Photo "${item.file.name}" exceeds the allowed upload size. Please select a smaller photo.`,
              );
            }
            throw new Error(rawText || `Upload failed with status ${res.status}`);
          }
          if (!data.success || !data.data?.[0]?.secureUrl) {
            throw new Error(data.message || `Failed to upload ${item.file.name}`);
          }

          const uploadRes = data.data[0];
          const secureUrl = uploadRes.secureUrl || uploadRes.url || '';

          setFormData((prev) => {
            const isFirstImage = prev.images.length === 0;
            const updatedImages = [
              ...prev.images,
              {
                imageUrl: secureUrl,
                publicId: uploadRes.publicId,
                isPrimary: isFirstImage,
                sortOrder: prev.images.length,
              },
            ];

            // Auto-link to existing variants that do not yet have an image
            const updatedVariants = prev.variants.map((v: any) => {
              if (!v.imageUrl) {
                return { ...v, imageUrl: secureUrl };
              }
              return v;
            });

            return {
              ...prev,
              images: updatedImages,
              variants: updatedVariants,
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
    setFormData((prev) => {
      const selectedImgUrl = prev.images[index]?.imageUrl;
      return {
        ...prev,
        images: prev.images.map((img: any, i: number) => ({
          ...img,
          isPrimary: i === index,
        })),
        variants: prev.variants.map((v: any) => {
          if (!v.imageUrl && selectedImgUrl) {
            return { ...v, imageUrl: selectedImgUrl };
          }
          return v;
        }),
      };
    });
  };

  // Upload photo specifically for a variant
  const handleVariantImageUpload = async (index: number, file: File) => {
    if (!file) return;
    setVariantUploadingIndex(index);
    try {
      const fileToUpload = await compressImageFile(file);
      const uploadData = new FormData();
      uploadData.append('file', fileToUpload);
      const res = await fetch('/api/v1/upload?folder=seller_products', {
        method: 'POST',
        body: uploadData,
      });
      const rawText = await res.text();
      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch {
        if (res.status === 413 || rawText.toLowerCase().includes('request entity too large')) {
          throw new Error('Photo exceeds the allowed upload size. Please select a smaller photo.');
        }
        throw new Error(rawText || `Upload failed with status ${res.status}`);
      }
      const uploadedUrl =
        data.data?.[0]?.secureUrl ||
        data.data?.[0]?.url ||
        data.data?.secureUrl ||
        data.data?.url ||
        data.data?.secure_url;

      if (data.success && uploadedUrl) {
        const targetVariant = formData.variants[index];
        const targetColor = targetVariant?.color;

        if (targetColor) {
          setColorPhotos((cp) => ({ ...cp, [targetColor]: uploadedUrl }));
        }

        setFormData((prev) => {
          const updatedVariants = prev.variants.map((v: any, i: number) => {
            if (i === index) return { ...v, imageUrl: uploadedUrl };
            if (targetColor && v.color === targetColor && !v.imageUrl) {
              return { ...v, imageUrl: uploadedUrl };
            }
            return v;
          });

          const hasInGallery = prev.images.some(
            (img: any) => (img.imageUrl || img.url) === uploadedUrl,
          );
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
        showToast(data.message || 'Server error: please try again after sometime', 'error');
      }
    } catch (err: any) {
      showToast('Server error: please try again after sometime', 'error');
    } finally {
      setVariantUploadingIndex(null);
    }
  };

  const handleAssignGalleryImageToVariant = (index: number, imageUrl: string) => {
    const targetVariant = formData.variants[index];
    const targetColor = targetVariant?.color;

    if (targetColor && imageUrl) {
      setColorPhotos((cp) => ({ ...cp, [targetColor]: imageUrl }));
    }

    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((v: any, i: number) => {
        if (i === index) return { ...v, imageUrl };
        if (imageUrl && targetColor && v.color === targetColor && !v.imageUrl) {
          return { ...v, imageUrl };
        }
        return v;
      }),
    }));
    if (imageUrl) {
      showToast('Assigned gallery photo to variant!', 'success');
    } else {
      showToast('Removed photo from variant');
    }
  };

  const handleApplyImageToAllColorVariants = (color: string, imageUrl: string) => {
    if (!color || !imageUrl) return;
    setColorPhotos((cp) => ({ ...cp, [color]: imageUrl }));
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

    const primaryImg =
      formData.images.find((img: any) => img.isPrimary)?.imageUrl ||
      formData.images[0]?.imageUrl ||
      '';

    if (mode === 'SIZE_ONLY') {
      sizes.forEach((sz) => {
        const existing = formData.variants.find((v: any) => v.size === sz && !v.color);
        newVariants.push({
          size: sz,
          color: '',
          price: existing?.price ?? basePrice ?? 0,
          stock: existing?.stock ?? baseStock ?? 10,
          sku: existing?.sku || '',
          imageUrl: existing?.imageUrl || primaryImg,
        });
      });
    } else if (mode === 'COLOR_ONLY') {
      colors.forEach((clr, cIdx) => {
        const existing = formData.variants.find((v: any) => v.color === clr && !v.size);
        const colorExisting = formData.variants.find((v: any) => v.color === clr && v.imageUrl);
        const fallbackImg =
          existing?.imageUrl ||
          colorPhotos[clr] ||
          colorExisting?.imageUrl ||
          formData.images[cIdx]?.imageUrl ||
          (colors.length === 1 ? primaryImg : '');
        newVariants.push({
          size: '',
          color: clr,
          price: existing?.price ?? basePrice ?? 0,
          stock: existing?.stock ?? baseStock ?? 10,
          sku: existing?.sku || '',
          imageUrl: fallbackImg,
        });
      });
    } else if (mode === 'SIZE_AND_COLOR') {
      colors.forEach((clr, cIdx) => {
        const colorExisting = formData.variants.find((v: any) => v.color === clr && v.imageUrl);
        const fallbackImg =
          colorPhotos[clr] ||
          colorExisting?.imageUrl ||
          formData.images[cIdx]?.imageUrl ||
          (colors.length === 1 ? primaryImg : '');
        sizes.forEach((sz) => {
          const existing = formData.variants.find((v: any) => v.color === clr && v.size === sz);
          newVariants.push({
            size: sz,
            color: clr,
            price: existing?.price ?? basePrice ?? 0,
            stock: existing?.stock ?? baseStock ?? 10,
            sku: existing?.sku || '',
            imageUrl: existing?.imageUrl || colorPhotos[clr] || fallbackImg,
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

  // Toggle specific color availability within a size (User's Core Requirement)
  const handleToggleColorForSize = (size: string, color: string) => {
    const exists = formData.variants.some((v: any) => v.size === size && v.color === color);
    if (exists) {
      const updated = formData.variants.filter((v: any) => !(v.size === size && v.color === color));
      const totalStock = updated.reduce((sum: number, v: any) => sum + Number(v.stock || 0), 0);
      setFormData((prev) => ({
        ...prev,
        variants: updated,
        stock: totalStock > 0 ? totalStock : prev.stock,
      }));
    } else {
      const colorExisting = formData.variants.find((v: any) => v.color === color && v.imageUrl);
      const primaryImg =
        formData.images.find((img: any) => img.isPrimary)?.imageUrl ||
        formData.images[0]?.imageUrl ||
        '';
      const newVariant = {
        size,
        color,
        price: Number(formData.price) || 0,
        stock: 10,
        sku: '',
        imageUrl:
          colorPhotos[color] ||
          colorExisting?.imageUrl ||
          (selectedColors.length === 1 ? primaryImg : '') ||
          formData.images[0]?.imageUrl ||
          '',
      };
      const updated = [...formData.variants, newVariant];
      const totalStock = updated.reduce((sum: number, v: any) => sum + Number(v.stock || 0), 0);
      setFormData((prev) => ({
        ...prev,
        variants: updated,
        stock: totalStock,
      }));
    }
  };

  const handleApplyAllColorsToAllSizes = () => {
    if (selectedColors.length === 0 || selectedSizes.length === 0) {
      showToast('Please select at least 1 size and 1 color first.', 'error');
      return;
    }
    const newVariants: any[] = [];
    selectedSizes.forEach((sz) => {
      selectedColors.forEach((clr) => {
        const existing = formData.variants.find((v: any) => v.size === sz && v.color === clr);
        const colorExisting = formData.variants.find((v: any) => v.color === clr && v.imageUrl);
        newVariants.push({
          size: sz,
          color: clr,
          price: existing?.price ?? Number(formData.price) ?? 0,
          stock: existing?.stock ?? 10,
          sku: existing?.sku || '',
          imageUrl: existing?.imageUrl || colorPhotos[clr] || colorExisting?.imageUrl || '',
        });
      });
    });
    const totalStock = newVariants.reduce((sum: number, v: any) => sum + Number(v.stock || 0), 0);
    setFormData((prev) => ({
      ...prev,
      variants: newVariants,
      stock: totalStock,
    }));
    showToast('Applied all selected colors across all sizes!', 'success');
  };

  const handleApplyBasePriceToAllVariants = () => {
    const base = Number(formData.price) || 0;
    if (base <= 0) {
      showToast('Please enter a valid Selling Price in Section 3 (Pricing) first.', 'error');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((v: any) => ({ ...v, price: base })),
    }));
    showToast(`Updated all variant prices to ₹${base}!`, 'success');
  };

  const handleUploadColorPhoto = async (color: string, file: File) => {
    if (!file) return;
    setColorUploading(color);
    try {
      const fileToUpload = await compressImageFile(file);
      const uploadData = new FormData();
      uploadData.append('file', fileToUpload);
      const res = await fetch('/api/v1/upload?folder=seller_products', {
        method: 'POST',
        body: uploadData,
      });
      const rawText = await res.text();
      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch {
        if (res.status === 413 || rawText.toLowerCase().includes('request entity too large')) {
          throw new Error('Photo exceeds the allowed upload size. Please select a smaller photo.');
        }
        throw new Error(rawText || `Upload failed with status ${res.status}`);
      }
      const uploadedUrl =
        data.data?.[0]?.secureUrl ||
        data.data?.[0]?.url ||
        data.data?.secureUrl ||
        data.data?.url ||
        data.data?.secure_url;

      if (data.success && uploadedUrl) {
        setColorPhotos((prev) => ({ ...prev, [color]: uploadedUrl }));
        setFormData((prev) => {
          const updatedVariants = prev.variants.map((v: any) =>
            v.color === color ? { ...v, imageUrl: uploadedUrl } : v,
          );
          const hasInGallery = prev.images.some(
            (img: any) => (img.imageUrl || img.url) === uploadedUrl,
          );
          const updatedImages = hasInGallery
            ? prev.images
            : [...prev.images, { imageUrl: uploadedUrl, isPrimary: prev.images.length === 0 }];

          return {
            ...prev,
            variants: updatedVariants,
            images: updatedImages,
          };
        });
        showToast(`Photo for ${color} uploaded and linked to all variants!`, 'success');
      } else {
        showToast(data.message || 'Server error: please try again after sometime', 'error');
      }
    } catch {
      showToast('Server error: please try again after sometime', 'error');
    } finally {
      setColorUploading(null);
    }
  };

  const handleAssignGalleryImageToColor = (color: string, imageUrl: string) => {
    if (imageUrl) {
      setColorPhotos((prev) => ({ ...prev, [color]: imageUrl }));
    } else {
      setColorPhotos((prev) => {
        const next = { ...prev };
        delete next[color];
        return next;
      });
    }
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((v: any) => (v.color === color ? { ...v, imageUrl } : v)),
    }));
    if (imageUrl) {
      showToast(`Assigned gallery photo to all ${color} variants!`, 'success');
    } else {
      showToast(`Removed photo from all ${color} variants`);
    }
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

    // Pricing validation (Section 4, 5, 6, 8)
    const sellingPrice = Number(formData.price);
    const mrp = Number(formData.compareAtPrice);
    if (mrp > 0) {
      if (sellingPrice > mrp) {
        showToast(`Selling price (₹${sellingPrice}) cannot exceed MRP (₹${mrp}).`, 'error');
        return;
      }
      const floors = CommissionService.calculatePricingFloors(mrp);
      if (CommissionService.roundMoney(sellingPrice) < floors.psychologicalMinimumSellingPrice) {
        showToast(
          `Selling price (₹${sellingPrice}) exceeds maximum allowed discount (70% limit with ₹1 psychological floor is ₹${floors.psychologicalMinimumSellingPrice}).`,
          'error',
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const endpoint = productId
        ? `/api/v1/seller/products/${productId}`
        : '/api/v1/seller/products';
      const method = productId ? 'PUT' : 'POST';

      // 1. Normalize images: support { imageUrl }, { url }, { secureUrl }, string URLs
      const normalizedImages = (formData.images || [])
        .map((img: any, idx: number) => {
          const resolvedUrl =
            typeof img === 'string' ? img : (img.imageUrl || img.secureUrl || img.url || '').trim();
          return {
            ...img,
            imageUrl: resolvedUrl,
            altText: img.altText || formData.name || 'Product Image',
            isPrimary: Boolean(img.isPrimary),
            sortOrder: img.sortOrder ?? idx,
          };
        })
        .filter((img: any) => Boolean(img.imageUrl));

      if (normalizedImages.length === 0) {
        showToast('Please upload at least 1 product image.', 'error');
        setIsSubmitting(false);
        return;
      }

      // 2. Ensure exactly one primary image is designated
      if (!normalizedImages.some((img: any) => img.isPrimary)) {
        normalizedImages[0].isPrimary = true;
      }

      // 3. If any image in the gallery is still a raw data/blob URI, upload it to Cloudinary before submission
      for (let i = 0; i < normalizedImages.length; i++) {
        const img = normalizedImages[i];
        if (img.imageUrl.startsWith('data:') || img.imageUrl.startsWith('blob:')) {
          try {
            const uploadRes = await fetch('/api/v1/upload?folder=seller_products', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ images: [img.imageUrl] }),
            });
            const uploadData = await uploadRes.json();
            if (
              uploadData.success &&
              uploadData.data?.[0]?.secureUrl &&
              !uploadData.data[0].secureUrl.startsWith('data:')
            ) {
              img.imageUrl = uploadData.data[0].secureUrl;
            } else {
              throw new Error(
                uploadData.message ||
                  `Failed to upload photo #${i + 1} to cloud storage. Please remove and re-add this photo.`,
              );
            }
          } catch (uploadErr: any) {
            throw new Error(
              uploadErr.message ||
                `Failed to upload photo #${i + 1}. Please ensure photos are valid image files under 4MB.`,
            );
          }
        }
      }

      // Clean images payload for Zod validation (must be valid URL, not empty, not raw base64)
      const sanitizedImages = normalizedImages
        .filter((img: any) => Boolean(img.imageUrl) && !img.imageUrl.startsWith('data:'))
        .map((img: any, idx: number) => ({
          imageUrl: img.imageUrl,
          altText: img.altText || formData.name || 'Product Image',
          isPrimary: Boolean(img.isPrimary),
          sortOrder: img.sortOrder ?? idx,
        }));

      if (sanitizedImages.length === 0) {
        showToast(
          'At least one valid product image is required. Please upload photos before updating.',
          'error',
        );
        setIsSubmitting(false);
        return;
      }

      // Keep state in sync with resolved Cloudinary URLs
      setFormData((prev) => ({
        ...prev,
        images: sanitizedImages,
      }));

      // Normalize variants images
      const normalizedVariants = (formData.variants || []).map((v: any) => {
        let vImgUrl = typeof v.imageUrl === 'string' ? v.imageUrl : v.image || '';
        if (vImgUrl.startsWith('data:')) {
          const matched = sanitizedImages.find(
            (si: any) => si.imageUrl && !si.imageUrl.startsWith('data:'),
          );
          vImgUrl = matched ? matched.imageUrl : '';
        }
        return {
          ...v,
          price: Number(v.price) || Number(formData.price),
          compareAtPrice:
            v.compareAtPrice && Number(v.compareAtPrice) > 0 ? Number(v.compareAtPrice) : undefined,
          costPrice: v.costPrice && Number(v.costPrice) > 0 ? Number(v.costPrice) : undefined,
          stock: Number(v.stock) || 0,
          imageUrl: vImgUrl,
        };
      });

      const payload = {
        ...formData,
        images: sanitizedImages,
        status: explicitStatus || formData.status,
        categoryId: effectiveCategoryId,
        categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : [effectiveCategoryId],
        price: Number(formData.price),
        compareAtPrice:
          formData.compareAtPrice && Number(formData.compareAtPrice) > 0
            ? Number(formData.compareAtPrice)
            : undefined,
        costPrice:
          formData.costPrice && Number(formData.costPrice) > 0
            ? Number(formData.costPrice)
            : undefined,
        stock: Number(formData.stock),
        variants: normalizedVariants,
      };

      const jsonString = JSON.stringify(payload);
      if (jsonString.length > 3.8 * 1024 * 1024) {
        throw new Error(
          'Listing payload size exceeds allowed limit (4MB). Please reduce images or description length.',
        );
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: jsonString,
      });

      const rawText = await res.text();
      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch {
        if (
          res.status === 413 ||
          rawText.toLowerCase().includes('payload_too_large') ||
          rawText.toLowerCase().includes('entity too large')
        ) {
          throw new Error(
            'Listing update failed: Upload payload exceeded size limit (max 4MB). Please ensure photos are under 4MB.',
          );
        }
        throw new Error(
          rawText?.slice(0, 150) || `Server returned error (${res.status}): Please try again.`,
        );
      }

      if (data.success) {
        showToast(data.message || 'Product saved successfully!', 'success');
        setTimeout(() => {
          router.push('/seller/products');
        }, 1200);
      } else {
        const errorDetail =
          data.errors && typeof data.errors === 'object'
            ? Object.values(data.errors).flat().join(', ')
            : data.message;
        showToast(errorDetail || 'Server error: please try again after sometime', 'error');
      }
    } catch (err: any) {
      console.error('Error saving product:', err);
      showToast(err.message || 'Server error: please try again after sometime', 'error');
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

  if (isLoadingProduct) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-200 shadow-xs max-w-6xl mx-auto my-8">
        <div className="w-12 h-12 border-4 border-navy border-t-orange rounded-full animate-spin mb-4" />
        <h3 className="text-base font-bold text-slate-800">Loading Product Details...</h3>
        <p className="text-xs text-slate-500 mt-1">
          Retrieving product catalog information, variants matrix, and images...
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => handleSubmit(e, 'pending_approval')}
      className="space-y-4 sm:space-y-5 max-w-6xl mx-auto pb-16"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs sticky top-2 sm:top-4 z-20 backdrop-blur-md">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href="/seller/products"
            className="p-1.5 sm:p-2 text-slate-500 hover:text-navy hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Back to Products Catalog"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-2.5">
            <h1 className="text-lg sm:text-xl font-extrabold text-navy tracking-tight">
              {productId ? 'Edit Product' : 'Add New Product'}
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange/10 text-orange border border-orange/20">
              {productId ? 'Editing' : 'Draft'}
            </span>
          </div>
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
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5 sm:space-y-4">
        <div className="flex items-start sm:items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
          <div className="min-w-0 pr-1">
            <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-navy flex items-center gap-1.5 sm:gap-2">
              <ShoppingBag className="w-4 h-4 text-orange shrink-0" /> Section 1: Common Product
              Information
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Basic product identity, brand name, and category placement.
            </p>
          </div>
          <span className="shrink-0 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
            Step 1 of 6
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 text-xs">
          <div className="md:col-span-2">
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Product Name / Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Royal Blue Banarasi Silk Saree with Gold Zari Border"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-slate-900 font-bold focus:border-navy focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Brand Name
            </label>
            <input
              type="text"
              placeholder="e.g. Jiivaa Couture, Boutique Edition, Self Manufactured"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-slate-900 font-medium focus:border-navy focus:bg-white focus:outline-none transition-all"
            />
          </div>

          {/* DYNAMIC CATEGORY & GARMENT TYPE SELECTOR */}
          <div className="md:col-span-2 bg-gradient-to-br from-orange-50/30 via-slate-50/60 to-white p-4 sm:p-5 rounded-2xl border border-orange/20 space-y-3.5 sm:space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 border-b border-orange/15 pb-2.5 sm:pb-3">
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-navy">
                  Dynamic Garment & Category Selection
                </h3>
                <p className="hidden sm:block text-[11px] text-slate-600 mt-0.5">
                  Choose the garment to automatically open its tailored attributes in Section 2 and
                  configure its size system.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleAutoDetectCategories}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange hover:bg-orange/90 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                  title="Auto-detect garment and category from title"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Auto-Detect
                </button>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-xl border border-slate-200 text-xs font-bold text-navy shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    Active Template: <strong className="text-orange">{activeTemplate.name}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* 1. Department Selection */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                1. Select Department
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_ENGINE_TAXONOMY.map((dept) => {
                  const isDeptActive = activeDeptId === dept.id;
                  const icon = dept.name === 'Men' ? '👨' : dept.name === 'Women' ? '👩' : '👶';
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => {
                        setActiveDeptId(dept.id);
                        if (dept.subCategories.length > 0) {
                          const firstSub = dept.subCategories[0];
                          setActiveSubId(firstSub.id);
                          if (firstSub.productTypes.length > 0) {
                            handleProductTypeChange(firstSub.productTypes[0].id, true);
                          }
                        }
                        if (dept.id === 'dept_men') {
                          setSelectedMainCat('group_men');
                        } else if (dept.id === 'dept_kids') {
                          setSelectedMainCat('group_kids');
                        } else {
                          setSelectedMainCat('group_women');
                        }
                      }}
                      className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                        isDeptActive
                          ? 'bg-navy text-white shadow-xs ring-2 ring-navy/20'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <span>{icon}</span>
                      <span>{dept.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Subcategory / Section Selection */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                2. Select Subcategory / Section
              </label>
              <div className="flex flex-wrap gap-1.5">
                {currentDepartmentDef?.subCategories.map((sub) => {
                  const isSubActive = activeSubId === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        setActiveSubId(sub.id);
                        if (
                          sub.productTypes.length > 0 &&
                          !sub.productTypes.some((pt) => pt.id === formData.productType)
                        ) {
                          handleProductTypeChange(sub.productTypes[0].id, true);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        isSubActive
                          ? 'bg-orange text-white shadow-xs font-black ring-2 ring-orange/20'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {sub.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Garment / Product Type Pills */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                3. Select Garment Type & Attributes Template
              </label>
              <div className="flex flex-wrap gap-2">
                {currentSubCategoryDef?.productTypes.map((pt) => {
                  const isPtActive = (formData.productType || activeTemplate.id) === pt.id;
                  return (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => handleProductTypeChange(pt.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isPtActive
                          ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/20 font-black'
                          : 'bg-white text-slate-800 hover:bg-slate-100 border border-slate-300'
                      }`}
                    >
                      {isPtActive && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      <span>{pt.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Product Type / Specific Category (Quick Search Dropdown)
            </label>
            <select
              value={formData.productType || activeTemplate.id}
              onChange={(e) => handleProductTypeChange(e.target.value)}
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
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange hover:bg-orange/90 text-white font-extrabold text-[11px] rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
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
                          ? 'border-orange bg-orange/5 text-navy font-bold shadow-2xs'
                          : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCategory(cat.id)}
                        className="rounded text-orange focus:ring-orange h-3.5 w-3.5 cursor-pointer"
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenAiStudioModal()}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-orange to-amber-500 hover:from-orange/90 hover:to-amber-500/90 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                title="Convert phone photos into studio catalog photos with Bria AI"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Studio Magic</span>
              </button>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                {formData.images.length} photos uploaded (Click star to set main display photo)
              </span>
            </div>
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
                      ? 'border-orange ring-2 ring-orange/20'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <img
                    src={img.imageUrl}
                    alt={`Product ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {img.isPrimary && (
                    <span className="absolute top-2 left-2 bg-orange text-white font-black text-[9px] uppercase px-2 py-0.5 rounded-full shadow-xs">
                      Main Photo
                    </span>
                  )}

                  {/* Linked color badges on thumbnail */}
                  {(() => {
                    const linkedColors = Array.from(
                      new Set(
                        formData.variants
                          .filter((v: any) => v.imageUrl === img.imageUrl && v.color)
                          .map((v: any) => v.color),
                      ),
                    );
                    if (linkedColors.length === 0) return null;
                    return (
                      <div className="absolute bottom-1.5 left-1.5 right-1.5 flex flex-wrap gap-1 pointer-events-none">
                        {linkedColors.map((c: any) => (
                          <span
                            key={c}
                            className="bg-navy/90 text-orange font-bold text-[8px] px-1.5 py-0.5 rounded shadow-xs"
                          >
                            ✓ {c}
                          </span>
                        ))}
                      </div>
                    );
                  })()}

                  <div className="absolute inset-0 bg-navy/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenAiStudioModal(img.imageUrl)}
                        className="p-1.5 bg-orange hover:bg-orange/90 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                        title="✨ Make Studio Photo with AI"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                      {!img.isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(idx)}
                          className="p-1.5 bg-white text-navy hover:text-orange rounded-lg text-xs font-bold shadow-xs cursor-pointer"
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

                    {selectedColors.length > 0 && (
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          const clr = e.target.value;
                          if (clr) {
                            handleAssignGalleryImageToColor(clr, img.imageUrl);
                          }
                          e.target.value = '';
                        }}
                        className="w-full text-center px-1 py-0.5 bg-white text-navy font-bold text-[9px] rounded shadow-xs outline-none cursor-pointer"
                        title="Link photo to a color variant"
                      >
                        <option value="" disabled>
                          To Color ▾
                        </option>
                        {selectedColors.map((clr) => (
                          <option key={clr} value={clr}>
                            {clr}
                          </option>
                        ))}
                      </select>
                    )}

                    {formData.variants.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            variants: prev.variants.map((v: any) => ({
                              ...v,
                              imageUrl: img.imageUrl,
                            })),
                          }));
                          showToast('Applied this photo to all variants!', 'success');
                        }}
                        className="w-full text-center px-1.5 py-0.5 bg-orange hover:bg-orange/90 text-white font-black text-[8px] uppercase tracking-wider rounded shadow-xs cursor-pointer"
                        title="Apply to all variants"
                      >
                        All Variants
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: DYNAMIC CATEGORY ATTRIBUTES ENGINE */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5 sm:space-y-4">
        <div className="flex items-start sm:items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
          <div className="min-w-0 pr-1">
            <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-navy flex items-center gap-1.5 sm:gap-2">
              <Layers className="w-4 h-4 text-orange shrink-0" /> Section 2: Dynamic Category
              Attributes
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Garment-tailored fabric, design, and weave specifications for{' '}
              <strong className="text-orange">{activeTemplate.name}</strong>.
            </p>
          </div>
          <span className="shrink-0 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
            Step 2 of 6
          </span>
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
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5 sm:space-y-4">
        <div className="flex items-start sm:items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
          <div className="min-w-0 pr-1">
            <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-navy flex items-center gap-1.5 sm:gap-2">
              <Percent className="w-4 h-4 text-orange shrink-0" /> Section 3: Pricing, GST Taxation
              & Inventory
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Customer selling price, MRP, GST tax rate, and warehouse stock tracking.
            </p>
          </div>
          <span className="shrink-0 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
            Step 3 of 6
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-orange-50/30 p-3.5 rounded-2xl border border-orange/20 space-y-1">
            <label className="block font-bold text-navy uppercase tracking-wider text-[10px]">
              Selling Price (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              min={1}
              placeholder="e.g. 1499"
              value={formData.price || ''}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              className="w-full bg-white border border-slate-200 focus:border-orange rounded-xl px-3 py-2 text-navy font-mono font-extrabold text-base focus:outline-none transition-all"
            />
            <p className="text-[10px] text-slate-500">Final price customer pays</p>
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
            {discountDetails ? (
              <p className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                ⚡ Discount: {discountDetails.formattedPercent} OFF
              </p>
            ) : (
              <p className="text-[10px] text-slate-400">Printed tag MRP</p>
            )}
          </div>

          {/* Pricing Floor & Psychological Pricing Action Callout */}
          {pricingFloors && formData.price === pricingFloors.normalMinimumSellingPrice && (
            <div className="col-span-full bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-xs">
              <div className="text-purple-900">
                <span className="font-bold text-xs">
                  70% Discount Price: ₹{pricingFloors.normalMinimumSellingPrice}
                </span>
                <p className="text-[11px] text-purple-700">
                  Optional psychological pricing: reduce selling price by ₹1 more.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    price: pricingFloors.psychologicalMinimumSellingPrice,
                  })
                }
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Use ₹1 Extra Discount</span>
                <span className="bg-purple-800 px-1.5 py-0.5 rounded font-mono text-[11px]">
                  ₹{pricingFloors.normalMinimumSellingPrice} → ₹
                  {pricingFloors.psychologicalMinimumSellingPrice}
                </span>
              </button>
            </div>
          )}

          {pricingFloors && formData.price === pricingFloors.psychologicalMinimumSellingPrice && (
            <div className="col-span-full bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-xs">
              <div className="text-emerald-900">
                <span className="font-bold text-xs">
                  ✓ Psychological Pricing Active (₹{pricingFloors.psychologicalMinimumSellingPrice})
                </span>
                <p className="text-[11px] text-emerald-700">
                  70% discount floor with ₹1 psychological allowance applied.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, price: pricingFloors.normalMinimumSellingPrice })
                }
                className="text-emerald-800 hover:text-emerald-950 underline text-xs font-semibold cursor-pointer"
              >
                Reset to 70% (₹{pricingFloors.normalMinimumSellingPrice})
              </button>
            </div>
          )}

          {pricingFloors &&
            Number(formData.price) > 0 &&
            Number(formData.price) < pricingFloors.psychologicalMinimumSellingPrice && (
              <div className="col-span-full bg-rose-50 border border-rose-300 p-3 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
                <span className="text-rose-600 font-black">⚠️ Discount Exceeds 70% Limit:</span>
                <span>
                  Minimum allowed selling price is ₹{pricingFloors.psychologicalMinimumSellingPrice}{' '}
                  (70% limit of ₹{pricingFloors.normalMinimumSellingPrice} with ₹1 psychological
                  floor).
                </span>
              </div>
            )}

          {Number(formData.compareAtPrice) > 0 &&
            Number(formData.price) > Number(formData.compareAtPrice) && (
              <div className="col-span-full bg-rose-50 border border-rose-300 p-3 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
                <span className="text-rose-600 font-black">⚠️ Pricing Error:</span>
                <span>
                  Selling price (₹{formData.price}) cannot exceed MRP (₹{formData.compareAtPrice}).
                </span>
              </div>
            )}

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Cost Price (Private - Not visible to buyers)
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
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5 sm:space-y-4">
        <div className="flex items-start sm:items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
          <div className="min-w-0 pr-1">
            <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-navy flex items-center gap-1.5 sm:gap-2">
              <Truck className="w-4 h-4 text-orange shrink-0" /> Section 4: Shipping & Packaging
              Specifications
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Physical package dead weight and dimensions used for courier rate estimation.
            </p>
          </div>
          <span className="shrink-0 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
            Step 4 of 6
          </span>
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

      {/* SECTION 5: MANDATORY RETURN & REPLACEMENT POLICY */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5 sm:space-y-4">
        <div className="flex items-start sm:items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
          <div className="min-w-0 pr-1">
            <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-navy flex items-center gap-1.5 sm:gap-2">
              <RotateCcw className="w-4 h-4 text-orange shrink-0" /> Section 5: Return & Replacement
              Policy <span className="text-rose-500">*</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Select one of the 3 standardized customer return & replacement options enforced across
              the marketplace.
            </p>
          </div>
          <span className="shrink-0 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
            Step 5 of 6
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* OPTION A: Return + Replacement */}
          <div
            onClick={() => setFormData({ ...formData, returnPolicyType: 'RETURN_AND_REPLACEMENT' })}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative ${
              formData.returnPolicyType === 'RETURN_AND_REPLACEMENT'
                ? 'border-orange bg-orange/5 ring-2 ring-orange/20 shadow-xs'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Option A • Full Flexibility
              </span>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  formData.returnPolicyType === 'RETURN_AND_REPLACEMENT'
                    ? 'border-orange bg-orange text-white'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {formData.returnPolicyType === 'RETURN_AND_REPLACEMENT' && (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
              </div>
            </div>
            <h3 className="font-extrabold text-navy text-sm mb-1">Return + Replacement</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed mb-4">
              Allows customers to request either a full return or a product replacement within the
              verified eligibility windows.
            </p>
            <div className="bg-white/80 rounded-xl p-3 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 text-[11px]">Return Window:</span>
                <span className="font-extrabold text-navy text-[11px]">Max 3 Days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-[11px]">Replacement Window:</span>
                <span className="font-extrabold text-navy text-[11px]">Max 7 Days</span>
              </div>
            </div>
          </div>

          {/* OPTION B: Replacement Only */}
          <div
            onClick={() => setFormData({ ...formData, returnPolicyType: 'REPLACEMENT_ONLY' })}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative ${
              formData.returnPolicyType === 'REPLACEMENT_ONLY'
                ? 'border-orange bg-orange/5 ring-2 ring-orange/20 shadow-xs'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-navy/10 text-navy border border-navy/20">
                Option B • Size/Defect Exchange
              </span>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  formData.returnPolicyType === 'REPLACEMENT_ONLY'
                    ? 'border-orange bg-orange text-white'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {formData.returnPolicyType === 'REPLACEMENT_ONLY' && (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
              </div>
            </div>
            <h3 className="font-extrabold text-navy text-sm mb-1">Replacement Only</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed mb-4">
              Returns for refund are not allowed. Customers may only request replacement for size or
              damaged items.
            </p>
            <div className="bg-white/80 rounded-xl p-3 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 text-[11px]">Return Window:</span>
                <span className="font-bold text-rose-600 text-[11px]">Not Allowed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-[11px]">Replacement Window:</span>
                <span className="font-extrabold text-navy text-[11px]">Max 7 Days</span>
              </div>
            </div>
          </div>

          {/* OPTION C: None */}
          <div
            onClick={() => setFormData({ ...formData, returnPolicyType: 'NONE' })}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative ${
              formData.returnPolicyType === 'NONE'
                ? 'border-orange bg-orange/5 ring-2 ring-orange/20 shadow-xs'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-800 border border-slate-300">
                Option C • Final Sale
              </span>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  formData.returnPolicyType === 'NONE'
                    ? 'border-orange bg-orange text-white'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {formData.returnPolicyType === 'NONE' && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
            </div>
            <h3 className="font-extrabold text-navy text-sm mb-1">None (Final Sale)</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed mb-4">
              Strictly no returns or replacements are accepted once the parcel has been delivered to
              the customer.
            </p>
            <div className="bg-white/80 rounded-xl p-3 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 text-[11px]">Return Window:</span>
                <span className="font-bold text-slate-500 text-[11px]">Not Allowed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-[11px]">Replacement Window:</span>
                <span className="font-bold text-slate-500 text-[11px]">Not Allowed</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2 text-[11px] text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Enforced by JiivaaKart Marketplace:</strong> Sellers cannot input arbitrary
            return days. When an order is placed, this policy is permanently locked to that order.
          </span>
        </div>
      </div>

      {/* SECTION 6: COLOR-FIRST PRODUCT VARIANT SYSTEM */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5 sm:space-y-4">
        <div className="flex items-start sm:items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
          <div className="min-w-0 pr-1">
            <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-navy flex items-center gap-1.5 sm:gap-2">
              <Boxes className="w-4 h-4 text-orange shrink-0" /> Section 6: Product Variant Matrix &
              Photo Gallery
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Color-first grouped matrix with variant-specific photos and category sizes (
              {SIZE_SYSTEMS[activeTemplate.sizeSystemId]?.name}).
            </p>
          </div>
          <span className="shrink-0 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
            Step 6 of 6
          </span>
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
                {variantMode === mode.id && <CheckCircle2 className="w-4 h-4 text-orange" />}
              </div>
            </button>
          ))}
        </div>

        {variantMode !== 'NONE' && (
          <div className="space-y-6 pt-2">
            {/* =========================================================================
                MODE A: COLOR + SIZE MATRIX (SIZE-FIRST WITH INLINE COLOR OPTIONS)
               ========================================================================= */}
            {variantMode === 'SIZE_AND_COLOR' && (
              <>
                {/* Step 1: Select Available Sizes */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-navy uppercase tracking-wider text-xs">
                      Step 1: Select Available Sizes (
                      {SIZE_SYSTEMS[activeTemplate.sizeSystemId]?.name})
                    </label>
                    <span className="text-[11px] text-navy font-bold">
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
                              ? 'bg-orange text-white shadow-xs ring-2 ring-orange/20 font-black'
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

                {/* Step 2: Select Product Colors & Shared Color Photos */}
                <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block font-bold text-navy uppercase tracking-wider text-xs">
                      Step 2: Select Product Colors
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Select all colors this product is made in. You can choose which colors are
                      available for each size below.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {COMMON_COLORS.map((clr) => {
                      const isSelected = selectedColors.includes(clr);
                      const hex = COLOR_HEX_MAP[clr] || '#94a3b8';
                      return (
                        <button
                          key={clr}
                          type="button"
                          onClick={() => handleToggleColor(clr)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-navy text-white shadow-xs ring-2 ring-navy/20'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: hex }}
                          />
                          {clr} {isSelected ? '✓' : '+'}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
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

                  {/* Shared Color Photos Cards */}
                  {selectedColors.length > 0 && (
                    <div className="pt-3 border-t border-slate-200/80">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block font-bold text-navy text-[11px] uppercase tracking-wider">
                          Color Photos (Uploaded once per color — shared across all sizes)
                        </label>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Auto-links to all sizes with this color
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedColors.map((clr) => {
                          const firstWithImg = formData.variants.find(
                            (v: any) => v.color === clr && v.imageUrl,
                          );
                          const colorImgUrl = colorPhotos[clr] || firstWithImg?.imageUrl || '';
                          const hex = COLOR_HEX_MAP[clr] || '#94a3b8';

                          return (
                            <div
                              key={clr}
                              className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 shadow-2xs"
                            >
                              <div className="relative w-12 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0 flex items-center justify-center group">
                                {colorImgUrl ? (
                                  <>
                                    <img
                                      src={colorImgUrl}
                                      alt={clr}
                                      className="w-full h-full object-cover"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleAssignGalleryImageToColor(clr, '')}
                                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center text-[10px] font-bold shadow-xs cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                                      title="Remove photo"
                                    >
                                      ×
                                    </button>
                                  </>
                                ) : (
                                  <ImageIcon className="w-5 h-5 text-slate-300" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                                    style={{ backgroundColor: hex }}
                                  />
                                  <span className="font-bold text-xs text-navy truncate">
                                    {clr}
                                  </span>
                                </div>

                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <label className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-navy border border-slate-200 rounded text-[10px] font-bold cursor-pointer transition-colors shadow-2xs">
                                      {colorUploading === clr ? (
                                        <span className="text-orange font-bold animate-pulse">
                                          Uploading...
                                        </span>
                                      ) : (
                                        <>
                                          <Upload className="w-2.5 h-2.5 text-orange" />
                                          <span>{colorImgUrl ? 'Change' : 'Upload'}</span>
                                        </>
                                      )}
                                      <input
                                        type="file"
                                        accept="image/*"
                                        disabled={colorUploading === clr}
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleUploadColorPhoto(clr, file);
                                          e.target.value = '';
                                        }}
                                        className="hidden"
                                      />
                                    </label>

                                    {formData.images.length > 0 && (
                                      <select
                                        defaultValue=""
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          if (val === '__CLEAR__') {
                                            handleAssignGalleryImageToColor(clr, '');
                                          } else if (val) {
                                            handleAssignGalleryImageToColor(clr, val);
                                          }
                                          e.target.value = '';
                                        }}
                                        className="text-[9px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded px-1.5 py-0.5 outline-none cursor-pointer"
                                        title="Select from product gallery"
                                      >
                                        <option value="" disabled>
                                          Gallery ▾
                                        </option>
                                        {formData.images.map((img: any, iIdx: number) => (
                                          <option key={iIdx} value={img.imageUrl}>
                                            Photo {iIdx + 1}
                                          </option>
                                        ))}
                                        {colorImgUrl && (
                                          <option
                                            value="__CLEAR__"
                                            className="text-rose-600 font-semibold"
                                          >
                                            ✕ Remove Photo
                                          </option>
                                        )}
                                      </select>
                                    )}
                                  </div>

                                  {/* Quick Gallery Thumbnail Click-to-Assign */}
                                  {formData.images.length > 0 && (
                                    <div className="flex items-center gap-1 pt-1 flex-wrap">
                                      <span className="text-[9px] font-bold text-slate-400 shrink-0">
                                        Tap to link:
                                      </span>
                                      {formData.images.map((img: any, iIdx: number) => {
                                        const isSelected = colorImgUrl === img.imageUrl;
                                        return (
                                          <button
                                            key={iIdx}
                                            type="button"
                                            onClick={() =>
                                              handleAssignGalleryImageToColor(
                                                clr,
                                                isSelected ? '' : img.imageUrl,
                                              )
                                            }
                                            className={`relative w-6 h-7 rounded border overflow-hidden cursor-pointer transition-all ${
                                              isSelected
                                                ? 'border-orange ring-2 ring-orange/50 scale-105 shadow-2xs'
                                                : 'border-slate-200 hover:border-slate-400 opacity-60 hover:opacity-100'
                                            }`}
                                            title={`Click to assign Photo ${iIdx + 1} to ${clr}`}
                                          >
                                            <img
                                              src={img.imageUrl}
                                              alt=""
                                              className="w-full h-full object-cover"
                                            />
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 3: Size-wise Color & Stock Allocation (User's Core Requirement) */}
                {selectedSizes.length > 0 && (
                  <div className="space-y-4 pt-1">
                    {/* Quick Actions Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 bg-orange/5 border border-orange/20 p-3 rounded-2xl">
                      <div className="flex items-center gap-1.5 text-navy font-bold text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-orange" />
                        <span>Quick Actions for All Sizes:</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleApplyAllColorsToAllSizes}
                          className="px-2.5 py-1 bg-white hover:bg-slate-50 text-navy border border-slate-200 rounded-lg text-xs font-bold cursor-pointer shadow-2xs"
                        >
                          ✓ Select All Colors in All Sizes
                        </button>
                        <button
                          type="button"
                          onClick={handleApplyBasePriceToAllVariants}
                          className="px-2.5 py-1 bg-white hover:bg-slate-50 text-navy border border-slate-200 rounded-lg text-xs font-bold cursor-pointer shadow-2xs"
                        >
                          ₹ Copy Base Price (₹{formData.price || 0})
                        </button>
                      </div>
                    </div>

                    {/* Grouped by Size Cards */}
                    <div className="space-y-3.5">
                      {selectedSizes.map((sz) => {
                        const sizeVariants = formData.variants.filter((v: any) => v.size === sz);
                        const sizeStock = sizeVariants.reduce(
                          (sum: number, v: any) => sum + Number(v.stock || 0),
                          0,
                        );

                        return (
                          <div
                            key={sz}
                            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3 hover:border-slate-300 transition-all"
                          >
                            {/* Size Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                              <div className="flex items-center gap-2.5">
                                <span className="inline-flex items-center justify-center bg-navy text-white font-black text-xs px-3 py-1 rounded-xl shadow-2xs">
                                  Size: {sz}
                                </span>
                                <span className="text-xs text-slate-500 font-semibold">
                                  {sizeVariants.length} color{sizeVariants.length !== 1 ? 's' : ''}{' '}
                                  available
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                                  Total Size Stock:{' '}
                                  <strong className="text-navy">{sizeStock}</strong>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleSize(sz)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title={`Remove Size ${sz}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Available Colors in this Size (Inline Options) */}
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                Available Colors in Size {sz}:
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                {selectedColors.map((clr) => {
                                  const isColorInSize = sizeVariants.some(
                                    (v: any) => v.color === clr,
                                  );
                                  const hex = COLOR_HEX_MAP[clr] || '#94a3b8';

                                  return (
                                    <button
                                      key={clr}
                                      type="button"
                                      onClick={() => handleToggleColorForSize(sz, clr)}
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                                        isColorInSize
                                          ? 'bg-orange text-white font-black ring-1 ring-orange shadow-2xs'
                                          : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                                      }`}
                                    >
                                      <span
                                        className="w-2 h-2 rounded-full border border-black/10 shrink-0"
                                        style={{ backgroundColor: hex }}
                                      />
                                      {clr} {isColorInSize ? '✓' : '+'}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Enabled Colors Compact Table */}
                            {sizeVariants.length > 0 ? (
                              <div className="pt-1 overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                    <tr>
                                      <th className="py-2 px-3">Photo</th>
                                      <th className="py-2 px-3">Color</th>
                                      <th className="py-2 px-3">Price (₹)</th>
                                      <th className="py-2 px-3">Stock Units</th>
                                      <th className="py-2 px-3">SKU</th>
                                      <th className="py-2 px-3 text-right">Remove</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {sizeVariants.map((v: any) => {
                                      const globalIndex = formData.variants.findIndex(
                                        (orig: any) =>
                                          orig.size === v.size && orig.color === v.color,
                                      );
                                      const hex = COLOR_HEX_MAP[v.color] || '#94a3b8';

                                      return (
                                        <tr key={v.color} className="hover:bg-slate-50/50">
                                          <td className="py-2 px-3">
                                            <div className="flex items-center gap-2">
                                              <div className="relative w-8 h-10 rounded-md border border-slate-200 overflow-hidden bg-slate-50 shrink-0 shadow-2xs flex items-center justify-center group">
                                                {v.imageUrl ? (
                                                  <>
                                                    <img
                                                      src={v.imageUrl}
                                                      alt=""
                                                      className="w-full h-full object-cover"
                                                    />
                                                    <button
                                                      type="button"
                                                      onClick={() =>
                                                        handleAssignGalleryImageToVariant(
                                                          globalIndex,
                                                          '',
                                                        )
                                                      }
                                                      className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center text-[9px] font-bold shadow-xs cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                                                      title="Remove photo"
                                                    >
                                                      ×
                                                    </button>
                                                  </>
                                                ) : (
                                                  <ImageIcon className="w-3.5 h-3.5 text-slate-300" />
                                                )}
                                              </div>

                                              <div className="flex flex-col gap-1">
                                                <label className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white hover:bg-slate-100 text-navy border border-slate-200 rounded text-[9px] font-bold cursor-pointer transition-colors shadow-2xs">
                                                  {variantUploadingIndex === globalIndex ? (
                                                    <span className="text-orange font-bold animate-pulse">
                                                      ...
                                                    </span>
                                                  ) : (
                                                    <>
                                                      <Upload className="w-2.5 h-2.5 text-orange" />
                                                      <span>
                                                        {v.imageUrl ? 'Change' : 'Upload'}
                                                      </span>
                                                    </>
                                                  )}
                                                  <input
                                                    type="file"
                                                    accept="image/*"
                                                    disabled={variantUploadingIndex === globalIndex}
                                                    onChange={(e) => {
                                                      const file = e.target.files?.[0];
                                                      if (file)
                                                        handleVariantImageUpload(globalIndex, file);
                                                      e.target.value = '';
                                                    }}
                                                    className="hidden"
                                                  />
                                                </label>

                                                {formData.images.length > 0 && (
                                                  <select
                                                    defaultValue=""
                                                    onChange={(e) => {
                                                      const val = e.target.value;
                                                      if (val === '__CLEAR__') {
                                                        handleAssignGalleryImageToVariant(
                                                          globalIndex,
                                                          '',
                                                        );
                                                      } else if (val) {
                                                        handleAssignGalleryImageToVariant(
                                                          globalIndex,
                                                          val,
                                                        );
                                                      }
                                                      e.target.value = '';
                                                    }}
                                                    className="text-[9px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded px-1 py-0.5 max-w-[80px] outline-none cursor-pointer"
                                                    title="Pick photo from gallery"
                                                  >
                                                    <option value="" disabled>
                                                      Gallery ▾
                                                    </option>
                                                    {formData.images.map(
                                                      (img: any, iIdx: number) => (
                                                        <option key={iIdx} value={img.imageUrl}>
                                                          Photo {iIdx + 1}
                                                        </option>
                                                      ),
                                                    )}
                                                    {v.imageUrl && (
                                                      <option
                                                        value="__CLEAR__"
                                                        className="text-rose-600 font-semibold"
                                                      >
                                                        ✕ Clear
                                                      </option>
                                                    )}
                                                  </select>
                                                )}
                                              </div>
                                            </div>
                                          </td>
                                          <td className="py-2 px-3 font-bold text-navy">
                                            <div className="flex items-center gap-1.5">
                                              <span
                                                className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                                                style={{ backgroundColor: hex }}
                                              />
                                              {v.color}
                                            </div>
                                          </td>
                                          <td className="py-2 px-3">
                                            <input
                                              type="number"
                                              min={1}
                                              value={v.price}
                                              onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                setFormData((prev) => ({
                                                  ...prev,
                                                  variants: prev.variants.map(
                                                    (varItem: any, i: number) =>
                                                      i === globalIndex
                                                        ? { ...varItem, price: val }
                                                        : varItem,
                                                  ),
                                                }));
                                              }}
                                              className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-navy font-mono font-bold focus:border-navy focus:bg-white focus:outline-none"
                                            />
                                          </td>
                                          <td className="py-2 px-3">
                                            <input
                                              type="number"
                                              min={0}
                                              value={v.stock}
                                              onChange={(e) => {
                                                const val = parseInt(e.target.value, 10) || 0;
                                                setFormData((prev) => {
                                                  const newVariants = prev.variants.map(
                                                    (varItem: any, i: number) =>
                                                      i === globalIndex
                                                        ? { ...varItem, stock: val }
                                                        : varItem,
                                                  );
                                                  const total = newVariants.reduce(
                                                    (sum: number, item: any) =>
                                                      sum + Number(item.stock || 0),
                                                    0,
                                                  );
                                                  return {
                                                    ...prev,
                                                    variants: newVariants,
                                                    stock: total,
                                                  };
                                                });
                                              }}
                                              className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-900 font-mono font-bold focus:border-navy focus:bg-white focus:outline-none"
                                            />
                                          </td>
                                          <td className="py-2 px-3 font-mono text-[11px] text-slate-500 uppercase">
                                            {v.sku ||
                                              `NVC-${(v.color || 'CLR').substring(0, 3).toUpperCase()}-${v.size || 'V'}`}
                                          </td>
                                          <td className="py-2 px-3 text-right">
                                            <button
                                              type="button"
                                              onClick={() => handleToggleColorForSize(sz, v.color)}
                                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                              title="Remove color from this size"
                                            >
                                              <X className="w-3.5 h-3.5" />
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="bg-slate-50 p-2.5 rounded-xl text-center text-xs text-slate-400 font-medium border border-dashed border-slate-200">
                                No colors enabled for Size {sz}. Click any color chip above to add
                                it.
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* =========================================================================
                MODE B: SIZE ONLY VARIANTS
               ========================================================================= */}
            {variantMode === 'SIZE_ONLY' && (
              <div className="space-y-4">
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-navy uppercase tracking-wider text-xs">
                      Select Available Sizes ({SIZE_SYSTEMS[activeTemplate.sizeSystemId]?.name})
                    </label>
                    <span className="text-[11px] text-navy font-bold">
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
                              ? 'bg-orange text-white shadow-xs ring-2 ring-orange/20 font-black'
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

                {formData.variants.length > 0 && (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3">Photo</th>
                          <th className="p-3">Size</th>
                          <th className="p-3">Price (₹)</th>
                          <th className="p-3">Stock Units</th>
                          <th className="p-3">Auto SKU</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {formData.variants.map((v: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                {v.imageUrl ? (
                                  <div className="relative w-10 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0 shadow-2xs">
                                    <img
                                      src={v.imageUrl}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-10 h-12 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                    <ImageIcon className="w-4 h-4 opacity-40" />
                                  </div>
                                )}

                                <div className="flex flex-col gap-1">
                                  <label className="inline-flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-slate-100 text-navy border border-slate-200 rounded text-[9px] font-bold cursor-pointer transition-colors shadow-2xs">
                                    {variantUploadingIndex === idx ? (
                                      <span>Uploading...</span>
                                    ) : (
                                      <>
                                        <Upload className="w-2.5 h-2.5 text-orange" />
                                        <span>{v.imageUrl ? 'Change' : 'Upload'}</span>
                                      </>
                                    )}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      disabled={variantUploadingIndex === idx}
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleVariantImageUpload(idx, file);
                                        e.target.value = '';
                                      }}
                                      className="hidden"
                                    />
                                  </label>

                                  {formData.images.length > 0 && (
                                    <select
                                      defaultValue=""
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '__CLEAR__') {
                                          handleAssignGalleryImageToVariant(idx, '');
                                        } else if (val) {
                                          handleAssignGalleryImageToVariant(idx, val);
                                        }
                                        e.target.value = '';
                                      }}
                                      className="text-[9px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded px-1 py-0.5 max-w-[85px] outline-none cursor-pointer"
                                      title="Select from product gallery"
                                    >
                                      <option value="" disabled>
                                        Gallery ▾
                                      </option>
                                      {formData.images.map((img: any, iIdx: number) => (
                                        <option key={iIdx} value={img.imageUrl}>
                                          Photo {iIdx + 1}
                                        </option>
                                      ))}
                                      {v.imageUrl && (
                                        <option
                                          value="__CLEAR__"
                                          className="text-rose-600 font-semibold"
                                        >
                                          ✕ Clear
                                        </option>
                                      )}
                                    </select>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3 font-bold text-slate-800">{v.size}</td>
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
                              {v.sku || `NVC-SZ-${v.size || 'V'}`}
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* =========================================================================
                MODE C: COLOR ONLY VARIANTS
               ========================================================================= */}
            {variantMode === 'COLOR_ONLY' && (
              <div className="space-y-4">
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <label className="block font-bold text-navy uppercase tracking-wider text-xs">
                    Select Available Colors
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_COLORS.map((clr) => {
                      const isSelected = selectedColors.includes(clr);
                      const hex = COLOR_HEX_MAP[clr] || '#94a3b8';
                      return (
                        <button
                          key={clr}
                          type="button"
                          onClick={() => handleToggleColor(clr)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-navy text-white shadow-xs ring-2 ring-navy/20'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: hex }}
                          />
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

                {formData.variants.length > 0 && (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3">Color Photo</th>
                          <th className="p-3">Color</th>
                          <th className="p-3">Price (₹)</th>
                          <th className="p-3">Stock Units</th>
                          <th className="p-3">Auto SKU</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {formData.variants.map((v: any, idx: number) => {
                          const isUploadingThis = variantUploadingIndex === idx;
                          const hex = COLOR_HEX_MAP[v.color] || '#94a3b8';

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
                                      <button
                                        type="button"
                                        onClick={() => handleAssignGalleryImageToVariant(idx, '')}
                                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center text-[10px] font-bold shadow-xs cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                                        title="Remove photo"
                                      >
                                        ×
                                      </button>
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
                                          <Upload className="w-3 h-3 text-orange" />
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
                                          e.target.value = '';
                                        }}
                                        className="hidden"
                                      />
                                    </label>

                                    {formData.images.length > 0 && (
                                      <select
                                        defaultValue=""
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          if (val === '__CLEAR__') {
                                            handleAssignGalleryImageToVariant(idx, '');
                                          } else if (val) {
                                            handleAssignGalleryImageToVariant(idx, val);
                                          }
                                          e.target.value = '';
                                        }}
                                        className="text-[9px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded px-1.5 py-0.5 max-w-[95px] outline-none cursor-pointer"
                                        title="Select from product gallery"
                                      >
                                        <option value="" disabled>
                                          From Gallery ▾
                                        </option>
                                        {formData.images.map((img: any, iIdx: number) => (
                                          <option key={iIdx} value={img.imageUrl}>
                                            Photo {iIdx + 1}
                                          </option>
                                        ))}
                                        {v.imageUrl && (
                                          <option
                                            value="__CLEAR__"
                                            className="text-rose-600 font-semibold"
                                          >
                                            ✕ Remove Photo
                                          </option>
                                        )}
                                      </select>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="p-3 font-bold text-navy">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                                    style={{ backgroundColor: hex }}
                                  />
                                  {v.color || '-'}
                                </div>
                              </td>
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
                                  `NVC-${(v.color || 'CLR').substring(0, 3).toUpperCase()}-V`}
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
        )}
      </div>

      {/* SECTION 7: ENTERPRISE SEO SEARCH ENGINE METADATA */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5 sm:space-y-4">
        <div className="flex items-start sm:items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
          <div className="min-w-0 pr-1">
            <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-navy flex items-center gap-1.5 sm:gap-2">
              <Globe className="w-4 h-4 text-orange shrink-0" /> Section 7: Enterprise SEO & Search
              Engine Keywords
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Search engine meta tags and focus keywords to improve visibility on Google search and
              store discovery.
            </p>
          </div>
          <span className="shrink-0 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200 whitespace-nowrap">
            Optional SEO
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              SEO Meta Title
            </label>
            <input
              type="text"
              placeholder="e.g. Royal Banarasi Silk Saree | JiivaaKart"
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

      {/* BOTTOM ACTION BAR */}
      <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3.5">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <Link
            href="/seller/products"
            className="text-xs font-bold text-slate-500 hover:text-navy flex items-center gap-1.5 transition-colors p-1"
          >
            <ArrowLeft className="w-4 h-4" /> Cancel & Back to Products
          </Link>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Review all sections before final submission
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3 bg-orange hover:bg-orange/90 text-white font-extrabold text-sm rounded-xl transition-all flex items-center justify-center gap-2.5 shadow-md shadow-orange/20 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Saving product...</span>
            ) : (
              <>
                <Send className="w-4 h-4 text-white" />{' '}
                {productId ? 'Update Listing' : 'Submit for Approval'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Studio Enhancer Modal (Powered by Bria AI) */}
      <AiStudioEnhancerModal
        isOpen={isAiStudioModalOpen}
        onClose={() => {
          setIsAiStudioModalOpen(false);
          setAiStudioTargetUrl(undefined);
        }}
        initialImageUrl={aiStudioTargetUrl}
        onApply={handleApplyStudioEnhancedPhoto}
      />
    </form>
  );
}
