'use client';

import { useCallback, useEffect, useState } from 'react';

import type { NotificationItem } from '../types/notification.types';

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/notifications', { method: 'GET' });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setNotifications(json.data);
        setUnreadCount(json.data.filter((n: NotificationItem) => !n.isRead).length);
      }
    } catch (err) {
      console.error('[USE_NOTIFICATIONS_HOOK_ERROR]', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch(`/api/v1/notifications/${notificationId}/read`, { method: 'PATCH' });
    } catch (err) {
      console.error('[MARK_READ_HOOK_ERROR]', err);
    }
  };

  return {
    notifications,
    isLoading,
    unreadCount,
    refetch: fetchNotifications,
    markAsRead,
  };
}
