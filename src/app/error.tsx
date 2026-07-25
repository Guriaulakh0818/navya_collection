'use client';

import { useEffect } from 'react';
import Link from 'next/link';

import { useToast } from '@/providers';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { toast } = useToast();

  useEffect(() => {
    toast(error.message || 'Something went wrong', 'error');
  }, [error, toast]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-24 text-center">
      <h1 className="font-heading text-6xl text-navy">Something went wrong</h1>
      <p className="mt-4 text-lg text-slate-600">We apologize for the inconvenience.</p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-[#234b8f]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold text-navy hover:bg-slate-50"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
