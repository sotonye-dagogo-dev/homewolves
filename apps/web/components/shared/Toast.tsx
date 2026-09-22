'use client';

import { createContext, useContext, useCallback, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
type Toast = { id: string; type: ToastType; message: string };

const ToastContext = createContext<{
  toast: (msg: string, type?: ToastType) => void;
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
} | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const api = {
    toast,
    success: (m: string) => toast(m, 'success'),
    error: (m: string) => toast(m, 'error'),
    info: (m: string) => toast(m, 'info'),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        <div aria-live="polite" aria-atomic="true" className="sr-only" />
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className="pointer-events-auto min-w-[280px] max-w-[420px] flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md animate-in slide-in-from-bottom-2"
            style={{
              background: t.type === 'error' ? 'var(--color-error-bg)' : t.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-bg-elevated)',
              borderColor: t.type === 'error' ? 'var(--color-error)' : t.type === 'success' ? 'var(--color-success)' : 'var(--color-border-default)',
              color: 'var(--color-text-primary)',
            }}
          >
            <span className="mt-0.5">
              {t.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : t.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-600" /> : <Info className="w-5 h-5 text-blue-600" />}
            </span>
            <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="p-1 rounded-full hover:bg-black/5"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
