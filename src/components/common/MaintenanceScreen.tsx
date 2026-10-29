import React, { useState } from 'react';
import {
  Wrench,
  Clock,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  X,
  CheckCircle2,
} from 'lucide-react';
import { DEFAULT_MAINTENANCE_TITLE, DEFAULT_MAINTENANCE_MESSAGE } from '../../types';

interface MaintenanceScreenProps {
  title?: string;
  message?: string;
  estimatedEnd?: string;
  themeColor?: string;
  isDark?: boolean;
  isPreview?: boolean;
  isAdminUser?: boolean;
  onAdminBypass?: () => void;
  onClosePreview?: () => void;
  onRefresh?: () => Promise<boolean | void>;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({
  title = DEFAULT_MAINTENANCE_TITLE,
  message = DEFAULT_MAINTENANCE_MESSAGE,
  estimatedEnd = '',
  themeColor = '#ec4899',
  isDark = true,
  isPreview = false,
  isAdminUser = false,
  onAdminBypass,
  onClosePreview,
  onRefresh,
}) => {
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [checkStatusMessage, setCheckStatusMessage] = useState<string | null>(null);

  const handleCheckStatus = async () => {
    if (isChecking) return;
    setIsChecking(true);
    setCheckStatusMessage(null);

    try {
      if (onRefresh) {
        const resolved = await onRefresh();
        if (resolved) return;
      }

      // サーバーの active_policy.json および maintenance.json を直接確認
      const [policyRes, maintRes] = await Promise.allSettled([
        fetch(`./active_policy.json?t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`./maintenance.json?t=${Date.now()}`, { cache: 'no-store' }),
      ]);

      let isModeOn = false;
      if (policyRes.status === 'fulfilled' && policyRes.value.ok) {
        try {
          const d = await policyRes.value.json();
          if (d && typeof d.maintenanceMode === 'boolean') {
            isModeOn = d.maintenanceMode;
          }
        } catch {}
      }
      if (maintRes.status === 'fulfilled' && maintRes.value.ok) {
        try {
          const m = await maintRes.value.json();
          if (m && (m.enabled === true || m.maintenanceMode === true)) {
            isModeOn = true;
          } else if (m && (m.enabled === false || m.maintenanceMode === false)) {
            isModeOn = false;
          }
        } catch {}
      }

      if (!isModeOn) {
        setCheckStatusMessage('メンテナンスが終了しました！画面を更新します...');
        setTimeout(() => {
          window.location.reload();
        }, 800);
        return;
      }
      setCheckStatusMessage('現在もメンテナンス継続中です。完了まで今しばらくお待ちください。');
    } catch {
      setCheckStatusMessage('最新状況を確認できませんでした。通信環境をお確かめの上再度お試しください。');
    } finally {
      setIsChecking(false);
    }
  };

  const bg = isDark ? '#0f1117' : '#f8fafc';
  const cardBg = isDark ? 'rgba(23, 27, 38, 0.92)' : 'rgba(255, 255, 255, 0.95)';
  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: bg,
        color: textColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        boxSizing: 'border-box',
        position: 'relative',
        fontFamily: "'M PLUS Rounded 1c', sans-serif",
      }}
    >
      {/* プレビュー時の上部バー */}
      {isPreview && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor: '#f59e0b',
            color: '#000000',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontWeight: 800,
            fontSize: 13,
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={18} />
            <span>【プレビュー表示】一般ユーザーに表示されるメンテナンス画面の確認中です</span>
          </div>
          {onClosePreview && (
            <button
              type="button"
              onClick={onClosePreview}
              style={{
                background: 'rgba(0, 0, 0, 0.15)',
                border: 'none',
                color: '#000000',
                padding: '4px 10px',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>閉じる</span>
              <X size={15} />
            </button>
          )}
        </div>
      )}

      {/* メインカード */}
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          backgroundColor: cardBg,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: 28,
          border: `1.5px solid ${borderColor}`,
          padding: '36px 24px 30px',
          boxSizing: 'border-box',
          boxShadow: isDark
            ? '0 20px 50px rgba(0, 0, 0, 0.6)'
            : '0 20px 50px rgba(0, 0, 0, 0.08)',
          textAlign: 'center',
          marginTop: isPreview ? 40 : 0,
        }}
      >
        {/* アイコンサークル */}
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: 28,
            backgroundColor: isDark ? 'rgba(236, 72, 153, 0.15)' : 'rgba(236, 72, 153, 0.1)',
            border: `2px solid ${themeColor}44`,
            color: themeColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: `0 12px 28px ${themeColor}33`,
          }}
        >
          <Wrench size={42} strokeWidth={2.2} />
        </div>

        {/* 状態バッジ */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 14px',
            borderRadius: 999,
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.16)' : 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.06em',
            marginBottom: 16,
            border: '1px solid rgba(239, 68, 68, 0.25)',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              display: 'inline-block',
              animation: 'pulse 1.8s infinite',
            }}
          />
          <span>メンテナンス実施中</span>
        </div>

        {/* タイトル */}
        <h1
          style={{
            fontSize: 22,
            fontWeight: 900,
            lineHeight: 1.4,
            margin: '0 0 14px',
            color: textColor,
          }}
        >
          {title}
        </h1>

        {/* 本文メッセージ */}
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.7,
            color: subTextColor,
            margin: '0 0 24px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {message}
        </p>

        {/* 終了予定時刻カード（設定されている場合） */}
        {estimatedEnd && estimatedEnd.trim() && (
          <div
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
              border: `1.2px dashed ${borderColor}`,
              borderRadius: 16,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 24,
            }}
          >
            <Clock size={16} style={{ color: themeColor, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: textColor }}>
              終了予定: <span style={{ color: themeColor }}>{estimatedEnd.trim()}</span>
            </span>
          </div>
        )}

        {/* 最新状況を確認ボタン */}
        <button
          type="button"
          onClick={handleCheckStatus}
          disabled={isChecking}
          style={{
            width: '100%',
            padding: '13px 18px',
            borderRadius: 14,
            border: 'none',
            backgroundColor: themeColor,
            color: '#FFFFFF',
            fontSize: 14.5,
            fontWeight: 800,
            cursor: isChecking ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: `0 8px 20px ${themeColor}44`,
            transition: 'all 0.2s ease',
            opacity: isChecking ? 0.8 : 1,
          }}
        >
          <RefreshCw
            size={17}
            style={{
              animation: isChecking ? 'spin 1s linear infinite' : 'none',
            }}
          />
          <span>{isChecking ? '確認中...' : '最新状態を確認（再読み込み）'}</span>
        </button>

        {/* 確認結果メッセージ */}
        {checkStatusMessage && (
          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              borderRadius: 10,
              fontSize: 12.5,
              fontWeight: 700,
              backgroundColor: checkStatusMessage.includes('終了')
                ? 'rgba(34, 197, 94, 0.15)'
                : 'rgba(245, 158, 11, 0.15)',
              color: checkStatusMessage.includes('終了') ? '#22c55e' : '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {checkStatusMessage.includes('終了') && <CheckCircle2 size={15} />}
            <span>{checkStatusMessage}</span>
          </div>
        )}

        {/* 区切り線 */}
        <div
          style={{
            margin: '28px 0 16px',
            height: 1,
            backgroundColor: borderColor,
          }}
        />

        {/* 管理者用バイパスボタン（管理者ログイン中の場合） */}
        {isAdminUser && onAdminBypass && (
          <div style={{ marginBottom: 14 }}>
            <button
              type="button"
              onClick={onAdminBypass}
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: 12,
                border: `1.2px dashed ${themeColor}66`,
                backgroundColor: isDark ? 'rgba(236, 72, 153, 0.08)' : 'rgba(236, 72, 153, 0.04)',
                color: themeColor,
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.2s ease',
              }}
            >
              <ShieldAlert size={15} />
              <span>管理者としてアプリを一時表示（バイパス）</span>
            </button>
          </div>
        )}

        {/* 管理者リンク */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <span style={{ fontSize: 12, color: subTextColor }}>管理者の方はこちら:</span>
          <a
            href="./admin.html"
            style={{
              fontSize: 12.5,
              fontWeight: 800,
              color: themeColor,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <span>管理コンソール</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.9); }
        }
      `}</style>
    </div>
  );
};
