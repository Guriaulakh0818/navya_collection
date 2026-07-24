import { CartState } from '../../../customer/lib/types';

type OrderSummaryProps = {
  cart: CartState;
};

export function OrderSummary({ cart }: OrderSummaryProps) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-premium">
      <h3 className="font-heading text-2xl text-navy">Order Summary</h3>
      <div className="mt-4 space-y-2 text-sm text-slate-600">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>₹{cart.subtotal.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{cart.shipping === 0 ? 'Free' : `₹${cart.shipping.toLocaleString('en-IN')}`}</span>
        </div>
        {cart.discount > 0 && (
          <div className="flex justify-between text-success">
            <span>Discount</span>
            <span>-₹{cart.discount.toLocaleString('en-IN')}</span>
          </div>
        )}
        <div className="border-t border-border pt-2 flex justify-between font-semibold text-navy">
          <span>Total</span>
          <span>₹{cart.total.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
}
