'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';

export function LogoutButton() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      className="w-full rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold text-xs"
    >
      Logout
    </Button>
  );
}
