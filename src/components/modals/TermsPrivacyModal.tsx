import React from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getEffectivePolicyInfo } from '../../types';
import { useDialog } from '../../hooks/useDialog';
import { PolicyContentRenderer } from '../common/PolicyContentRenderer';

interface TermsPrivacyModalProps {
  isOpen: boolean;
  mode: 'consent' | 'view';
  initialTab?: 'terms' | 'privacy';
  isPolicyUpdate?: boolean;
  onAccept?: () => void;
  onClose?: () => void;
}

export const TermsPrivacyModal: React.FC<TermsPrivacyModalProps> = ({
  isOpen,
  mode,
  isPolicyUpdate = false,
  onAccept,
  onClose,
}) => {
  const { themeColor, settings } = useApp();
  const isConsent = mode === 'consent';

  const handleBackdropClick = () => {
    if (mode === 'view' && onClose) {
      onClose();
    }
  };

  // 同意モードでは Esc で閉じられない（同意必須）
  const dialogRef = useDialog<HTMLDivElement>(isOpen, handleBackdropClick, {
    closeOnEscape: !isConsent,
  });

  if (!isOpen) return null;

  const policyInfo = getEffectivePolicyInfo(settings);

  const sheetBg = 'var(--bg-surface-elevated)';
  const subtleBg = 'var(--bg-surface-subtle)';
  const borderSubtle = 'var(--border-subtle)';
  const textColor = 'var(--text-primary)';
  const subTextColor = 'var(--text-secondary)';
  const labelColor = 'var(--text-muted)';

  const policyText = policyInfo.termsContent || policyInfo.privacyContent;
  const ctaLabel = isPolicyUpdate ? '同意して続ける' : '同意してはじめる';

  return (
    <div
      className="flutter-sheet-backdrop"
      style={{ zIndex: 1300 }}
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        role={isConsent ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby="terms-privacy-title"
        aria-describedby="terms-privacy-desc"
        className="flutter-bottom-sheet"
        style={{
          backgroundColor: sheetBg,
          padding: 0,
          maxHeight: 'min(90dvh, calc(var(--visual-viewport-height, 90dvh) - 12px))',
          maxWidth: 500,
          margin: '0 auto',
          borderRadius: '22px 22px 0 0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 上部ドラッグハンドル */}
        <div style={{ padding: '10px 0 2px', display: 'flex', justifyContent: 'center' }}>
          <div className="flutter-sheet-handle" style={{ margin: 0 }} />
        </div>

        {/* ヘッダー */}
        <div
          style={{
            padding: '8px 20px 12px',
            borderBottom: `1px solid ${borderSubtle}`,
            backgroundColor: sheetBg,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <h2
                id="terms-privacy-title"
                style={{
                  margin: 0,
                  fontSize: 16.5,
                  fontWeight: 800,
                  color: textColor,
                  letterSpacing: '-0.01em',
                }}
              >
                利用規約・プライバシーポリシー
              </h2>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginTop: 5,
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '1.5px 7px',
                    borderRadius: 6,
                    backgroundColor: `${themeColor}18`,
                    color: themeColor,
                    fontSize: 10.5,
                    fontWeight: 800,
                  }}
                >
                  ZEN大学 在学生対象
                </span>
                <span style={{ fontSize: 11.5, color: labelColor }}>
                  改定: {policyInfo.dateLabel}
                </span>
              </div>
            </div>

            {mode === 'view' && onClose && (
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: subtleBg,
                  border: `1px solid ${borderSubtle}`,
                  color: subTextColor,
                  width: 32,
                  height: 32,
                  flexShrink: 0,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
                aria-label="閉じる"
              >
                <X size={16} strokeWidth={2.2} />
              </button>
            )}
          </div>
        </div>

        {/* 1枚完結の規約・プライバシーポリシー本文 */}
        <div
          id="terms-privacy-desc"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 18px 14px',
            color: subTextColor,
          }}
        >
          {isConsent && (
            <p
              style={{
                margin: '0 0 10px',
                fontSize: 12,
                lineHeight: 1.45,
                color: isPolicyUpdate ? textColor : subTextColor,
                fontWeight: isPolicyUpdate ? 700 : 500,
              }}
            >
              {isPolicyUpdate
                ? '規約・プライバシーポリシーが改定されました。内容をご確認のうえ同意をお願いします。'
                : 'ご利用の前に、以下の内容をご確認ください。'}
            </p>
          )}

          <PolicyContentRenderer
            content={policyText}
            textColor={textColor}
            subTextColor={subTextColor}
            themeColor={themeColor}
          />
        </div>

        {/* フッターアクション */}
        <div
          style={{
            padding: '10px 18px calc(14px + var(--safe-bottom))',
            borderTop: `1px solid ${borderSubtle}`,
            backgroundColor: sheetBg,
          }}
        >
          {mode === 'consent' ? (
            <>
              <div
                style={{
                  fontSize: 11,
                  color: labelColor,
                  textAlign: 'center',
                  lineHeight: 1.4,
                  marginBottom: 8,
                }}
              >
                ボタンの押下をもって上記内容に同意したものとみなします。
              </div>
              <button
                type="button"
                onClick={onAccept}
                style={{
                  width: '100%',
                  height: 46,
                  borderRadius: 12,
                  border: 'none',
                  backgroundColor: themeColor,
                  color: 'var(--text-on-accent)',
                  fontSize: 14.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: `0 4px 14px ${themeColor}38`,
                  transition: 'opacity 0.15s ease',
                }}
              >
                {ctaLabel}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '100%',
                height: 42,
                borderRadius: 12,
                border: `1px solid ${borderSubtle}`,
                backgroundColor: subtleBg,
                color: textColor,
                fontSize: 13.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              閉じる
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
