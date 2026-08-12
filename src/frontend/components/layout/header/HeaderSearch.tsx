'use client';

import { Building2, Search, ShoppingBag, Tag, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type HeaderSearchProps = {
  className?: string;
};

export function HeaderSearch({ className }: HeaderSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<{
    products: any[];
    shops: any[];
    categories: any[];
  }>({
    products: [],
    shops: [],
    categories: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search preview dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // 300ms Debounced Suggestions Fetcher
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions({ products: [], shops: [], categories: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/v1/search/suggestions?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        if (data.success && data.data) {
          setSuggestions(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch search suggestions:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const hasSuggestions =
    suggestions.products.length > 0 ||
    suggestions.shops.length > 0 ||
    suggestions.categories.length > 0;

  return (
    <div ref={searchRef} className={`relative w-full ${className || ''}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center w-full">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search products, boutiques, or categories..."
          className="w-full h-10 pl-10 pr-9 rounded-full bg-slate-100 border border-slate-200/80 text-xs sm:text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:border-navy focus:bg-white focus:ring-2 focus:ring-navy/10 transition-all shadow-xs"
        />

        <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSuggestions({ products: [], shops: [], categories: [] });
            }}
            className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 rounded-full"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[80vh] overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" />
              Searching marketplace...
            </div>
          ) : !hasSuggestions ? (
            <div className="p-4 text-center text-xs text-slate-500">
              No matching products or boutiques found for &quot;{query}&quot;. Press Enter to search
              catalog.
            </div>
          ) : (
            <>
              {/* Product Suggestions */}
              {suggestions.products.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                    Matching Products
                  </span>
                  <div className="space-y-1">
                    {suggestions.products.map((p) => (
                      <Link
                        key={p.id}
                        href={`/product/${p.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-all group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-400 select-none">
                          {p.images?.[0]?.imageUrl ? (
                            <img
                              src={p.images[0].imageUrl}
                              alt={p.name}
                              className="w-full h-full object-cover select-none overflow-hidden [text-indent:-9999px]"
                            />
                          ) : (
                            <ShoppingBag className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block text-xs font-bold text-navy truncate group-hover:text-orange transition-colors">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate">
                            By {p.shop?.name || 'Boutique'}
                          </span>
                        </div>
                        <span className="text-xs font-extrabold text-navy font-mono">
                          ₹{Number(p.price || 0).toLocaleString('en-IN')}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Shop Suggestions */}
              {suggestions.shops.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                    Boutique Stores
                  </span>
                  <div className="space-y-1">
                    {suggestions.shops.map((s) => (
                      <Link
                        key={s.id}
                        href={`/shop/${s.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-all group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-amber-500 select-none">
                          {s.logo ? (
                            <img
                              src={s.logo}
                              alt={s.name}
                              className="w-full h-full object-cover select-none overflow-hidden [text-indent:-9999px]"
                            />
                          ) : (
                            <Building2 className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block text-xs font-bold text-navy truncate group-hover:text-orange transition-colors">
                            {s.name}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {s.city || 'Hisar'}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-orange uppercase">
                          Visit Shop →
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Category Suggestions */}
              {suggestions.categories.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                    Categories
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.categories.map((c) => (
                      <Link
                        key={c.id}
                        href={`/shop?category=${c.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="px-3 py-1 bg-slate-100 hover:bg-navy hover:text-white text-navy font-bold text-xs rounded-full transition-all flex items-center gap-1"
                      >
                        <Tag className="w-3 h-3" /> {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              className="text-xs text-orange font-bold hover:underline"
            >
              See All Results for &quot;{query}&quot; →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
