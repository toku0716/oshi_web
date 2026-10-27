import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="通知"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: 'calc(100% - 32px)',
        maxWidth: 440,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isInfo = toast.type === 'info';

        return (
          <div
            key={toast.id}
            role="status"
            style={{
              pointerEvents: 'auto',
              padding: '12px 16px',
              borderRadius: 16,
              backgroundColor: isError
                ? 'var(--color-danger, #FF453A)'
                : 'var(--bg-toast, #1C1C1E)',
              color: '#FFFFFF',
              fontSize: 13.5,
              fontWeight: 600,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.28)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              animation: 'fadeIn 0.18s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
              {isError ? (
                <AlertCircle size={18} style={{ flexShrink: 0, color: '#FFFFFF' }} />
              ) : isInfo ? (
                <Info size={18} style={{ flexShrink: 0, color: 'var(--oshi-color)' }} />
              ) : (
                <CheckCircle2 size={18} style={{ flexShrink: 0, color: '#30D158' }} />
              )}
              <span style={{ wordBreak: 'break-word', lineHeight: 1.4 }}>
                {toast.message}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {toast.actionLabel && toast.onAction && (
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await toast.onAction?.();
                    } finally {
                      removeToast(toast.id);
                    }
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  {toast.actionLabel}
                </button>
              )}

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                aria-label="通知を閉じる"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  color: 'rgba(255, 255, 255, 0.7)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <X size={15} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
