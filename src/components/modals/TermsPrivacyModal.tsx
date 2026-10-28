import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getEffectivePolicyInfo } from '../../types';
import { useDialog } from '../../hooks/useDialog';
import { PolicyContentRenderer } from '../common/PolicyContentRenderer';

interface TermsPrivacyModalProps {
  isOpen: boolean;
  mode: 'consent' | 'view';
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
  const [tab, setTab] = useState<'terms' | 'privacy'>('terms');

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
  const headerBg = 'var(--bg-surface-elevated)';
  const borderColor = 'var(--border-medium)';
  const textColor = 'var(--text-primary)';
  const subTextColor = 'var(--text-secondary)';
  const labelColor = 'var(--text-muted)';
  const segmentBg = 'var(--bg-surface-subtle)';

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
        aria-describedby={isConsent ? 'terms-privacy-consent-desc' : undefined}
        className="flutter-bottom-sheet"
        style={{
          backgroundColor: sheetBg,
          padding: 0,
          maxHeight: 'min(88dvh, calc(var(--visual-viewport-height, 88dvh) - 16px))',
          maxWidth: 560,
          margin: '0 auto',
          borderRadius: '20px 20px 0 0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 上部ハンドル */}
        <div style={{ padding: '12px 0 4px', display: 'flex', justifyContent: 'center' }}>
          <div className="flutter-sheet-handle" style={{ margin: 0 }} />
        </div>

        {/* ヘッダー */}
        <div
          style={{
            padding: '8px 20px 14px',
            borderBottom: `1px solid ${borderColor}`,
            backgroundColor: headerBg,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div>
              <h2
                id="terms-privacy-title"
                style={{ margin: 0, fontSize: 17, fontWeight: 800, color: textColor }}
              >
                利用規約・プライバシーポリシー
              </h2>
              <div style={{ fontSize: 12, color: labelColor, marginTop: 2 }}>
                改定日: {policyInfo.dateLabel} (Ver. {policyInfo.version})
              </div>
            </div>

            {mode === 'view' && onClose && (
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: segmentBg,
                  border: 'none',
                  color: textColor,
                  width: 36,
                  height: 36,
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* シンプルなセグメントコントロール */}
          <div
            role="tablist"
            aria-label="表示する文書"
            style={{
              display: 'flex',
              padding: 3,
              backgroundColor: segmentBg,
              borderRadius: 10,
            }}
          >
            <button
              type="button"
              role="tab"
              id="terms-privacy-tab-terms"
              aria-selected={tab === 'terms'}
              aria-controls="terms-privacy-panel"
              onClick={() => setTab('terms')}
              style={{
                flex: 1,
                padding: '8px 0',
                border: 'none',
                borderRadius: 8,
                backgroundColor: tab === 'terms' ? sheetBg : 'transparent',
                color: tab === 'terms' ? textColor : labelColor,
                fontWeight: tab === 'terms' ? 800 : 600,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: tab === 'terms' ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              利用規約
            </button>
            <button
              type="button"
              role="tab"
              id="terms-privacy-tab-privacy"
              aria-selected={tab === 'privacy'}
              aria-controls="terms-privacy-panel"
              onClick={() => setTab('privacy')}
              style={{
                flex: 1,
                padding: '8px 0',
                border: 'none',
                borderRadius: 8,
                backgroundColor: tab === 'privacy' ? sheetBg : 'transparent',
                color: tab === 'privacy' ? textColor : labelColor,
                fontWeight: tab === 'privacy' ? 800 : 600,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: tab === 'privacy' ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              プライバシーポリシー
            </button>
          </div>
        </div>

        {/* 同意メッセージ（必要な場合のみ） */}
        {mode === 'consent' && (
          <div
            id="terms-privacy-consent-desc"
            style={{
              margin: '14px 20px 0',
              padding: '12px 14px',
              borderRadius: 10,
              backgroundColor: `${themeColor}14`,
              border: `1px solid ${themeColor}33`,
              fontSize: 12.5,
              lineHeight: 1.6,
              color: textColor,
            }}
          >
            {isPolicyUpdate
              ? '【ZEN大学 生徒限定】利用規約およびプライバシーポリシーが改定されました。内容をご確認の上、同意をお願いいたします。'
              : '【ZEN大学 生徒限定】本アプリはZEN大学の生徒のみなさまを対象として提供しております。今後のサービス改善・機能向上のため、フィードバックへのご協力をお願いいたします。ご利用前に以下の規約・ポリシーをご確認ください。'}
          </div>
        )}

        {/* スクロール本文エリア */}
        <div
          role="tabpanel"
          id="terms-privacy-panel"
          aria-labelledby={tab === 'terms' ? 'terms-privacy-tab-terms' : 'terms-privacy-tab-privacy'}
          tabIndex={0}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px 24px',
            fontSize: 13,
            lineHeight: 1.7,
            color: subTextColor,
          }}
        >
          {tab === 'terms' ? (
            <PolicyContentRenderer
              content={policyInfo.termsContent}
              textColor={textColor}
              subTextColor={subTextColor}
            />
          ) : (
            <PolicyContentRenderer
              content={policyInfo.privacyContent}
              textColor={textColor}
              subTextColor={subTextColor}
            />
          )}
        </div>

        {/* フッターアクション */}
        <div
          style={{
            padding: '12px 20px calc(20px + var(--safe-bottom))',
            borderTop: `1px solid ${borderColor}`,
            backgroundColor: headerBg,
          }}
        >
          {mode === 'consent' ? (
            <button
              type="button"
              onClick={onAccept}
              style={{
                width: '100%',
                height: 48,
                borderRadius: 12,
                border: 'none',
                backgroundColor: themeColor,
                color: 'var(--text-on-accent)',
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {isPolicyUpdate ? '同意して続ける' : '同意してはじめる'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '100%',
                height: 44,
                borderRadius: 12,
                border: 'none',
                backgroundColor: segmentBg,
                color: textColor,
                fontSize: 14,
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
