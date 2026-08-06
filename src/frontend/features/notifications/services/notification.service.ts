import { prisma } from '@/lib/prisma';

import { NOTIFICATION_CONSTANTS } from '../constants/notification.constants';
import type {
  AdminAlertParams,
  NotificationDispatchResult,
  SendEmailParams,
  SendNotificationParams,
  SendSMSParams,
} from '../types/notification.types';
import { buildSMSMessage } from '../utils/template.utils';
import { AdminAlertService } from './admin-alert.service';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';

export class NotificationService {
  /**
   * Helper function for exponential backoff delay retry execution.
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Resolves valid user ID from DB or falls back to null to avoid foreign key violations.
   */
  private static async resolveValidUserId(userId?: string | null): Promise<string | null> {
    if (!userId) return null;
    try {
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      return userExists ? userExists.id : null;
    } catch {
      return null;
    }
  }

  /**
   * Dispatches SMS with 3x retry mechanism and database log persistence.
   */
  static async sendSMS(params: SendSMSParams): Promise<NotificationDispatchResult> {
    let attempts = 0;
    let result: NotificationDispatchResult = {
      success: false,
      channel: 'SMS',
      status: 'FAILED',
      provider: 'SMS',
      message: 'Failed to send SMS after retries.',
    };

    const textContent = buildSMSMessage(params.type, params.variables);

    while (attempts < NOTIFICATION_CONSTANTS.RETRY.MAX_ATTEMPTS) {
      attempts++;
      result = await SmsService.sendSMS(params);
      if (result.success) break;

      if (attempts < NOTIFICATION_CONSTANTS.RETRY.MAX_ATTEMPTS) {
        const delay =
          NOTIFICATION_CONSTANTS.RETRY.INITIAL_DELAY_MS *
          Math.pow(NOTIFICATION_CONSTANTS.RETRY.BACKOFF_FACTOR, attempts - 1);
        console.warn(
          `[SMS_RETRY] Retrying SMS dispatch (${attempts}/${NOTIFICATION_CONSTANTS.RETRY.MAX_ATTEMPTS}) after ${delay}ms...`,
        );
        await this.sleep(delay);
      }
    }

    // Persist Notification Record in Database
    try {
      const validUserId = await this.resolveValidUserId(params.userId);
      const dbRecord = await prisma.notification.create({
        data: {
          userId: validUserId,
          channel: 'SMS',
          type: params.type as any,
          title: `SMS: ${params.type}`,
          message: textContent,
          status: result.success ? 'SENT' : 'FAILED',
          provider: result.provider,
          providerResponse: result.providerResponse
            ? JSON.parse(JSON.stringify(result.providerResponse))
            : undefined,
          metadata: params.variables ? JSON.parse(JSON.stringify(params.variables)) : undefined,
          recipient: params.recipientMobile,
          sentAt: result.success ? new Date() : null,
        },
      });
      result.notificationId = dbRecord.id;
    } catch (err: any) {
      console.warn('[NOTIFICATION_DB_LOG_WARN] Failed to write SMS log to database:', err.message);
    }

    return result;
  }

  /**
   * Dispatches Email with 3x retry mechanism and database log persistence.
   */
  static async sendEmail(params: SendEmailParams): Promise<NotificationDispatchResult> {
    let attempts = 0;
    let result: NotificationDispatchResult = {
      success: false,
      channel: 'EMAIL',
      status: 'FAILED',
      provider: 'EMAIL',
      message: 'Failed to send Email after retries.',
    };

    while (attempts < NOTIFICATION_CONSTANTS.RETRY.MAX_ATTEMPTS) {
      attempts++;
      result = await EmailService.sendEmail(params);
      if (result.success) break;

      if (attempts < NOTIFICATION_CONSTANTS.RETRY.MAX_ATTEMPTS) {
        const delay =
          NOTIFICATION_CONSTANTS.RETRY.INITIAL_DELAY_MS *
          Math.pow(NOTIFICATION_CONSTANTS.RETRY.BACKOFF_FACTOR, attempts - 1);
        console.warn(
          `[EMAIL_RETRY] Retrying Email dispatch (${attempts}/${NOTIFICATION_CONSTANTS.RETRY.MAX_ATTEMPTS}) after ${delay}ms...`,
        );
        await this.sleep(delay);
      }
    }

    // Persist Notification Record in Database
    try {
      const validUserId = await this.resolveValidUserId(params.userId);
      const dbRecord = await prisma.notification.create({
        data: {
          userId: validUserId,
          channel: 'EMAIL',
          type: params.type as any,
          title: params.subject || `Email: ${params.type}`,
          message: `Transactional Email (${params.type}) sent to ${params.recipientEmail}`,
          status: result.success ? 'SENT' : 'FAILED',
          provider: result.provider,
          providerResponse: result.providerResponse
            ? JSON.parse(JSON.stringify(result.providerResponse))
            : undefined,
          metadata: params.variables ? JSON.parse(JSON.stringify(params.variables)) : undefined,
          recipient: params.recipientEmail,
          sentAt: result.success ? new Date() : null,
        },
      });
      result.notificationId = dbRecord.id;
    } catch (err: any) {
      console.warn(
        '[NOTIFICATION_DB_LOG_WARN] Failed to write Email log to database:',
        err.message,
      );
    }

    return result;
  }

