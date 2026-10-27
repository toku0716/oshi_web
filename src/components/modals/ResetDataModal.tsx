import React, { useState } from 'react';
import { Heart, Calendar, CheckSquare, Package, Wallet, Settings, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ResetDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => Promise<void>;
}

export const ResetDataModal: React.FC<ResetDataModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
}) => {
  const { isDark } = useApp();
  const [isAgreed, setIsAgreed] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const sheetBg = isDark ? '#1C1D26' : '#FFFFFF';
  const cardBg = isDark ? '#252736' : '#F6F7FA';
  const borderColor = isDark ? '#323447' : '#E6E8EE';
  const textColor = isDark ? '#FFFFFF' : '#111111';
  const subTextColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.65)';

  const handleReset = async () => {
    if (!isAgreed || isProcessing) return;
    setIsProcessing(true);
    try {
      await onConfirmReset();
      setIsAgreed(false);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (isProcessing) return;
    setIsAgreed(false);
    onClose();
  };

  return (
    <div
      className="flutter-sheet-backdrop"
      style={{ zIndex: 1400 }}
      onClick={handleClose}
    >
      <div
        className="flutter-bottom-sheet"
        style={{
          backgroundColor: sheetBg,
          padding: '20px 22px 28px',
          maxHeight: '90vh',
          maxWidth: 480,
          margin: '0 auto',
          borderRadius: '24px 24px 0 0',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flutter-sheet-handle" />

        {/* 警告ヘッダー */}
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: 'rgba(255, 59, 48, 0.14)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FF3B30"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: textColor,
              }}
            >
              全データの初期化
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#FF3B30',
                marginTop: 2,
              }}
            >
              端末内の全データが完全に消去されます
            </div>
          </div>
        </div>

        {/* 削除対象の説明ボックス */}
        <div
          style={{
            marginTop: 18,
            padding: 16,
            borderRadius: 16,
            backgroundColor: cardBg,
            border: `1.2px solid ${borderColor}`,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: textColor,
              marginBottom: 10,
            }}
          >
            以下の保存データがすべて消去されます：
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 8,
              fontSize: 12.5,
              fontWeight: 700,
              color: subTextColor,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Heart size={14} color="#FF2D55" /> <span>推しプロフィール</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={14} color="#0A84FF" /> <span>予定・スケジュール</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckSquare size={14} color="#30D158" /> <span>やること（ToDo）</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Package size={14} color="#BF5AF2" /> <span>グッズ・保管場所</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Wallet size={14} color="#FF9F0A" /> <span>推し活の支出記録</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Settings size={14} color="#8E8E93" /> <span>アプリ各種設定</span>
            </div>
          </div>
        </div>

        {/* 警告メッセージ */}
        <div
          style={{
            marginTop: 14,
            padding: '12px 14px',
            borderRadius: 14,
            backgroundColor: 'rgba(255, 59, 48, 0.08)',
            border: '1px solid rgba(255, 59, 48, 0.25)',
            fontSize: 12,
            lineHeight: 1.6,
            fontWeight: 600,
            color: isDark ? '#FFA39E' : '#D92D20',
            display: 'flex',
            gap: 10,
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>ご注意：</strong>
            <br />
            この操作を取り消すことはできません。必要なデータがある場合は、先に「バックアップ保存」を行ってJSONファイルを保存してください。
          </div>
        </div>

        {/* 同意チェックボックス */}
        <label
          style={{
            marginTop: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 14px',
            borderRadius: 14,
            backgroundColor: isAgreed ? 'rgba(255, 59, 48, 0.08)' : cardBg,
            border: `1.5px solid ${isAgreed ? '#FF3B30' : borderColor}`,
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <input
            type="checkbox"
            checked={isAgreed}
            onChange={(e) => setIsAgreed(e.target.checked)}
            disabled={isProcessing}
            style={{
              width: 18,
              height: 18,
              accentColor: '#FF3B30',
              cursor: 'pointer',
            }}
          />
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 800,
              color: isAgreed ? (isDark ? '#FFA39E' : '#D92D20') : textColor,
            }}
          >
            すべてのデータを完全に消去することを理解しました
          </span>
        </label>

        {/* 操作ボタン */}
        <div
          style={{
            marginTop: 20,
            display: 'flex',
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={handleClose}
            disabled={isProcessing}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 14,
              border: `1.2px solid ${borderColor}`,
              backgroundColor: 'transparent',
              color: textColor,
              fontSize: 14,
              fontWeight: 800,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
            }}
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={!isAgreed || isProcessing}
            style={{
              flex: 1.3,
              height: 48,
              borderRadius: 14,
              border: 'none',
              backgroundColor: isAgreed && !isProcessing ? '#FF3B30' : (isDark ? '#3A282B' : '#E5C4C7'),
              color: isAgreed && !isProcessing ? '#FFFFFF' : (isDark ? '#7A5B60' : '#A38B8E'),
              fontSize: 14,
              fontWeight: 900,
              cursor: isAgreed && !isProcessing ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'background-color 0.15s ease',
            }}
          >
            {isProcessing ? (
              <span>初期化中...</span>
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                <span>すべて削除して初期化</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
