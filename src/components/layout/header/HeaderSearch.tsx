'use client';

import { Search, X } from 'lucide-react';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type HeaderSearchProps = {
  className?: string;
};

const popularSearches = [
  'Navy Cotton Shirt',
  'Kids Ethnic Kurta',
  'Chino Trousers',
  'Summer Wear',
  'Blazers',
];

export function HeaderSearch({ className }: HeaderSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className || ''}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search Gents & Kids Wear..."
          className="w-full rounded-full border border-brand-border bg-brand-divider pl-10 pr-10 py-2.5 text-xs font-medium text-brand-foreground placeholder:text-brand-muted outline-none transition-all focus:bg-white focus:border-navy focus:ring-2 focus:ring-navy/15"
        />
        <Search className="absolute left-3.5 h-4 w-4 text-brand-muted" />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3.5 text-brand-muted hover:text-brand-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </form>

      {/* Quick Search Preview Dropdown */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-dropdown border border-brand-border p-4 z-50 animate-in fade-in duration-150"
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
            Trending Searches
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {popularSearches.map((item) => (
              <button
                key={item}
                onClick={() => {
                  setQuery(item);
                  setIsOpen(false);
                  router.push(`/shop?q=${encodeURIComponent(item)}`);
                }}
                className="rounded-full bg-brand-divider px-3 py-1 text-xs text-brand-foreground hover:bg-navy hover:text-white transition-colors"
              >
                {item}
              </button>
            ))}
          </div>

          <Link
            href={`/shop${query ? `?q=${encodeURIComponent(query)}` : ''}`}
            onClick={() => setIsOpen(false)}
            className="block text-center text-xs font-semibold text-navy hover:text-orange pt-2 border-t border-brand-border"
          >
            {query ? `Search for "${query}" in All Products →` : 'Browse Catalog →'}
          </Link>
        </div>
      )}
    </div>
  );
}
