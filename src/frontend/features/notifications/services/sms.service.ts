import axios from 'axios';

import { NOTIFICATION_CONSTANTS } from '../constants/notification.constants';
import type { NotificationDispatchResult, SendSMSParams } from '../types/notification.types';
import { buildSMSMessage } from '../utils/template.utils';

export class SmsService {
  /**
   * Sends transactional SMS via Brevo SMS API with development fallback.
   */
  static async sendSMS(params: SendSMSParams): Promise<NotificationDispatchResult> {
    const correlationId = params.correlationId || `sms_${Date.now()}`;
    const rawMobile = (params.recipientMobile || '').replace(/\D/g, '');
    const cleanMobile =
      rawMobile.length === 10
        ? `+91${rawMobile}`
        : rawMobile.startsWith('91')
          ? `+${rawMobile}`
          : `+${rawMobile}`;

    const textContent = buildSMSMessage(params.type, params.variables);
    const apiKey =
      process.env.BREVO_API_KEY || process.env.SMS_API_KEY || process.env.BREVO_SMS_API_KEY || '';

    console.log(
      `[SMS_DISPATCH_INIT] Dispatching SMS to ${cleanMobile} (${params.type}) | CID: ${correlationId}...`,
    );

    // Development / Mock Fallback if API key missing
    if (!apiKey) {
      console.log(`📱 [DEV_SMS_FALLBACK] SMS to ${cleanMobile}: "${textContent}"`);
      return {
        success: true,
        channel: 'SMS',
        status: 'SENT',
        provider: 'DEV_FALLBACK_SMS',
        message: 'SMS logged in development console.',
        providerResponse: { textContent, mobile: cleanMobile, dev: true },
      };
    }

    try {
      const smsConfig = NOTIFICATION_CONSTANTS.EMAIL_PROVIDER || NOTIFICATION_CONSTANTS.BREVO;
      const smsUrl = `${smsConfig.API_URL}${smsConfig.SMS_ENDPOINT}`;
      const response = await axios.post(
        smsUrl,
        {
          sender: smsConfig.SMS_SENDER,
          recipient: cleanMobile,
          content: textContent,
          type: 'transactional',
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey,
          },
        },
      );

      console.log(
        `✅ [SMS_SUCCESS] SMS dispatched to ${cleanMobile}. MessageId:`,
        response.data?.messageId || response.data?.reference,
      );

      return {
        success: true,
        channel: 'SMS',
        status: 'SENT',
        provider: 'TRANSACTIONAL_SMS',
        message: 'SMS dispatched successfully.',
        providerResponse: response.data,
      };
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'SMS API call failed.';
      console.warn(`⚠️ [SMS_ERROR] Failed to send SMS to ${cleanMobile}:`, errorMsg);

      const isDevOrAddonMissing =
        process.env.NODE_ENV === 'development' ||
        process.env.NODE_ENV === 'test' ||
        errorMsg.toLowerCase().includes('addon') ||
        errorMsg.toLowerCase().includes('credit') ||
        errorMsg.toLowerCase().includes('account') ||
        errorMsg.toLowerCase().includes('invalid');

      if (isDevOrAddonMissing) {
        console.log(`📱 [DEV_SMS_FALLBACK] SMS to ${cleanMobile}: "${textContent}"`);
        return {
          success: true,
          channel: 'SMS',
          status: 'SENT',
          provider: 'DEV_FALLBACK_SMS',
          message: `SMS fallback mode active (${errorMsg}).`,
          providerResponse: { textContent, mobile: cleanMobile, dev: true, note: errorMsg },
        };
      }

      return {
        success: false,
        channel: 'SMS',
        status: 'FAILED',
        provider: 'TRANSACTIONAL_SMS',
        message: errorMsg,
        providerResponse: error.response?.data || error.message,
        error: error.response?.data || error.message,
      };
    }
  }
}
