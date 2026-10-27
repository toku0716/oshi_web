import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getEffectivePolicyInfo } from '../../types';
import { useDialog } from '../../hooks/useDialog';

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
          maxHeight: '88dvh',
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
            <div>
              <section style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: textColor, margin: '0 0 6px' }}>
                  第1条（対象者とサービスの目的）
                </h4>
                <p style={{ margin: 0 }}>
                  本利用規約は、「推しサポ」（以下「本アプリ」）の利用条件を定めるものです。本アプリは、<strong>ZEN大学の生徒（学生）のみを対象</strong>として提供されています。利用者の推し活管理を便利にサポートするとともに、今後の機能改善やサービス開発を目的としています。
                </p>
              </section>

              <section style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: textColor, margin: '0 0 6px' }}>
                  第2条（今後のためのフィードバックへのご協力）
                </h4>
                <p style={{ margin: 0 }}>
                  本アプリの機能向上および今後のサービス開発のため、利用者の皆様からのご意見・ご感想・改善要望などのフィードバック（Googleフォーム等を通じたアンケートを含む）へのご協力をお願いしております。いただいたフィードバック内容は、今後の開発および機能改善の目的のみに大切に活用いたします。
                </p>
              </section>

              <section style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: textColor, margin: '0 0 6px' }}>
                  第3条（サービス概要とデータの保存）
                </h4>
                <p style={{ margin: 0 }}>
                  本アプリは、推し活に関するスケジュール、グッズ、メモなどを一元管理できるWebアプリケーションです。登録されたデータはお使いの端末（ブラウザ）内にのみ保存され、外部サーバーへ自動的に送信・蓄積されることはありません。
                </p>
              </section>

              <section style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: textColor, margin: '0 0 6px' }}>
                  第4条（バックアップとデータ管理）
                </h4>
                <p style={{ margin: 0 }}>
                  ブラウザの履歴消去、端末の故障、紛失、機種変更等により、端末内に保存されたデータが消失する可能性があります。大切なデータは、マイページの「バックアップ保存」機能を利用し、定期的にご自身で保存してください。
                </p>
              </section>

              <section style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: textColor, margin: '0 0 6px' }}>
                  第5条（禁止事項）
                </h4>
                <p style={{ margin: '0 0 6px' }}>利用者は、本アプリの利用にあたり、以下の行為を行ってはなりません。</p>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>ZEN大学の生徒以外の第三者への不正な利用権限の譲渡・共有</li>
                  <li>法令または公序良俗に違反する行為</li>
                  <li>本アプリの運営やサーバーを妨害する行為</li>
                  <li>その他、運営者・開発者が不適切と判断する行為</li>
                </ul>
              </section>

              <section style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: textColor, margin: '0 0 6px' }}>
                  第6条（免責事項）
                </h4>
                <p style={{ margin: 0 }}>
                  端末の不具合、ブラウザの仕様変更、通信障害、データの消失等によって利用者に生じた損害について、開発者は法令に別段の定めがある場合を除き、一切の責任を負いません。
                </p>
              </section>

              <section style={{ marginBottom: 12 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: textColor, margin: '0 0 6px' }}>
                  第7条（利用規約の変更）
                </h4>
                <p style={{ margin: 0 }}>
                  必要に応じて本規約を変更することがあります。重要な変更がある場合は、アプリ内にてお知らせします。
                </p>
              </section>
            </div>
          ) : (
            <div>
              <section style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: textColor, margin: '0 0 6px' }}>
                  1. 本アプリの対象者と利用目的
                </h4>
                <p style={{ margin: 0 }}>
                  本アプリは、<strong>ZEN大学の生徒のみなさま</strong>を対象として提供しております。推し活サポート機能の提供、ならびに今後のサービス改善・新機能開発のためのフィードバック収集を目的としています。
                </p>
              </section>

              <section style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: textColor, margin: '0 0 6px' }}>
                  2. 個人情報の収集について（アカウント登録不要）
                </h4>
                <p style={{ margin: 0 }}>
                  本アプリは、通常の利用において利用者の個人情報（氏名、電話番号、住所、学生証番号、クレジットカード情報など）を収集することはありません。事前の会員登録不要ですぐにご利用いただけます。
                </p>
              </section>

              <section style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: textColor, margin: '0 0 6px' }}>
                  3. 登録データの端末内保存（外部送信ゼロ）
                </h4>
                <p style={{ margin: 0 }}>
                  登録された推しの情報、予定、やることリスト、グッズ、支出記録、設定などは、すべてお使いの端末（ブラウザのIndexedDB / LocalStorage）にのみ保存されます。外部サーバーへ自動送信・蓄積されることはありません。
                </p>
              </section>

              <section style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: textColor, margin: '0 0 6px' }}>
                  4. フィードバックおよび回答内容の取り扱い
                </h4>
                <p style={{ margin: 0 }}>
                  今後のサービス向上のためにGoogleフォーム等を通じてご協力いただくフィードバックやアンケート回答は、アプリの機能改善および開発の参考としてのみ利用いたします。ご回答いただいた内容を個人が特定できる形で第三者へ開示・提供したり、目的外に使用することはございません。
                </p>
              </section>

              <section style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: textColor, margin: '0 0 6px' }}>
                  5. 写真・画像データについて
                </h4>
                <p style={{ margin: 0 }}>
                  推しアイコンやグッズ等に登録された画像は、端末内でリサイズ処理された後、端末内にのみ保存されます。外部のクラウドやサーバーへアップロードされることはありません。
                </p>
              </section>

              <section style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: textColor, margin: '0 0 6px' }}>
                  6. Googleログインの利用について（設定時のみ）
                </h4>
                <p style={{ margin: '0 0 6px' }}>
                  アクセス制限が有効な環境でGoogleアカウントによるログインをご利用いただく場合、Googleからメールアドレスおよび表示名を取得します。
                </p>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>利用目的は、正規ユーザー（ZEN大学関係者等）の確認（本人認証）およびログイン表示のみに限定されます。</li>
                  <li>広告配信や第三者への提供、AI学習等に利用することは一切ありません。</li>
                  <li>アプリ内の「ログアウト」からいつでもセッションを消去できます。</li>
                </ul>
              </section>

              <section style={{ marginBottom: 12 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: textColor, margin: '0 0 6px' }}>
                  7. Cookieおよびトラッキングについて
                </h4>
                <p style={{ margin: 0 }}>
                  本アプリでは、利用者の行動追跡（トラッキング）や第三者による広告配信のためのCookieは一切使用しておりません。設定保持（カラー設定・外観モード等）のためにのみブラウザのストレージを使用しています。
                </p>
              </section>
            </div>
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
