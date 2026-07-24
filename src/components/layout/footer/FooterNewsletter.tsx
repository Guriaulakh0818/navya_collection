'use client';

import { useState } from 'react';

type FooterNewsletterProps = {
  title?: string;
  description?: string;
};

export function FooterNewsletter({
  title = 'Stay in the loop',
  description = 'Subscribe to receive updates, access to exclusive deals, and more.',
}: FooterNewsletterProps) {
  const [email, setEmail] = useState('');

  return (
    <div>
      <h3 className="font-heading text-2xl text-navy">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setEmail('');
        }}
        className="mt-4 flex gap-2"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="flex-1 rounded-full border border-border px-4 py-2 text-sm text-slate-900 outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
        />
        <button
          type="submit"
          className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white hover:bg-[#234b8f]"
        >
          Subscribe
        </button>
      </form>
    </div>
  );
}
