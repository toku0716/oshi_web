import React from 'react';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  warningNote?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  warningNote,
  confirmLabel = '確定',
  cancelLabel = 'キャンセル',
  variant = 'warning',
  isLoading = false,
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />;
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />;
      default:
        return <Info className="w-8 h-8 text-neutral-500 mx-auto" />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white';
      default:
        return 'bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="text-center py-1">
        <div className="mb-3">{getIcon()}</div>
        <p className="text-neutral-700 dark:text-neutral-200 whitespace-pre-line text-xs sm:text-sm leading-relaxed mb-4">
          {message}
        </p>

        {warningNote && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-950 dark:text-amber-100 rounded-xl p-3 text-xs leading-relaxed text-left mb-5 flex gap-2">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span>{warningNote}</span>
          </div>
        )}

        <div className="flex gap-2.5 justify-end mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-3.5 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-neutral-700 dark:text-neutral-200 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] font-semibold text-xs transition disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-3.5 py-2 rounded-lg font-semibold text-xs transition shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5 ${getConfirmButtonClass()}`}
          >
            {isLoading ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
