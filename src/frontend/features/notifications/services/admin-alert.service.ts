import { NOTIFICATION_CONSTANTS } from '../constants/notification.constants';
import type { AdminAlertParams, NotificationDispatchResult } from '../types/notification.types';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';

export class AdminAlertService {
  /**
   * Sends critical store alert to store admins via Email and SMS.
   */
  static async notifyAdmin(params: AdminAlertParams): Promise<{
    emailResult?: NotificationDispatchResult;
    smsResult?: NotificationDispatchResult;
  }> {
    const adminEmail = NOTIFICATION_CONSTANTS.ADMIN.EMAIL;
    const adminMobile = NOTIFICATION_CONSTANTS.ADMIN.MOBILE;
    const correlationId = `admin_alert_${Date.now()}`;

    console.log(`🚨 [ADMIN_ALERT_INIT] Alert Type: ${params.type} | Title: "${params.title}"`);

    const emailPromise = EmailService.sendEmail({
      recipientEmail: adminEmail,
      recipientName: 'Store Administrator',
      type: params.type,
      subject: `[ADMIN ALERT] ${params.title}`,
      variables: {
        customMessage: params.message,
        ...params.variables,
      },
      correlationId,
    });

    const smsPromise = SmsService.sendSMS({
      recipientMobile: adminMobile,
      type: params.type,
      variables: {
        customMessage: `[ADMIN ALERT] ${params.title}: ${params.message}`,
        ...params.variables,
      },
      correlationId,
    });

    const [emailResult, smsResult] = await Promise.all([
      emailPromise.catch((err) => ({
        success: false,
        channel: 'EMAIL' as const,
        status: 'FAILED' as const,
        provider: 'EMAIL',
        message: err.message,
      })),
      smsPromise.catch((err) => ({
        success: false,
        channel: 'SMS' as const,
        status: 'FAILED' as const,
        provider: 'SMS',
        message: err.message,
      })),
    ]);

    return { emailResult, smsResult };
  }
}
