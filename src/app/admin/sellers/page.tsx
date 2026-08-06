import { Building2, ShieldCheck, Sparkles } from 'lucide-react';
import { Metadata } from 'next';

import { SellerApprovalTable } from '@/frontend/features/admin/components/SellerApprovalTable';

export const metadata: Metadata = {
  title: 'Seller Approvals & Governance | Navya Collection Admin',
  description:
    'Manage, inspect, approve, reject, or suspend multi-vendor seller applications on Navya Collection.',
};

export default function AdminSellersPage() {
  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50 min-h-screen text-slate-900">
      {/* Top Banner Header - Navy & Amber Theme */}
      <div className="bg-navy text-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Marketplace Governance
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Building2 className="w-7 h-7 text-amber-400" />
            Seller Approvals & Merchant Management
          </h1>
          <p className="text-xs md:text-sm text-slate-300 font-medium mt-1">
            Review onboarding applications, verify GSTIN/PAN tax details, approve boutique partners,
            and audit seller actions.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2.5 rounded-2xl text-xs font-bold text-white backdrop-blur-md">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Real-time Audit Trail Enabled</span>
        </div>
      </div>

      {/* Seller Management Data Table */}
      <SellerApprovalTable />
    </div>
  );
}
