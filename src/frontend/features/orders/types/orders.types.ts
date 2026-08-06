export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface TrackingEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'active' | 'pending';
}

export type OrderStatus = 'Processing' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: OrderStatus;
  total: number;
  subtotal: number;
  shipping: number;
  items: OrderItem[];
  address: {
    name: string;
    mobile: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  deliveryMethod: string;
  paymentMethod: string;
  trackingEvents: TrackingEvent[];
}
