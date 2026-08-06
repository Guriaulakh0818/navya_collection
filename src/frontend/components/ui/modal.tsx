'use client';

import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Fragment, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function Modal({ open, onClose, title, description, children, footer }: ModalProps) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[500]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className={cn(
            'relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl',
            'transform transition-all',
          )}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-start justify-between">
            <div>
              {title && <h3 className="text-lg font-semibold text-navy">{title}</h3>}
              {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-slate-500 hover:text-navy"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4">{children}</div>

          {footer && <div className="mt-6 flex items-center justify-end gap-3">{footer}</div>}
        </div>
      </div>
    </div>,
    typeof document !== 'undefined' ? document.body : (null as unknown as Element),
  );
}
