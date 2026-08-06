'use client';

import { Building2, CheckCircle2, Clock, Mail, Phone, RefreshCw, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

interface PendingApprovalCardProps {
  shopName?: string;
  applicantName?: string;
  email?: string;
  mobile?: string;
  shopId?: string;
  onRefresh?: () => void;
}

export function PendingApprovalCard({
  shopName = 'Your Boutique Shop',
  applicantName = 'Seller Applicant',
  email = 'seller@example.com',
  mobile = '+91 98765 43210',
  shopId = 'SHOP-PENDING-REF',
  onRefresh,
}: PendingApprovalCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCheckStatus = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    } else {
      window.location.reload();
    }
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className="max-w-3xl mx-auto my-8 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm font-sans text-slate-900">
      {/* Top Banner Status */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 shadow-xs">
            <Clock className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-navy flex items-center gap-2">
              Application Under Review
              <span className="px-2.5 py-0.5 text-xs font-extrabold rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                PENDING APPROVAL
              </span>
            </h2>
            <p className="text-sm text-slate-600 mt-0.5 font-medium">
              Ref ID:{' '}
              <span className="font-mono text-amber-800 font-bold">{shopId.substring(0, 16)}</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleCheckStatus}
          disabled={isRefreshing}
          className="px-4 py-2 text-xs font-extrabold rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-navy transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 text-amber-700 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing Status...' : 'Check Approval Status'}
        </button>
      </div>

      {/* Main Details Body */}
      <div className="py-6 space-y-6">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Submitted Merchant Application Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500 block text-xs font-semibold">Store / Dukan Name</span>
              <span className="font-extrabold text-navy">{shopName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-semibold">Primary Applicant</span>
              <span className="font-extrabold text-navy">{applicantName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-semibold">Email Address</span>
              <span className="font-bold text-slate-700">{email}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-semibold">Registered Phone</span>
              <span className="font-bold text-slate-700">{mobile}</span>
            </div>
          </div>
        </div>

        {/* Next Steps & Verification Process */}
        <div className="space-y-3">
          <h4 className="text-sm font-extrabold text-navy">What happens next?</h4>
          <ul className="space-y-3 text-xs md:text-sm text-slate-700 font-medium">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong className="text-navy font-bold">Document Verification:</strong> Our
                marketplace operations team is validating your GSTIN, PAN, and Bank details.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong className="text-navy font-bold">Expected Timeline:</strong> Approvals are
                typically completed within{' '}
                <strong className="text-amber-800 font-bold">24 to 48 business hours</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                <strong className="text-navy font-bold">Dashboard Unlock:</strong> Once approved,
                your Seller Dashboard will automatically activate, allowing catalog creation and
                shipping setup.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Support Footer */}
      <div className="pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600 font-medium">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-700 font-bold">
            <Mail className="w-4 h-4 text-amber-700" />
            sellers@navyacollection.com
          </span>
          <span className="flex items-center gap-1.5 text-slate-700 font-bold">
            <Phone className="w-4 h-4 text-amber-700" />
            +91 98785 43210
          </span>
        </div>
        <Link
          href="/"
          className="text-amber-700 hover:text-amber-600 font-extrabold underline underline-offset-4"
        >
          Return to Customer Storefront ↗
        </Link>
      </div>
    </div>
  );
}
