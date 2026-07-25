'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';

export function LogoutButton() {
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <Button variant="outline" onClick={handleLogout} className="w-full">
      Logout
    </Button>
  );
}
