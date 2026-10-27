import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useDialog } from '../../hooks/useDialog';

interface SmartTimeKeypadSheetProps {
  isOpen: boolean;
  initialTime?: string;
  onClose: () => void;
  onConfirm: (time: string) => void;
}

export const SmartTimeKeypadSheet: React.FC<SmartTimeKeypadSheetProps> = ({
  isOpen,
  initialTime,
  onClose,
  onConfirm,
}) => {
  const { themeColor } = useApp();
  const [digits, setDigits] = useState<string>('');
  const dialogRef = useDialog<HTMLDivElement>(isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      if (initialTime && initialTime.includes(':')) {
        const clean = initialTime.replace(/[^0-9]/g, '');
        if (clean.length === 4) {
          setDigits(clean);
          return;
        }
        if (clean.length === 3) {
          setDigits(`0${clean}`);
          return;
        }
      }
      setDigits('');
    }
  }, [isOpen, initialTime]);

  const handleDigit = (d: string) => {
    setDigits((prev) => {
      if (prev.length >= 4) return prev;

      // 1桁目に 3〜9 が入力された場合は 03〜09時 として自動0補完（例: 9 -> 3 -> 0 で 09:30）
      if (prev.length === 0) {
        const firstNum = parseInt(d, 10);
        if (firstNum >= 3 && firstNum <= 9) {
          return `0${d}`;
        }
        return d;
      }

      // 1桁目が '2' の状態で 4〜9 が押された場合は 02時 + 分の10の位（4,5）として補完
      if (prev.length === 1 && prev === '2') {
        const secondNum = parseInt(d, 10);
        if (secondNum === 4 || secondNum === 5) {
          return `02${d}`;
        }
        if (secondNum > 5) return prev;
      }

      const next = prev + d;
      if (next.length >= 2) {
        const hh = parseInt(next.substring(0, 2), 10);
        if (isNaN(hh) || hh > 23) return prev;
      }
      if (next.length >= 3) {
        const m1 = parseInt(next.substring(2, 3), 10);
        if (isNaN(m1) || m1 > 5) return prev;
      }
      return next;
    });
  };

  const handleDouble = (pair: string) => {
    setDigits((prev) => {
      if (prev.length === 2) {
        return prev + pair;
      }
      if (prev.length === 1) {
        const h = parseInt(prev, 10);
        if (!isNaN(h)) {
          return `0${h}${pair}`;
        }
      }
      return prev;
    });
  };

  const handleBackspace = () => {
    setDigits((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
  };

  const formattedPreview = (rawDigits = digits): string => {
    if (rawDigits.length === 0) return '-- : --';
    if (rawDigits.length === 1) return `0${rawDigits} : 00`;
    if (rawDigits.length === 2) return `${rawDigits} : 00`;
    if (rawDigits.length === 3) {
      return `0${rawDigits.substring(0, 1)} : ${rawDigits.substring(1, 3)}`;
    }
    return `${rawDigits.substring(0, 2)} : ${rawDigits.substring(2, 4)}`;
  };

  const finalTimeValue = (rawDigits = digits): string => {
    if (rawDigits.length === 0) return '';
    return formattedPreview(rawDigits).replace(/\s+/g, '');
  };

  const handleConfirm = () => {
    const val = finalTimeValue();
    if (!val) {
      onConfirm('');
      onClose();
      return;
    }
    const parts = val.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      onConfirm(val);
      onClose();
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (!isOpen) return null;

  const sheetBg = 'var(--bg-surface-elevated)';
  const keyBg = 'var(--bg-surface-subtle)';
  const textColor = 'var(--text-primary)';

  const renderDigitBox = (index: number) => {
    const active = digits.length === index;
    const ch = index < digits.length ? digits[index] : '-';
    return (
      <div
        key={index}
        style={{
          width: 48,
          height: 58,
          margin: '0 4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: active ? `${themeColor}24` : keyBg,
          borderRadius: 14,
          border: `2px solid ${active ? themeColor : 'transparent'}`,
          fontSize: 28,
          fontWeight: 900,
          color: index < digits.length ? textColor : 'var(--text-muted)',
        }}
      >
        {ch}
      </div>
    );
  };

  const renderKey = (label: string, onClick: () => void, isSub = false) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 54,
        borderRadius: 14,
        border: 'none',
        backgroundColor: keyBg,
        color: isSub ? themeColor : textColor,
        fontSize: isSub ? 17 : 22,
        fontWeight: 800,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      className="flutter-sheet-backdrop"
      style={{ zIndex: 1200 }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="時間を入力"
        className="flutter-bottom-sheet"
        style={{
          backgroundColor: sheetBg,
          padding: '14px 20px calc(24px + var(--safe-bottom))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flutter-sheet-handle" />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 14,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 900, color: textColor }}>
            時間を素早く入力
          </span>
          {digits.length > 0 && (
            <button
              type="button"
              onClick={() => {
                onConfirm('');
                onClose();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#FF3B30',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              時刻をクリア
            </button>
          )}
        </div>

        {/* 4桁ディスプレイ */}
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {renderDigitBox(0)}
          {renderDigitBox(1)}
          <span
            style={{
              padding: '0 8px',
              fontSize: 28,
              fontWeight: 900,
              color: themeColor,
            }}
          >
            :
          </span>
          {renderDigitBox(2)}
          {renderDigitBox(3)}
        </div>
        <div
          style={{
            marginTop: 8,
            textAlign: 'center',
            fontSize: 12,
            fontWeight: 600,
            color: '#8E8E93',
          }}
        >
          例: 「1」「8」「3」「0」→ 18:30
        </div>

        {/* 電卓グリッド */}
        <div
          style={{
            marginTop: 18,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
          }}
        >
          {renderKey('1', () => handleDigit('1'))}
          {renderKey('2', () => handleDigit('2'))}
          {renderKey('3', () => handleDigit('3'))}
          {renderKey('4', () => handleDigit('4'))}
          {renderKey('5', () => handleDigit('5'))}
          {renderKey('6', () => handleDigit('6'))}
          {renderKey('7', () => handleDigit('7'))}
          {renderKey('8', () => handleDigit('8'))}
          {renderKey('9', () => handleDigit('9'))}
          {renderKey('00', () => handleDouble('00'), true)}
          {renderKey('0', () => handleDigit('0'))}
          {renderKey('30', () => handleDouble('30'), true)}
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={handleBackspace}
            style={{
              flex: 1,
              height: 50,
              borderRadius: 14,
              border: 'none',
              backgroundColor: keyBg,
              color: textColor,
              fontSize: 18,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ⌫
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              flex: 2,
              height: 50,
              borderRadius: 14,
              border: 'none',
              backgroundColor: themeColor,
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: 900,
              cursor: 'pointer',
            }}
          >
            決定 ({finalTimeValue() || '未設定'})
          </button>
        </div>
      </div>
    </div>
  );
};
