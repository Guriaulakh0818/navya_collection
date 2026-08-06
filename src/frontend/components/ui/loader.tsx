'use client';

import { cn } from '@/lib/utils';

type LoaderProps = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
  light?: boolean;
};

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-3',
};

export function Loader({ size = 'md', className, text, light = false }: LoaderProps) {
  return (
    <div className={cn('inline-flex items-center justify-center gap-2.5', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-t-transparent shrink-0',
          light ? 'border-white' : 'border-navy',
          sizeClasses[size],
        )}
      />
      {text && (
        <span
          className={cn('text-xs font-bold tracking-wide', light ? 'text-white' : 'text-slate-700')}
        >
          {text}
        </span>
      )}
    </div>
  );
}

export function FullPageLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader size="lg" text={text} />
    </div>
  );
}
