'use client';

import Link from 'next/link';

// Only verified, official public social profiles belonging to Navya Collection should be listed here.
// Unverified placeholders are strictly omitted per Phase 2.8 trust standards.
const VERIFIED_SOCIALS: Array<{ href: string; label: string }> = [];

type FooterSocialProps = {
  className?: string;
};

export function FooterSocial({ className }: FooterSocialProps) {
  if (!VERIFIED_SOCIALS || VERIFIED_SOCIALS.length === 0) {
    return null;
  }

  return (
    <div className={className || 'flex items-center gap-4'}>
      {VERIFIED_SOCIALS.map((s) => (
        <Link
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-slate-600 hover:text-navy transition-colors"
        >
          {s.label}
        </Link>
      ))}
    </div>
  );
}
