'use client';

import { IndianRupee, Loader2, Sparkles, Store, Truck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { SellerRegistrationWizard } from '@/frontend/features/seller/components/SellerRegistrationWizard';
import {
  SellerStatusData,
  SellerStatusView,
} from '@/frontend/features/seller/components/SellerStatusView';

export function BecomeSellerContent() {
  const router = useRouter();
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [statusData, setStatusData] = useState<SellerStatusData | null>(null);
  const [forceNewForm, setForceNewForm] = useState(false);

  const fetchSellerStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch('/api/v1/seller/status', {
        cache: 'no-store',
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data && json.data.shop) {
          const shopStatus = json.data.status || json.data.shop.status;

          // If APPROVED, auto redirect to seller dashboard
          if (json.data.isApproved || shopStatus === 'APPROVED') {
            router.push('/seller/dashboard');
            return;
          }

          setStatusData(json.data);
        } else {
          setStatusData(null);
        }
      } else {
        setStatusData(null);
      }
    } catch (err) {
      console.warn('[SELLER_STATUS_FETCH_WARN]', err);
      setStatusData(null);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchSellerStatus();
  }, []);

  if (isLoadingStatus) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
        <p className="text-sm font-extrabold text-navy">Checking seller registration status...</p>
      </div>
    );
  }

  // If seller has existing application and user has not clicked "Start New Registration"
  if (statusData && statusData.shop && !forceNewForm) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <SellerStatusView
          statusData={statusData}
          onRefresh={fetchSellerStatus}
          onStartNew={() => setForceNewForm(true)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Hero Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-extrabold uppercase tracking-widest shadow-xs">
          <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
          Multi-Vendor Seller Network
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-navy tracking-tight leading-tight">
          Sell Your Fashion &amp; Apparel on <br className="hidden sm:inline" />
          <span className="text-amber-600 font-extrabold">Navya Collection Marketplace</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
          Expand your clothing store from Hisar, Jaipur, Surat or Delhi to customers across India.
          Complete your application to unlock seller privileges.
        </p>
      </div>

      {/* Embedded 8-Step Seller Onboarding Wizard (Placed at the top as requested) */}
      <div className="mb-12">
        <SellerRegistrationWizard />
      </div>

      {/* Feature Highlights Grid (Placed below registration form as requested) */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-amber-500/50 hover:shadow-md transition-all shadow-xs space-y-3">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-xs">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-navy text-sm mb-1">Instant Payouts</h3>
            <p className="text-xs text-slate-500 font-medium">
              Direct UPI &amp; Netbanking settlements on every delivered order.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-amber-500/50 hover:shadow-md transition-all shadow-xs space-y-3">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-xs">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-navy text-sm mb-1">Pan-India Logistics</h3>
            <p className="text-xs text-slate-500 font-medium">
              Integrated Shiprocket pickup right from your warehouse door.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-amber-500/50 hover:shadow-md transition-all shadow-xs space-y-3">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-navy text-sm mb-1">Millions of Buyers</h3>
            <p className="text-xs text-slate-500 font-medium">
              Showcase your sarees, suits, gents &amp; kids wear to high-intent shoppers.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-amber-500/50 hover:shadow-md transition-all shadow-xs space-y-3">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-xs">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-navy text-sm mb-1">Dedicated Support</h3>
            <p className="text-xs text-slate-500 font-medium">
              Personal account manager to help catalog, price, and boost store sales.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
