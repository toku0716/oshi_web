import React, { useState } from 'react';
import { Lock, Unlock, Settings, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { settingsRepository } from '../../repository';
import {
  cacheAccessConfig,
  clearGoogleSession,
  getEffectiveAccessConfig,
  getSavedGoogleSession,
  normalizeEmail,
  saveGoogleSession,
} from '../../utils/googleAuthUtils';

interface AccessControlAdminCardProps {
  onLogout?: () => void;
}

export const AccessControlAdminCard: React.FC<AccessControlAdminCardProps> = ({
  onLogout,
}) => {
  const { settings, themeColor, isDark, refreshAllData, showToast } = useApp();

  const config = getEffectiveAccessConfig(settings);
  const currentSession = getSavedGoogleSession();

  const [newEmailInput, setNewEmailInput] = useState<string>('');
  const [clientIdInput, setClientIdInput] = useState<string>(
    settings?.googleClientId ?? config.googleClientId ?? ''
  );
  const [showClientIdConfig, setShowClientIdConfig] = useState<boolean>(false);

  const cardBg = isDark ? '#1B1C22' : '#FFFFFF';
  const borderColor = isDark ? '#2A2C36' : '#EAECEF';
  const textColor = isDark ? '#FFFFFF' : '#111111';
  const subTextColor = isDark ? '#9E9EA8' : '#6E6E77';
  const subtleBg = isDark ? '#14151B' : '#F6F7FA';

  const handleToggleAccessControl = async () => {
    const nextEnabled = !config.enabled;

    // 有効化する際、許可メールアドレスが1件もない場合は警告
    if (nextEnabled && config.allowedEmails.length === 0) {
      const trimmedCandidate = normalizeEmail(newEmailInput);
      if (trimmedCandidate && trimmedCandidate.includes('@')) {
        // 入力欄に入力中のメールアドレスがあればそれを登録して有効化
        const updatedEmails = [trimmedCandidate];
        await settingsRepository.saveSettings({
          accessControlEnabled: true,
          allowedGoogleEmails: updatedEmails,
        });
        cacheAccessConfig({
          accessControlEnabled: true,
          allowedGoogleEmails: updatedEmails,
        });
        saveGoogleSession({
          email: trimmedCandidate,
          name: trimmedCandidate.split('@')[0],
          authenticatedAt: new Date().toISOString(),
        });
        setNewEmailInput('');
        await refreshAllData();
        showToast(
          `${trimmedCandidate} を許可リストに登録し、アクセス制限をONにしました`
        );
        return;
      }

      showToast(
        '締め出し防止のため、先に許可するGoogleメールアドレスを1件以上追加してください',
        'error'
      );
      return;
    }

    // 有効化した時点で現在の端末が未ログインなら、設定中のオーナー自身が締め出されないよう先頭の許可メールでセッションを保持
    if (nextEnabled && !currentSession && config.allowedEmails.length > 0) {
      const ownerEmail = config.allowedEmails[0];
      saveGoogleSession({
        email: ownerEmail,
        name: ownerEmail.split('@')[0],
        authenticatedAt: new Date().toISOString(),
      });
    }

    await settingsRepository.saveSettings({
      accessControlEnabled: nextEnabled,
    });
    cacheAccessConfig({
      accessControlEnabled: nextEnabled,
    });
    await refreshAllData();
    showToast(
      nextEnabled
        ? 'Googleアカウント限定アクセスをONにしました'
        : 'Googleアカウント限定アクセスをOFFにしました'
    );
  };

  const handleAddAllowedEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = normalizeEmail(newEmailInput);
    const isValidRule =
      email.includes('@') || email.startsWith('.') || email.startsWith('*.');
    if (!email || !isValidRule) {
      showToast(
        '有効なメールアドレス（例: user@xxx.ac.jp）またはドメイン末尾（例: @xxx.ac.jp / .ac.jp）を入力してください',
        'error'
      );
      return;
    }

    if (config.allowedEmails.includes(email)) {
      showToast('このメールアドレス・ルールはすでに許可リストに登録されています', 'error');
      return;
    }

    const updatedCustom = Array.from(new Set([...config.customEmails, email]));
    await settingsRepository.saveSettings({
      allowedGoogleEmails: updatedCustom,
    });
    cacheAccessConfig({
      allowedGoogleEmails: updatedCustom,
    });

    // 初回1件目の追加時は現在のブラウザセッションとしてもセットしておく（完全なメールアドレスの場合）
    if (!currentSession && !email.startsWith('@') && !email.startsWith('.') && !email.startsWith('*.')) {
      saveGoogleSession({
        email,
        name: email.split('@')[0],
        authenticatedAt: new Date().toISOString(),
      });
    }

    setNewEmailInput('');
    await refreshAllData();
    showToast(`${email} を許可リストに追加しました`);
  };

  const handleRemoveAllowedEmail = async (emailToRemove: string) => {
    const normalized = normalizeEmail(emailToRemove);
    const remainingTotal = config.allowedEmails.filter((e) => e !== normalized);

    if (config.enabled && remainingTotal.length === 0) {
      showToast(
        'アクセス制限がONの間は、許可メールを0件にすることはできません',
        'error'
      );
      return;
    }

    const updatedCustom = config.customEmails.filter((e) => e !== normalized);
    await settingsRepository.saveSettings({
      allowedGoogleEmails: updatedCustom,
    });
    cacheAccessConfig({
      allowedGoogleEmails: updatedCustom,
    });
    await refreshAllData();
    showToast(`${normalized} を許可リストから削除しました`);
  };

  const handleSaveClientId = async () => {
    const trimmed = clientIdInput.trim();
    await settingsRepository.saveSettings({
      googleClientId: trimmed,
    });
    cacheAccessConfig({
      googleClientId: trimmed,
    });
    await refreshAllData();
    showToast(
      trimmed
        ? 'Google OAuth クライアントIDを保存しました'
        : 'Google OAuth クライアントIDをクリアしました'
    );
    setShowClientIdConfig(false);
  };

  const handleLogoutAndLock = () => {
    clearGoogleSession();
    showToast('ログアウトしました');
    onLogout?.();
  };

  return (
    <div
      style={{
        padding: 18,
        backgroundColor: cardBg,
        borderRadius: 18,
        border: `1.2px solid ${borderColor}`,
      }}
    >
      {/* ヘッダー＆ON/OFFスイッチ */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: config.enabled
                ? `${themeColor}1F`
                : isDark
                  ? '#262834'
                  : '#EEF0F4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            {config.enabled ? (
              <Lock size={18} color="#FF9500" />
            ) : (
              <Unlock size={18} color={subTextColor} />
            )}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 14.5,
                  fontWeight: 800,
                  color: textColor,
                }}
              >
                特定Googleアカウントのみ許可
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 999,
                  backgroundColor: config.enabled
                    ? '#34C75920'
                    : isDark
                      ? '#2A2C36'
                      : '#EAECEF',
                  color: config.enabled ? '#34C759' : subTextColor,
                }}
              >
                {config.enabled ? '保護中 (ON)' : '制限なし (OFF)'}
              </span>
            </div>
            <div
              style={{
                marginTop: 2,
                fontSize: 12,
                color: subTextColor,
                fontWeight: 600,
              }}
            >
              会員登録不要で、指定したGmailアドレスの人のみサイトに入れます
            </div>
          </div>
        </div>

        {/* トグルボタン */}
        <button
          type="button"
          role="switch"
          aria-checked={config.enabled}
          onClick={handleToggleAccessControl}
          style={{
            width: 50,
            height: 28,
            borderRadius: 999,
            border: 'none',
            backgroundColor: config.enabled
              ? themeColor
              : isDark
                ? '#333645'
                : '#D5D8E0',
            padding: 3,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: config.enabled ? 'flex-end' : 'flex-start',
            transition: 'background-color 0.2s ease',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            }}
          />
        </button>
      </div>

      <div
        style={{
          margin: '16px 0',
          height: 1,
          backgroundColor: borderColor,
        }}
      />

      {/* 許可するGoogleアカウント（メールアドレス）追加フォーム */}
      <div>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 800,
            color: textColor,
            marginBottom: 8,
          }}
        >
          アクセスを許可するGoogleアカウント（{config.allowedEmails.length}件）
        </div>

        <form
          onSubmit={handleAddAllowedEmail}
          style={{ display: 'flex', gap: 8, marginBottom: 12 }}
        >
          <input
            type="text"
            value={newEmailInput}
            onChange={(e) => setNewEmailInput(e.target.value)}
            placeholder="例: user@xxx.ac.jp / example@gmail.com / @xxx.ac.jp"
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 12,
              border: `1.2px solid ${borderColor}`,
              backgroundColor: subtleBg,
              color: textColor,
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0 16px',
              borderRadius: 12,
              border: 'none',
              backgroundColor: themeColor,
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            ＋ 追加
          </button>
        </form>

        {/* 登録済みメールアドレスリスト */}
        {config.allowedEmails.length === 0 ? (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              backgroundColor: subtleBg,
              color: subTextColor,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            まだ許可されたGoogleアカウントがありません。あなた自身のGoogleメールアドレスを追加してからスイッチをONにしてください。
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {config.allowedEmails.map((email) => {
              const isFromEnv = config.envEmails.includes(email);
              const isCurrentUser =
                currentSession && normalizeEmail(currentSession.email) === email;

              return (
                <div
                  key={email}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    padding: '9px 12px',
                    borderRadius: 12,
                    backgroundColor: subtleBg,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      minWidth: 0,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: textColor,
                        wordBreak: 'break-all',
                      }}
                    >
                      {email}
                    </span>
                    {isCurrentUser && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: 999,
                          backgroundColor: `${themeColor}22`,
                          color: themeColor,
                        }}
                      >
                        ログイン中
                      </span>
                    )}
                    {isFromEnv && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: 999,
                          backgroundColor: '#007AFF22',
                          color: '#007AFF',
                        }}
                      >
                        .env固定
                      </span>
                    )}
                  </div>

                  {!isFromEnv && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAllowedEmail(email)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 8,
                        border: 'none',
                        backgroundColor: '#FF3B3018',
                        color: '#FF3B30',
                        fontSize: 11.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      削除
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 現在ログイン中のセッション情報 ＆ ロック画面確認ボタン */}
      {(currentSession || config.enabled) && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: `1px solid ${borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: 12, color: subTextColor, fontWeight: 600 }}>
            {currentSession ? (
              <>
                認証済み: <strong style={{ color: textColor }}>{currentSession.email}</strong>
              </>
            ) : (
              '現在未ログイン状態'
            )}
          </div>

          {config.enabled && (
            <button
              type="button"
              onClick={handleLogoutAndLock}
              style={{
                padding: '6px 12px',
                borderRadius: 10,
                border: `1px solid ${borderColor}`,
                backgroundColor: 'transparent',
                color: textColor,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Lock size={12} />
                <span>ロック画面を確認（ログアウト）</span>
              </span>
            </button>
          )}
        </div>
      )}

      {/* Google OAuth クライアントID 詳細設定（折りたたみ） */}
      <div style={{ marginTop: 12 }}>
        <button
          type="button"
          onClick={() => setShowClientIdConfig((prev) => !prev)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            color: subTextColor,
            fontSize: 11.5,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Settings size={13} />
          <span>
            {showClientIdConfig
              ? 'Google OAuth クライアントID設定を閉じる'
              : 'Google OAuth クライアントID設定（本番用ワンタップGoogle認証）'}
          </span>
        </button>

        {showClientIdConfig && (
          <div
            style={{
              marginTop: 10,
              padding: 12,
              borderRadius: 12,
              backgroundColor: subtleBg,
              border: `1px solid ${borderColor}`,
            }}
          >
            <div
              style={{
                fontSize: 11.5,
                color: subTextColor,
                lineHeight: 1.55,
                marginBottom: 8,
              }}
            >
              Google Cloud Console で発行した「ウェブ アプリケーション」の OAuth 2.0 クライアントID（または <code>.env</code> の <code>VITE_GOOGLE_CLIENT_ID</code>）を設定すると、Google公式の「Googleでログイン」ボタンによる暗号署名トークン検証が有効になります。
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                placeholder="xxxx.apps.googleusercontent.com"
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: `1px solid ${borderColor}`,
                  backgroundColor: cardBg,
                  color: textColor,
                  fontSize: 12,
                }}
              />
              <button
                type="button"
                onClick={handleSaveClientId}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: 'none',
                  backgroundColor: themeColor,
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                保存
              </button>
            </div>

            <div
              style={{
                marginTop: 10,
                padding: '10px 12px',
                borderRadius: 10,
                backgroundColor: cardBg,
                border: `1px solid ${borderColor}`,
                fontSize: 11.5,
                lineHeight: 1.55,
                color: subTextColor,
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  color: textColor,
                  marginBottom: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <AlertTriangle size={14} color="#FF9500" />
                <span>Google Cloud コンソールの「承認済みの JavaScript 生成元」設定（必須）</span>
              </div>
              <div>
                <code>origin_mismatch</code> エラーを防ぐため、Google Cloud コンソールの OAuth 2.0 クライアントID設定の<strong>「承認済みの JavaScript 生成元」</strong>に以下の2つを<strong>両方とも</strong>登録してください：
              </div>
              <div
                style={{
                  marginTop: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <code
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    backgroundColor: subtleBg,
                    color: themeColor,
                    fontWeight: 800,
                    fontSize: 11.5,
                    userSelect: 'all',
                  }}
                >
                  {typeof window !== 'undefined'
                    ? window.location.origin
                    : 'http://localhost:5173'}
                </code>
                <code
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    backgroundColor: subtleBg,
                    color: themeColor,
                    fontWeight: 800,
                    fontSize: 11.5,
                    userSelect: 'all',
                  }}
                >
                  http://localhost
                </code>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
