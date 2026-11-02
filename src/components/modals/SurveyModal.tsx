import React, { useState } from 'react';
import {
  MessageSquare,
  ExternalLink,
  X,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useDialog } from '../../hooks/useDialog';
import { getEffectiveGoogleFormUrl, formatGoogleFormEmbedUrl } from '../../types';

interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SurveyModal: React.FC<SurveyModalProps> = ({ isOpen, onClose }) => {
  const { settings, themeColor, isDark } = useApp();

  const effectiveUrl = getEffectiveGoogleFormUrl(settings);
  const [viewMode, setViewMode] = useState<'card' | 'embedded'>('card');

  const dialogRef = useDialog<HTMLDivElement>(isOpen, onClose);

  if (!isOpen) return null;

  const handleOpenGoogleForm = () => {
    if (!effectiveUrl) return;
    window.open(effectiveUrl, '_blank', 'noopener,noreferrer');
  };

  const embedUrl = formatGoogleFormEmbedUrl(effectiveUrl);

  return (
    <div className="flutter-sheet-backdrop" style={{ zIndex: 1200 }} onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="survey-title"
        className="flutter-sheet"
        style={{
          maxWidth: 560,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-surface-elevated)',
          borderRadius: 24,
          padding: 0,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-elevation-high)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                backgroundColor: `${themeColor}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: themeColor,
              }}
            >
              <MessageSquare size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <h2
                  id="survey-title"
                  style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}
                >
                  改善アンケート
                </h2>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: 999,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#7248B918',
                    color: isDark ? '#D8B4FE' : '#7248B9',
                  }}
                >
                  Googleフォーム
                </span>
              </div>
              <p style={{ fontSize: 11.5, margin: '2px 0 0', color: 'var(--text-muted)' }}>
                推し活をより快適にするためのご意見・ご要望
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            style={{
              background: 'none',
              border: 'none',
              padding: 8,
              borderRadius: 8,
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* コンテンツエリア */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
          {/* URL未設定時の案内 */}
          {!effectiveUrl ? (
            <div
              style={{
                textAlign: 'center',
                padding: '28px 16px',
                borderRadius: 18,
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  backgroundColor: `${themeColor}18`,
                  color: themeColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                }}
              >
                <AlertCircle size={28} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                現在アンケートの受付を準備中です
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                アンケートフォームの準備が整い次第、こちらからご案内いたします。
              </p>
            </div>
          ) : null}

          {/* URL設定済み時の表示 */}
          {effectiveUrl && (
            <div>
              {/* 紹介カード */}
              <div
                style={{
                  borderRadius: 18,
                  padding: '18px 20px',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : `${themeColor}0C`,
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : `1px solid ${themeColor}26`,
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Sparkles size={16} color={themeColor} />
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                    皆様の声をお聞かせください
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 14px' }}>
                  「推しサポ」をより使いやすく、推し活をもっと楽しくサポートするために、機能のご要望や使い心地についてのアンケートをGoogleフォームにて実施しています。
                </p>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    fontSize: 11.5,
                    color: 'var(--text-secondary)',
                    backgroundColor: isDark ? '#23262F' : '#FFFFFF',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid var(--border-subtle)',
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: themeColor, fontWeight: 800 }}>✓</span>
                    <span>アプリの総合満足度や使いやすさ</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: themeColor, fontWeight: 800 }}>✓</span>
                    <span>今後欲しい新機能・連携機能のアイデア</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: themeColor, fontWeight: 800 }}>✓</span>
                    <span>気になった不具合や改善点のご報告</span>
                  </div>
                </div>

                {/* メインアクションボタン */}
                <button
                  type="button"
                  onClick={handleOpenGoogleForm}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '14px 20px',
                    borderRadius: 14,
                    border: 'none',
                    backgroundColor: themeColor,
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: `0 4px 16px ${themeColor}44`,
                    transition: 'transform 0.1s ease',
                  }}
                >
                  <span>Googleフォームを開いて回答する</span>
                  <ExternalLink size={16} />
                </button>
              </div>

              {/* 埋め込み表示切り替え */}
              {embedUrl && (
                <div style={{ marginTop: 14 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 10,
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                      アプリ内プレビュー
                    </span>
                    <button
                      type="button"
                      onClick={() => setViewMode((prev) => (prev === 'card' ? 'embedded' : 'card'))}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: 12,
                        color: themeColor,
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      {viewMode === 'card' ? 'アプリ内で開く ▼' : '閉じる ▲'}
                    </button>
                  </div>

                  {viewMode === 'embedded' && (
                    <div
                      style={{
                        borderRadius: 16,
                        overflow: 'hidden',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: '#FFFFFF',
                        boxShadow: 'var(--shadow-card)',
                      }}
                    >
                      <iframe
                        src={embedUrl}
                        title="Googleフォーム アンケート"
                        style={{
                          width: '100%',
                          height: 480,
                          border: 'none',
                          display: 'block',
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
