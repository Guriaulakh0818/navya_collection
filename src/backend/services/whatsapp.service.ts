/**
 * Official Navya Collection WhatsApp Business Support Service
 * Support Number: 919053883125
 */

export const NAVYA_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919053883125';

/**
 * Builds the official WhatsApp click-to-chat URL with pre-filled order context (Section 4, 18).
 */
export function generateWhatsAppReturnUrl(params: {
  orderNumber: string;
  productName: string;
  requestType: 'Return' | 'Replacement';
}): string {
  const message = [
    'Hi Navya Collection,',
    'I want to raise a return/replacement request.',
    '',
    `Order ID: ${params.orderNumber}`,
    `Product: ${params.productName}`,
    `Request Type: ${params.requestType}`,
  ].join('\n');

  return `https://wa.me/${NAVYA_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
