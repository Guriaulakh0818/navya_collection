'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { useAuthStore } from '@/stores';

export default function AccountPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();

  const [name, setName] = useState(user?.name || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(true);

  // Sync when store user updates
  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.mobile) setMobile(user.mobile);
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  // Fetch fresh database profile on page mount
  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      try {
        const res = await fetch('/api/v1/auth/profile');
        if (res.ok) {
          const json = await res.json();
          if (json?.success && json?.user && isMounted) {
            if (json.user.name) setName(json.user.name);
            if (json.user.mobile) setMobile(json.user.mobile);
            if (json.user.email) setEmail(json.user.email);
            const baseUser = (user || {}) as any;
            setUser({ ...baseUser, ...json.user });
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    }
    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/v1/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobile, email }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.user) {
        const baseUser = user as any;
        setUser({ ...baseUser, ...json.user, name, mobile, email });
        setMessage('Profile updated successfully');
        setIsSuccess(true);
      } else {
        setMessage(json.message || 'Failed to update profile');
        setIsSuccess(false);
      }
    } catch {
      setMessage('Failed to update profile');
      setIsSuccess(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Account', href: '/account' },
          { label: 'My Profile' },
        ]}
        className="mx-auto max-w-[1440px] px-4 md:px-6 py-4"
      />
      <div className="mx-auto max-w-3xl px-4 md:px-6 py-8">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm">
          <h2 className="font-heading text-2xl font-bold text-navy mb-1">My Profile</h2>
          <p className="text-xs text-slate-500 mb-6">
            Manage your personal information, mobile contact details, and account preferences.
          </p>

          <form onSubmit={handleSave} className="space-y-5">
            {/* 1. Full Name */}
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="font-medium"
              />
            </div>

            {/* 2. Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
                Mobile Number (For Delivery Updates)
              </label>
              <div className="relative flex rounded-xl border border-border bg-white shadow-xs focus-within:ring-2 focus-within:ring-navy transition">
                <span className="inline-flex items-center rounded-l-xl border-r border-border bg-slate-100 px-3.5 text-xs font-bold text-navy select-none">
                  +91
                </span>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  maxLength={10}
                  className="w-full rounded-r-xl bg-transparent px-3.5 py-2.5 text-sm font-medium text-navy outline-none placeholder:text-slate-400"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Mobile number for courier tracking notifications (No SMS OTP verification required).
              </p>
            </div>

            {/* 3. Email Address (Gmail) */}
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
                Gmail Address (Primary Login)
              </label>
              <div className="relative flex items-center">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@gmail.com"
                  className="bg-slate-50 font-semibold text-slate-800 pr-24"
                />
                <span className="absolute right-3 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 select-none">
                  ✓ Verified
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Your email is used for OTP sign-in and order receipts.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                disabled={isSaving}
                className="rounded-full bg-navy text-white hover:bg-navy/90 px-7 font-bold text-xs"
              >
                {isSaving ? 'Saving...' : 'Save Profile Changes'}
              </Button>
              {message && (
                <span
                  className={`text-xs font-semibold animate-fade-in ${isSuccess ? 'text-emerald-600' : 'text-rose-600'}`}
                >
                  {message}
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
