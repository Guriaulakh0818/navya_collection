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

import { useAuthStore } from '@/stores';

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
  const user = useAuthStore((s) => s.user);
  const isSupervisor = String(user?.role) === 'SUPERVISOR';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
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
                          : 'bg-indigo-50 text-indigo-800 border-indigo-300'
                  }`}
                >
                  {shop.status}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Slug: <span className="font-mono text-amber-700 font-bold">{shop.slug}</span> |
                Owner: <span className="font-semibold text-slate-800">{owner.name}</span> (
                {owner.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/admin/sellers/${shop.id}`}
              className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 shadow-xs"
            >
              Open Review Page <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-4 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'details'
                ? 'border-amber-500 text-amber-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Merchant Profile & Bank Details
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 px-4 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'documents'
                ? 'border-amber-500 text-amber-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            Uploaded Documents ({documents.length})
          </button>
          {!isSupervisor && (
            <button
              onClick={() => setActiveTab('actions')}
              className={`py-3 px-4 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'actions'
                  ? 'border-amber-500 text-amber-800'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Approval & Governance Actions
            </button>
          )}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Primary Owner Info */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-600" />
                  Primary Owner Profile
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px] font-medium">Full Name</span>
                    <span className="font-bold text-slate-900">{owner.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] font-medium">
                      Email Address
                    </span>
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-amber-600" />
                      {owner.email || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] font-medium">
                      Contact Phone
                    </span>
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-amber-600" />
                      {owner.mobile || shop.phone || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tax & Business Structure */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  Business Tax & Legal Registration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px] font-medium">
                      Legal Registered Name
                    </span>
                    <span className="font-bold text-slate-900">{profile.legalName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] font-medium">PAN Number</span>
                    <span className="font-mono font-extrabold text-amber-800">
                      {profile.panNumber || shop.panNumber || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] font-medium">
                      GSTIN Number
                    </span>
                    <span className="font-mono font-extrabold text-amber-800">
                      {profile.gstin || shop.gstin || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Physical Address */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  Shop & Pickup Warehouse Address
                </h3>
                <p className="text-xs font-semibold text-slate-800">
                  {shop.fullAddress ||
                    primaryAddress.addressLine1 ||
                    profile.businessAddress ||
                    'N/A'}
                </p>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px] font-medium">City</span>
                    <span className="font-bold text-slate-900">
                      {shop.city || profile.city || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] font-medium">State</span>
                    <span className="font-bold text-slate-900">
                      {shop.state || profile.state || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] font-medium">Pincode</span>
                    <span className="font-mono font-bold text-slate-900">
                      {shop.pincode || profile.pincode || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Settlement Bank & UPI */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-amber-600" />
                  Settlement Bank Account & Payout UPI
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px] font-medium">
                      Account Holder Name
                    </span>
                    <span className="font-bold text-slate-900">
                      {shop.bankAccountHolder || profile.bankAccountHolder || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] font-medium">
                      Bank Name & Account
                    </span>
                    <span className="font-bold text-slate-900">
                      {shop.bankName || profile.bankName || 'N/A'} (
                      {shop.bankAccountNumber || profile.bankAccountNumber || 'N/A'})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] font-medium">
                      IFSC Code & UPI ID
                    </span>
                    <span className="font-mono font-extrabold text-amber-800">
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
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-amber-600" />
                Submitted Documents & Verification Assets
              </h3>

              {documents.length === 0 ? (
                <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 bg-slate-50 rounded-2xl text-xs font-medium">
                  No verification documents were attached with this seller application.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-900 block uppercase tracking-wider">
                          {doc.documentType}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                          Status:{' '}
                          <span className="text-amber-700 font-extrabold">{doc.status}</span>
                        </span>
                      </div>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all shadow-xs"
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
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                Governance & Status Action Controls
              </h3>

              {/* Action Buttons Header */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setActionMode('approve')}
                  className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                    actionMode === 'approve'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve Seller Application
                </button>

                <button
                  onClick={() => setActionMode('reject')}
                  className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                    actionMode === 'reject'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  Reject Application
                </button>

                <button
                  onClick={() => setActionMode('suspend')}
                  className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                    actionMode === 'suspend'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Suspend Active Shop
                </button>
              </div>

              {/* APPROVE ACTION PANEL */}
              {actionMode === 'approve' && (
                <div className="p-5 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-4">
                  <h4 className="text-sm font-extrabold text-emerald-900">
                    Configure Seller Approval Parameters
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Commission Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-mono text-xs font-bold focus:border-emerald-500 focus:outline-none shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Verification Badge
                      </label>
                      <select
                        value={verificationBadge}
                        onChange={(e) => setVerificationBadge(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-xs font-bold focus:border-emerald-500 focus:outline-none shadow-xs cursor-pointer"
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
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting
                      ? 'Approving & Activating Seller...'
                      : 'Confirm Seller Approval ✓'}
                  </button>
                </div>
              )}

              {/* REJECT ACTION PANEL */}
              {actionMode === 'reject' && (
                <div className="p-5 bg-rose-50/80 border border-rose-200 rounded-2xl space-y-4">
                  <h4 className="text-sm font-extrabold text-rose-900">Provide Rejection Reason</h4>

                  <div>
                    <textarea
                      rows={3}
                      placeholder="e.g. GSTIN certificate is invalid or legal entity name does not match bank account details."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-xs font-medium focus:border-rose-500 focus:outline-none shadow-xs"
                    />
                  </div>

                  <button
                    onClick={handleConfirmReject}
                    disabled={isSubmitting}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Rejecting Application...' : 'Confirm Application Rejection ✕'}
                  </button>
                </div>
              )}

              {/* SUSPEND ACTION PANEL */}
              {actionMode === 'suspend' && (
                <div className="p-5 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-4">
                  <h4 className="text-sm font-extrabold text-amber-900">
                    Provide Suspension Reason
                  </h4>

                  <div>
                    <textarea
                      rows={3}
                      placeholder="e.g. High customer complaint rate or counterfeit product listing investigation."
                      value={suspensionReason}
                      onChange={(e) => setSuspensionReason(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-xs font-medium focus:border-amber-500 focus:outline-none shadow-xs"
                    />
                  </div>

                  <button
                    onClick={handleConfirmSuspend}
                    disabled={isSubmitting}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Suspending Shop...' : 'Confirm Shop Suspension ⚠️'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-extrabold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 transition-all cursor-pointer"
          >
            Close Modal
          </button>
        </div>
      </div>
    </div>
  );
}
