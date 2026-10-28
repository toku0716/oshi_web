import React, { useEffect, useRef, useState } from 'react';
import { Lock, ShieldAlert, AlertTriangle, RefreshCw } from 'lucide-react';
import type { GoogleAuthSession } from '../../types';
import {
  decodeGoogleJwtCredential,
  isGoogleEmailAllowed,
  loadGoogleIdentityScript,
  normalizeEmail,
  saveGoogleSession,
} from '../../utils/googleAuthUtils';

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
              } catch {}

              // 許可リストがまだ空（初回セットアップ直後）の場合は、最初にログインしたGoogleアカウントをオーナーとして自動許可
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
                  : 'Google認証トークンの検証に失敗しました。'
              );
            }
          },
          auto_select: true,
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
            width: 280,
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
          `最新の許可リスト（${merged.length}件）を再同期しました。`
        );
      } else {
        setRecheckNotice('サーバーから許可リストを取得できませんでした。');
      }
    } catch {
      setRecheckNotice('ネットワークエラーが発生しました。接続を確認してください。');
    } finally {
      setIsRechecking(false);
    }
  };

  const bgColor = isDark ? '#111216' : '#F4F6FA';
  const cardBg = isDark ? '#1B1C22' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#111111';
  const subTextColor = isDark ? '#9E9EA8' : '#6E6E77';
  const borderColor = isDark ? '#2A2C36' : '#E8EAEE';

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
          maxWidth: 420,
          backgroundColor: cardBg,
          borderRadius: 28,
          border: `1px solid ${borderColor}`,
          boxShadow: isDark
            ? '0 24px 60px rgba(0, 0, 0, 0.55)'
            : '0 20px 50px rgba(0, 0, 0, 0.08)',
          padding: '32px 24px 28px',
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
            background: `linear-gradient(135deg, ${themeColor}, ${themeColor}CC)`,
            boxShadow: `0 10px 24px ${themeColor}44`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            marginBottom: 18,
          }}
        >
          <Lock size={26} color="#FFFFFF" strokeWidth={2.4} />
        </div>

        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: themeColor,
            backgroundColor: `${themeColor}18`,
            padding: '4px 12px',
            borderRadius: 999,
            marginBottom: 10,
            letterSpacing: '0.04em',
          }}
        >
          PRIVATE ACCESS ONLY
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: '-0.02em',
          }}
        >
          推しサポ
        </h1>
        <p
          style={{
            margin: '8px 0 0',
            fontSize: 13,
            color: subTextColor,
            lineHeight: 1.6,
          }}
        >
          このサイトは<strong>許可されたGoogleアカウントのみ</strong>アクセスできます。
          <br />
          アカウント新規登録は不要です。お使いのGoogleアカウントで認証してください。
        </p>

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
                fontSize: 13,
                fontWeight: 800,
                color: '#FF3B30',
              }}
            >
              <ShieldAlert size={16} color="#FF3B30" strokeWidth={2.4} style={{ flexShrink: 0 }} />
              <span>このGoogleアカウントは許可されていません</span>
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                color: textColor,
                fontWeight: 700,
                wordBreak: 'break-all',
              }}
            >
              選択されたアカウント: {deniedProfile.email}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 11.5,
                color: subTextColor,
                lineHeight: 1.5,
              }}
            >
              許可リストに登録されているGoogleアカウントに切り替えて再度ログインするか、管理者に連絡してください。
            </div>

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
              <span>{isRechecking ? '最新リストを確認中...' : '最新の許可リストを再取得して再判定'}</span>
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
              marginTop: 16,
              padding: '10px 14px',
              borderRadius: 12,
              backgroundColor: '#FF950018',
              border: '1px solid #FF950044',
              color: '#FF9500',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 公式 Sign in with Google ボタン表示エリア */}
        {googleClientId && (
          <div
            style={{
              marginTop: 24,
              minHeight: 48,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <div ref={googleButtonRef} />
            {!gsiReady && !gsiLoadError && (
              <div style={{ fontSize: 12, color: subTextColor, marginTop: 8 }}>
                Google認証ボタンを読み込み中...
              </div>
            )}
            {gsiLoadError && (
              <div style={{ fontSize: 12, color: '#FF3B30', marginTop: 8 }}>
                Google認証スクリプトの読み込みに失敗しました。ネットワーク接続を確認してください。
              </div>
            )}
          </div>
        )}

        <div
          style={{
            marginTop: 22,
            fontSize: 11,
            color: subTextColor,
            lineHeight: 1.5,
          }}
        >
          ※ パスワードや個人情報のサーバー保存・会員登録は一切行いません。
          <br />
          許可されたGoogleアカウントかどうかの本人確認のみに使用されます。
        </div>
      </div>
    </div>
  );
};
