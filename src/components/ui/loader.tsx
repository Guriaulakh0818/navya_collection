'use client';

import { cn } from '@/lib/utils';

type LoaderProps = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
};

const sizeClasses = {
  sm: 'h-5 w-5 border-2',
  md: 'h-8 w-8 border-4',
  lg: 'h-12 w-12 border-4',
};

export function Loader({ size = 'md', className, text }: LoaderProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-navy border-t-transparent',
          sizeClasses[size],
        )}
      />
      {text && <p className="text-sm text-slate-600">{text}</p>}
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
