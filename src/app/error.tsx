'use client';

import { AlertCircle, RefreshCw, ShieldAlert } from 'lucide-react';
import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('❌ Application Unhandled Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6 font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-lg w-full text-center space-y-6 shadow-xl">
        <div className="w-16 h-16 bg-orange/10 border border-orange/20 rounded-3xl flex items-center justify-center mx-auto text-orange">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-navy tracking-tight">Something Went Wrong</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            An unexpected error occurred while loading this page. Our team has been automatically
            notified.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 py-3 bg-orange hover:bg-orange/90 text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>

          <Link
            href="/"
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
