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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-navy line-clamp-1">{product.name}</h2>
              <span className="text-xs text-amber-700 font-mono font-bold">SKU: {product.sku}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-800">
          {/* Seller Shop Banner */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                  Merchant Boutique
                </span>
                <strong className="text-navy text-sm font-extrabold">
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
              <span className="font-bold text-white block uppercase tracking-wider text-[11px]">
                Product Gallery ({product.images?.length || 0})
              </span>
              <div className="aspect-[3/4] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                {primaryImg?.imageUrl ? (
                  <img
                    src={primaryImg.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    No Image
                  </div>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images?.map((img: any) => (
                  <div
                    key={img.id}
                    className="w-14 h-14 bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shrink-0"
                  >
                    <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

            {/* Product Metadata & Price */}
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Selling Price
                  </span>
                  <span className="text-lg font-extrabold text-emerald-400 font-mono">
                    ₹{Number(product.price || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Base Inventory
                  </span>
                  <span className="text-lg font-extrabold text-white font-mono">
                    {product.stock} Units
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Category
                  </span>
                  <span className="font-semibold text-slate-200">
                    {product.category?.name || 'Couture'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Status
                  </span>
                  <span className="font-bold text-amber-400 uppercase">{product.status}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">
                  Product Description
                </span>
                <p className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-slate-200 line-clamp-4">
                  {product.description}
                </p>
              </div>

              {/* Variants Matrix */}
              {product.variants?.length > 0 && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-2">
                    Size & Color Variants ({product.variants.length})
                  </span>
                  <div className="max-h-32 overflow-y-auto space-y-1.5 p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                    {product.variants.map((v: any) => (
                      <div
                        key={v.id}
                        className="flex justify-between items-center text-[11px] p-2 bg-slate-900 rounded-lg"
                      >
                        <span className="font-bold text-amber-300">
                          Size: {v.size || 'STD'} | Color: {v.color || 'Default'}
                        </span>
                        <span className="font-mono text-emerald-400">
                          ₹{Number(v.price).toLocaleString('en-IN')} ({v.stock} Stock)
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
              className="p-4 bg-rose-950/40 border border-rose-500/30 rounded-2xl space-y-3"
            >
              <h3 className="font-bold text-rose-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Provide Rejection Reason for Seller Notification
              </h3>
              <textarea
                required
                rows={3}
                placeholder="Explain why this product submission does not comply with Navya Collection catalog standards..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-slate-950 border border-rose-500/30 rounded-xl p-3 text-xs text-white focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRejecting(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs shadow-lg"
                >
                  Confirm Rejection & Send Reason
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Action Footer */}
        {!isRejecting && (
          <div className="p-6 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs"
            >
              Close Inspection
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsRejecting(true)}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
              >
                Reject Submission ✕
              </button>
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve & Publish Live ✓
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
