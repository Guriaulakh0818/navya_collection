'use client';

import Link from 'next/link';

const socials = [
  { href: 'https://instagram.com', label: 'Instagram' },
  { href: 'https://facebook.com', label: 'Facebook' },
  { href: 'https://twitter.com', label: 'Twitter' },
];

type FooterSocialProps = {
  className?: string;
};

export function FooterSocial({ className }: FooterSocialProps) {
  return (
    <div className={className || 'flex items-center gap-4'}>
      {socials.map((s) => (
        <Link
          key={s.label}
          href={s.href}
          className="text-sm font-medium text-slate-600 hover:text-navy"
        >
          {s.label}
        </Link>
      ))}
    </div>
  );
}
