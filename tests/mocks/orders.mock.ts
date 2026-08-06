export const MOCK_ORDER = {
  id: 'ord_1001',
  orderNumber: 'NC-2026-1001',
  userId: 'usr_cust_001',
  subtotal: 3499,
  discount: 350,
  shippingCharge: 0,
  tax: 566.82,
  grandTotal: 3715.82,
  orderStatus: 'CONFIRMED',
  paymentStatus: 'PAID',
  paymentMethod: 'RAZORPAY',
  createdAt: '2026-08-02T10:00:00Z',
  items: [
    {
      id: 'item_01',
      productId: 'prod_001',
      name: 'Pure Chanderi Silk Saree with Zari Border',
      price: 3499,
      quantity: 1,
    },
  ],
};
