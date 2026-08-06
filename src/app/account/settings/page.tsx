'use client';

import { useEffect, useState } from 'react';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { useAuth } from '@/providers/auth-provider';

type SettingsState = {
  emailNotifications: boolean;
  smsNotifications: boolean;
  promotionalOffers: boolean;
};

export default function SettingsPage() {
  const { logout, user } = useAuth();
  const [settings, setSettings] = useState<SettingsState>({
    emailNotifications: true,
    smsNotifications: true,
    promotionalOffers: false,
  });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('account-settings');
      if (stored) setSettings(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('account-settings', JSON.stringify(settings));
    setMessage('Preferences updated successfully');
    setTimeout(() => setMessage(null), 3000);
  };

  const handleLogout = async () => {
    const ok = window.confirm('Are you sure you want to log out of your account?');
    if (!ok) return;
    await logout();
  };

  return (
    <ProtectedRoute>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Account', href: '/account' },
          { label: 'Settings' },
        ]}
        className="mx-auto max-w-[1440px] px-4 md:px-6 py-4"
      />
      <div className="mx-auto max-w-3xl px-4 md:px-6 py-8 space-y-6">
        {/* Notifications Preference Box */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm">
          <h2 className="font-heading text-2xl font-bold text-navy mb-1">
            Notifications & Preferences
          </h2>
          <p className="text-xs font-medium text-slate-500 mb-6">
            Manage how Navya Collection contacts you regarding orders and offers.
          </p>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <label className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 hover:border-slate-300 transition cursor-pointer select-none">
              <div>
                <p className="text-sm font-bold text-navy">Email notifications</p>
                <p className="text-xs text-slate-500">
                  Receive order invoices, updates, and account alerts
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                className="h-4 w-4 accent-navy cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 hover:border-slate-300 transition cursor-pointer select-none">
              <div>
                <p className="text-sm font-bold text-navy">SMS notifications</p>
                <p className="text-xs text-slate-500">
                  Receive Instant OTP verification and dispatch tracking SMS
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.smsNotifications}
                onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                className="h-4 w-4 accent-navy cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 hover:border-slate-300 transition cursor-pointer select-none">
              <div>
                <p className="text-sm font-bold text-navy">Promotional & Festive Offers</p>
                <p className="text-xs text-slate-500">
                  Get early access to exclusive seasonal sales and new arrivals
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.promotionalOffers}
                onChange={(e) => setSettings({ ...settings, promotionalOffers: e.target.checked })}
                className="h-4 w-4 accent-navy cursor-pointer"
              />
            </label>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="submit"
                className="rounded-full bg-navy text-white hover:bg-navy/90 font-bold text-xs px-6 py-2.5 shadow-md transition cursor-pointer"
              >
                Save Preferences
              </button>
              {message && (
                <span className="text-xs font-semibold text-emerald-600 animate-fade-in">
                  {message}
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Security & Account Session Box */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm space-y-3">
          <h2 className="font-heading text-2xl font-bold text-navy">Account Security</h2>
          <p className="text-xs text-slate-500">
            Your account is secured via passwordless Email OTP verification to{' '}
            {user?.email || 'your email address'}.
          </p>
          <div className="pt-2">
            <Button
              variant="outline"
              className="rounded-full text-xs font-semibold border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleLogout}
            >
              Log Out of Account
            </Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
