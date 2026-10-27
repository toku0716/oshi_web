import React from 'react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: 'calc(100% - 32px)',
        maxWidth: 420,
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          style={{
            padding: '12px 16px',
            borderRadius: 14,
            backgroundColor:
              toast.type === 'error' ? '#FF3B30' : '#1C1C1E',
            color: '#FFFFFF',
            fontSize: 13.5,
            fontWeight: 700,
            boxShadow: '0 6px 20px rgba(0,0,0,0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
};
