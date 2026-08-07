'use client';

import {
  Building2,
  CheckCircle2,
  Eye,
  FileText,
  Image as ImageIcon,
  Layers,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Tag,
  X,
} from 'lucide-react';
import { useState } from 'react';

import { useAuthStore } from '@/stores';

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

  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const primaryImg = product.images?.find((i: any) => i.isPrimary) || product.images?.[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header - Navya Navy & Gold Theme */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-navy text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white line-clamp-1">{product.name}</h2>
              <span className="text-xs text-amber-300 font-mono font-bold">SKU: {product.sku}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-800 bg-white">
          {/* Seller Shop Banner */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-extrabold tracking-wider">
                  Merchant Boutique
                </span>
                <strong className="text-navy text-sm font-black">
                  {shop.name || 'Merchant Shop'}
                </strong>
                <span className="text-[10px] text-slate-500 block font-medium">
                  Owner: {shop.owner?.name} ({shop.owner?.email})
                </span>
              </div>
            </div>
            <span className="px-3 py-1 text-[10px] font-extrabold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> VERIFIED MERCHANT
            </span>
          </div>

          {/* Product Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Gallery Images */}
            <div className="space-y-3">
              <span className="font-extrabold text-navy block uppercase tracking-wider text-[11px]">
                Product Gallery ({product.images?.length || 0})
              </span>
              <div className="aspect-[3/4] bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden shadow-2xs select-none">
                {primaryImg?.imageUrl ? (
                  <img
                    src={primaryImg.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover select-none overflow-hidden [text-indent:-9999px]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                    No Image
                  </div>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 select-none">
                {product.images?.map((img: any) => (
                  <div
                    key={img.id}
                    className="w-14 h-14 bg-slate-100 border border-slate-200 rounded-xl overflow-hidden shrink-0 select-none"
                  >
                    <img
                      src={img.imageUrl}
                      alt={product.name || ''}
                      className="w-full h-full object-cover select-none overflow-hidden [text-indent:-9999px]"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Product Metadata & Price */}
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-extrabold">
                    Selling Price
                  </span>
                  <span className="text-xl font-black text-emerald-700 font-mono">
                    ₹{Number(product.price || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-extrabold">
                    Base Inventory
                  </span>
                  <span className="text-xl font-black text-navy font-mono">
                    {product.stock} Units
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-extrabold">
                    Category
                  </span>
                  <span className="font-extrabold text-slate-800 text-sm">
                    {product.category?.name || 'Couture'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-extrabold mb-1">
                    Status
                  </span>
                  <span className="font-extrabold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-300 uppercase text-[10px]">
                    {product.status}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-extrabold mb-1">
                  Product Description
                </span>
                <p className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 text-slate-700 font-medium leading-relaxed line-clamp-4">
                  {product.description}
                </p>
              </div>

              {/* Variants Matrix */}
              {product.variants?.length > 0 && (
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-extrabold mb-2">
                    Size &amp; Color Variants ({product.variants.length})
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-slate-50/80 rounded-2xl border border-slate-200">
                    {product.variants.map((v: any) => (
                      <div
                        key={v.id}
                        className="flex justify-between items-center text-[11px] p-2.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs"
                      >
                        <span className="font-bold text-navy">
                          Size: {v.size || 'Free Size'} | Color: {v.color || 'Default'}
                        </span>
                        <span className="font-mono font-extrabold text-emerald-700">
                          ₹{Number(v.price).toLocaleString('en-IN')}{' '}
                          <span className="text-slate-500 font-sans font-normal">
                            ({v.stock} Stock)
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rejection Form Input */}
          {isRejecting && (
            <form
              onSubmit={handleRejectSubmit}
              className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3"
            >
              <h3 className="font-extrabold text-rose-900 text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" /> Provide Rejection Reason for
                Seller Notification
              </h3>
              <textarea
                required
                rows={3}
                placeholder="Explain why this product submission does not comply with Navya Collection catalog standards..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-white border border-rose-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-medium"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRejecting(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-extrabold text-xs shadow-md cursor-pointer"
                >
                  Confirm Rejection &amp; Send Reason
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Action Footer */}
        {!isRejecting && (
          <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-100/90 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-2xs"
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
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Reject Submission ✕
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve &amp; Publish Live ✓
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
