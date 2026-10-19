'use client';

import {
  Building2,
  CheckCircle2,
  FileText,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function SellerProfilePage() {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/seller/dashboard');
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch seller profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
        <div className="w-5 h-5 border-2 border-orange border-t-transparent rounded-full animate-spin" />
        <span>Loading Merchant Profile...</span>
      </div>
    );
  }

  const shop = data?.shop || {};
  const owner = data?.owner || {};
  const profile = data?.sellerProfile || {};

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 sm:pb-6 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight flex items-center gap-2 sm:gap-3">
          <User className="w-5 h-5 sm:w-6 sm:h-6 text-orange shrink-0" />
          <span>Profile &amp; Verification</span>
        </h1>
        <p className="text-[11px] sm:text-xs text-slate-500 mt-1 font-medium">
          Registered business entity details, PAN, GSTIN, and primary warehouse location.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange/10 border border-orange/20 flex items-center justify-center text-orange font-bold shadow-xs shrink-0">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-navy">{shop.name}</h2>
              <span className="text-[11px] sm:text-xs text-orange font-mono font-bold">
                slug: {shop.slug}
              </span>
            </div>
          </div>

          <span className="self-start sm:self-auto px-3 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            VERIFIED SELLER
          </span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="font-extrabold uppercase tracking-wider text-navy flex items-center gap-2">
              <User className="w-4 h-4 text-orange" /> Owner Account Information
            </h3>
            <div>
              <span className="text-slate-500 block font-medium">Primary Account Holder</span>
              <span className="font-extrabold text-navy text-sm">{owner.name || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">Account Email</span>
              <span className="font-semibold text-slate-800">{owner.email || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">Verified Mobile Number</span>
              <span className="font-semibold text-slate-800">
                {owner.mobile || shop.phone || 'N/A'}
              </span>
            </div>
          </div>

          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="font-extrabold uppercase tracking-wider text-navy flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange" /> Legal Tax Identifiers
            </h3>
            <div>
              <span className="text-slate-500 block font-medium">Legal Registered Name</span>
              <span className="font-extrabold text-navy text-sm">
                {profile.legalName || shop.name || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">PAN Card Number</span>
              <span className="font-mono font-extrabold text-navy">
                {profile.panNumber || shop.panNumber || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">GSTIN Tax Identifier</span>
              <span className="font-mono font-extrabold text-navy">
                {profile.gstin || shop.gstin || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Warehouse Address */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
          <h3 className="font-extrabold uppercase tracking-wider text-navy flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange" /> Primary Pickup Warehouse Address
          </h3>
          <p className="text-slate-800 font-semibold">
            {profile.businessAddress || shop.fullAddress || 'N/A'}
          </p>
          <div className="flex gap-4 text-slate-500 font-medium">
            <span>
              City: <strong className="text-navy font-bold">{profile.city || shop.city}</strong>
            </span>
            <span>
              State: <strong className="text-navy font-bold">{profile.state || shop.state}</strong>
            </span>
            <span>
              Pincode:{' '}
              <strong className="text-navy font-mono font-bold">
                {profile.pincode || shop.pincode}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
