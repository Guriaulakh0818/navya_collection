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
      <div className="fixed inset-x-0 bottom-4 z-[1000] flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-full px-4 py-2 text-sm font-medium text-white shadow-lg ${
              t.variant === 'error'
                ? 'bg-error'
                : t.variant === 'success'
                  ? 'bg-success'
                  : 'bg-navy'
            }`}
          >
            {t.message}
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
