import axios from 'axios';

import { NOTIFICATION_CONSTANTS } from '../constants/notification.constants';
import {
  renderAdminAlertEmail,
  renderCancelledEmail,
  renderDeliveredEmail,
  renderInvoiceEmail,
  renderOrderConfirmationEmail,
  renderReturnApprovedEmail,
  renderShippingConfirmationEmail,
  renderWelcomeEmail,
} from '../templates';
import type { NotificationDispatchResult, SendEmailParams } from '../types/notification.types';

export class EmailService {
  /**
   * Selects template and renders subject & HTML body.
   */
  private static renderTemplate(
    type: string,
    vars: any,
    customSubject?: string,
  ): { subject: string; html: string } {
    let result: { subject: string; html: string };

    switch (type) {
      case 'WELCOME':
        result = renderWelcomeEmail(vars);
        break;
      case 'ORDER_PLACED':
      case 'ORDER_CONFIRMED':
        result = renderOrderConfirmationEmail(vars);
        break;
      case 'ORDER_SHIPPED':
      case 'OUT_FOR_DELIVERY':
        result = renderShippingConfirmationEmail(vars);
        break;
      case 'DELIVERED':
        result = renderDeliveredEmail(vars);
        break;
      case 'ORDER_CANCELLED':
        result = renderCancelledEmail(vars);
        break;
      case 'INVOICE':
        result = renderInvoiceEmail(vars);
        break;
      case 'RETURN_APPROVED':
        result = renderReturnApprovedEmail(vars);
        break;
      case 'ADMIN_NEW_ORDER':
      case 'ADMIN_PAYMENT_FAILURE':
      case 'ADMIN_LOW_STOCK':
      case 'ADMIN_OUT_OF_STOCK':
        result = renderAdminAlertEmail(vars);
        break;
      default:
        result = renderOrderConfirmationEmail(vars);
        break;
    }

    if (customSubject) {
      result.subject = customSubject;
    }

    return result;
  }

  /**
   * Sends transactional email via configured Email Service API with development fallback.
   */
  static async sendEmail(params: SendEmailParams): Promise<NotificationDispatchResult> {
    const correlationId = params.correlationId || `email_${Date.now()}`;
    const recipientEmail = (params.recipientEmail || '').trim().toLowerCase();
    const recipientName = params.recipientName || varsCustomerName(params.variables);

    const { subject, html } = this.renderTemplate(params.type, params.variables, params.subject);
    const apiKey = process.env.BREVO_API_KEY || process.env.EMAIL_API_KEY || '';

    console.log(
      `[EMAIL_DISPATCH_INIT] Dispatching Email to ${recipientEmail} (${params.type}) | CID: ${correlationId}...`,
    );

    // Development / Mock Fallback if API key missing
    if (!apiKey) {
      console.log(`📧 [DEV_EMAIL_FALLBACK] Email to ${recipientEmail} | Subject: "${subject}"`);
      return {
        success: true,
        channel: 'EMAIL',
        status: 'SENT',
        provider: 'DEV_FALLBACK_EMAIL',
        message: 'Email logged in development console.',
        providerResponse: { recipientEmail, subject, dev: true },
      };
    }

    try {
      const emailConfig = NOTIFICATION_CONSTANTS.EMAIL_PROVIDER || NOTIFICATION_CONSTANTS.BREVO;
      const emailUrl = `${emailConfig.API_URL}${emailConfig.EMAIL_ENDPOINT}`;
      const response = await axios.post(
        emailUrl,
        {
          sender: {
            name: emailConfig.SENDER_NAME,
            email: emailConfig.SENDER_EMAIL,
          },
          to: [
            {
              email: recipientEmail,
              name: recipientName,
            },
          ],
          subject,
          htmlContent: html,
        },
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey,
          },
        },
      );

      console.log(
        `✅ [EMAIL_SUCCESS] Email dispatched to ${recipientEmail}. MessageId:`,
        response.data?.messageId,
      );

      return {
        success: true,
        channel: 'EMAIL',
        status: 'SENT',
        provider: 'TRANSACTIONAL_EMAIL',
        message: 'Email dispatched successfully.',
        providerResponse: response.data,
      };
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Email API call failed.';
      console.warn(`⚠️ [EMAIL_ERROR] Failed to send email to ${recipientEmail}:`, errorMsg);

      return {
        success: false,
        channel: 'EMAIL',
        status: 'FAILED',
        provider: 'TRANSACTIONAL_EMAIL',
        message: errorMsg,
        providerResponse: error.response?.data || error.message,
        error: error.response?.data || error.message,
      };
    }
  }
}

function varsCustomerName(vars?: any): string {
  return vars?.customerName || 'Valued Customer';
}
