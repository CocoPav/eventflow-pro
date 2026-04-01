import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

/* ── Context ────────────────────────────────────────────── */
const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

/* ── Provider ───────────────────────────────────────────── */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type = 'success', duration = 3200) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration, exiting: false }]);
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 320);
  }, []);

  // Aliases
  const toast = {
    success: (msg, d) => push(msg, 'success', d),
    error:   (msg, d) => push(msg, 'error',   d),
    warning: (msg, d) => push(msg, 'warning', d),
    info:    (msg, d) => push(msg, 'info',    d),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

/* ── Single Toast ───────────────────────────────────────── */
const CONFIGS = {
  success: { icon: CheckCircle2, color: '#059669', bg: '#f0fdf4', border: '#d1fae5' },
  error:   { icon: AlertCircle,  color: '#dc2626', bg: '#fff5f5', border: '#fecaca' },
  warning: { icon: AlertTriangle,color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  info:    { icon: Info,          color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
};

function ToastItem({ toast, onDismiss }) {
  const cfg = CONFIGS[toast.type] || CONFIGS.info;
  const Icon = cfg.icon;

  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: 'var(--radius-lg)',
        padding: '10px 12px',
        boxShadow: 'var(--shadow-md)',
        minWidth: 260,
        maxWidth: 380,
        animation: toast.exiting
          ? 'toastOut 0.28s var(--ease-smooth) forwards'
          : 'toastIn 0.28s var(--ease-out) forwards',
        pointerEvents: 'all',
      }}
    >
      <Icon size={16} color={cfg.color} strokeWidth={2.5} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: 600, color: '#111', lineHeight: 1.4 }}>
        {toast.message}
      </span>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#9ca3af', padding: 2, borderRadius: 4,
          display: 'flex', alignItems: 'center', flexShrink: 0,
        }}
      >
        <X size={13} />
      </button>
    </div>
  );
}

/* ── Stack ──────────────────────────────────────────────── */
function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column-reverse',
      gap: 8,
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
