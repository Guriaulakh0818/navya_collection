'use client';

import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (!items.length) return null;

  return (
    <nav className={cn('flex items-center gap-2 text-sm', className)} aria-label="Breadcrumb">
      <Link href="/" className="text-slate-500 hover:text-navy">
        <Home className="h-4 w-4" />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={index} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-slate-400" />
            {isLast || !item.href ? (
              <span className={cn('font-medium', isLast ? 'text-navy' : 'text-slate-600')}>
                {item.label}
              </span>
            ) : (
              <Link href={item.href} className="text-slate-600 hover:text-navy">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
