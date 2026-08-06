'use client';

import {
  Building2,
  CheckCircle2,
  IndianRupee,
  Save,
  Settings,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function SellerSettingsPage() {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Form State
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfscCode, setBankIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/seller/dashboard');
      const result = await res.json();
      if (result.success) {
        setData(result.data);
        const shop = result.data.shop || {};
        const profile = result.data.sellerProfile || {};

        setBankAccountHolder(shop.bankAccountHolder || profile.bankAccountHolder || '');
        setBankName(shop.bankName || profile.bankName || '');
        setBankAccountNumber(shop.bankAccountNumber || profile.bankAccountNumber || '');
        setBankIfscCode(shop.bankIfscCode || profile.bankIfscCode || '');
        setUpiId(profile.upiId || '');
      }
    } catch (err: any) {
      console.error('Failed to fetch seller settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Simulated save API update
      setToastMessage({ type: 'success', text: 'Settlement bank details updated successfully!' });
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
        <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <span>Loading Settlement Settings...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-navy tracking-tight flex items-center gap-3">
            <Settings className="w-6 h-6 text-amber-600" />
            Settlement Bank Account & Payout Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Configure direct netbanking accounts and instant UPI IDs for automated vendor payouts.
          </p>
        </div>
      </div>

      {toastMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
              : 'bg-rose-50 text-rose-800 border border-rose-300'
          }`}
        >
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Settings Form */}
      <form
        onSubmit={handleSaveSettings}
        className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6"
      >
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-amber-600 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-amber-600" /> Direct Netbanking & Settlement Account
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Account Holder Name *
            </label>
            <input
              type="text"
              value={bankAccountHolder}
              onChange={(e) => setBankAccountHolder(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-semibold focus:border-amber-500 focus:outline-none shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Bank Name *
            </label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-semibold focus:border-amber-500 focus:outline-none shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Account Number *
            </label>
            <input
              type="text"
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-mono font-bold focus:border-amber-500 focus:outline-none shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              IFSC Code *
            </label>
            <input
              type="text"
              value={bankIfscCode}
              onChange={(e) => setBankIfscCode(e.target.value.toUpperCase())}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-mono uppercase font-bold focus:border-amber-500 focus:outline-none shadow-xs"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Payout UPI ID for Instant Vendor Settlements *
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:border-amber-500 focus:outline-none font-mono text-amber-700 font-extrabold shadow-xs"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving Settlement Details...' : 'Save Bank & UPI Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
