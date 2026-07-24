import { ApiClient } from '../api/client';

const shippingClient = new ApiClient('/api/v1/shipping');

export async function createShipment(data: {
  orderId: string;
  addressId: string;
  items: { sku: string; quantity: number }[];
}) {
  return shippingClient.post('/create', data);
}

export async function trackShipment(trackingId: string) {
  return shippingClient.get(`/track/${trackingId}`);
}

export async function cancelShipment(trackingId: string) {
  return shippingClient.post(`/cancel/${trackingId}`);
}
