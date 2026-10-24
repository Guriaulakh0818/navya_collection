'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type Toast = {
  id: string;
  message: string;
  variant?: 'info' | 'success' | 'error';
};

type ToastContextType = {
  toasts: Toast[];
  toast: (message: string, variant?: Toast['variant']) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, variant: Toast['variant'] = 'info') => {
    if (!message) return;
    const id = `${Date.now()}-${Math.random()}`;

    setToasts((prev) => {
      // Prevent duplicate toast spam if the same message is already visible
      if (prev.some((t) => t.message === message)) {
        return prev;
      }
      return [...prev, { id, message, variant }];
    });

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const contextValue = useMemo(() => ({ toasts, toast }), [toasts, toast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Centered phone flash message popup */}
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-3 pointer-events-none px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
            className={`pointer-events-auto flex items-center gap-3 rounded-full px-5 py-3 sm:px-6 sm:py-3.5 text-xs sm:text-sm font-bold shadow-2xl backdrop-blur-md transition-all duration-200 animate-in fade-in zoom-in-95 cursor-pointer active:scale-95 ${
              t.variant === 'error'
                ? 'bg-navy-900/95 text-white border border-red-500/60 shadow-black/70 ring-1 ring-red-500/30'
                : 'bg-navy-900/95 text-white border border-orange/50 shadow-black/70 ring-1 ring-orange/30'
            }`}
          >
            {t.variant === 'error' && (
              <span className="flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full bg-red-500 text-white font-extrabold text-[11px] sm:text-xs shadow-xs">
                ✕
              </span>
            )}
            {t.variant === 'success' && (
              <span className="flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full bg-orange text-white font-extrabold text-[11px] sm:text-xs shadow-xs">
                ✓
              </span>
            )}
            {(!t.variant || t.variant === 'info') && (
              <span className="flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full bg-orange text-white font-extrabold text-[11px] sm:text-xs shadow-xs">
                ℹ
              </span>
            )}
            <span className="tracking-tight text-white leading-snug line-clamp-2 max-w-[78vw] sm:max-w-md">
              {t.message}
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}
