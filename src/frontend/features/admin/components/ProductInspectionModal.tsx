/* eslint-disable @next/next/no-img-element */
'use client';

import {
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Image as ImageIcon,
  Layers,
  MapPin,
  Package,
  Percent,
  Phone,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Truck,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { useAuthStore } from '@/stores';

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
  Navy: '#1e3a8a',
  Beige: '#d4b996',
  Grey: '#64748b',
  Gray: '#64748b',
  Orange: '#f97316',
  Brown: '#78350f',
  Multicolor: '#6366f1',
};

const REJECTION_PRESETS = [
  'Low quality or blurry product photos',
  'Pricing or MRP is unrealistic / mismatched',
  'Product description is incomplete or unclear',
  'Incorrect category, gender, or fabric specifications',
  'Size & color variants lack accurate stock or photos',
  'Prohibited item or potential trademark violation',
];

interface ProductInspectionModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (productId: string) => Promise<void>;
  onReject: (productId: string, reason: string) => Promise<void>;
}

export function ProductInspectionModal({
  product,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: ProductInspectionModalProps) {
  const user = useAuthStore((s) => s.user);
  const isSupervisor = String(user?.role) === 'SUPERVISOR';

  const [activeTab, setActiveTab] = useState<'overview' | 'variants' | 'compliance' | 'seo'>(
    'overview',
  );
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeImage, setActiveImage] = useState<string>('');

  useEffect(() => {
    if (product) {
      const primary = product.images?.find((i: any) => i.isPrimary) || product.images?.[0];
      setActiveImage(primary?.imageUrl || '');
      setActiveTab('overview');
      setIsRejecting(false);
      setRejectReason('');
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(product.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;
    setIsSubmitting(true);
    try {
      await onReject(product.id, rejectReason);
      setRejectReason('');
      setIsRejecting(false);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const shop = product.shop || {};
  const price = Number(product.price || 0);
  const compareAtPrice = Number(product.compareAtPrice || 0);
  const costPrice = product.costPrice ? Number(product.costPrice) : null;
  const discountPercent =
    compareAtPrice > price ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;

  const variants = product.variants || [];
  const totalVariantStock = variants.reduce(
    (sum: number, v: any) => sum + (Number(v.stock) || 0),
    0,
  );

  const variantImages = variants
    .map((v: any) => ({ imageUrl: v.imageUrl, label: `${v.color || ''} ${v.size || ''}`.trim() }))
    .filter((v: any) => !!v.imageUrl);

  const formattedDate = product.createdAt
    ? new Date(product.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recently';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header - Navya Navy & Gold Theme */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-navy text-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-orange/10 border border-orange/20 flex items-center justify-center text-orange font-bold shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-white truncate">
                  {product.name}
                </h2>
                <span
                  className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase border ${
                    product.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : product.status === 'pending_approval'
                        ? 'bg-orange/10 text-orange border-orange/30 animate-pulse'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {product.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300 font-medium flex-wrap mt-0.5">
                <span className="text-white/80 font-mono font-bold">SKU: {product.sku}</span>
                <span>•</span>
                <span className="text-slate-300 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-orange" /> Submitted: {formattedDate}
                </span>
                {product.category?.name && (
                  <>
                    <span>•</span>
                    <span className="text-slate-300">{product.category.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer shrink-0 ml-2"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs text-slate-800 bg-slate-50/50">
          {/* Seller Shop Banner */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-navy/5 border border-navy/20 flex items-center justify-center text-navy shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 block text-[10px] uppercase font-extrabold tracking-wider">
                    Merchant Boutique
                  </span>
                  <span className="text-[10px] text-slate-400">•</span>
                  <span className="text-navy font-bold text-xs">
                    {shop.name || 'Merchant Shop'}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-wrap mt-0.5 text-[11px] text-slate-600 font-medium">
                  <span>
                    Owner:{' '}
                    <strong className="text-slate-800">{shop.owner?.name || 'Seller'}</strong> (
                    {shop.owner?.email || shop.email || 'No email'})
                  </span>
                  {(shop.phone || shop.owner?.mobile) && (
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      <Phone className="w-3 h-3 text-navy" />
                      {shop.phone || shop.owner?.mobile}
                    </span>
                  )}
                  {(shop.city || shop.state) && (
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      <MapPin className="w-3 h-3 text-rose-500" />
                      {[shop.city, shop.state].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <span className="px-3 py-1 text-[10px] font-extrabold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> VERIFIED MERCHANT
              </span>
              {shop.slug && (
                <a
                  href={`/shops/${shop.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 text-[10px] font-bold text-navy bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg inline-flex items-center gap-1 transition-colors"
                >
                  Storefront <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              )}
            </div>
          </div>

          {/* Main Inspection Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Interactive Product Gallery (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-navy uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-orange" />
                  Product Gallery ({product.images?.length || 0})
                </span>
                {activeImage && (
                  <a
                    href={activeImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-orange hover:underline inline-flex items-center gap-1"
                  >
                    View Original <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Large Image Preview */}
              <div className="relative aspect-[3/4] bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden shadow-2xs select-none group">
                {activeImage ? (
                  <img
                    src={activeImage}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 font-bold gap-2">
                    <ImageIcon className="w-8 h-8 opacity-40" />
                    <span>No Image Uploaded</span>
                  </div>
                )}
                {product.images?.find((img: any) => img.imageUrl === activeImage)?.isPrimary && (
                  <span className="absolute top-2.5 left-2.5 bg-orange text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md uppercase">
                    ★ Primary Photo
                  </span>
                )}
              </div>

              {/* Clickable Gallery Thumbnails */}
              {product.images?.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Product Photos (Click to preview)
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-1.5 select-none">
                    {product.images.map((img: any, idx: number) => {
                      const isSelected = activeImage === img.imageUrl;
                      return (
                        <button
                          key={img.id || idx}
                          type="button"
                          onClick={() => setActiveImage(img.imageUrl)}
                          className={`relative w-14 h-14 bg-white border-2 rounded-xl overflow-hidden shrink-0 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-orange ring-2 ring-orange/30 scale-105 shadow-xs'
                              : 'border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100'
                          }`}
                          title={`Photo ${idx + 1}${img.isPrimary ? ' (Primary)' : ''}`}
                        >
                          <img
                            src={img.imageUrl}
                            alt={`Photo ${idx + 1}`}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                          {img.isPrimary && (
                            <span className="absolute bottom-0 inset-x-0 bg-orange text-white font-black text-[8px] text-center leading-tight">
                              ★
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Variant Photos Quick Strip */}
              {variantImages.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Variant Photos ({variantImages.length})
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-1.5 select-none">
                    {variantImages.map((vImg: any, idx: number) => {
                      const isSelected = activeImage === vImg.imageUrl;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveImage(vImg.imageUrl)}
                          className={`relative w-12 h-12 bg-white border-2 rounded-xl overflow-hidden shrink-0 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-orange ring-2 ring-orange/30 scale-105 shadow-xs'
                              : 'border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100'
                          }`}
                          title={vImg.label || 'Variant Photo'}
                        >
                          <img
                            src={vImg.imageUrl}
                            alt={vImg.label || 'Variant'}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Tabbed Structured Product Information (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Tabs Navigation */}
              <div className="flex items-center gap-1.5 border-b border-slate-200 bg-white p-1 rounded-2xl shadow-2xs overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-2 rounded-xl font-extrabold text-[11px] transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    activeTab === 'overview'
                      ? 'bg-navy text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" /> Overview &amp; Specs
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('variants')}
                  className={`px-3 py-2 rounded-xl font-extrabold text-[11px] transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    activeTab === 'variants'
                      ? 'bg-navy text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" /> Variants ({variants.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('compliance')}
                  className={`px-3 py-2 rounded-xl font-extrabold text-[11px] transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    activeTab === 'compliance'
                      ? 'bg-navy text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Policies &amp; Tax
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('seo')}
                  className={`px-3 py-2 rounded-xl font-extrabold text-[11px] transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    activeTab === 'seo'
                      ? 'bg-navy text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> Description &amp; SEO
                </button>
              </div>

              {/* Tab 1: Overview & Specs */}
              {activeTab === 'overview' && (
                <div className="space-y-4 animate-fade-in">
                  {/* Pricing Breakdown Card */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-extrabold">
                        Selling Price
                      </span>
                      <span className="text-xl font-black text-emerald-700 font-mono">
                        ₹{price.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-extrabold">
                        MRP / Compare
                      </span>
                      {compareAtPrice > 0 ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-bold text-slate-400 line-through font-mono">
                            ₹{compareAtPrice.toLocaleString('en-IN')}
                          </span>
                          {discountPercent > 0 && (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md">
                              {discountPercent}% OFF
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">—</span>
                      )}
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-extrabold">
                        Base Stock
                      </span>
                      <span className="text-lg font-black text-navy font-mono">
                        {product.stock || 0} Units
                      </span>
                      {product.lowStockThreshold && (
                        <span className="text-[9px] text-slate-400 block font-medium">
                          Alert at &le; {product.lowStockThreshold}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-extrabold">
                        Cost Price
                      </span>
                      {costPrice ? (
                        <span className="text-sm font-bold text-slate-700 font-mono">
                          ₹{costPrice.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Not provided</span>
                      )}
                    </div>
                  </div>

                  {/* Garment Specifications Grid */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <span className="text-navy font-extrabold text-[11px] uppercase tracking-wider block">
                      Catalog &amp; Garment Specifications
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 text-[10px] font-bold block uppercase">
                          Brand
                        </span>
                        <strong className="text-navy font-extrabold">
                          {product.brand || product.brandRef?.name || 'Self-Manufactured'}
                        </strong>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 text-[10px] font-bold block uppercase">
                          Category
                        </span>
                        <strong className="text-slate-800 font-extrabold">
                          {product.category?.name || 'Couture'}
                        </strong>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 text-[10px] font-bold block uppercase">
                          Department / Gender
                        </span>
                        <strong className="text-slate-800 font-extrabold uppercase">
                          {product.gender || 'Unisex'}
                        </strong>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 text-[10px] font-bold block uppercase">
                          Fabric / Material
                        </span>
                        <strong className="text-slate-800 font-extrabold">
                          {product.fabric || 'Standard / Unspecified'}
                        </strong>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 text-[10px] font-bold block uppercase">
                          Fit Type
                        </span>
                        <strong className="text-slate-800 font-extrabold">
                          {product.fit || 'Regular'}
                        </strong>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 text-[10px] font-bold block uppercase">
                          Occasion
                        </span>
                        <strong className="text-slate-800 font-extrabold truncate block">
                          {product.occasion || 'Casual / Everyday'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Description Preview */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                    <span className="text-slate-500 block text-[10px] uppercase font-extrabold">
                      Product Description Summary
                    </span>
                    <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-line line-clamp-3">
                      {product.description || 'No description provided.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: Variants Matrix */}
              {activeTab === 'variants' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                    <div>
                      <span className="font-extrabold text-navy text-xs block">
                        Variants Matrix ({variants.length})
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Total Combined Variant Inventory:{' '}
                        <strong className="text-navy">{totalVariantStock} Units</strong>
                      </span>
                    </div>
                    <span className="px-2.5 py-1 bg-navy/5 text-navy border border-navy/20 rounded-lg text-[10px] font-bold">
                      {variants.length} Matrix Combinations
                    </span>
                  </div>

                  {variants.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
                      <Layers className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
                      <p className="font-bold text-xs">
                        No individual size/color variants defined.
                      </p>
                      <span className="text-[11px] text-slate-400 block">
                        This item sells as a single standard product using the base price and stock.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                      {variants.map((v: any, idx: number) => {
                        const hex = COLOR_HEX_MAP[v.color] || '#94a3b8';
                        const vPrice = Number(v.price || 0);
                        const vCompare = Number(v.compareAtPrice || 0);

                        return (
                          <div
                            key={v.id || idx}
                            className="p-3 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:border-slate-300 transition-all flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Variant Photo Thumbnail */}
                              <div
                                onClick={() => v.imageUrl && setActiveImage(v.imageUrl)}
                                className={`relative w-11 h-12 rounded-xl overflow-hidden border shrink-0 flex items-center justify-center transition-all ${
                                  v.imageUrl
                                    ? 'border-slate-200 bg-slate-50 cursor-pointer hover:border-orange'
                                    : 'border-dashed border-slate-200 bg-slate-50 text-slate-300'
                                }`}
                                title={
                                  v.imageUrl ? 'Click to preview variant photo' : 'No variant photo'
                                }
                              >
                                {v.imageUrl ? (
                                  <img
                                    src={v.imageUrl}
                                    alt={v.name || 'Variant'}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon className="w-4 h-4 opacity-40" />
                                )}
                              </div>

                              {/* Attributes & SKU */}
                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-extrabold text-navy text-xs">
                                    Size: {v.size || 'Free Size'}
                                  </span>
                                  <span className="text-slate-300">•</span>
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                                      style={{ backgroundColor: hex }}
                                    />
                                    <span className="font-bold text-slate-700 text-xs">
                                      {v.color || 'Default'}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono font-medium truncate">
                                  SKU: <span className="text-navy font-bold">{v.sku}</span>
                                </div>
                              </div>
                            </div>

                            {/* Pricing & Stock */}
                            <div className="text-right shrink-0 space-y-0.5">
                              <div className="flex items-center gap-1.5 justify-end">
                                <span className="font-mono font-extrabold text-emerald-700 text-xs sm:text-sm">
                                  ₹{vPrice.toLocaleString('en-IN')}
                                </span>
                                {vCompare > vPrice && (
                                  <span className="text-[10px] font-medium text-slate-400 line-through font-mono">
                                    ₹{vCompare.toLocaleString('en-IN')}
                                  </span>
                                )}
                              </div>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block ${
                                  Number(v.stock) > 0
                                    ? 'bg-slate-100 text-slate-700'
                                    : 'bg-rose-50 text-rose-700'
                                }`}
                              >
                                {v.stock} Stock
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Policies & Tax */}
              {activeTab === 'compliance' && (
                <div className="space-y-4 animate-fade-in">
                  {/* Return & Replacement Policy */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <span className="text-navy font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-navy" /> Return &amp; Replacement
                      Policy
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">
                          Customer Returns
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              product.returnAllowed ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <strong className="text-navy font-bold">
                            {product.returnAllowed
                              ? `Allowed (${product.returnWindowDays || 3} Days Window)`
                              : 'Not Allowed / Final Sale'}
                          </strong>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">
                          Customer Replacements
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              product.replacementAllowed ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <strong className="text-navy font-bold">
                            {product.replacementAllowed
                              ? `Allowed (${product.replacementWindowDays || 7} Days Window)`
                              : 'Not Allowed'}
                          </strong>
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      Policy Mode:{' '}
                      <span className="font-bold text-slate-700">
                        {product.returnPolicyType || 'RETURN_AND_REPLACEMENT'}
                      </span>
                    </div>
                  </div>

                  {/* Taxation & Compliance */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <span className="text-navy font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-navy" /> Tax &amp; HSN Compliance
                    </span>
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">
                          HSN Code
                        </span>
                        <strong className="text-navy font-mono font-bold text-xs">
                          {product.hsnCode || 'Not provided'}
                        </strong>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">
                          GST Tax Rate
                        </span>
                        <strong className="text-navy font-mono font-bold text-xs">
                          {product.taxRate ? `${product.taxRate}% GST` : '0% (Standard / Exempt)'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Configuration */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <span className="text-navy font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-navy" /> Shipping Configuration
                    </span>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">
                          Shipping Mode
                        </span>
                        <strong className="text-navy font-bold">
                          {product.specialShippingMode || 'STANDARD'}
                        </strong>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">
                          Special Rate
                        </span>
                        <strong className="text-slate-700 font-bold">
                          {product.specialShippingRate
                            ? `₹${product.specialShippingRate}`
                            : 'Standard Shipping Applies'}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Description & SEO */}
              {activeTab === 'seo' && (
                <div className="space-y-4 animate-fade-in">
                  {/* Full Product Description */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                    <span className="text-navy font-extrabold text-[11px] uppercase tracking-wider block">
                      Full Product Description
                    </span>
                    <div className="max-h-48 overflow-y-auto p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-medium leading-relaxed whitespace-pre-wrap text-[11px]">
                      {product.description || 'No description entered by merchant.'}
                    </div>
                  </div>

                  {/* Enterprise SEO Metadata */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <span className="text-navy font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-navy" /> Search Engine Optimization
                      (SEO)
                    </span>
                    <div className="space-y-2 text-[11px]">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">
                          Meta Title
                        </span>
                        <strong className="text-navy font-bold block">
                          {product.metaTitle || product.name}
                        </strong>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">
                          Meta Description
                        </span>
                        <p className="text-slate-700 font-medium leading-relaxed">
                          {product.metaDescription || product.description?.slice(0, 160) || 'None'}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-slate-400 text-[10px] font-bold uppercase block">
                            Focus Keyword
                          </span>
                          <span className="text-slate-800 font-bold">
                            {product.focusKeyword || 'None'}
                          </span>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-slate-400 text-[10px] font-bold uppercase block">
                            Product URL Slug
                          </span>
                          <span className="text-navy font-mono font-bold truncate block">
                            /{product.category?.slug || 'products'}/{product.slug}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rejection Form Input */}
          {isRejecting && (
            <form
              onSubmit={handleRejectSubmit}
              className="p-5 bg-rose-50 border border-rose-200 rounded-3xl space-y-4 animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-rose-900 text-sm flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" /> Provide Rejection Reason for
                  Seller Notification
                </h3>
                <span className="text-[10px] font-bold text-rose-600">
                  Seller will be notified to revise submission
                </span>
              </div>

              {/* Quick Preset Chips */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                  Quick Reason Presets (Click to insert):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {REJECTION_PRESETS.map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() =>
                        setRejectReason((prev) => (prev ? `${prev}. ${preset}` : preset))
                      }
                      className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer shadow-2xs"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                required
                rows={3}
                placeholder="Explain clearly what needs to be corrected before this product can be published live..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-white border border-rose-300 rounded-2xl p-3.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-medium"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRejecting(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold text-xs cursor-pointer shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Sending...' : 'Confirm Rejection & Send Reason'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Action Footer */}
        {!isRejecting && (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-2xs"
            >
              Close Inspection
            </button>
            {isSupervisor ? (
              <span className="text-xs font-bold text-sky-800 bg-sky-100 border border-sky-300 px-3.5 py-1.5 rounded-full">
                ℹ️ Supervisor Read-Only Inspection Mode
              </span>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsRejecting(true)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  Reject Submission ✕
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmitting ? 'Publishing...' : 'Approve & Publish Live ✓'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
