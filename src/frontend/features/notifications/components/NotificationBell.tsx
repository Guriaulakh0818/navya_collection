'use client';

import { Bell } from 'lucide-react';

import { useNotifications } from '../hooks/useNotifications';

type NotificationBellProps = {
  userId?: string;
  onClick?: () => void;
  className?: string;
};

export function NotificationBell({ userId, onClick, className = '' }: NotificationBellProps) {
  const { unreadCount } = useNotifications(userId);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center justify-center p-2 rounded-full text-slate-700 hover:text-navy hover:bg-slate-100 transition-all cursor-pointer ${className}`}
      aria-label="Notifications"
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange text-[10px] font-extrabold text-white shadow-sm animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
