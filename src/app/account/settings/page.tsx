'use client';

import { useEffect, useState } from 'react';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { useAuthStore } from '@/stores';

type SettingsState = {
  emailNotifications: boolean;
  smsNotifications: boolean;
  promotionalOffers: boolean;
};

export default function SettingsPage() {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [settings, setSettings] = useState<SettingsState>({
    emailNotifications: true,
    smsNotifications: true,
    promotionalOffers: false,
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    setMessage('Settings saved');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Password updated');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleDeactivate = () => {
    const ok = window.confirm('This will log you out and clear local session data. Continue?');
    if (!ok) return;
    logout();
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
        <div className="rounded-2xl border border-border bg-white p-6 shadow-premium">
          <h2 className="font-heading text-2xl text-navy mb-1">Notifications</h2>
          <p className="text-sm text-slate-600 mb-6">Manage how we contact you.</p>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <label className="flex items-center justify-between rounded-xl border border-border p-4">
              <div>
                <p className="text-sm font-medium text-navy">Email notifications</p>
                <p className="text-xs text-slate-500">Order updates and account alerts</p>
              </div>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                className="h-4 w-4 accent-navy"
              />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-border p-4">
              <div>
                <p className="text-sm font-medium text-navy">SMS notifications</p>
                <p className="text-xs text-slate-500">OTP and delivery updates</p>
              </div>
              <input
                type="checkbox"
                checked={settings.smsNotifications}
                onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                className="h-4 w-4 accent-navy"
              />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-border p-4">
              <div>
                <p className="text-sm font-medium text-navy">Promotional offers</p>
                <p className="text-xs text-slate-500">Receive deals and festive sale alerts</p>
              </div>
              <input
                type="checkbox"
                checked={settings.promotionalOffers}
                onChange={(e) => setSettings({ ...settings, promotionalOffers: e.target.checked })}
                className="h-4 w-4 accent-navy"
              />
            </label>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" className="rounded-full">
                Save Settings
              </Button>
              {message && <span className="text-sm text-slate-600">{message}</span>}
            </div>
          </form>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6 shadow-premium">
          <h2 className="font-heading text-2xl text-navy mb-1">Change Password</h2>
          <p className="text-sm text-slate-600 mb-6">Update your account password.</p>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Current Password</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">New Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">
                Confirm New Password
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="rounded-full">
              Update Password
            </Button>
          </form>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6 shadow-premium">
          <h2 className="font-heading text-2xl text-navy mb-1">Account</h2>
          <p className="text-sm text-slate-600 mb-4">Logged in as {user?.mobile}</p>
          <Button
            variant="outline"
            className="rounded-full text-error hover:text-error"
            onClick={handleDeactivate}
          >
            Deactivate Account
          </Button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
