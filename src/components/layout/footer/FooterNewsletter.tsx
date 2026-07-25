'use client';

import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export function FooterNewsletter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  if (subscribed) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
        <span>Thank you for subscribing! Check your inbox for your 15% OFF coupon.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          required
          className="flex-1 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs text-white placeholder:text-white/50 outline-none focus:border-orange focus:ring-2 focus:ring-orange/30 transition-all"
        />
        <button
          type="submit"
          className="rounded-full bg-orange px-5 py-2.5 text-xs font-bold text-white hover:bg-orange-hover transition-colors shadow-sm"
        >
          Join
        </button>
      </div>
    </form>
  );
}
