import Razorpay from 'razorpay';

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function createRazorpayOrder(amount: number, currency = 'INR') {
  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency,
    payment_capture: true,
  });
  return order;
}