  /**
   * Central Unified Notification Dispatcher.
   * Automatically invokes the correct providers (SMS, EMAIL, IN_APP).
   */
  static async sendNotification(
    params: SendNotificationParams,
  ): Promise<NotificationDispatchResult[]> {
    const results: NotificationDispatchResult[] = [];
    const channels = params.channels || ['EMAIL', 'SMS', 'IN_APP'];
    const vars = params.variables || {};

    // 1. Dispatch SMS
    if (channels.includes('SMS') && params.recipientMobile) {
      try {
        const smsRes = await this.sendSMS({
          recipientMobile: params.recipientMobile,
          type: params.type,
          variables: vars,
          userId: params.userId,
        });
        results.push(smsRes);
      } catch (err: any) {
        console.warn('[NOTIFICATION_SMS_SWALLOWED]', err.message);
      }
    }

    // 2. Dispatch Email
    if (channels.includes('EMAIL') && params.recipientEmail) {
      try {
        const emailRes = await this.sendEmail({
          recipientEmail: params.recipientEmail,
          recipientName: params.recipientName,
          type: params.type,
          variables: vars,
          userId: params.userId,
        });
        results.push(emailRes);
      } catch (err: any) {
        console.warn('[NOTIFICATION_EMAIL_SWALLOWED]', err.message);
      }
    }

    // 3. Dispatch In-App Notification
    if (channels.includes('IN_APP')) {
      try {
        const title = params.title || `Update on ${params.type}`;
        const message = params.message || buildSMSMessage(params.type, vars);
        const validUserId = await this.resolveValidUserId(params.userId);

        const inAppRecord = await prisma.notification.create({
          data: {
            userId: validUserId,
            channel: 'IN_APP',
            type: params.type as any,
            title,
            message,
            status: 'SENT',
            provider: 'SYSTEM_IN_APP',
            link: params.link || null,
            metadata: vars ? JSON.parse(JSON.stringify(vars)) : undefined,
            sentAt: new Date(),
          },
        });

        results.push({
          success: true,
          notificationId: inAppRecord.id,
          channel: 'IN_APP',
          status: 'SENT',
          provider: 'SYSTEM_IN_APP',
          message: 'In-app notification created successfully.',
        });
      } catch (err: any) {
        console.warn('[NOTIFICATION_INAPP_SWALLOWED]', err.message);
      }
    }

    return results;
  }

  /**
   * Automated Admin Alerts
   */
  static async sendAdminAlert(params: AdminAlertParams) {
    try {
      return await AdminAlertService.notifyAdmin(params);
    } catch (err: any) {
      console.warn('[NOTIFICATION_ADMIN_ALERT_SWALLOWED]', err.message);
      return { success: false };
    }
  }

  /**
   * Retrieves In-App notifications for a user.
   */
  static async getUserNotifications(userId: string, limit = 20) {
    try {
      return await prisma.notification.findMany({
        where: {
          userId,
          channel: 'IN_APP',
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (err: any) {
      console.error('[GET_USER_NOTIFICATIONS_ERROR]', err.message);
      return [];
    }
  }

  /**
   * Marks a notification as read.
   */
  static async markAsRead(notificationId: string, userId: string) {
    try {
      return await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId,
        },
        data: {
          isRead: true,
        },
      });
    } catch (err: any) {
      console.error('[MARK_AS_READ_ERROR]', err.message);
      return { count: 0 };
    }
  }
}
