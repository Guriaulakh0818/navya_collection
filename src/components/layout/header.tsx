'use client';

import { useState } from 'react';

const navLinks = [
  { href: '#brand', label: 'Brand' },
  { href: '#collections', label: 'Collections' },
  { href: '#products', label: 'Products' },
  { href: '#phases', label: 'Phases' },
  { href: '#contact', label: 'Contact' },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-navy font-heading text-lg font-bold text-white">
            N
          </div>
          <div>
            <div className="text-sm font-bold text-navy">Navya</div>
            <div className="text-xs text-slate-500">Collection</div>
          </div>
        </div>

        <nav className={`hidden gap-6 text-sm font-medium text-slate-600 md:flex`}>
          {navLinks.map((link) => (
            <a key={link.href} href={link.href}>{link.label}</a>
          ))}
        </nav>

        <button
          className="md:hidden rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-navy"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
      </div>

      {menuOpen && (
        <nav className="md:hidden border-t border-border bg-bg px-4 py-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block py-2 text-sm font-medium text-slate-600"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
