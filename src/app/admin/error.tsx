'use client';

import { AlertTriangle, Home, LogIn, RefreshCw, ShieldAlert } from 'lucide-react';
import { useEffect } from 'react';
import Link from 'next/link';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('⚠️ [ADMIN_PORTAL_EXCEPTION]', {
      message: error?.message,
      stack: error?.stack,
      digest: error?.digest,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-6 shadow-xl">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-600">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-navy/5 text-navy border border-navy/10 rounded-full text-[11px] font-black uppercase tracking-wider inline-block">
            Navya Admin Safety Shield
          </span>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Admin Operation Interrupted
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
            A temporary connection issue or unhandled request occurred in the admin portal. Your
            admin session remains safe.
          </p>
        </div>

        {error?.message && (
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-left">
            <p className="text-[10px] font-mono text-slate-600 break-words line-clamp-3">
              <span className="font-bold text-rose-600">Diagnostics:</span> {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>

          <Link
            href="/admin/dashboard"
            className="flex-1 py-2.5 bg-navy hover:bg-navy-hover text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Admin Dashboard</span>
          </Link>

          <Link
            href="/admin/login"
            className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1"
            title="Re-login to refresh admin token"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="sr-only sm:not-sr-only">Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
