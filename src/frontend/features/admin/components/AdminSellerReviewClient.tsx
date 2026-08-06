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

interface AdminSellerReviewClientProps {
  shopData: any;
}

export function AdminSellerReviewClient({ shopData }: AdminSellerReviewClientProps) {
  const [shop, setShop] = useState(shopData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Form states for actions
  const [actionMode, setActionMode] = useState<'none' | 'approve' | 'reject' | 'request_changes'>(
    'none',
  );
  const [commissionRate, setCommissionRate] = useState(
    shop.commissionRate ? Number(shop.commissionRate) : 10.0,
  );
  const [verificationBadge, setVerificationBadge] = useState(
    shop.verificationBadge || 'VERIFIED_SELLER',
  );
  const [rejectionReason, setRejectionReason] = useState('');
  const [changeNotes, setChangeNotes] = useState('');

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
        setShop((prev: any) => ({ ...prev, status: 'APPROVED' }));
        setActionMode('none');
      } else {
        showToast(data.message || 'Failed to approve seller.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'An error occurred.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showToast('Please enter a rejection reason.', 'error');
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
        showToast(data.message || 'Seller application rejected.', 'success');
        setShop((prev: any) => ({ ...prev, status: 'REJECTED' }));
        setActionMode('none');
      } else {
        showToast(data.message || 'Failed to reject seller application.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'An error occurred.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!changeNotes.trim()) {
      showToast('Please enter change request notes.', 'error');
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
        showToast(data.message || 'Status updated to Under Review.', 'success');
        setShop((prev: any) => ({ ...prev, status: 'UNDER_REVIEW' }));
        setActionMode('none');
      } else {
        showToast(data.message || 'Failed to update seller status.', 'error');
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
    <div className="p-6 md:p-10 space-y-8 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border flex items-center justify-between transition-all ${
            toastMessage.type === 'error'
              ? 'bg-rose-950/80 border-rose-500/30 text-rose-200'
              : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
          }`}
        >
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Bar Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <Link
            href="/admin/sellers"
            className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-bold hover:underline mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Sellers Governance
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Building2 className="w-8 h-8 text-amber-400" />
              {shop.name}
            </h1>
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full border uppercase tracking-wider ${
                shop.status === 'APPROVED'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : shop.status === 'PENDING_VERIFICATION'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                    : shop.status === 'REJECTED'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
              }`}
            >
              {shop.status}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Shop ID: <span className="text-amber-400">{shop.id}</span> | Submitted: {submissionTime}
          </p>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setActionMode('approve')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Approve Seller
          </button>
          <button
            onClick={() => setActionMode('request_changes')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            Request Changes
          </button>
          <button
            onClick={() => setActionMode('reject')}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            Reject Application
          </button>
        </div>
      </div>

      {/* ACTION PANELS */}
      {actionMode === 'approve' && (
        <div className="p-6 bg-emerald-950/60 border-2 border-emerald-500/40 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-emerald-300 uppercase tracking-wider">
            Configure & Confirm Seller Approval
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                Commission Rate (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                Verification Badge
              </label>
              <select
                value={verificationBadge}
                onChange={(e) => setVerificationBadge(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-xs"
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
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Processing Approval...' : 'Confirm Seller Approval ✓'}
            </button>
          </div>
        </div>
      )}

      {actionMode === 'request_changes' && (
        <div className="p-6 bg-indigo-950/60 border-2 border-indigo-500/40 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider">
            Request Changes / Mark Under Review
          </h3>
          <div>
            <textarea
              rows={3}
              placeholder="Specify required changes or document clarifications for the seller..."
              value={changeNotes}
              onChange={(e) => setChangeNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={() => setActionMode('none')}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleRequestChanges}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Updating Status...' : 'Send Change Request ⏳'}
            </button>
          </div>
        </div>
      )}

      {actionMode === 'reject' && (
        <div className="p-6 bg-rose-950/60 border-2 border-rose-500/40 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-rose-300 uppercase tracking-wider">
            Provide Application Rejection Reason
          </h3>
          <div>
            <textarea
              rows={3}
              placeholder="e.g. GSTIN certificate mismatch or unverified PAN tax documentation..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={() => setActionMode('none')}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Rejecting...' : 'Confirm Rejection ✕'}
            </button>
          </div>
        </div>
      )}

      {/* Main Review Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seller & Owner Profile */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <User className="w-4 h-4" />
            Seller & Owner Details
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Applicant Name:</span>
              <span className="font-bold text-white">{owner.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Email Address:</span>
              <span className="font-bold text-amber-300 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> {owner.email}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Contact Mobile:</span>
              <span className="font-bold text-slate-200 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-amber-400" />{' '}
                {owner.mobile || shop.phone || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Account Role & Status:</span>
              <span className="font-mono text-emerald-400">
                {owner.role} ({owner.approvalStatus})
              </span>
            </div>
          </div>
        </div>

        {/* Business & Tax Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Business & Tax Registrations
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Legal Registered Name:</span>
              <span className="font-bold text-white">{profile.legalName || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">PAN Number:</span>
              <span className="font-mono font-bold text-amber-300">
                {shop.panNumber || profile.panNumber || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">GSTIN Number:</span>
              <span className="font-mono font-bold text-amber-300">
                {shop.gstin || profile.gstin || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Commission Rate:</span>
              <span className="font-bold text-emerald-400">
                {shop.commissionRate ? `${shop.commissionRate}%` : '10.00%'}
              </span>
            </div>
          </div>
        </div>

        {/* Pickup Address */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Pickup Warehouse Address
          </h2>
          <div className="space-y-2 text-xs">
            <p className="text-slate-200 font-medium">
              {shop.fullAddress || primaryAddress.addressLine1 || profile.businessAddress || 'N/A'}
            </p>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-400 block">City</span>
                <span className="font-bold text-white">{shop.city || profile.city || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">State</span>
                <span className="font-bold text-white">{shop.state || profile.state || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Pincode</span>
                <span className="font-mono font-bold text-amber-300">
                  {shop.pincode || profile.pincode || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Settlement Bank Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Settlement Bank Account & UPI
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Account Holder Name:</span>
              <span className="font-bold text-white">
                {shop.bankAccountHolder || profile.bankAccountHolder || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Bank Name & Account:</span>
              <span className="font-bold text-white">
                {shop.bankName || profile.bankName || 'N/A'} (
                {shop.bankAccountNumber || profile.bankAccountNumber || 'N/A'})
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">IFSC Code & UPI:</span>
              <span className="font-mono font-bold text-amber-300">
                {shop.bankIfscCode || profile.bankIfscCode || 'N/A'} | {profile.upiId || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* UPLOADED DOCUMENTS SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <FileCheck className="w-4 h-4" />
          Uploaded Documents & Verification Proofs ({documents.length})
        </h2>

        {documents.length === 0 ? (
          <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl text-xs">
            No verification documents attached with this submission.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {documents.map((doc: any) => (
              <div
                key={doc.id}
                className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3"
              >
                <div>
                  <span className="text-xs font-extrabold text-white uppercase tracking-wider block">
                    {doc.documentType}
                  </span>
                  <span className="text-[10px] text-amber-400 font-semibold block mt-0.5">
                    Status: {doc.status}
                  </span>
                </div>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
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
