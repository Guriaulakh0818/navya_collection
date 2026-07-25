'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const showEllipsis = totalPages > 7;

  const getPageNumbers = () => {
    if (!showEllipsis) return pages;

    if (page <= 4) {
      return [...pages.slice(0, 5), '...', totalPages];
    }
    if (page >= totalPages - 3) {
      return [1, '...', ...pages.slice(totalPages - 5)];
    }
    return [1, '...', page - 1, page, page + 1, '...', totalPages];
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {getPageNumbers().map((p, index) =>
        p === '...' ? (
          <span key={`ellipsis-${index}`} className="px-2 text-sm text-slate-500">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={cn(
              'inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium',
              page === p
                ? 'bg-navy text-white'
                : 'border border-border bg-white text-slate-600 hover:bg-slate-50',
            )}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
