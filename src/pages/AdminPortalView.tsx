import React, { useState } from 'react';
import {
  Wrench,
  ExternalLink,
  Lock,
  Unlock,
  Settings,
  AlertTriangle,
  FileText,
  RefreshCw,
  Calendar,
  Eye,
  FlaskConical,
} from 'lucide-react';
import { ToastContainer } from '../components/common/ToastContainer';
import { TermsPrivacyModal } from '../components/modals/TermsPrivacyModal';
import { useApp } from '../context/AppContext';
import { settingsRepository } from '../repository';
import {
  CURRENT_POLICY_DATE_LABEL,
  CURRENT_POLICY_VERSION,
  getEffectivePolicyInfo,
} from '../types';
import {
  cacheAccessConfig,
  clearGoogleSession,
  getEffectiveAccessConfig,
  getSavedGoogleSession,
  normalizeEmail,
  saveGoogleSession,
} from '../utils/googleAuthUtils';

export const AdminPortalView: React.FC = () => {
  const { settings, themeColor, isDark, refreshAllData, showToast } = useApp();

  const config = getEffectiveAccessConfig(settings);
  const policyInfo = getEffectivePolicyInfo(settings);
  const currentSession = getSavedGoogleSession();

  // 1. 許可Googleアカウント追加ステート
  const [newEmailInput, setNewEmailInput] = useState<string>('');

  // 2. Google OAuth クライアントIDステート
  const [clientIdInput, setClientIdInput] = useState<string>(
    settings?.googleClientId ?? config.googleClientId ?? ''
  );

  // 3. 利用規約バージョン改定ステート
  const [newPolicyVersion, setNewPolicyVersion] = useState<string>(
    policyInfo.version
  );
  const [newPolicyDateLabel, setNewPolicyDateLabel] = useState<string>(
    policyInfo.dateLabel
  );
  const [previewModalMode, setPreviewModalMode] = useState<
    'none' | 'view' | 'consent_initial' | 'consent_update'
  >('none');

  const bgColor = isDark ? '#0D0E12' : '#F3F5F9';
  const cardBg = isDark ? '#171921' : '#FFFFFF';
  const subtleBg = isDark ? '#11131A' : '#F7F8FC';
  const borderColor = isDark ? '#262936' : '#E5E8F0';
  const textColor = isDark ? '#FFFFFF' : '#11141C';
  const subTextColor = isDark ? '#969AA8' : '#646A7A';

  const currentOrigin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:5173';

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} をコピーしました`);
    } catch {
      showToast('コピーに失敗しました', 'error');
    }
  };

  // アクセス制限 ON/OFF 切り替え
  const handleToggleAccessControl = async () => {
    const nextEnabled = !config.enabled;

    if (nextEnabled && config.allowedEmails.length === 0) {
      const candidate = normalizeEmail(newEmailInput);
      const isValidCandidate =
        candidate.includes('@') ||
        candidate.startsWith('.') ||
        candidate.startsWith('*.');
      if (candidate && isValidCandidate) {
        const updatedEmails = [candidate];
        await settingsRepository.saveSettings({
          accessControlEnabled: true,
          allowedGoogleEmails: updatedEmails,
        });
        cacheAccessConfig({
          accessControlEnabled: true,
          allowedGoogleEmails: updatedEmails,
        });
        if (
          !candidate.startsWith('@') &&
          !candidate.startsWith('.') &&
          !candidate.startsWith('*.')
        ) {
          saveGoogleSession({
            email: candidate,
            name: candidate.split('@')[0],
            authenticatedAt: new Date().toISOString(),
          });
        }
        setNewEmailInput('');
        await refreshAllData();
        showToast(
          `${candidate} を許可リストに登録し、アクセス制限をONにしました`
        );
        return;
      }

      showToast(
        '締め出し防止のため、先に許可するGoogleアカウント（または .ac.jp ドメイン）を1件以上追加してください',
        'error'
      );
      return;
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
        ? 'Googleアカウント限定アクセスを【保護中 (ON)】にしました'
        : 'Googleアカウント限定アクセスを【制限なし (OFF)】にしました'
    );
  };

  // 許可Googleアカウント・ドメインの追加
  const handleAddAllowedEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const rule = normalizeEmail(newEmailInput);
    const isValidRule =
      rule.includes('@') || rule.startsWith('.') || rule.startsWith('*.');
    if (!rule || !isValidRule) {
      showToast(
        '有効なメールアドレス（例: user@xxx.ac.jp）またはドメイン末尾（例: @xxx.ac.jp / .ac.jp）を入力してください',
        'error'
      );
      return;
    }

    if (config.allowedEmails.includes(rule)) {
      showToast('すでに許可リストに登録されています', 'error');
      return;
    }

    const updatedCustom = Array.from(new Set([...config.customEmails, rule]));
    await settingsRepository.saveSettings({
      allowedGoogleEmails: updatedCustom,
    });
    cacheAccessConfig({
      allowedGoogleEmails: updatedCustom,
    });

    if (
      !currentSession &&
      !rule.startsWith('@') &&
      !rule.startsWith('.') &&
      !rule.startsWith('*.')
    ) {
      saveGoogleSession({
        email: rule,
        name: rule.split('@')[0],
        authenticatedAt: new Date().toISOString(),
      });
    }

    setNewEmailInput('');
    await refreshAllData();
    showToast(`${rule} を許可リストに追加しました`);
  };

  // 許可Googleアカウントの削除
  const handleRemoveAllowedEmail = async (emailToRemove: string) => {
    const normalized = normalizeEmail(emailToRemove);
    const remainingTotal = config.allowedEmails.filter((e) => e !== normalized);

    if (config.enabled && remainingTotal.length === 0) {
      showToast(
        'アクセス制限がONの間は、許可リストを0件にすることはできません',
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

  // OAuth クライアントIDの保存
  const handleSaveClientId = async (e: React.FormEvent) => {
    e.preventDefault();
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
  };

  // 利用規約・プライバシーポリシーの新バージョン発行
  const handlePublishPolicyUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const ver = newPolicyVersion.trim();
    const label = newPolicyDateLabel.trim();
    if (!ver || !label) {
      showToast('バージョン番号と改定日ラベルを入力してください', 'error');
      return;
    }

    localStorage.setItem('oshiss_active_policy_version', ver);
    localStorage.setItem('oshiss_active_policy_date_label', label);

    await settingsRepository.saveSettings({
      activePolicyVersion: ver,
      activePolicyDateLabel: label,
    });
    await refreshAllData();
    showToast(
      `利用規約 Ver.${ver} を発行しました！次回アプリ起動時に改定確認モーダルが表示されます`
    );
  };

  // 今日の日付から新しいバージョン番号を自動入力
  const handleFillTodayPolicyVersion = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const baseVer = `${y}-${m}-${d}`;
    const nextVer =
      policyInfo.version === baseVer
        ? `${baseVer}-r2`
        : policyInfo.version.startsWith(`${baseVer}-r`)
          ? `${baseVer}-r${
              (parseInt(policyInfo.version.split('-r')[1] || '2', 10) || 1) + 1
            }`
          : baseVer;

    setNewPolicyVersion(nextVer);
    setNewPolicyDateLabel(`${y}年${now.getMonth() + 1}月${now.getDate()}日`);
  };

  // 規約改定時の起動時モーダルをシミュレート（過去バージョン同意済状態にする）
  const handleSimulatePolicyUpdateOnStartup = async () => {
    const oldVer = '2025-01-01';
    localStorage.setItem('oshiss_accepted_policy_version', oldVer);
    await settingsRepository.saveSettings({
      acceptedPolicyVersion: oldVer,
      acceptedPolicyAt: new Date(2025, 0, 1).toISOString(),
    });
    await refreshAllData();
    showToast(
      '「過去バージョンに同意済」の状態にセットしました。ユーザーサイトを開くと改定お知らせが出ます！'
    );
  };

  // 初回起動時の未同意状態をシミュレート
  const handleResetPolicyConsent = async () => {
    localStorage.removeItem('oshiss_accepted_policy_version');
    await settingsRepository.saveSettings({
      acceptedPolicyVersion: '',
      acceptedPolicyAt: '',
    });
    await refreshAllData();
    showToast(
      '利用規約の同意状態を未同意にリセットしました。ユーザーサイトを開くと初回同意画面が出ます！'
    );
  };

  const acceptedVer =
    settings?.acceptedPolicyVersion ||
    localStorage.getItem('oshiss_accepted_policy_version') ||
    '';

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: bgColor,
        color: textColor,
        paddingBottom: 60,
      }}
    >
      <ToastContainer />

      {/* 管理者サイト専用トップバー */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: isDark
            ? 'rgba(23, 25, 33, 0.88)'
            : 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(14px)',
          borderBottom: `1px solid ${borderColor}`,
          padding: '14px 20px',
        }}
      >
        <div
          style={{
            maxWidth: 880,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                background: `linear-gradient(135deg, ${themeColor}, #5856D6)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: 18,
              }}
            >
              <Wrench size={20} color="#FFFFFF" strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 17,
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                  }}
                >
                  推しサポ 管理者コンソール
                </span>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 999,
                    backgroundColor: `${themeColor}22`,
                    color: themeColor,
                  }}
                >
                  ADMIN PORTAL
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: subTextColor }}>
                アクセス制限・Google OAuth設定・利用規約バージョンの一元管理サイト
              </div>
            </div>
          </div>

          <a
            href="./"
            style={{
              padding: '9px 16px',
              borderRadius: 12,
              backgroundColor: themeColor,
              color: '#FFFFFF',
              textDecoration: 'none',
              fontSize: 12.5,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: `0 4px 12px ${themeColor}44`,
            }}
          >
            <span>ユーザー用サイトを開く</span>
            <ExternalLink size={13} strokeWidth={2.4} />
          </a>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main
        style={{
          maxWidth: 880,
          margin: '24px auto 0',
          padding: '0 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        {/* ステータスサマリーカード */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14,
          }}
        >
          <div
            style={{
              padding: 18,
              borderRadius: 18,
              backgroundColor: cardBg,
              border: `1.2px solid ${borderColor}`,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: subTextColor }}>
              サイトアクセス制限
            </div>
            <div
              style={{
                marginTop: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {config.enabled ? (
                <Lock size={18} color="#34C759" strokeWidth={2.4} />
              ) : (
                <Unlock size={18} color={subTextColor} strokeWidth={2.4} />
              )}
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: config.enabled ? '#34C759' : subTextColor,
                }}
              >
                {config.enabled ? '保護中 (ON)' : '制限なし (OFF)'}
              </span>
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 11.5,
                color: subTextColor,
              }}
            >
              許可登録数: {config.allowedEmails.length} 件
            </div>
          </div>

          <div
            style={{
              padding: 18,
              borderRadius: 18,
              backgroundColor: cardBg,
              border: `1.2px solid ${borderColor}`,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: subTextColor }}>
              現在のGoogle認証セッション
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 15,
                fontWeight: 900,
                color: currentSession ? textColor : subTextColor,
                wordBreak: 'break-all',
              }}
            >
              {currentSession ? currentSession.email : '未ログイン（ロック状態）'}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 11.5,
                color: subTextColor,
              }}
            >
              OAuth Client ID: {config.googleClientId ? '設定済' : '未設定'}
            </div>
          </div>

          <div
            style={{
              padding: 18,
              borderRadius: 18,
              backgroundColor: cardBg,
              border: `1.2px solid ${borderColor}`,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: subTextColor }}>
              利用規約・プライバシーポリシー
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 18,
                fontWeight: 900,
                color: themeColor,
              }}
            >
              Ver. {policyInfo.version}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 11.5,
                color: subTextColor,
              }}
            >
              この端末の同意状態:{' '}
              {acceptedVer === policyInfo.version
                ? '最新規約に同意済'
                : acceptedVer
                  ? `旧版(${acceptedVer})のみ同意・次回起動時に通知`
                  : '未同意・次回起動時に表示'}
            </div>
          </div>
        </div>

        {/* セクション 1: 許可Googleアカウント・ドメイン管理 */}
        <section
          style={{
            padding: 22,
            borderRadius: 22,
            backgroundColor: cardBg,
            border: `1.2px solid ${borderColor}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={18} />
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900 }}>
                  1. 特定Googleアカウント・ドメインのアクセス許可管理
                </h2>
              </div>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 12.5,
                  color: subTextColor,
                }}
              >
                アカウント新規登録なしで、ここに登録されたGoogleメールアドレスまたは <code>.ac.jp</code> ドメインの人のみユーザーサイトへアクセスできます。
              </p>
            </div>

            {/* ON/OFF トグル */}
            <button
              type="button"
              onClick={handleToggleAccessControl}
              style={{
                padding: '10px 18px',
                borderRadius: 14,
                border: 'none',
                backgroundColor: config.enabled
                  ? '#34C759'
                  : isDark
                    ? '#2A2D3A'
                    : '#E2E5EE',
                color: config.enabled ? '#FFFFFF' : textColor,
                fontSize: 13,
                fontWeight: 900,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {config.enabled ? <Lock size={15} /> : <Unlock size={15} />}
              <span>
                {config.enabled
                  ? 'アクセス制限: ON（クリックで解除）'
                  : 'アクセス制限: OFF（クリックで有効化）'}
              </span>
            </button>
          </div>

          <div
            style={{
              margin: '18px 0',
              height: 1,
              backgroundColor: borderColor,
            }}
          />

          {/* 追加フォーム */}
          <form
            onSubmit={handleAddAllowedEmail}
            style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}
          >
            <input
              type="text"
              value={newEmailInput}
              onChange={(e) => setNewEmailInput(e.target.value)}
              placeholder="例: user@gmail.com / s24001@xxx.ac.jp / @xxx.ac.jp / .ac.jp"
              style={{
                flex: '1 1 280px',
                padding: '11px 14px',
                borderRadius: 12,
                border: `1.2px solid ${borderColor}`,
                backgroundColor: subtleBg,
                color: textColor,
                fontSize: 13.5,
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '11px 20px',
                borderRadius: 12,
                border: 'none',
                backgroundColor: themeColor,
                color: '#FFFFFF',
                fontSize: 13.5,
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              ＋ 許可リストに追加
            </button>
          </form>

          {/* 登録リスト */}
          {config.allowedEmails.length === 0 ? (
            <div
              style={{
                padding: 16,
                borderRadius: 14,
                backgroundColor: subtleBg,
                color: subTextColor,
                fontSize: 12.5,
                fontWeight: 600,
              }}
            >
              許可リストはまだ空です。上の入力欄から許可したいGoogleメールアドレス（または <code>@xxx.ac.jp</code> / <code>.ac.jp</code>）を追加してください。
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {config.allowedEmails.map((rule) => {
                const isFromEnv = config.envEmails.includes(rule);
                const isDomainRule =
                  rule.startsWith('@') ||
                  rule.startsWith('.') ||
                  rule.startsWith('*.');
                const isCurrentUser =
                  currentSession &&
                  normalizeEmail(currentSession.email) === rule;

                return (
                  <div
                    key={rule}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      padding: '10px 14px',
                      borderRadius: 12,
                      backgroundColor: subtleBg,
                      border: `1px solid ${borderColor}`,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13.5,
                          fontWeight: 800,
                          color: textColor,
                        }}
                      >
                        {rule}
                      </span>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 999,
                          backgroundColor: isDomainRule
                            ? '#AF52DE22'
                            : '#007AFF18',
                          color: isDomainRule ? '#AF52DE' : '#007AFF',
                        }}
                      >
                        {isDomainRule ? 'ドメイン/末尾一括許可' : '個人アドレス'}
                      </span>
                      {isCurrentUser && (
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 999,
                            backgroundColor: '#34C75922',
                            color: '#34C759',
                          }}
                        >
                          現在ログイン中
                        </span>
                      )}
                      {isFromEnv && (
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 999,
                            backgroundColor: '#FF950022',
                            color: '#FF9500',
                          }}
                        >
                          .env固定
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {!isDomainRule && !isCurrentUser && (
                        <button
                          type="button"
                          onClick={() => {
                            saveGoogleSession({
                              email: rule,
                              name: rule.split('@')[0],
                              authenticatedAt: new Date().toISOString(),
                            });
                            refreshAllData();
                            showToast(`${rule} としてログイン状態にしました`);
                          }}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 8,
                            border: `1px solid ${borderColor}`,
                            backgroundColor: cardBg,
                            color: textColor,
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          このアカウントで認証済にする
                        </button>
                      )}
                      {!isFromEnv && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAllowedEmail(rule)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 8,
                            border: 'none',
                            backgroundColor: '#FF3B3018',
                            color: '#FF3B30',
                            fontSize: 11.5,
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          削除
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ロック画面テスト用アクションバー */}
          <div
            style={{
              marginTop: 16,
              paddingTop: 14,
              borderTop: `1px solid ${borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ fontSize: 12, color: subTextColor }}>
              ユーザーサイトの「Googleログイン画面（ロック画面）」をテストしたい場合は、右のボタンで一度未ログイン状態にしてからユーザーサイトを開いてください。
            </div>
            <button
              type="button"
              onClick={() => {
                clearGoogleSession();
                refreshAllData();
                showToast(
                  '認証セッションをクリアしました。ユーザーサイトを開くとロック画面が表示されます'
                );
              }}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: `1px solid ${borderColor}`,
                backgroundColor: subtleBg,
                color: textColor,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Lock size={12} />
              <span>未ログイン（ロック状態）にしてテストする</span>
            </button>
          </div>
        </section>

        {/* セクション 2: Google OAuth クライアントIDの設定・origin_mismatch 確認ガイド */}
        <section
          style={{
            padding: 22,
            borderRadius: 22,
            backgroundColor: cardBg,
            border: `1.2px solid ${borderColor}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={18} />
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900 }}>
              2. Google OAuth クライアントID設定 ＆ origin_mismatch 対策ガイド
            </h2>
          </div>
          <p
            style={{
              margin: '4px 0 16px',
              fontSize: 12.5,
              color: subTextColor,
            }}
          >
            Google Cloud コンソールで発行した「ウェブアプリケーション」用の OAuth 2.0 クライアントIDを設定します。
          </p>

          <form
            onSubmit={handleSaveClientId}
            style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}
          >
            <input
              type="text"
              value={clientIdInput}
              onChange={(e) => setClientIdInput(e.target.value)}
              placeholder="xxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com"
              style={{
                flex: '1 1 280px',
                padding: '11px 14px',
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
                padding: '11px 20px',
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
              クライアントIDを保存
            </button>
          </form>

          {/* origin_mismatch 対策コピーボックス */}
          <div
            style={{
              padding: 16,
              borderRadius: 14,
              backgroundColor: subtleBg,
              border: `1px solid ${borderColor}`,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: textColor,
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <AlertTriangle size={15} color="#FF9500" />
              <span>「エラー 400: origin_mismatch」を防ぐための必須設定</span>
            </div>
            <div
              style={{
                fontSize: 12,
                color: subTextColor,
                lineHeight: 1.6,
                marginBottom: 12,
              }}
            >
              Google Cloud コンソールの <strong>[認証情報] ＞ [OAuth 2.0 クライアント ID]</strong> にある <strong>「承認済みの JavaScript 生成元（Authorized JavaScript origins）」</strong> には、以下の2つのURLを<strong>両方とも</strong>登録してください（ローカル開発時はポート番号あり・なしの両方が必須です）：
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[currentOrigin, 'http://localhost'].map((url) => (
                <div
                  key={url}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 10,
                    backgroundColor: cardBg,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <code
                    style={{
                      fontSize: 12.5,
                      fontWeight: 800,
                      color: themeColor,
                      userSelect: 'all',
                    }}
                  >
                    {url}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopyText(url, url)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 8,
                      border: `1px solid ${borderColor}`,
                      backgroundColor: subtleBg,
                      color: textColor,
                      fontSize: 11.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    コピー
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* セクション 3: 利用規約・プライバシーポリシーの改定管理 */}
        <section
          style={{
            padding: 22,
            borderRadius: 22,
            backgroundColor: cardBg,
            border: `1.2px solid ${borderColor}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} />
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900 }}>
              3. 利用規約・プライバシーポリシーの改定（再同意リセット）管理
            </h2>
          </div>
          <p
            style={{
              margin: '4px 0 16px',
              fontSize: 12.5,
              color: subTextColor,
            }}
          >
            利用規約のバージョンを更新すると、すべてのユーザーの次回サイト起動時に<strong>「利用規約・プライバシーポリシー改定のお知らせ」</strong>モーダルが自動表示され、再同意を求めることができます。
          </p>

          <form
            onSubmit={handlePublishPolicyUpdate}
            style={{
              padding: 16,
              borderRadius: 16,
              backgroundColor: subtleBg,
              border: `1px solid ${borderColor}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                marginBottom: 12,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 800 }}>
                新しい規約バージョンを発行する
              </span>
              <button
                type="button"
                onClick={handleFillTodayPolicyVersion}
                style={{
                  padding: '5px 10px',
                  borderRadius: 8,
                  border: `1px solid ${borderColor}`,
                  backgroundColor: cardBg,
                  color: themeColor,
                  fontSize: 11.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Calendar size={12} />
                <span>今日の日付で新バージョン番号を自動入力</span>
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: subTextColor,
                    marginBottom: 4,
                  }}
                >
                  バージョン番号 (例: 2026-10-18-r2)
                </label>
                <input
                  type="text"
                  value={newPolicyVersion}
                  onChange={(e) => setNewPolicyVersion(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: `1px solid ${borderColor}`,
                    backgroundColor: cardBg,
                    color: textColor,
                    fontSize: 13,
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: subTextColor,
                    marginBottom: 4,
                  }}
                >
                  改定日ラベル (例: 2026年10月18日)
                </label>
                <input
                  type="text"
                  value={newPolicyDateLabel}
                  onChange={(e) => setNewPolicyDateLabel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: `1px solid ${borderColor}`,
                    backgroundColor: cardBg,
                    color: textColor,
                    fontSize: 13,
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="submit"
                style={{
                  padding: '10px 18px',
                  borderRadius: 11,
                  border: 'none',
                  backgroundColor: themeColor,
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <RefreshCw size={14} />
                <span>このバージョンで規約改定を発行（全ユーザーへ再同意を要求）</span>
              </button>

              {policyInfo.version !== CURRENT_POLICY_VERSION && (
                <button
                  type="button"
                  onClick={async () => {
                    localStorage.removeItem('oshiss_active_policy_version');
                    localStorage.removeItem('oshiss_active_policy_date_label');
                    await settingsRepository.saveSettings({
                      activePolicyVersion: CURRENT_POLICY_VERSION,
                      activePolicyDateLabel: CURRENT_POLICY_DATE_LABEL,
                    });
                    setNewPolicyVersion(CURRENT_POLICY_VERSION);
                    setNewPolicyDateLabel(CURRENT_POLICY_DATE_LABEL);
                    await refreshAllData();
                    showToast('初期バージョンに戻しました');
                  }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 11,
                    border: `1px solid ${borderColor}`,
                    backgroundColor: cardBg,
                    color: subTextColor,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  デフォルト({CURRENT_POLICY_VERSION})に戻す
                </button>
              )}
            </div>
          </form>

          {/* テスト＆プレビューボタン群 */}
          <div
            style={{
              marginTop: 14,
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={handleSimulatePolicyUpdateOnStartup}
              style={{
                padding: '9px 14px',
                borderRadius: 10,
                border: `1px solid ${borderColor}`,
                backgroundColor: subtleBg,
                color: textColor,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <FlaskConical size={13} />
              <span>起動時の「規約改定お知らせ」状態にセット</span>
            </button>
            <button
              type="button"
              onClick={handleResetPolicyConsent}
              style={{
                padding: '9px 14px',
                borderRadius: 10,
                border: `1px solid ${borderColor}`,
                backgroundColor: subtleBg,
                color: textColor,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <FlaskConical size={13} />
              <span>起動時の「初回未同意」状態にリセット</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewModalMode('consent_update')}
              style={{
                padding: '9px 14px',
                borderRadius: 10,
                border: `1px solid ${borderColor}`,
                backgroundColor: subtleBg,
                color: themeColor,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Eye size={13} />
              <span>改定モーダルを今すぐプレビュー</span>
            </button>
          </div>
        </section>
      </main>

      {/* プレビュー用モーダル */}
      <TermsPrivacyModal
        isOpen={previewModalMode !== 'none'}
        mode={previewModalMode === 'view' ? 'view' : 'consent'}
        isPolicyUpdate={previewModalMode === 'consent_update'}
        onAccept={() => setPreviewModalMode('none')}
        onClose={() => setPreviewModalMode('none')}
      />
    </div>
  );
};
