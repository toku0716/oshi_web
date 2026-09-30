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
        return <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />;
      case 'warning':
        return <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />;
      default:
        return <Info className="w-10 h-10 text-pink-500 mx-auto" />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-500 hover:bg-rose-600 focus:ring-rose-200 text-white';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-200 text-white';
      default:
        return 'bg-pink-500 hover:bg-pink-600 focus:ring-pink-200 text-white';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="text-center py-2">
        <div className="mb-4">{getIcon()}</div>
        <p className="text-gray-700 whitespace-pre-line text-sm leading-relaxed mb-4">
          {message}
        </p>

        {warningNote && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 text-xs leading-relaxed text-left mb-6 flex gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{warningNote}</span>
          </div>
        )}

        <div className="flex gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-sm transition focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition shadow-sm focus:outline-none focus:ring-2 disabled:opacity-50 flex items-center justify-center gap-1.5 ${getConfirmButtonClass()}`}
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
