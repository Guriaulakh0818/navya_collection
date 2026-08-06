'use client';

import { CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';

export function FooterNewsletter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/v1/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setSubscribed(true);
        setEmail('');
        setTimeout(() => setSubscribed(false), 8000);
      } else {
        setErrorMsg(data.message || 'Failed to subscribe. Please try again.');
      }
    } catch {
      setErrorMsg('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold shadow-xs animate-in fade-in duration-200">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
        <span>
          🎉 Subscribed! We sent your 15% OFF coupon code (NAVYA15VIP) to your email inbox!
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full max-w-full">
      <div className="flex flex-col sm:flex-row gap-2 w-full max-w-full">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errorMsg) setErrorMsg('');
          }}
          placeholder="Enter your email address"
          required
          disabled={loading}
          className="w-full sm:flex-1 min-w-0 rounded-xl sm:rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs text-white placeholder:text-white/50 outline-none focus:border-orange focus:ring-2 focus:ring-orange/30 transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto rounded-xl sm:rounded-full bg-orange px-5 py-2.5 text-xs font-extrabold text-white hover:bg-orange-hover transition-colors shadow-sm shrink-0 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            'Subscribe'
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-extrabold flex items-center gap-2 shadow-xs animate-in fade-in duration-200">
          <span className="text-amber-400">⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}
    </form>
  );
}
