'use client';

import { IndianRupee, Loader2, Lock, Sparkles, Store, Truck, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { SellerLoginCard } from '@/frontend/features/seller/components/SellerLoginCard';
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
  const [portalMode, setPortalMode] = useState<'register' | 'login'>('register');

  const fetchSellerStatus = useCallback(async () => {
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
  }, [router]);

  useEffect(() => {
    fetchSellerStatus();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'login' || params.get('mode') === 'login') {
        setPortalMode('login');
      }
    }
  }, [fetchSellerStatus]);

  if (isLoadingStatus) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="w-10 h-10 text-orange animate-spin" />
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
      {/* Hero Header with Jiivaa Mascot */}
      <div className="max-w-4xl mx-auto mb-8 bg-gradient-to-br from-white via-orange/5 to-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6">
          <div className="md:col-span-8 space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange/10 border border-orange/20 text-orange text-[11px] font-extrabold uppercase tracking-wider shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-orange animate-pulse" />
              <span>Multi-Vendor Seller Network</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-navy tracking-tight leading-tight">
              Sell Your Fashion on <br className="hidden sm:inline" />
              <span className="text-orange">JiivaaKart Marketplace</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-xl font-medium leading-relaxed">
              Expand your boutique from Hisar, Jaipur, Surat or Delhi to shoppers across India with
              0% setup friction and verified courier door-pickup.
            </p>
          </div>

          <div className="md:col-span-4 flex items-center justify-center">
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
              <div className="absolute inset-0 bg-radial from-orange/20 via-orange/5 to-transparent rounded-full blur-xl pointer-events-none" />
              <div className="relative z-10 w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-white border border-orange-200 shadow-sm p-2 flex items-center justify-center overflow-hidden">
                <Image
                  src="/brand/jiivaa/crops/journey/08-seller-onboarding.png"
                  alt="Jiivaa - Seller Onboarding"
                  width={160}
                  height={170}
                  className="w-full h-full object-contain select-none"
                  priority
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-navy text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs border border-white">
                Seller Hub
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Pill Switcher: Register New Store vs Existing Merchant Login */}
      <div className="max-w-md mx-auto mb-10">
        <div className="grid grid-cols-2 p-1.5 bg-slate-200/80 rounded-2xl shadow-inner border border-slate-300/40">
          <button
            type="button"
            onClick={() => setPortalMode('register')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              portalMode === 'register'
                ? 'bg-white text-navy shadow-sm'
                : 'text-slate-600 hover:text-navy hover:bg-white/40'
            }`}
          >
            <Sparkles className="w-4 h-4 text-orange" />
            <span>Register Store</span>
          </button>

          <button
            type="button"
            onClick={() => setPortalMode('login')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              portalMode === 'login'
                ? 'bg-white text-navy shadow-sm'
                : 'text-slate-600 hover:text-navy hover:bg-white/40'
            }`}
          >
            <Lock className="w-4 h-4 text-orange" />
            <span>Merchant Login</span>
          </button>
        </div>
      </div>

      {/* Active Portal View: Registration Wizard or Dedicated Merchant Login */}
      <div className="mb-12">
        {portalMode === 'register' ? (
          <SellerRegistrationWizard onSwitchToLogin={() => setPortalMode('login')} />
        ) : (
          <SellerLoginCard onSwitchToRegister={() => setPortalMode('register')} />
        )}
      </div>

      {/* Feature Highlights Grid (Placed below registration form as requested) */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-orange/50 hover:shadow-md transition-all shadow-xs space-y-3">
          <div className="w-11 h-11 rounded-xl bg-orange/10 border border-orange/20 flex items-center justify-center text-orange shadow-xs">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-navy text-sm mb-1">Instant Payouts</h3>
            <p className="text-xs text-slate-500 font-medium">
              Direct UPI &amp; Netbanking settlements on every delivered order.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-navy/40 hover:shadow-md transition-all shadow-xs space-y-3">
          <div className="w-11 h-11 rounded-xl bg-navy/10 border border-navy/20 flex items-center justify-center text-navy shadow-xs">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-navy text-sm mb-1">Pan-India Logistics</h3>
            <p className="text-xs text-slate-500 font-medium">
              Integrated Shiprocket pickup right from your warehouse door.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-orange/50 hover:shadow-md transition-all shadow-xs space-y-3">
          <div className="w-11 h-11 rounded-xl bg-orange/10 border border-orange/20 flex items-center justify-center text-orange shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-navy text-sm mb-1">Millions of Buyers</h3>
            <p className="text-xs text-slate-500 font-medium">
              Showcase your sarees, suits, gents &amp; kids wear to high-intent shoppers.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-navy/40 hover:shadow-md transition-all shadow-xs space-y-3">
          <div className="w-11 h-11 rounded-xl bg-navy/10 border border-navy/20 flex items-center justify-center text-navy shadow-xs">
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
