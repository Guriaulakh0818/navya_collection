'use client';

import {
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  FileText,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  ShieldCheck,
  User,
  Wallet,
  X,
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

interface SellerDetailModalProps {
  shop: any | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (shopId: string, commissionRate: number, verificationBadge: string) => Promise<void>;
  onReject: (shopId: string, reason: string) => Promise<void>;
  onSuspend: (shopId: string, reason: string) => Promise<void>;
}

export function SellerDetailModal({
  shop,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onSuspend,
}: SellerDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'actions'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [suspensionReason, setSuspensionReason] = useState('');
  const [commissionRate, setCommissionRate] = useState(10.0);
  const [verificationBadge, setVerificationBadge] = useState('VERIFIED_SELLER');
  const [actionMode, setActionMode] = useState<'none' | 'approve' | 'reject' | 'suspend'>('none');

  if (!isOpen || !shop) return null;

  const owner = shop.owner || {};
  const profile = shop.sellerProfile || {};
  const addresses = shop.addresses || [];
  const primaryAddress = addresses[0] || {};
  const documents = shop.documents || [];

  const handleConfirmApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(shop.id, commissionRate, verificationBadge);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onReject(shop.id, rejectionReason);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSuspend = async () => {
    if (!suspensionReason.trim()) {
      alert('Please enter a suspension reason.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSuspend(shop.id, suspensionReason);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-navy flex items-center gap-2">
                {shop.name}
                <span
                  className={`px-2.5 py-0.5 text-xs font-extrabold rounded-full border ${
                    shop.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : shop.status === 'PENDING_VERIFICATION'
                        ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                        : shop.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {shop.status}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Slug: <span className="font-mono text-amber-400">{shop.slug}</span> | Owner:{' '}
                {owner.name} ({owner.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/admin/sellers/${shop.id}`}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
            >
              Open Review Page <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 gap-2">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'details'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Merchant Profile & Bank Details
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'documents'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            Uploaded Documents ({documents.length})
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'actions'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Approval & Governance Actions
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Primary Owner Info */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Primary Owner Profile
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Full Name</span>
                    <span className="font-semibold text-white">{owner.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Email Address</span>
                    <span className="font-semibold text-slate-200 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-amber-400" />
                      {owner.email || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Contact Phone</span>
                    <span className="font-semibold text-slate-200 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-amber-400" />
                      {owner.mobile || shop.phone || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tax & Business Structure */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Business Tax & Legal Registration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Legal Registered Name</span>
                    <span className="font-semibold text-white">{profile.legalName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">PAN Number</span>
                    <span className="font-mono font-semibold text-amber-300">
                      {profile.panNumber || shop.panNumber || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">GSTIN Number</span>
                    <span className="font-mono font-semibold text-amber-300">
                      {profile.gstin || shop.gstin || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Physical Address */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Shop & Pickup Warehouse Address
                </h3>
                <p className="text-xs text-slate-200">
                  {shop.fullAddress ||
                    primaryAddress.addressLine1 ||
                    profile.businessAddress ||
                    'N/A'}
                </p>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">City</span>
                    <span className="font-semibold text-white">
                      {shop.city || profile.city || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">State</span>
                    <span className="font-semibold text-white">
                      {shop.state || profile.state || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Pincode</span>
                    <span className="font-mono font-semibold text-white">
                      {shop.pincode || profile.pincode || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Settlement Bank & UPI */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Settlement Bank Account & Payout UPI
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Account Holder Name</span>
                    <span className="font-semibold text-white">
                      {shop.bankAccountHolder || profile.bankAccountHolder || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Bank Name & Account</span>
                    <span className="font-semibold text-white">
                      {shop.bankName || profile.bankName || 'N/A'} (
                      {shop.bankAccountNumber || profile.bankAccountNumber || 'N/A'})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">IFSC Code & UPI ID</span>
                    <span className="font-mono font-semibold text-amber-300">
                      {shop.bankIfscCode || profile.bankIfscCode || 'N/A'} |{' '}
                      {profile.upiId || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                Submitted Documents & Verification Assets
              </h3>

              {documents.length === 0 ? (
                <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  No verification documents were attached with this seller application.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-white block uppercase tracking-wider">
                          {doc.documentType}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Status: <span className="text-amber-400 font-semibold">{doc.status}</span>
                        </span>
                      </div>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                      >
                        View File <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Governance & Status Action Controls
              </h3>

              {/* Action Buttons Header */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setActionMode('approve')}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                    actionMode === 'approve'
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve Seller Application
                </button>

                <button
                  onClick={() => setActionMode('reject')}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                    actionMode === 'reject'
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  Reject Application
                </button>

                <button
                  onClick={() => setActionMode('suspend')}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                    actionMode === 'suspend'
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Suspend Active Shop
                </button>
              </div>

              {/* APPROVE ACTION PANEL */}
              {actionMode === 'approve' && (
                <div className="p-5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-4">
                  <h4 className="text-sm font-bold text-emerald-300">
                    Configure Seller Approval Parameters
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                        Commission Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                        Verification Badge
                      </label>
                      <select
                        value={verificationBadge}
                        onChange={(e) => setVerificationBadge(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white"
                      >
                        <option value="VERIFIED_SELLER">VERIFIED_SELLER</option>
                        <option value="TRUSTED_SELLER">TRUSTED_SELLER</option>
                        <option value="TOP_RATED">TOP_RATED</option>
                        <option value="PREMIUM_STORE">PREMIUM_STORE</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmApprove}
                    disabled={isSubmitting}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
                  >
                    {isSubmitting
                      ? 'Approving & Activating Seller...'
                      : 'Confirm Seller Approval ✓'}
                  </button>
                </div>
              )}

              {/* REJECT ACTION PANEL */}
              {actionMode === 'reject' && (
                <div className="p-5 bg-rose-950/40 border border-rose-500/30 rounded-xl space-y-4">
                  <h4 className="text-sm font-bold text-rose-300">Provide Rejection Reason</h4>

                  <div>
                    <textarea
                      rows={3}
                      placeholder="e.g. GSTIN certificate is invalid or legal entity name does not match bank account details."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white"
                    />
                  </div>

                  <button
                    onClick={handleConfirmReject}
                    disabled={isSubmitting}
                    className="w-full py-3 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/25 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Rejecting Application...' : 'Confirm Application Rejection ✕'}
                  </button>
                </div>
              )}

              {/* SUSPEND ACTION PANEL */}
              {actionMode === 'suspend' && (
                <div className="p-5 bg-amber-950/40 border border-amber-500/30 rounded-xl space-y-4">
                  <h4 className="text-sm font-bold text-amber-300">Provide Suspension Reason</h4>

                  <div>
                    <textarea
                      rows={3}
                      placeholder="e.g. High customer complaint rate or counterfeit product listing investigation."
                      value={suspensionReason}
                      onChange={(e) => setSuspensionReason(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white"
                    />
                  </div>

                  <button
                    onClick={handleConfirmSuspend}
                    disabled={isSubmitting}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Suspending Shop...' : 'Confirm Shop Suspension ⚠️'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            Close Modal
          </button>
        </div>
      </div>
    </div>
  );
}
