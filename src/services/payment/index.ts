import { ApiClient } from '../api/client';

const checkoutClient = new ApiClient('/api/v1/checkout');

export async function initiateCheckout(data: {
  addressId: string;
  paymentMethod: 'cod' | 'online';
  couponCode?: string;
}) {
  return checkoutClient.post('/initiate', data);
}

export async function confirmPayment(orderId: string, paymentId: string) {
  return checkoutClient.post('/confirm', { orderId, paymentId });
}
