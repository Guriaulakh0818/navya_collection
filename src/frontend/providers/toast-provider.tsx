'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

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

  const toast = (message: string, variant: Toast['variant'] = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ toasts, toast }}>
      {children}
      <div className="fixed inset-x-0 bottom-6 z-[9999] flex flex-col items-center gap-2.5 pointer-events-none px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2.5 rounded-full px-5 py-3 text-xs sm:text-sm font-bold shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-3 duration-300 ${
              t.variant === 'error'
                ? 'bg-red-950/95 text-red-100 border border-red-500/50 shadow-red-950/50 ring-1 ring-red-500/30'
                : t.variant === 'success'
                  ? 'bg-emerald-950/95 text-emerald-100 border border-emerald-500/50 shadow-emerald-950/50 ring-1 ring-emerald-500/30'
                  : 'bg-slate-900/95 text-white border border-slate-700/60 shadow-slate-950/50'
            }`}
          >
            {t.variant === 'error' && (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-white font-extrabold text-[10px]">
                ✕
              </span>
            )}
            {t.variant === 'success' && (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white font-extrabold text-[10px]">
                ✓
              </span>
            )}
            {(!t.variant || t.variant === 'info') && (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-slate-950 font-extrabold text-[10px]">
                ℹ
              </span>
            )}
            <span className="tracking-tight">{t.message}</span>
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
