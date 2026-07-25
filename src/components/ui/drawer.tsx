'use client';

import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Fragment, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  side?: 'left' | 'right';
};

export function Drawer({ open, onClose, title, children, side = 'right' }: DrawerProps) {
  if (!open) return null;

  const position = side === 'right' ? 'inset-y-0 right-0' : 'inset-y-0 left-0';

  return createPortal(
    <Fragment>
      <div className="fixed inset-0 z-[500]">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div
          className={cn(
            'absolute h-full w-full max-w-sm bg-white shadow-xl',
            'transform transition-transform duration-300 ease-in-out',
            position,
            open ? 'translate-x-0' : side === 'right' ? 'translate-x-full' : '-translate-x-full',
          )}
        >
          <div className="flex items-center justify-between border-b border-border p-4">
            {title && <h3 className="font-semibold text-navy">{title}</h3>}
            <button
              onClick={onClose}
              className="rounded-full p-1 text-slate-500 hover:text-navy"
              aria-label="Close drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </Fragment>,
    typeof document !== 'undefined' ? document.body : (null as unknown as Element),
  );
}
