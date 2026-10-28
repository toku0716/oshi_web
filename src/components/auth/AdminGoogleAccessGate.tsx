import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, ArrowLeft, Wrench, RefreshCw } from 'lucide-react';
import type { GoogleAuthSession } from '../../types';
import {
  decodeGoogleJwtCredential,
  isGoogleEmailAllowed,
  loadGoogleIdentityScript,
  normalizeEmail,
  saveAdminGoogleSession,
} from '../../utils/googleAuthUtils';

interface AdminGoogleAccessGateProps {
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

export const AdminGoogleAccessGate: React.FC<AdminGoogleAccessGateProps> = ({
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

  useEffect(() => {
    let cancelled = false;
    const fetchFresh = async () => {
      try {
        const res = await fetch(`./active_policy.json?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok && !cancelled) {
          const data = await res.json();
          if (Array.isArray(data?.allowedAdminGoogleEmails) && data.allowedAdminGoogleEmails.length > 0) {
            setLiveAllowedEmails((prev) =>
              Array.from(new Set([...prev, ...data.allowedAdminGoogleEmails]))
            );
          }
        }
      } catch {}
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
              setErrorMsg('Googleからの認証情報を取得できませんでした。');
              return;
            }
            try {
              const payload = decodeGoogleJwtCredential(response.credential);
              setErrorMsg(null);
              setRecheckNotice(null);

              let checkPool = liveAllowedEmails;
              try {
                const freshRes = await fetch(`./active_policy.json?t=${Date.now()}`, {
                  cache: 'no-store',
                });
                if (freshRes.ok) {
                  const data = await freshRes.json();
                  if (Array.isArray(data?.allowedAdminGoogleEmails) && data.allowedAdminGoogleEmails.length > 0) {
                    checkPool = Array.from(new Set([...checkPool, ...data.allowedAdminGoogleEmails]));
                    setLiveAllowedEmails(checkPool);
                  }
                }
              } catch {}

              // 管理者リストがまだ空の場合は、最初にログインしたGoogleアカウントを管理者オーナーとして自動登録
              if (checkPool.length === 0) {
                const session: GoogleAuthSession = {
                  email: payload.email,
                  name: payload.name,
                  picture: payload.picture,
                  authenticatedAt: new Date().toISOString(),
                };
                saveAdminGoogleSession(session);
                onAuthenticated(session, payload.email);
                return;
              }

              // 管理者許可リストに含まれているかチェック
              if (isGoogleEmailAllowed(payload.email, checkPool)) {
                setDeniedProfile(null);
                const session: GoogleAuthSession = {
                  email: payload.email,
                  name: payload.name,
                  picture: payload.picture,
                  authenticatedAt: new Date().toISOString(),
                };
                saveAdminGoogleSession(session);
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
                  : 'Google認証トークンの検証に失敗しました。'
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
            text: 'signin_with',
            logo_alignment: 'left',
            width: 290,
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

  const handleRecheckAllowed = async () => {
    setIsRechecking(true);
    setRecheckNotice(null);
    try {
      const res = await fetch(`./active_policy.json?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const serverAllowed = Array.isArray(data?.allowedAdminGoogleEmails) ? data.allowedAdminGoogleEmails : [];
        const merged = Array.from(new Set([...liveAllowedEmails, ...serverAllowed]));
        setLiveAllowedEmails(merged);

        if (deniedProfile && isGoogleEmailAllowed(deniedProfile.email, merged)) {
          const session: GoogleAuthSession = {
            email: deniedProfile.email,
            name: deniedProfile.name,
            picture: deniedProfile.picture,
            authenticatedAt: new Date().toISOString(),
          };
          saveAdminGoogleSession(session);
          setDeniedProfile(null);
          onAuthenticated(session);
          return;
        }
        setRecheckNotice(`最新の管理者リスト（${merged.length}件）を再同期しました。`);
      } else {
        setRecheckNotice('管理者リストの取得に失敗しました。');
      }
    } catch {
      setRecheckNotice('通信エラーが発生しました。');
    } finally {
      setIsRechecking(false);
    }
  };

  const bgColor = isDark ? '#0D0E12' : '#F3F5F9';
  const cardBg = isDark ? '#171921' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#11141C';
  const subTextColor = isDark ? '#969AA8' : '#646A7A';
  const borderColor = isDark ? '#262936' : '#E5E8F0';

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
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          backgroundColor: cardBg,
          borderRadius: 28,
          border: `1.5px solid ${borderColor}`,
          boxShadow: isDark
            ? '0 24px 60px rgba(0, 0, 0, 0.55)'
            : '0 20px 50px rgba(0, 0, 0, 0.08)',
          padding: '36px 28px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* アイコンバッジ */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #007AFF, #5856D6)',
            boxShadow: '0 10px 24px rgba(0, 122, 255, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            marginBottom: 18,
          }}
        >
          <Wrench size={28} color="#FFFFFF" strokeWidth={2.4} />
        </div>

        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: '#007AFF',
            backgroundColor: 'rgba(0, 122, 255, 0.12)',
            padding: '4px 12px',
            borderRadius: 999,
            marginBottom: 10,
            letterSpacing: '0.04em',
          }}
        >
          ADMIN CONSOLE AUTH
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: '-0.02em',
          }}
        >
          管理者コンソール ログイン
        </h1>

        <p
          style={{
            margin: '10px 0 0',
            fontSize: 13,
            color: subTextColor,
            lineHeight: 1.6,
          }}
        >
          このページは<strong>許可された管理者Googleアカウント</strong>のみログインできます。
          <br />
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
            ※ 推しサポ一般ユーザーの許可リストとは別個に管理・判定されます。
          </span>
        </p>

        {/* 初回オーナー自動登録の案内（管理者リストが空の場合） */}
        {allowedEmails.length === 0 && (
          <div
            style={{
              width: '100%',
              marginTop: 18,
              padding: '12px 14px',
              borderRadius: 14,
              backgroundColor: isDark ? 'rgba(0, 122, 255, 0.12)' : 'rgba(0, 122, 255, 0.08)',
              border: '1px solid rgba(0, 122, 255, 0.3)',
              fontSize: 12,
              lineHeight: 1.5,
              color: textColor,
              textAlign: 'left',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
            }}
          >
            <ShieldCheck size={18} style={{ color: '#007AFF', flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>管理者初回セットアップ中：</strong>
              <br />
              現在管理者が登録されていません。最初にログインしたGoogleアカウントが管理者（オーナー）として登録されます。
            </div>
          </div>
        )}

        {/* アクセス拒否時の表示 */}
        {deniedProfile && (
          <div
            style={{
              width: '100%',
              marginTop: 20,
              padding: '14px 16px',
              borderRadius: 16,
              backgroundColor: '#FF3B3014',
              border: '1px solid #FF3B3044',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#FF3B30',
                fontSize: 13,
                fontWeight: 800,
                marginBottom: 8,
              }}
            >
              <ShieldAlert size={18} />
              管理者権限がありません
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 10,
                backgroundColor: isDark ? '#00000033' : '#FFFFFF',
                marginBottom: 8,
              }}
            >
              {deniedProfile.picture ? (
                <img
                  src={deniedProfile.picture}
                  alt={deniedProfile.name || deniedProfile.email}
                  style={{ width: 28, height: 28, borderRadius: '50%' }}
                />
              ) : (
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    backgroundColor: '#FF3B3022',
                    color: '#FF3B30',
                    fontSize: 12,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {deniedProfile.email.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                {deniedProfile.name && (
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {deniedProfile.name}
                  </div>
                )}
                <div
                  style={{
                    fontSize: 11.5,
                    color: subTextColor,
                    wordBreak: 'break-all',
                  }}
                >
                  {deniedProfile.email}
                </div>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: 11.5, color: subTextColor, lineHeight: 1.5 }}>
              このGoogleアカウントは管理者として許可されていません。
              推しサポの一般利用権限とは異なり、管理者コンソール専用のアクセス権が必要です。
            </p>

            <button
              onClick={handleRecheckAllowed}
              disabled={isRechecking}
              style={{
                marginTop: 10,
                width: '100%',
                padding: '9px 12px',
                borderRadius: 10,
                backgroundColor: isDark ? '#262834' : '#FFFFFF',
                border: `1px solid ${borderColor}`,
                color: textColor,
                fontSize: 12,
                fontWeight: 800,
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
              <span>{isRechecking ? '管理者リストを確認中...' : '最新の管理者リストを再取得して再判定'}</span>
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
              marginTop: 14,
              padding: '10px 14px',
              borderRadius: 12,
              backgroundColor: '#FF950018',
              border: '1px solid #FF950044',
              color: '#FF9500',
              fontSize: 12,
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google認証ボタン領域 */}
        <div style={{ width: '100%', marginTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {googleClientId ? (
            <>
              <div
                ref={googleButtonRef}
                style={{
                  minHeight: 44,
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%',
                }}
              />
              {!gsiReady && !gsiLoadError && (
                <div style={{ fontSize: 12, color: subTextColor, marginTop: 8 }}>
                  Google認証を読み込み中...
                </div>
              )}
              {gsiLoadError && (
                <div style={{ fontSize: 12, color: '#FF3B30', marginTop: 8 }}>
                  Google認証スクリプトの読み込みに失敗しました（オフラインまたはブロックされています）
                </div>
              )}

              {/* origin_mismatch トラブルシューティング案内 */}
              <div
                style={{
                  width: '100%',
                  marginTop: 14,
                  padding: '10px 12px',
                  borderRadius: 12,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F5F6F9',
                  border: `1px solid ${borderColor}`,
                  fontSize: 11,
                  color: subTextColor,
                  textAlign: 'left',
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 700, color: textColor, marginBottom: 2 }}>
                  ℹ️ Googleで origin_mismatch が出る場合:
                </div>
                <div>・Google Consoleの登録先が「リダイレクトURI」ではなく<strong>「JavaScript生成元」</strong>になっているかご確認ください。</div>
                <div style={{ marginTop: 2 }}>
                  ・現在の生成元: <code style={{ color: '#007AFF', fontWeight: 700 }}>{typeof window !== 'undefined' ? window.location.origin : ''}</code>
                </div>
                <div style={{ marginTop: 2, wordBreak: 'break-all' }}>
                  ・アプリが現在送信しているクライアントID: <code style={{ color: '#FF9500', fontWeight: 700 }}>{googleClientId || '（未設定）'}</code>
                </div>
              </div>
            </>
          ) : (
            <div
              style={{
                padding: '14px',
                borderRadius: 14,
                backgroundColor: isDark ? '#22232A' : '#F0F2F6',
                border: `1px solid ${borderColor}`,
                fontSize: 12,
                color: subTextColor,
                lineHeight: 1.5,
              }}
            >
              Google OAuth クライアントIDが未設定です。.env の VITE_GOOGLE_CLIENT_ID を設定してください。
            </div>
          )}
        </div>

        {/* 一般画面へ戻るリンク */}
        <div style={{ marginTop: 24 }}>
          <a
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              color: subTextColor,
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={14} />
            推しサポ（一般ユーザー画面）へ戻る
          </a>
        </div>
      </div>
    </div>
  );
};
