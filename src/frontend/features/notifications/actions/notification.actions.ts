'use server';

import { NotificationService } from '../services/notification.service';
import type { SendNotificationParams } from '../types/notification.types';

export async function triggerNotificationAction(params: SendNotificationParams) {
  try {
    const results = await NotificationService.sendNotification(params);
    return {
      success: true,
      message: 'Notification trigger processed.',
      results,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to trigger notification.',
      results: [],
    };
  }
}

export async function getUserNotificationsAction(userId: string) {
  try {
    const notifications = await NotificationService.getUserNotifications(userId);
    return {
      success: true,
      data: notifications,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to fetch user notifications.',
      data: [],
    };
  }
}

export async function markNotificationAsReadAction(notificationId: string, userId: string) {
  try {
    await NotificationService.markAsRead(notificationId, userId);
    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to mark notification as read.',
    };
  }
}
