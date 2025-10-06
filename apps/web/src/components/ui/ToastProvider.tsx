'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

type Toast = { id: string; title: string; variant?: 'success' | 'error' | 'info' };

type ToastContextValue = {
  show: (title: string, variant?: Toast['variant']) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((title: string, variant: Toast['variant'] = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, title, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className={`px-3 py-2 rounded-lg shadow-medium text-white ${
            t.variant === 'success' ? 'bg-green-600' : t.variant === 'error' ? 'bg-red-600' : 'bg-gray-900'
          }`}>
            {t.title}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}


