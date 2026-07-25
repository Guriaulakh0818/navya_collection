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
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.name || '');
  }, [user?.name]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const baseUser = user as { id: string; mobile: string; role: 'customer' | 'admin' } | null;
      setUser(baseUser ? { ...baseUser, name } : null);
      setMessage('Profile updated successfully');
    } catch {
      setMessage('Failed to update profile');
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
        <div className="rounded-2xl border border-border bg-white p-6 shadow-premium">
          <h2 className="font-heading text-2xl text-navy mb-1">My Profile</h2>
          <p className="text-sm text-slate-600 mb-6">
            Manage your personal information and contact details.
          </p>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Full Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Mobile Number</label>
              <Input value={user?.mobile || ''} disabled className="bg-slate-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Email</label>
              <Input placeholder="Enter your email" />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={isSaving} className="rounded-full">
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              {message && <span className="text-sm text-slate-600">{message}</span>}
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
