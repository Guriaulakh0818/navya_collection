'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-24 text-center">
      <h1 className="font-heading text-6xl text-navy">Something went wrong</h1>
      <p className="mt-4 text-lg text-slate-600">{error.message}</p>
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-[#234b8f]"
      >
        Try again
      </button>
    </div>
  );
}
