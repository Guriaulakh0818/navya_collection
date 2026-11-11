/**
 * Official JiivaaKart / Navya Collection WhatsApp Business Support Service
 * Support Number: 919053883125
 */

export const NAVYA_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919053883125';

export interface WhatsAppMessagePayload {
  toPhone: string;
  templateName: string;
  variables: Record<string, string>;
}

export class WhatsAppService {
  /**
   * Dispatches automated template message via Meta WhatsApp Business Cloud API.
   * Gracefully simulates delivery in development or when credentials are pending.
   */
  static async sendTemplateMessage(
    payload: WhatsAppMessagePayload,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    const formattedPhone = payload.toPhone.replace(/\D/g, '').replace(/^0+/, '');
    const fullPhone = formattedPhone.length === 10 ? `91${formattedPhone}` : formattedPhone;

    if (!token || !phoneId) {
      console.log(
        `[WHATSAPP_CLOUD_SIMULATED] To: ${fullPhone} | Template: ${payload.templateName}`,
        payload.variables,
      );
      return { success: true, messageId: `wamid_sim_${Date.now()}` };
    }

    try {
      const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: fullPhone,
          type: 'template',
          template: {
            name: payload.templateName,
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: Object.entries(payload.variables).map(([_, val]) => ({
                  type: 'text',
                  text: val,
                })),
              },
            ],
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: json.error?.message || 'Failed to dispatch WhatsApp template',
        };
      }

      return { success: true, messageId: json.messages?.[0]?.id };
    } catch (err: any) {
      console.error('[WHATSAPP_API_ERROR]', err);
      return { success: false, error: err.message || 'WhatsApp API request failed' };
    }
  }

  /**
   * Dispatches 1-hour Abandoned Cart Recovery Template
   */
  static async sendAbandonedCartRecovery(params: {
    customerName: string;
    customerPhone: string;
    itemCount: number;
    cartUrl: string;
  }) {
    return this.sendTemplateMessage({
      toPhone: params.customerPhone,
      templateName: 'jiivaa_cart_recovery',
      variables: {
        name: params.customerName || 'Shopper',
        count: String(params.itemCount),
        cart_link: params.cartUrl,
      },
    });
  }
}

/**
 * Builds the official WhatsApp click-to-chat URL with pre-filled order context (Section 4, 18).
 */
export function generateWhatsAppReturnUrl(params: {
  orderNumber: string;
  productName: string;
  requestType: 'Return' | 'Replacement';
}): string {
  const message = [
    'Hi JiivaaKart,',
    'I want to raise a return/replacement request.',
    '',
    `Order ID: ${params.orderNumber}`,
    `Product: ${params.productName}`,
    `Request Type: ${params.requestType}`,
  ].join('\n');

  return `https://wa.me/${NAVYA_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
