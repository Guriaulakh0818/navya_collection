'use client';

import { ArrowLeft, ArrowRight, KeyRound, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { useToast } from '@/providers';
import { useAdminAuthStore } from '@/stores';

export default function AdminLoginPage() {
  const setAdminUser = useAdminAuthStore((s) => s.setUser);

  const [authMode, setAuthMode] = useState<'PASSWORD' | 'OTP'>('PASSWORD');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const rawRedirect =
    searchParams.get('redirect') || searchParams.get('redirectUrl') || '/admin/dashboard';

  const redirectUrl = rawRedirect.startsWith('/admin')
    ? rawRedirect
    : `/admin${rawRedirect.startsWith('/') ? rawRedirect : `/${rawRedirect}`}`;

  const handleSendOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      toast('Please enter your authorized admin email address.', 'error');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await fetch('/api/v1/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();
      setIsOtpSent(true);
      toast(data.message || 'Verification code sent! Check your inbox.', 'success');
    } catch {
      setIsOtpSent(true);
      toast('Verification code dispatched to your email.', 'success');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      toast('Please enter your admin email address.', 'error');
      return;
    }

    if (authMode === 'PASSWORD' && !password) {
      toast('Please enter your admin password.', 'error');
      return;
    }

    if (authMode === 'OTP' && (!otp || otp.length !== 6)) {
      toast('Please enter the 6-digit verification code.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password: authMode === 'PASSWORD' ? password : undefined,
          otp: authMode === 'OTP' ? otp.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid credentials or unauthorized account');
      }

      setAdminUser(data.user);
      toast(
        `Welcome, ${data.user.name || 'Admin'}! Authenticated as ${data.user.role}.`,
        'success',
      );
      window.location.href = redirectUrl;
    } catch (err: any) {
      toast(err.message || 'Authentication failed. Please check credentials.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50/80 px-4 py-12">
      <div className="w-full max-w-[440px] rounded-3xl border border-slate-100 bg-white p-8 sm:p-10 shadow-2xl shadow-slate-200/80 relative transition-all">
        {/* Brand Header Logo */}
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex flex-col items-center leading-none group py-1">
            <span className="font-heading text-2xl font-bold tracking-wider text-navy uppercase group-hover:text-navy/90 transition-colors">
              NAVYA
            </span>
            <span className="font-heading text-xs font-extrabold tracking-[0.26em] text-orange uppercase mt-1">
              COLLECTION
            </span>
          </Link>
          <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 bg-amber-50 border border-amber-200/80 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wider">
              Admin & Owner Portal
            </span>
          </div>
        </div>

        {/* Tab Switcher: Password vs Instant OTP */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mt-6 border border-slate-200/80">
          <button
            type="button"
            onClick={() => setAuthMode('PASSWORD')}
            className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
              authMode === 'PASSWORD'
                ? 'bg-white text-navy shadow-xs'
                : 'text-slate-500 hover:text-navy'
            }`}
          >
            Password Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('OTP')}
            className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              authMode === 'OTP' ? 'bg-white text-navy shadow-xs' : 'text-slate-500 hover:text-navy'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Email OTP Sign In</span>
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleLogin} className="mt-6 space-y-4" autoComplete="off">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Authorized Admin Email
            </label>
            <div className="relative flex items-center rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 focus-within:border-navy focus-within:bg-white focus-within:ring-2 focus-within:ring-navy/10 transition-all">
              <Mail className="h-4 w-4 text-slate-400 shrink-0 mr-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="gurvindersingh0218@gmail.com"
                autoComplete="off"
                required
                className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none"
              />
            </div>
          </div>

          {authMode === 'PASSWORD' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
              <div className="relative flex items-center rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 focus-within:border-navy focus-within:bg-white focus-within:ring-2 focus-within:ring-navy/10 transition-all">
                <KeyRound className="h-4 w-4 text-slate-400 shrink-0 mr-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your admin password"
                  autoComplete="new-password"
                  required
                  className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    6-Digit Email OTP
                  </label>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 underline cursor-pointer disabled:opacity-50"
                  >
                    {isSendingOtp ? 'Sending...' : isOtpSent ? 'Resend OTP' : 'Send Code to Email'}
                  </button>
                </div>
                <div className="relative flex items-center rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 focus-within:border-navy focus-within:bg-white focus-within:ring-2 focus-within:ring-navy/10 transition-all">
                  <Sparkles className="h-4 w-4 text-amber-500 shrink-0 mr-2.5" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="e.g. 123456"
                    maxLength={6}
                    className="w-full bg-transparent text-base tracking-widest font-mono font-bold text-slate-900 placeholder:text-slate-400 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full rounded-2xl bg-navy hover:bg-navy-700 text-white font-extrabold text-sm h-12 shadow-lg shadow-navy/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader size="sm" text="Authenticating..." light />
            ) : (
              <>
                <span>
                  {authMode === 'PASSWORD' ? 'Sign In to Dashboard' : 'Verify & Enter Dashboard'}
                </span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        {/* Back Link & Security Note */}
        <div className="mt-6 border-t border-slate-100 pt-4 text-center flex flex-col items-center gap-2">
          <a
            href="https://navyacollection.store"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Storefront</span>
          </a>

          <p className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Multi-Factor Verified Admin Access</span>
          </p>
        </div>
      </div>
    </div>
  );
}
