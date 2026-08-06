'use client';

import { CheckCircle2, Clock } from 'lucide-react';

import type { NotificationItem } from '../types/notification.types';

type NotificationListProps = {
  notifications: NotificationItem[];
  isLoading?: boolean;
  onMarkRead?: (id: string) => void;
};

export function NotificationList({ notifications, isLoading, onMarkRead }: NotificationListProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-semibold">No notifications yet</p>
        <p className="text-xs text-slate-400 mt-1">Updates on your orders will appear here.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`p-3.5 flex items-start gap-3 transition-colors ${
            n.isRead ? 'bg-white' : 'bg-orange/5 font-medium'
          }`}
        >
          <div className="mt-0.5 shrink-0">
            <CheckCircle2 className={`h-4 w-4 ${n.isRead ? 'text-slate-400' : 'text-orange'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-navy truncate">{n.title}</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5 line-clamp-2">
              {n.message}
            </p>
            <span className="text-[10px] text-slate-400 block mt-1">
              {new Date(n.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          {!n.isRead && onMarkRead && (
            <button
              type="button"
              onClick={() => onMarkRead(n.id)}
              className="text-[10px] text-orange hover:underline shrink-0 font-bold"
            >
              Mark Read
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
