'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import './toast.css';

export type ToastVariant = 'success' | 'warning' | 'error' | 'info';

export interface ToastOptions {
  id?: string;
  duration?: number; // ms, 0 = persistent
  onClose?: () => void;
}

export interface Toast {
  id: string;
  title: string;
  body?: string;
  variant: ToastVariant;
  duration: number;
  isExiting?: boolean;
}

interface ToastContextType {
  toasts: Toast[];
  add: (title: string, variant: ToastVariant, options?: ToastOptions & { body?: string }) => string;
  remove: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback(
    (title: string, variant: ToastVariant, options?: ToastOptions & { body?: string }) => {
      const id = options?.id || Math.random().toString(36).substr(2, 9);
      const duration = options?.duration ?? (variant === 'error' ? 6000 : 4000);

      const toast: Toast = {
        id,
        title,
        body: options?.body,
        variant,
        duration,
      };

      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        setTimeout(() => remove(id), duration);
      }

      return id;
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t)),
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 150);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, add, remove }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return {
    success: (title: string, options?: ToastOptions & { body?: string }) =>
      context.add(title, 'success', options),
    warning: (title: string, options?: ToastOptions & { body?: string }) =>
      context.add(title, 'warning', options),
    error: (title: string, options?: ToastOptions & { body?: string }) =>
      context.add(title, 'error', options),
    info: (title: string, options?: ToastOptions & { body?: string }) =>
      context.add(title, 'info', options),
  };
};

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.variant} ${toast.isExiting ? 'toast--exit' : ''}`.trim()}
        >
          <div className="toast__icon">
            {toast.variant === 'success' && '✓'}
            {toast.variant === 'warning' && '!'}
            {toast.variant === 'error' && '✕'}
            {toast.variant === 'info' && 'i'}
          </div>
          <div className="toast__content">
            <h3 className="toast__title">{toast.title}</h3>
            {toast.body && <p className="toast__body">{toast.body}</p>}
          </div>
          <button
            className="toast__close"
            onClick={() => onRemove(toast.id)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};
