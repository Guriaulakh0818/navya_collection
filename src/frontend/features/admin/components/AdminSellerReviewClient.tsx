'use client';

import {
  ArrowLeft,
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
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export function AdminSellerReviewClient({
  shop: propShop,
  shopData,
}: {
  shop?: any;
  shopData?: any;
}) {
  const shop = propShop || shopData || {};
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMode, setActionMode] = useState<'none' | 'approve' | 'request_changes' | 'reject'>(
    'none',
  );
  const [commissionRate, setCommissionRate] = useState<number>(shop.commissionRate || 10.0);
  const [verificationBadge, setVerificationBadge] = useState<string>(
    shop.verificationBadge || 'VERIFIED_SELLER',
  );
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [changeNotes, setChangeNotes] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const owner = shop.owner || {};
  const profile = shop.sellerProfile || {};
  const addresses = shop.addresses || [];
  const primaryAddress = addresses[0] || {};
  const documents = shop.documents || [];

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/admin/sellers/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: shop.id,
          commissionRate,
          verificationBadge,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Seller approved successfully!', 'success');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showToast(data.message || 'Failed to approve seller.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'An error occurred.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!changeNotes.trim()) {
      showToast('Please specify the changes required.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/admin/sellers/request-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: shop.id,
          notes: changeNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Change request dispatched to seller.', 'success');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showToast(data.message || 'Failed to request changes.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'An error occurred.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showToast('Please specify a rejection reason.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/admin/sellers/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: shop.id,
          rejectionReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Seller application rejected.', 'success');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showToast(data.message || 'Failed to reject seller.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'An error occurred.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submissionTime = new Date(shop.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="p-6 md:p-10 space-y-8 bg-slate-50 min-h-screen text-slate-900 font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border flex items-center justify-between transition-all ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-800'
              : 'bg-emerald-50 border-emerald-300 text-emerald-800'
          }`}
        >
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Bar Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <Link
            href="/admin/sellers"
            className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-bold hover:text-navy hover:underline mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Sellers Governance
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-navy tracking-tight flex items-center gap-3">
              <Building2 className="w-8 h-8 text-amber-600 shrink-0" />
              {shop.name}
            </h1>
            <span
              className={`px-3 py-1 text-xs font-extrabold rounded-full border uppercase tracking-wider ${
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
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Shop ID: <span className="text-amber-800 font-bold">{shop.id}</span> | Submitted:{' '}
            {submissionTime}
          </p>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setActionMode('approve')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            Approve Seller
          </button>
          <button
            onClick={() => setActionMode('request_changes')}
            className="px-4 py-2.5 bg-navy hover:bg-navy/90 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Clock className="w-4 h-4" />
            Request Changes
          </button>
          <button
            onClick={() => setActionMode('reject')}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <ShieldAlert className="w-4 h-4" />
            Reject Application
          </button>
        </div>
      </div>

      {/* ACTION PANELS */}
      {actionMode === 'approve' && (
        <div className="p-6 bg-emerald-50/80 border border-emerald-200 rounded-3xl space-y-4 shadow-sm">
          <h3 className="text-sm font-extrabold text-emerald-900 uppercase tracking-wider">
            Configure & Confirm Seller Approval
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
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
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
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
          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={() => setActionMode('none')}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Processing Approval...' : 'Confirm Seller Approval ✓'}
            </button>
          </div>
        </div>
      )}

      {actionMode === 'request_changes' && (
        <div className="p-6 bg-indigo-50/80 border border-indigo-200 rounded-3xl space-y-4 shadow-sm">
          <h3 className="text-sm font-extrabold text-indigo-900 uppercase tracking-wider">
            Request Changes / Mark Under Review
          </h3>
          <div>
            <textarea
              rows={3}
              placeholder="Specify required changes or document clarifications for the seller..."
              value={changeNotes}
              onChange={(e) => setChangeNotes(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-medium focus:border-indigo-500 focus:outline-none shadow-xs"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={() => setActionMode('none')}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleRequestChanges}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-navy hover:bg-navy/90 text-white font-extrabold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Updating Status...' : 'Send Change Request ⏳'}
            </button>
          </div>
        </div>
      )}

      {actionMode === 'reject' && (
        <div className="p-6 bg-rose-50/80 border border-rose-200 rounded-3xl space-y-4 shadow-sm">
          <h3 className="text-sm font-extrabold text-rose-900 uppercase tracking-wider">
            Provide Application Rejection Reason
          </h3>
          <div>
            <textarea
              rows={3}
              placeholder="e.g. GSTIN certificate mismatch or unverified PAN tax documentation..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-medium focus:border-rose-500 focus:outline-none shadow-xs"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={() => setActionMode('none')}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Rejecting...' : 'Confirm Rejection ✕'}
            </button>
          </div>
        </div>
      )}

      {/* Main Review Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seller & Owner Profile */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-2">
            <User className="w-4 h-4 text-amber-600" />
            Seller & Owner Details
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Applicant Name:</span>
              <span className="font-bold text-slate-900">{owner.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Email Address:</span>
              <span className="font-bold text-amber-800 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-amber-600" /> {owner.email}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Contact Mobile:</span>
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-amber-600" />{' '}
                {owner.mobile || shop.phone || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Account Role & Status:</span>
              <span className="font-mono font-bold text-emerald-700">
                {owner.role} ({owner.approvalStatus})
              </span>
            </div>
          </div>
        </div>

        {/* Business & Tax Details */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-600" />
            Business & Tax Registrations
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Legal Registered Name:</span>
              <span className="font-bold text-slate-900">{profile.legalName || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">PAN Number:</span>
              <span className="font-mono font-extrabold text-amber-800">
                {shop.panNumber || profile.panNumber || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">GSTIN Number:</span>
              <span className="font-mono font-extrabold text-amber-800">
                {shop.gstin || profile.gstin || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Commission Rate:</span>
              <span className="font-bold text-emerald-700">
                {shop.commissionRate ? `${shop.commissionRate}%` : '10.00%'}
              </span>
            </div>
          </div>
        </div>

        {/* Pickup Address */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-600" />
            Pickup Warehouse Address
          </h2>
          <div className="space-y-2 text-xs">
            <p className="text-slate-800 font-bold">
              {shop.fullAddress || primaryAddress.addressLine1 || profile.businessAddress || 'N/A'}
            </p>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px]">
              <div>
                <span className="text-slate-500 block font-medium">City</span>
                <span className="font-bold text-slate-900">
                  {shop.city || profile.city || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">State</span>
                <span className="font-bold text-slate-900">
                  {shop.state || profile.state || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Pincode</span>
                <span className="font-mono font-extrabold text-amber-800">
                  {shop.pincode || profile.pincode || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Settlement Bank Details */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-amber-600" />
            Settlement Bank Account & UPI
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Account Holder Name:</span>
              <span className="font-bold text-slate-900">
                {shop.bankAccountHolder || profile.bankAccountHolder || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Bank Name & Account:</span>
              <span className="font-bold text-slate-900">
                {shop.bankName || profile.bankName || 'N/A'} (
                {shop.bankAccountNumber || profile.bankAccountNumber || 'N/A'})
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">IFSC Code & UPI:</span>
              <span className="font-mono font-extrabold text-amber-800">
                {shop.bankIfscCode || profile.bankIfscCode || 'N/A'} | {profile.upiId || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* UPLOADED DOCUMENTS SECTION */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-amber-600" />
          Uploaded Documents & Verification Proofs ({documents.length})
        </h2>

        {documents.length === 0 ? (
          <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 bg-slate-50 rounded-2xl text-xs font-medium">
            No verification documents attached with this submission.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {documents.map((doc: any) => (
              <div
                key={doc.id}
                className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3"
              >
                <div>
                  <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block">
                    {doc.documentType}
                  </span>
                  <span className="text-[10px] text-amber-700 font-bold block mt-0.5">
                    Status: {doc.status}
                  </span>
                </div>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  Inspect Document <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
