'use client';

import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  FileEdit,
  HelpCircle,
  Mail,
  Phone,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export interface SellerStatusData {
  userId: string;
  name?: string | null;
  email?: string | null;
  mobile?: string | null;
  role?: string;
  approvalStatus?: string;
  status: 'PENDING_VERIFICATION' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | string;
  isApproved: boolean;
  shop?: {
    id: string;
    name: string;
    slug: string;
    status: string;
    createdAt: string | Date;
    updatedAt?: string | Date;
    city?: string;
    state?: string;
  } | null;
  sellerProfile?: {
    legalName?: string | null;
    gstin?: string | null;
    panNumber?: string | null;
    city?: string;
    state?: string;
  } | null;
  rejectionReason?: string | null;
}

interface SellerStatusViewProps {
  statusData: SellerStatusData;
  onRefresh: () => Promise<void>;
  onStartNew?: () => void;
}

export function SellerStatusView({ statusData, onRefresh, onStartNew }: SellerStatusViewProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const shop = statusData.shop;
  const status = statusData.status || shop?.status || 'PENDING_VERIFICATION';
  const submissionDate = shop?.createdAt
    ? new Date(shop.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  // Status mapping colors & labels
  const getStatusBadge = () => {
    switch (status) {
      case 'APPROVED':
        return {
          label: 'APPROVED',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          icon: CheckCircle2,
          iconColor: 'text-emerald-600',
          title: 'Merchant Application Approved! 🎉',
          desc: 'Your boutique store is live. Access your Seller Dashboard to upload products and handle orders.',
        };
      case 'UNDER_REVIEW':
        return {
          label: 'UNDER REVIEW',
          color: 'bg-indigo-50 text-indigo-800 border-indigo-300',
          icon: Clock,
          iconColor: 'text-indigo-600',
          title: 'Application Under Review',
          desc: 'Our compliance team is inspecting your submitted documents and legal registration.',
        };
      case 'REJECTED':
        return {
          label: 'ACTION REQUIRED / REJECTED',
          color: 'bg-rose-50 text-rose-800 border-rose-300',
          icon: ShieldAlert,
          iconColor: 'text-rose-600',
          title: 'Application Requires Revision',
          desc: 'Your seller registration needs updates before it can be approved by platform compliance.',
        };
      case 'PENDING_VERIFICATION':
      default:
        return {
          label: 'PENDING APPROVAL',
          color: 'bg-amber-50 text-amber-800 border-amber-300',
          icon: Clock,
          iconColor: 'text-amber-600',
          title: 'Registration Submitted Successfully',
          desc: 'Your merchant application has been saved permanently in our database and queued for review.',
        };
    }
  };

  const statusConfig = getStatusBadge();
  const StatusIcon = statusConfig.icon;

  return (
    <div className="w-full max-w-4xl mx-auto my-8 bg-white border border-slate-200 rounded-3xl p-6 md:p-10 shadow-sm font-sans text-slate-900 space-y-8">
      {/* Top Banner Status Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-start gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-xs border ${statusConfig.color}`}
          >
            <StatusIcon
              className={`w-8 h-8 ${statusConfig.iconColor} ${status === 'PENDING_VERIFICATION' || status === 'UNDER_REVIEW' ? 'animate-pulse' : ''}`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={`px-3 py-1 text-xs font-extrabold rounded-full border uppercase tracking-wider ${statusConfig.color}`}
              >
                {statusConfig.label}
              </span>
              {shop?.slug && (
                <span className="text-xs font-mono text-slate-500 font-bold">
                  Ref ID:{' '}
                  <span className="text-amber-800 font-extrabold">{shop.id.substring(0, 16)}</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-navy tracking-tight">
              {statusConfig.title}
            </h1>
            <p className="text-sm text-slate-600 font-medium mt-1">{statusConfig.desc}</p>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-4 py-2.5 text-xs font-extrabold rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-navy transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-amber-700 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Checking Database...' : 'Refresh Status'}
          </button>
        </div>
      </div>

      {/* Main Registration Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Merchant & Store Summary */}
        <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-600" />
            Registered Store Details
          </h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-slate-500 block text-xs font-semibold">Store / Dukan Name</span>
              <span className="font-extrabold text-navy text-base">
                {shop?.name || 'Your Fashion Store'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-semibold">Primary Merchant</span>
              <span className="font-extrabold text-slate-800">
                {statusData.name || 'Merchant Partner'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500 block text-xs font-semibold">Email Address</span>
                <span className="font-bold text-slate-700 text-xs break-all">
                  {statusData.email || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs font-semibold">Mobile Number</span>
                <span className="font-bold text-slate-700 text-xs">
                  {statusData.mobile || 'N/A'}
                </span>
              </div>
            </div>
            {statusData.sellerProfile?.legalName && (
              <div>
                <span className="text-slate-500 block text-xs font-semibold">Legal Entity</span>
                <span className="font-semibold text-slate-700 text-xs">
                  {statusData.sellerProfile.legalName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Timeline & SLA Details */}
        <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            Submission Metadata & Timeline
          </h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-slate-500 block text-xs font-semibold">
                Submission Date & Time
              </span>
              <span className="font-extrabold text-navy">{submissionDate}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-semibold">
                Expected Review Time
              </span>
              <span className="font-extrabold text-amber-800">24 to 48 business hours</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-semibold">Marketplace Region</span>
              <span className="font-bold text-slate-700">
                {statusData.sellerProfile?.city || shop?.city || 'Hisar'},{' '}
                {statusData.sellerProfile?.state || shop?.state || 'Haryana'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* REJECTION REASON CARD (IF REJECTED) */}
      {status === 'REJECTED' && (
        <div className="p-6 bg-rose-50 border-2 border-rose-200 rounded-2xl space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-extrabold text-rose-900">
                Rejection Reason Provided by Admin
              </h3>
              <p className="text-xs text-rose-700 font-medium mt-1">
                Please review the feedback below and update your application details or re-upload
                compliance documents.
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-200 text-sm font-mono text-rose-950 font-bold">
            {statusData.rejectionReason ||
              'Documents or GSTIN tax details require verification. Please contact support or update your application.'}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {onStartNew && (
              <button
                onClick={onStartNew}
                className="px-5 py-3 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <FileEdit className="w-4 h-4" />
                Edit / Resubmit Application
              </button>
            )}
            <button
              onClick={() => setShowSupportModal(true)}
              className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Mail className="w-4 h-4 text-amber-400" />
              Contact Merchant Helpdesk
            </button>
          </div>
        </div>
      )}

      {/* APPROVED REDIRECT ACTION CARD */}
      {status === 'APPROVED' && (
        <div className="p-6 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <h3 className="text-base font-extrabold text-emerald-950">
                Seller Privileges Activated
              </h3>
              <p className="text-xs text-emerald-800 font-medium">
                Your store is officially approved. You can start creating listings, setting up
                logistics, and receiving payouts.
              </p>
            </div>
          </div>
          <Link
            href="/seller/dashboard"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            Go to Seller Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* NEXT STEPS GUIDE FOR PENDING & UNDER_REVIEW */}
      {(status === 'PENDING_VERIFICATION' || status === 'UNDER_REVIEW') && (
        <div className="space-y-4 border-t border-slate-200 pt-6">
          <h3 className="text-sm font-extrabold text-navy">Verification Lifecycle & Next Steps</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center">
                1
              </div>
              <h4 className="font-extrabold text-navy">Application Saved</h4>
              <p className="text-slate-600">
                Your merchant profile and documents are safely stored in PostgreSQL.
              </p>
            </div>

            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
              <div className="w-7 h-7 rounded-lg bg-amber-200 text-amber-900 font-extrabold flex items-center justify-center">
                2
              </div>
              <h4 className="font-extrabold text-navy">Admin Document Audit</h4>
              <p className="text-slate-600">
                Platform governance is validating GSTIN, PAN, and Bank settlement details.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 font-extrabold flex items-center justify-center">
                3
              </div>
              <h4 className="font-extrabold text-navy">Dashboard Activation</h4>
              <p className="text-slate-600">
                You will receive an email notification as soon as status changes to Approved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Support Footer & Contact Modal */}
      <div className="pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600 font-medium">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => setShowSupportModal(!showSupportModal)}
            className="flex items-center gap-1.5 text-navy font-extrabold hover:text-amber-700 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-amber-600" />
            Contact Support Team
          </button>
          <span className="flex items-center gap-1.5 text-slate-700 font-bold">
            <Mail className="w-4 h-4 text-amber-600" />
            sellers@navyacollection.com
          </span>
          <span className="flex items-center gap-1.5 text-slate-700 font-bold">
            <Phone className="w-4 h-4 text-amber-600" />
            +91 99919 83125
          </span>
        </div>

        <Link
          href="/"
          className="text-amber-700 hover:text-amber-600 font-extrabold underline underline-offset-4"
        >
          Back to Storefront ↗
        </Link>
      </div>

      {/* Support Modal Overlay */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-navy flex items-center gap-2">
              <Mail className="w-5 h-5 text-amber-600" />
              Navya Merchant Partner Support
            </h3>
            <p className="text-xs text-slate-600">
              Need assistance with your seller application or status verification? Reach out
              directly to our merchant onboardings desk:
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs font-semibold">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-bold text-navy">support@navyacollection.in</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Merchant Desk:</span>
                <span className="font-bold text-navy">+91 99919 83125</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Operating Hours:</span>
                <span className="font-bold text-amber-800">10:00 AM – 7:00 PM IST</span>
              </div>
            </div>

            <button
              onClick={() => setShowSupportModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
