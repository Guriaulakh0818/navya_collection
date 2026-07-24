import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-24 text-center">
      <h1 className="font-heading text-6xl text-navy">404</h1>
      <p className="mt-4 text-lg text-slate-600">Sorry, we couldn&apos;t find that page.</p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-[#234b8f]"
      >
        Back to Home
      </Link>
    </div>
  );
}
