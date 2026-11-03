import React, { useEffect, useRef, useState } from 'react';
import {
  Heart,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  AlertCircle,
  RefreshCw,
  FileText,
  Zap,
} from 'lucide-react';
import type { GoogleAuthSession } from '../../types';
import {
  decodeGoogleJwtCredential,
  isGoogleEmailAllowed,
  loadGoogleIdentityScript,
  saveGoogleSession,
} from '../../utils/googleAuthUtils';
import { TermsPrivacyModal } from '../modals/TermsPrivacyModal';

interface GoogleAccessGateProps {
  themeColor: string;
  isDark: boolean;
  googleClientId: string;
  allowedEmails: string[];
  onAuthenticated: (
    session: GoogleAuthSession,
    autoRegisterFirstOwnerEmail?: string
  ) => void;
}

interface GisCredentialResponse {
  credential?: string;
}

interface GisWindow {
  google?: {
    accounts?: {
      id?: {
        initialize: (config: {
          client_id: string;
          callback: (response: GisCredentialResponse) => void;
          auto_select?: boolean;
        }) => void;
        renderButton: (
          parent: HTMLElement,
          options: Record<string, unknown>
        ) => void;
        prompt: () => void;
      };
    };
  };
}

export const GoogleAccessGate: React.FC<GoogleAccessGateProps> = ({
  themeColor,
  isDark,
  googleClientId,
  allowedEmails,
  onAuthenticated,
}) => {
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [liveAllowedEmails, setLiveAllowedEmails] = useState<string[]>(allowedEmails);
  const [isRechecking, setIsRechecking] = useState<boolean>(false);
  const [recheckNotice, setRecheckNotice] = useState<string | null>(null);
  const [deniedProfile, setDeniedProfile] = useState<{
    email: string;
    name?: string;
    picture?: string;
  } | null>(null);
  const [gsiReady, setGsiReady] = useState<boolean>(false);
  const [gsiLoadError, setGsiLoadError] = useState<boolean>(false);
  const [isTermsOpen, setIsTermsOpen] = useState<boolean>(false);

  // 初回マウント時にもサーバーから最新のポリシーを取得して即時同期
  useEffect(() => {
    let cancelled = false;
    const fetchFresh = async () => {
      try {
        const res = await fetch(`./active_policy.json?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok && !cancelled) {
          const data = await res.json();
          const serverAllowed = [
            ...(Array.isArray(data?.allowedGoogleEmails) ? data.allowedGoogleEmails : []),
            ...(Array.isArray(data?.allowedAdminGoogleEmails) ? data.allowedAdminGoogleEmails : []),
          ];
          if (serverAllowed.length > 0) {
            setLiveAllowedEmails((prev) => Array.from(new Set([...prev, ...serverAllowed])));
          }
        }
      } catch { }
    };
    fetchFresh();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setLiveAllowedEmails((prev) => Array.from(new Set([...prev, ...allowedEmails])));
  }, [allowedEmails]);

  useEffect(() => {
    if (!googleClientId) {
      return;
    }

    let cancelled = false;

    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled) return;
        const win = window as unknown as GisWindow;
        const gsi = win.google?.accounts?.id;
        if (!gsi) {
          setGsiLoadError(true);
          return;
        }

        gsi.initialize({
          client_id: googleClientId,
          callback: async (response: GisCredentialResponse) => {
            if (!response.credential) {
              setErrorMsg('Googleからの認証情報を取得できませんでした。もう一度お試しください。');
              return;
            }
            try {
              const payload = decodeGoogleJwtCredential(response.credential);
              setErrorMsg(null);
              setRecheckNotice(null);

              // 認証ボタン押下時にサーバーの最新ポリシーを即時取得して他端末の追加を瞬時に反映
              let checkPool = liveAllowedEmails;
              try {
                const freshRes = await fetch(`./active_policy.json?t=${Date.now()}`, {
                  cache: 'no-store',
                });
                if (freshRes.ok) {
                  const data = await freshRes.json();
                  const serverAllowed = [
                    ...(Array.isArray(data?.allowedGoogleEmails) ? data.allowedGoogleEmails : []),
                    ...(Array.isArray(data?.allowedAdminGoogleEmails) ? data.allowedAdminGoogleEmails : []),
                  ];
                  if (serverAllowed.length > 0) {
                    checkPool = Array.from(new Set([...checkPool, ...serverAllowed]));
                    setLiveAllowedEmails(checkPool);
                  }
                }
              } catch { }

              // 許可リストがまだ空の場合は、最初にログインしたアカウントをオーナーとして自動許可
              if (checkPool.length === 0) {
                const session: GoogleAuthSession = {
                  email: payload.email,
                  name: payload.name,
                  picture: payload.picture,
                  authenticatedAt: new Date().toISOString(),
                };
                saveGoogleSession(session);
                onAuthenticated(session, payload.email);
                return;
              }

              // 許可リストに含まれているかチェック
              if (isGoogleEmailAllowed(payload.email, checkPool)) {
                setDeniedProfile(null);
                const session: GoogleAuthSession = {
                  email: payload.email,
                  name: payload.name,
                  picture: payload.picture,
                  authenticatedAt: new Date().toISOString(),
                };
                saveGoogleSession(session);
                onAuthenticated(session);
              } else {
                setDeniedProfile({
                  email: payload.email,
                  name: payload.name,
                  picture: payload.picture,
                });
              }
            } catch (err) {
              setErrorMsg(
                err instanceof Error
                  ? err.message
                  : 'Google認証の検証に失敗しました。もう一度お試しください。'
              );
            }
          },
          auto_select: false,
        });

        setGsiReady(true);
        setGsiLoadError(false);

        if (googleButtonRef.current) {
          googleButtonRef.current.innerHTML = '';
          gsi.renderButton(googleButtonRef.current, {
            theme: isDark ? 'filled_black' : 'outline',
            size: 'large',
            shape: 'pill',
            text: 'continue_with',
            logo_alignment: 'left',
            width: 320,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGsiLoadError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [googleClientId, liveAllowedEmails, isDark, onAuthenticated]);

  // 最新の許可リストをサーバーから再取得して再判定
  const handleRecheckAllowed = async () => {
    setIsRechecking(true);
    setRecheckNotice(null);
    try {
      const res = await fetch(`./active_policy.json?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const serverAllowed = [
          ...(Array.isArray(data?.allowedGoogleEmails) ? data.allowedGoogleEmails : []),
          ...(Array.isArray(data?.allowedAdminGoogleEmails) ? data.allowedAdminGoogleEmails : []),
        ];
        const merged = Array.from(new Set([...liveAllowedEmails, ...serverAllowed]));
        setLiveAllowedEmails(merged);

        if (deniedProfile && isGoogleEmailAllowed(deniedProfile.email, merged)) {
          const session: GoogleAuthSession = {
            email: deniedProfile.email,
            name: deniedProfile.name,
            picture: deniedProfile.picture,
            authenticatedAt: new Date().toISOString(),
          };
          saveGoogleSession(session);
          setDeniedProfile(null);
          onAuthenticated(session);
          return;
        }
        setRecheckNotice(
          `最新の許可リストを再同期しました。`
        );
      } else {
        setRecheckNotice('サーバーから設定を取得できませんでした。');
      }
    } catch {
      setRecheckNotice('通信エラーが発生しました。接続を確認してください。');
    } finally {
      setIsRechecking(false);
    }
  };

  const bgColor = isDark ? '#0C0D11' : '#F6F8FA';
  const cardBg = isDark ? '#16181F' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#14171A';
  const subTextColor = isDark ? '#9BA1B0' : '#5E6678';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E6EE';
  const featureBoxBg = isDark ? '#1C1F2A' : '#F8FAFC';

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: bgColor,
        color: textColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Hiragino Sans", sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          backgroundColor: cardBg,
          borderRadius: 24,
          border: `1px solid ${borderColor}`,
          boxShadow: isDark
            ? '0 20px 48px rgba(0, 0, 0, 0.6)'
            : '0 16px 40px rgba(15, 23, 42, 0.08)',
          padding: '36px 28px 30px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxSizing: 'border-box',
        }}
      >
        {/* Figmaスタイルのアプリアイコン */}
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: 18,
            background: `linear-gradient(135deg, ${themeColor}, ${themeColor}DD)`,
            boxShadow: `0 10px 22px ${themeColor}38`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            marginBottom: 16,
          }}
        >
          <Heart size={28} fill="#FFFFFF" color="#FFFFFF" strokeWidth={1.5} />
        </div>

        {/* タグバッジ */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11.5,
            fontWeight: 800,
            color: themeColor,
            backgroundColor: `${themeColor}14`,
            padding: '4px 12px',
            borderRadius: 999,
            marginBottom: 12,
            letterSpacing: '0.02em',
          }}
        >
          <GraduationCap size={13} strokeWidth={2.4} />
          <span>ZEN大学 在学生専用</span>
        </div>

        {/* メイン見出し */}
        <h1
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 900,
            letterSpacing: '-0.02em',
            color: textColor,
          }}
        >
          推しサポへようこそ
        </h1>

        {/* サブタイトル */}
        <p
          style={{
            margin: '8px 0 20px',
            fontSize: 13,
            color: subTextColor,
            lineHeight: 1.6,
          }}
        >
          大学のGoogleアカウントでログインすると、推し活の予定やTODO、支出管理をすぐに始められます。
        </p>

        {/* Figmaスタイルの安心ポイント（ハイライトボックス） */}
        <div
          style={{
            width: '100%',
            backgroundColor: featureBoxBg,
            borderRadius: 16,
            border: `1px solid ${borderColor}`,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 9,
            textAlign: 'left',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                backgroundColor: `${themeColor}20`,
                color: themeColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Zap size={13} strokeWidth={2.6} />
            </div>
            <div style={{ fontSize: 12, color: textColor, fontWeight: 700 }}>
              <strong>登録・パスワード不要</strong>
              <span style={{ color: subTextColor, fontWeight: 500, marginLeft: 4 }}>
                — Googleで1タップですぐ使えます
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                backgroundColor: 'rgba(52, 199, 89, 0.16)',
                color: '#34C759',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={14} strokeWidth={2.4} />
            </div>
            <div style={{ fontSize: 12, color: textColor, fontWeight: 700 }}>
              <strong>安全な端末内保存</strong>
              <span style={{ color: subTextColor, fontWeight: 500, marginLeft: 4 }}>
                — 推し活データは外部に送信されません
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                backgroundColor: 'rgba(90, 107, 255, 0.16)',
                color: '#5A6BFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <GraduationCap size={14} strokeWidth={2.4} />
            </div>
            <div style={{ fontSize: 12, color: textColor, fontWeight: 700 }}>
              <strong>学生アカウント限定</strong>
              <span style={{ color: subTextColor, fontWeight: 500, marginLeft: 4 }}>
                — @student.zen.ac.jp で在籍確認
              </span>
            </div>
          </div>
        </div>

        {/* アクセス対象外（別アカウント選択時）のガイダンス */}
        {deniedProfile && (
          <div
            style={{
              width: '100%',
              marginBottom: 20,
              padding: '14px 16px',
              borderRadius: 16,
              backgroundColor: isDark ? 'rgba(255, 69, 58, 0.12)' : '#FFF2F2',
              border: isDark ? '1px solid rgba(255, 69, 58, 0.35)' : '1px solid #FFD0D0',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                fontSize: 13,
                fontWeight: 800,
                color: isDark ? '#FF6961' : '#E02E24',
              }}
            >
              <AlertCircle size={16} strokeWidth={2.4} style={{ flexShrink: 0 }} />
              <span>ZEN大学のアカウントをお選びください</span>
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                color: textColor,
                wordBreak: 'break-all',
                lineHeight: 1.5,
              }}
            >
              選択されたアカウント：<strong style={{ color: themeColor }}>{deniedProfile.email}</strong>
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 11.5,
                color: subTextColor,
                lineHeight: 1.5,
              }}
            >
              大学から配布された学生用Googleアカウント（<code>@student.zen.ac.jp</code>）に切り替えてもう一度ログインしてください。
            </div>

            <button
              onClick={handleRecheckAllowed}
              disabled={isRechecking}
              style={{
                marginTop: 10,
                width: '100%',
                padding: '9px 12px',
                borderRadius: 10,
                backgroundColor: isDark ? '#262936' : '#FFFFFF',
                border: `1px solid ${borderColor}`,
                color: textColor,
                fontSize: 12,
                fontWeight: 700,
                cursor: isRechecking ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
              }}
            >
              <RefreshCw
                size={13}
                style={{
                  animation: isRechecking ? 'spin 1s linear infinite' : 'none',
                }}
              />
              <span>{isRechecking ? 'アクセス権限を再確認中...' : '最新の権限を再確認する'}</span>
            </button>

            {recheckNotice && (
              <div
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  color: '#FF9500',
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                {recheckNotice}
              </div>
            )}
          </div>
        )}

        {/* エラーメッセージ */}
        {errorMsg && (
          <div
            style={{
              width: '100%',
              marginBottom: 16,
              padding: '10px 14px',
              borderRadius: 12,
              backgroundColor: 'rgba(255, 149, 0, 0.12)',
              border: '1px solid rgba(255, 149, 0, 0.3)',
              color: '#FF9500',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              textAlign: 'left',
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 公式 Sign in with Google ボタン表示エリア */}
        {googleClientId && (
          <div
            style={{
              minHeight: 46,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <div ref={googleButtonRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }} />
            {!gsiReady && !gsiLoadError && (
              <div
                style={{
                  height: 44,
                  width: '100%',
                  maxWidth: 320,
                  borderRadius: 999,
                  backgroundColor: isDark ? '#252834' : '#EEF2F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  color: subTextColor,
                  fontWeight: 600,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              >
                ログインボタンを準備中...
              </div>
            )}
            {gsiLoadError && (
              <div style={{ fontSize: 12, color: '#FF3B30', marginTop: 8 }}>
                認証スクリプトの読み込みに失敗しました。ページを再読み込みしてください。
              </div>
            )}
          </div>
        )}

        {/* フッター：規約へのリンクと注記 */}
        <div
          style={{
            marginTop: 22,
            paddingTop: 18,
            borderTop: `1px solid ${borderColor}`,
            width: '100%',
            fontSize: 11.5,
            color: subTextColor,
            lineHeight: 1.6,
          }}
        >
          <div>
            ログインすることで、
            <button
              type="button"
              onClick={() => setIsTermsOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: themeColor,
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: 11.5,
              }}
            >
              利用規約・プライバシーポリシー
            </button>
            に同意したものとみなされます。
          </div>
          <div style={{ marginTop: 6, fontSize: 10.5, color: isDark ? '#7E8597' : '#8A92A6' }}>
            ※ 在籍確認のみに使用し、個人情報のサーバー保存や外部送信は行いません。
          </div>
        </div>
      </div>

      {/* 利用規約・プライバシーポリシー閲覧モーダル */}
      <TermsPrivacyModal
        isOpen={isTermsOpen}
        mode="view"
        onClose={() => setIsTermsOpen(false)}
      />
    </div>
  );
};
