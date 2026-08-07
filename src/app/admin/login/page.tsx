'use client';

import { ArrowLeft, ArrowRight, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { useToast } from '@/providers';
import { useAdminAuthStore } from '@/stores';

export default function AdminLoginPage() {
  const setAdminUser = useAdminAuthStore((s) => s.setUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const redirectUrl = searchParams.get('redirect') || '/admin/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast('Please enter your authorized Gmail address and password.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
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
      toast(err.message || 'Invalid email or password.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50/80 px-4 py-12">
      <div className="w-full max-w-[420px] rounded-3xl border border-slate-100 bg-white p-8 sm:p-10 shadow-2xl shadow-slate-200/80 relative transition-all">
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
          <p className="text-xs font-semibold text-slate-400 mt-2">Admin Portal</p>
        </div>

        {/* Form Content */}
        <form onSubmit={handleLogin} className="mt-8 space-y-5" autoComplete="off">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Admin Email / Gmail Address
            </label>
            <div className="relative flex items-center rounded-full border border-slate-200 bg-slate-50/50 px-4 py-3 focus-within:border-navy focus-within:bg-white focus-within:ring-2 focus-within:ring-navy/10 transition-all">
              <Mail className="h-4 w-4 text-slate-400 shrink-0 mr-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@navyacollection.com"
                autoComplete="off"
                required
                className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Password</label>
            <div className="relative flex items-center rounded-full border border-slate-200 bg-slate-50/50 px-4 py-3 focus-within:border-navy focus-within:bg-white focus-within:ring-2 focus-within:ring-navy/10 transition-all">
              <KeyRound className="h-4 w-4 text-slate-400 shrink-0 mr-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoComplete="new-password"
                required
                className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full rounded-full bg-navy hover:bg-navy-700 text-white font-extrabold text-sm h-12 shadow-lg shadow-navy/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader size="sm" text="Signing In..." light />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        {/* Back Link & Security Note */}
        <div className="mt-8 border-t border-slate-100 pt-5 text-center flex flex-col items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Main Store</span>
          </Link>

          <p className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Authorized Gmail & Password Access Only</span>
          </p>
        </div>
      </div>
    </div>
  );
}
