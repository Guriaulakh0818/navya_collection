import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-24 text-center">
      <div className="mb-6">
        <span className="inline-block rounded-full bg-navy/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-navy">
          404 Error
        </span>
      </div>
      <h1 className="font-heading text-6xl text-navy">Page Not Found</h1>
      <p className="mt-4 text-lg text-slate-600">
        Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been removed,
        renamed, or does not exist.
      </p>
      <div className="mt-8 flex items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-[#234b8f]"
        >
          Back to Home
        </Link>
        <Link
          href="/shop"
          className="rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold text-navy hover:bg-slate-50"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
