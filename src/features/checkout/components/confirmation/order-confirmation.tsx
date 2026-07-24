'use client';

type Props = {
  orderId: string;
  message: string;
};

export function OrderConfirmation({ orderId, message }: Props) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
        <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="font-heading text-4xl text-navy">Order Confirmed!</h1>
      <p className="mt-4 text-lg text-slate-600">{message}</p>
      <p className="mt-2 text-sm text-slate-600">Order ID: <span className="font-semibold text-navy">{orderId}</span></p>
      <a
        href="/"
        className="mt-8 inline-flex rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-[#234b8f]"
      >
        Continue Shopping
      </a>
    </div>
  );
}
