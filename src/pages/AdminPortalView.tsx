import React, { useState, useEffect } from 'react';
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
  ShieldCheck,
  LogOut,
  UserCheck,
  Users,
  Edit3,
  Save,
  RotateCcw,
  CheckCircle2,
  MessageSquare,
  Link2,
} from 'lucide-react';
import { ToastContainer } from '../components/common/ToastContainer';
import { TermsPrivacyModal } from '../components/modals/TermsPrivacyModal';
import { AdminGoogleAccessGate } from '../components/auth/AdminGoogleAccessGate';
import { PolicyContentRenderer } from '../components/common/PolicyContentRenderer';
import {
  DEFAULT_TERMS_CONTENT,
  DEFAULT_PRIVACY_CONTENT,
} from '../data/defaultPolicyText';
import { useApp } from '../context/AppContext';
import { settingsRepository } from '../repository';
import { setCurrentUserEmail } from '../db/database';
import type { GoogleAuthSession } from '../types';
import {
  CURRENT_POLICY_DATE_LABEL,
  CURRENT_POLICY_VERSION,
  getEffectivePolicyInfo,
  DEFAULT_GOOGLE_FORM_URL,
} from '../types';
import {
  cacheAccessConfig,
  cacheAdminAccessConfig,
  clearAdminGoogleSession,
  clearGoogleSession,
  getEffectiveAccessConfig,
  getEffectiveAdminAccessConfig,
  getSavedAdminGoogleSession,
  getSavedGoogleSession,
  isGoogleEmailAllowed,
  normalizeEmail,
  saveAdminGoogleSession,
  saveGoogleSession,
} from '../utils/googleAuthUtils';

export const AdminPortalView: React.FC = () => {
  const { settings, themeColor, isDark, refreshAllData, showToast } = useApp();

  const config = getEffectiveAccessConfig(settings);
  const adminConfig = getEffectiveAdminAccessConfig(settings);
  const policyInfo = getEffectivePolicyInfo(settings);
  const currentSession = getSavedGoogleSession();
  const [adminSession, setAdminSession] = useState<GoogleAuthSession | null>(() => {
    const savedAdmin = getSavedAdminGoogleSession();
    if (savedAdmin) return savedAdmin;
    const savedUser = getSavedGoogleSession();
    if (savedUser?.email) {
      const cfg = getEffectiveAdminAccessConfig(settings);
      if (cfg.allowedEmails.length === 0 || isGoogleEmailAllowed(savedUser.email, cfg.allowedEmails)) {
        return savedUser;
      }
    }
    return null;
  });

  // 既に一般ユーザーとしてGoogleログイン中で、管理者権限もある場合は管理者セッションも自動引き継ぎ
  useEffect(() => {
    if (!adminSession && currentSession?.email) {
      if (
        adminConfig.allowedEmails.length === 0 ||
        isGoogleEmailAllowed(currentSession.email, adminConfig.allowedEmails)
      ) {
        saveAdminGoogleSession(currentSession);
        setAdminSession(currentSession);
      }
    }
  }, [adminSession, currentSession, adminConfig.allowedEmails]);

  // 1. 管理者Googleアカウント追加ステート
  const [newAdminEmailInput, setNewAdminEmailInput] = useState<string>('');

  // 2. 許可Googleアカウント（推しサポ一般ユーザー）追加ステート
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

  // 4. 利用規約・プライバシーポリシー本文編集ステート
  const [policyEditorTab, setPolicyEditorTab] = useState<'terms' | 'privacy'>('terms');
  const [editorPreviewMode, setEditorPreviewMode] = useState<'edit' | 'preview'>('edit');
  const [editingTermsContent, setEditingTermsContent] = useState<string>(
    policyInfo.termsContent
  );
  const [editingPrivacyContent, setEditingPrivacyContent] = useState<string>(
    policyInfo.privacyContent
  );

  // 5. 改善アンケート GoogleフォームURLステート
  const [googleFormUrlInput, setGoogleFormUrlInput] = useState<string>(
    settings?.googleFormUrl ??
      (typeof window !== 'undefined'
        ? localStorage.getItem('oshiss_google_form_url') ?? DEFAULT_GOOGLE_FORM_URL
        : DEFAULT_GOOGLE_FORM_URL)
  );

  useEffect(() => {
    if (settings?.googleFormUrl && !googleFormUrlInput) {
      setGoogleFormUrlInput(settings.googleFormUrl);
    }
  }, [settings?.googleFormUrl]);

  useEffect(() => {
    if (policyInfo.termsContent && !editingTermsContent) {
      setEditingTermsContent(policyInfo.termsContent);
    }
    if (policyInfo.privacyContent && !editingPrivacyContent) {
      setEditingPrivacyContent(policyInfo.privacyContent);
    }
  }, [policyInfo.termsContent, policyInfo.privacyContent]);

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

  // 管理者アクセス制限 ON/OFF 切り替え
  const handleToggleAdminAccessControl = async () => {
    const nextEnabled = !adminConfig.enabled;

    if (nextEnabled && adminConfig.allowedEmails.length === 0) {
      const candidate = normalizeEmail(newAdminEmailInput);
      const isValidCandidate =
        candidate.includes('@') || candidate.includes('.');
      if (candidate && isValidCandidate) {
        const updatedEmails = [candidate];
        await settingsRepository.saveSettings({
          adminAccessControlEnabled: true,
          allowedAdminGoogleEmails: updatedEmails,
        });
        cacheAdminAccessConfig({
          adminAccessControlEnabled: true,
          allowedAdminGoogleEmails: updatedEmails,
        });
        await syncPolicyToServer({
          adminAccessControlEnabled: true,
          allowedAdminGoogleEmails: updatedEmails,
        });
        if (
          !candidate.startsWith('@') &&
          !candidate.startsWith('.') &&
          !candidate.startsWith('*.')
        ) {
          const newSession = {
            email: candidate,
            name: candidate.split('@')[0],
            authenticatedAt: new Date().toISOString(),
          };
          saveAdminGoogleSession(newSession);
          setAdminSession(newSession);
        }
        setNewAdminEmailInput('');
        await refreshAllData();
        showToast(
          `${candidate} を管理者リストに登録し、管理者認証をONにしました`
        );
        return;
      }

      showToast(
        '締め出し防止のため、先に許可する管理者Googleアカウントを1件以上追加してください',
        'error'
      );
      return;
    }

    await settingsRepository.saveSettings({
      adminAccessControlEnabled: nextEnabled,
    });
    cacheAdminAccessConfig({
      adminAccessControlEnabled: nextEnabled,
    });
    await syncPolicyToServer({
      adminAccessControlEnabled: nextEnabled,
    });
    await refreshAllData();
    showToast(
      nextEnabled
        ? '管理者Google認証を【保護中 (ON)】にしました'
        : '管理者Google認証を【制限なし (OFF)】にしました'
    );
  };

  // 管理者Googleアカウントの追加
  const handleAddAdminEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const rule = normalizeEmail(newAdminEmailInput);
    if (!rule) return;

    const isValid =
      rule.includes('@') || rule.includes('.');
    if (!isValid) {
      showToast(
        '有効なGoogleメールアドレス（例: admin@example.com / @xxx.ac.jp）を入力してください',
        'error'
      );
      return;
    }

    if (adminConfig.allowedEmails.includes(rule)) {
      showToast('すでに管理者リストに登録されています', 'error');
      return;
    }

    const updatedCustom = Array.from(new Set([...adminConfig.customEmails, rule]));
    await settingsRepository.saveSettings({
      allowedAdminGoogleEmails: updatedCustom,
    });
    cacheAdminAccessConfig({
      allowedAdminGoogleEmails: updatedCustom,
    });
    await syncPolicyToServer({
      allowedAdminGoogleEmails: updatedCustom,
    });

    if (
      !adminSession &&
      !rule.startsWith('@') &&
      !rule.startsWith('.') &&
      !rule.startsWith('*.')
    ) {
      const newSession = {
        email: rule,
        name: rule.split('@')[0],
        authenticatedAt: new Date().toISOString(),
      };
      saveAdminGoogleSession(newSession);
      setAdminSession(newSession);
    }

    setNewAdminEmailInput('');
    await refreshAllData();
    showToast(`${rule} を管理者許可リストに追加しました`);
  };

  // 管理者Googleアカウントの削除
  const handleRemoveAdminEmail = async (emailToRemove: string) => {
    const normalized = normalizeEmail(emailToRemove);
    const remainingTotal = adminConfig.allowedEmails.filter((e) => e !== normalized);

    if (adminConfig.enabled && remainingTotal.length === 0) {
      showToast(
        '管理者アクセス制限がONの間は、管理者リストを0件にすることはできません',
        'error'
      );
      return;
    }

    const updatedCustom = adminConfig.customEmails.filter((e) => e !== normalized);
    await settingsRepository.saveSettings({
      allowedAdminGoogleEmails: updatedCustom,
    });
    cacheAdminAccessConfig({
      allowedAdminGoogleEmails: updatedCustom,
    });
    await syncPolicyToServer({
      allowedAdminGoogleEmails: updatedCustom,
    });
    await refreshAllData();
    showToast(`${normalized} を管理者リストから削除しました`);
  };

  // アクセス制限 ON/OFF 切り替え
  const handleToggleAccessControl = async () => {
    const nextEnabled = !config.enabled;

    if (nextEnabled && config.allowedEmails.length === 0) {
      const candidate = normalizeEmail(newEmailInput);
      const isValidCandidate =
        candidate.includes('@') || candidate.includes('.');
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
        await syncPolicyToServer({
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
    await syncPolicyToServer({
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
      rule.includes('@') || rule.includes('.');
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
    await syncPolicyToServer({
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
    await syncPolicyToServer({
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

  // アンケート GoogleフォームURLの保存
  const handleSaveGoogleFormUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = googleFormUrlInput.trim();
    if (trimmed && !/^https?:\/\//i.test(trimmed)) {
      showToast('正しいURL（https://...）を入力してください', 'error');
      return;
    }
    await settingsRepository.saveSettings({
      googleFormUrl: trimmed,
    });
    localStorage.setItem('oshiss_google_form_url', trimmed);
    await syncPolicyToServer({
      googleFormUrl: trimmed,
    });
    await refreshAllData();
    showToast(
      trimmed
        ? '改善アンケート用GoogleフォームURLを保存しました✨'
        : 'GoogleフォームURLをクリアしました'
    );
  };

  // サーバー（ファイル）への規約・アクセス制限同期（スマホ等の別端末共有用）
  const syncPolicyToServer = async (payload?: {
    version?: string;
    dateLabel?: string;
    termsContent?: string;
    privacyContent?: string;
    accessControlEnabled?: boolean;
    adminAccessControlEnabled?: boolean;
    allowedGoogleEmails?: string[];
    allowedAdminGoogleEmails?: string[];
    googleFormUrl?: string;
  }) => {
    try {
      await fetch('/api/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: policyInfo.version,
          dateLabel: policyInfo.dateLabel,
          termsContent: policyInfo.termsContent,
          privacyContent: policyInfo.privacyContent,
          accessControlEnabled: config.enabled,
          allowedGoogleEmails: config.allowedEmails,
          allowedAdminGoogleEmails: adminConfig.allowedEmails,
          ...payload,
          updatedAt: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.warn('Could not sync to server disk:', err);
    }
  };

  // 利用規約・プライバシーポリシーの文面のみ下書き・即時保存（再同意要求なし）
  const handleSavePolicyContentOnly = async () => {
    const terms = editingTermsContent.trim();
    const privacy = editingPrivacyContent.trim();

    if (!terms) {
      showToast('利用規約の本文を入力してください', 'error');
      return;
    }
    if (!privacy) {
      showToast('プライバシーポリシーの本文を入力してください', 'error');
      return;
    }

    localStorage.setItem('oshiss_custom_terms_content', terms);
    localStorage.setItem('oshiss_custom_privacy_content', privacy);

    await settingsRepository.saveSettings({
      customTermsContent: terms,
      customPrivacyContent: privacy,
    });

    await syncPolicyToServer({
      version: policyInfo.version,
      dateLabel: policyInfo.dateLabel,
      termsContent: terms,
      privacyContent: privacy,
    });

    await refreshAllData();
    showToast('規約・プライバシーポリシーの本文を更新保存しました！（スマホ等の別端末にも即時同期されます）', 'success');
  };

  // 利用規約・プライバシーポリシーの新バージョン発行（全ユーザーへ再同意を要求）
  const handlePublishPolicyUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const ver = newPolicyVersion.trim();
    const label = newPolicyDateLabel.trim();
    const terms = editingTermsContent.trim();
    const privacy = editingPrivacyContent.trim();

    if (!ver || !label) {
      showToast('バージョン番号と改定日ラベルを入力してください', 'error');
      return;
    }
    if (!terms || !privacy) {
      showToast('規約・ポリシーの本文を入力してください', 'error');
      return;
    }

    localStorage.setItem('oshiss_active_policy_version', ver);
    localStorage.setItem('oshiss_active_policy_date_label', label);
    localStorage.setItem('oshiss_custom_terms_content', terms);
    localStorage.setItem('oshiss_custom_privacy_content', privacy);

    await settingsRepository.saveSettings({
      activePolicyVersion: ver,
      activePolicyDateLabel: label,
      customTermsContent: terms,
      customPrivacyContent: privacy,
    });

    await syncPolicyToServer({
      version: ver,
      dateLabel: label,
      termsContent: terms,
      privacyContent: privacy,
    });

    await refreshAllData();
    showToast(
      `利用規約・ポリシー Ver.${ver} を発行しました！全ユーザー・スマホ端末の次回起動時に改定確認モーダルが表示されます`,
      'success'
    );
  };

  // 規約本文をデフォルトにリセット
  const handleResetTermsToDefault = () => {
    setEditingTermsContent(DEFAULT_TERMS_CONTENT);
    showToast('利用規約をデフォルトの文章に戻しました（保存ボタンを押すと確定します）', 'info');
  };

  // プライバシーポリシー本文をデフォルトにリセット
  const handleResetPrivacyToDefault = () => {
    setEditingPrivacyContent(DEFAULT_PRIVACY_CONTENT);
    showToast('プライバシーポリシーをデフォルトの文章に戻しました（保存ボタンを押すと確定します）', 'info');
  };

  // 全て初期デフォルトに戻す
  const handleResetAllPolicyToDefault = async () => {
    if (!window.confirm('利用規約・プライバシーポリシーの本文とバージョン設定をすべて初期状態に戻しますか？')) {
      return;
    }
    localStorage.removeItem('oshiss_active_policy_version');
    localStorage.removeItem('oshiss_active_policy_date_label');
    localStorage.removeItem('oshiss_custom_terms_content');
    localStorage.removeItem('oshiss_custom_privacy_content');
    await settingsRepository.saveSettings({
      activePolicyVersion: CURRENT_POLICY_VERSION,
      activePolicyDateLabel: CURRENT_POLICY_DATE_LABEL,
      customTermsContent: '',
      customPrivacyContent: '',
    });
    await syncPolicyToServer({
      version: CURRENT_POLICY_VERSION,
      dateLabel: CURRENT_POLICY_DATE_LABEL,
      termsContent: DEFAULT_TERMS_CONTENT,
      privacyContent: DEFAULT_PRIVACY_CONTENT,
    });
    setNewPolicyVersion(CURRENT_POLICY_VERSION);
    setNewPolicyDateLabel(CURRENT_POLICY_DATE_LABEL);
    setEditingTermsContent(DEFAULT_TERMS_CONTENT);
    setEditingPrivacyContent(DEFAULT_PRIVACY_CONTENT);
    await refreshAllData();
    showToast('規約・ポリシー設定を初期デフォルトに戻しました', 'success');
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

  const isAuthorizedAdmin =
    Boolean(adminSession?.email) &&
    (adminConfig.allowedEmails.length === 0 ||
      isGoogleEmailAllowed(adminSession!.email, adminConfig.allowedEmails));

  if (adminConfig.enabled && !isAuthorizedAdmin) {
    return (
      <AdminGoogleAccessGate
        themeColor={themeColor}
        isDark={isDark}
        googleClientId={adminConfig.googleClientId}
        allowedEmails={adminConfig.allowedEmails}
        onAuthenticated={async (session, autoRegisterFirstOwnerEmail) => {
          setAdminSession(session);
          if (autoRegisterFirstOwnerEmail) {
            const updated = [normalizeEmail(autoRegisterFirstOwnerEmail)];
            await settingsRepository.saveSettings({
              allowedAdminGoogleEmails: updated,
            });
            cacheAdminAccessConfig({
              allowedAdminGoogleEmails: updated,
            });
            await refreshAllData();
          }
        }}
      />
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: bgColor,
        color: textColor,
        paddingBottom: 'calc(80px + var(--keyboard-inset-height, 0px) + var(--safe-bottom))',
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
                background: `linear-gradient(135deg, #007AFF, #5856D6)`,
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
                    backgroundColor: '#007AFF18',
                    color: '#007AFF',
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {adminSession && (
              <button
                type="button"
                onClick={() => {
                  clearAdminGoogleSession();
                  setAdminSession(null);
                  showToast('管理者ログアウトしました');
                }}
                style={{
                  padding: '7px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(255, 59, 48, 0.4)',
                  backgroundColor: 'rgba(255, 59, 48, 0.1)',
                  color: '#FF3B30',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
                title="管理者セッションを終了"
              >
                <LogOut size={13} />
                <span>ログアウト</span>
              </button>
            )}

            <a
              href="./"
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                backgroundColor: subtleBg,
                color: textColor,
                border: `1px solid ${borderColor}`,
                fontSize: 12,
                fontWeight: 800,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span>ユーザーサイトへ</span>
              <ExternalLink size={12} strokeWidth={2.4} />
            </a>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main
        style={{
          maxWidth: 880,
          margin: '24px auto 0',
          padding: '0 16px calc(60px + var(--keyboard-inset-height, 0px))',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        {/* スマホ対応：管理者ログインアカウント情報 ＆ ログアウトバー */}
        {adminSession && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 16,
              backgroundColor: cardBg,
              border: `1px solid ${borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <ShieldCheck size={18} color="#007AFF" style={{ flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, color: subTextColor, fontWeight: 700 }}>
                  ログイン中の管理者アカウント:
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: textColor,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {adminSession.email}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                clearAdminGoogleSession();
                setAdminSession(null);
                showToast('管理者ログアウトしました');
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                border: '1.2px solid rgba(255, 59, 48, 0.4)',
                backgroundColor: 'rgba(255, 59, 48, 0.08)',
                color: '#FF3B30',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <LogOut size={14} />
              <span>管理者からログアウト</span>
            </button>
          </div>
        )}
        {/* ステータスサマリーカード */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 14,
          }}
        >
          {/* カード 1: 管理者Google認証 */}
          <div
            style={{
              padding: 18,
              borderRadius: 18,
              backgroundColor: cardBg,
              border: `1.2px solid ${borderColor}`,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: subTextColor }}>
              管理者Google認証
            </div>
            <div
              style={{
                marginTop: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {adminConfig.enabled ? (
                <ShieldCheck size={18} color="#007AFF" strokeWidth={2.4} />
              ) : (
                <Unlock size={18} color={subTextColor} strokeWidth={2.4} />
              )}
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: adminConfig.enabled ? '#007AFF' : subTextColor,
                }}
              >
                {adminConfig.enabled ? '管理者保護中' : '制限なし'}
              </span>
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 11.5,
                color: subTextColor,
              }}
            >
              管理者登録数: {adminConfig.allowedEmails.length} 名
            </div>
          </div>

          {/* カード 2: 推しサポ一般アクセス制限 */}
          <div
            style={{
              padding: 18,
              borderRadius: 18,
              backgroundColor: cardBg,
              border: `1.2px solid ${borderColor}`,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: subTextColor }}>
              推しサポ一般アクセス制限
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
                  fontSize: 18,
                  fontWeight: 900,
                  color: config.enabled ? '#34C759' : subTextColor,
                }}
              >
                {config.enabled ? '一般保護中' : '制限なし'}
              </span>
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 11.5,
                color: subTextColor,
              }}
            >
              一般許可数: {config.allowedEmails.length} 件
            </div>
          </div>

          {/* カード 3: ログインセッション状況 */}
          <div
            style={{
              padding: 18,
              borderRadius: 18,
              backgroundColor: cardBg,
              border: `1.2px solid ${borderColor}`,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: subTextColor }}>
              管理者セッション
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 14,
                fontWeight: 900,
                color: adminSession ? '#007AFF' : subTextColor,
                wordBreak: 'break-all',
              }}
            >
              {adminSession ? adminSession.email : '未ログイン'}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 11.5,
                color: subTextColor,
                wordBreak: 'break-all',
              }}
            >
              一般側: {currentSession ? currentSession.email : '未ログイン'}
            </div>
          </div>

          {/* カード 4: 利用規約バージョン */}
          <div
            style={{
              padding: 18,
              borderRadius: 18,
              backgroundColor: cardBg,
              border: `1.2px solid ${borderColor}`,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: subTextColor }}>
              利用規約バージョン
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
              OAuth ID: {config.googleClientId ? '設定済' : '未設定'}
            </div>
          </div>
        </div>

        {/* セクション 1: 管理者（Admin）Googleアカウントのアクセス許可管理 */}
        <section
          style={{
            padding: 22,
            borderRadius: 22,
            backgroundColor: cardBg,
            border: `1.5px solid ${isDark ? '#007AFF44' : '#007AFF33'}`,
            position: 'relative',
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
                <ShieldCheck size={20} color="#007AFF" />
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900 }}>
                  1. 管理者（Admin）Googleアカウントのアクセス許可管理
                </h2>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 999,
                    backgroundColor: '#007AFF18',
                    color: '#007AFF',
                  }}
                >
                  管理者専用
                </span>
              </div>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 12.5,
                  color: subTextColor,
                }}
              >
                <strong>「推しサポ」一般ユーザーのアクセス制限とは完全に別枠</strong>で、管理者コンソールへのログインが許可されるGoogleアカウントを管理します。
              </p>
            </div>

            {/* 管理者認証 ON/OFF トグル */}
            <button
              type="button"
              onClick={handleToggleAdminAccessControl}
              style={{
                padding: '10px 18px',
                borderRadius: 14,
                border: 'none',
                backgroundColor: adminConfig.enabled
                  ? '#007AFF'
                  : isDark
                    ? '#2A2D3A'
                    : '#E2E5EE',
                color: adminConfig.enabled ? '#FFFFFF' : textColor,
                fontSize: 13,
                fontWeight: 900,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {adminConfig.enabled ? <Lock size={15} /> : <Unlock size={15} />}
              <span>
                {adminConfig.enabled
                  ? '管理者認証: ON (保護中)'
                  : '管理者認証: OFF (制限なし)'}
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
            onSubmit={handleAddAdminEmail}
            style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}
          >
            <input
              type="text"
              value={newAdminEmailInput}
              onChange={(e) => setNewAdminEmailInput(e.target.value)}
              placeholder="例: admin@example.com / @xxx.ac.jp"
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
                backgroundColor: '#007AFF',
                color: '#FFFFFF',
                fontSize: 13.5,
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              管理者を追加
            </button>
          </form>

          {/* 登録済み管理者リスト */}
          {adminConfig.allowedEmails.length === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                borderRadius: 14,
                backgroundColor: subtleBg,
                textAlign: 'center',
                fontSize: 13,
                color: subTextColor,
              }}
            >
              管理者許可リストは現在空です。次回Googleログイン時に最初のログインユーザーが自動登録されるか、上の入力欄から管理者を登録してください。
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {adminConfig.allowedEmails.map((rule) => {
                const isFromEnv = adminConfig.envEmails.includes(rule);
                const isDomainRule =
                  rule.startsWith('@') ||
                  rule.startsWith('.') ||
                  rule.startsWith('*.');
                const isCurrentAdmin =
                  adminSession &&
                  normalizeEmail(adminSession.email) === rule;

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
                          backgroundColor: '#007AFF18',
                          color: '#007AFF',
                        }}
                      >
                        管理者権限
                      </span>
                      {isDomainRule && (
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 999,
                            backgroundColor: '#AF52DE22',
                            color: '#AF52DE',
                          }}
                        >
                          ドメイン一括許可
                        </span>
                      )}
                      {isCurrentAdmin && (
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
                          現在管理者としてログイン中
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
                      {!isDomainRule && !isCurrentAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            const newSession = {
                              email: rule,
                              name: rule.split('@')[0],
                              authenticatedAt: new Date().toISOString(),
                            };
                            saveAdminGoogleSession(newSession);
                            setAdminSession(newSession);
                            showToast(`${rule} として管理者ログイン状態にしました`);
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
                          この管理者で認証済にする
                        </button>
                      )}
                      {!isFromEnv && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAdminEmail(rule)}
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
        </section>

        {/* セクション 2: 推しサポ（一般ユーザー）Googleアクセス許可管理 */}
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
                <Users size={18} />
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900 }}>
                  2. 推しサポ（一般ユーザー）Googleアクセス許可管理
                </h2>
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
                  一般ユーザー用
                </span>
              </div>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 12.5,
                  color: subTextColor,
                }}
              >
                アカウント新規登録なしで、ここに登録されたGoogleメールアドレスまたは <code>.ac.jp</code> ドメインの人のみユーザーサイトへアクセスできます。
                <br />
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                  ※ ここに登録されたアカウントには<strong>管理者権限は付与されません。</strong>
                </span>
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
                          onClick={async () => {
                            saveGoogleSession({
                              email: rule,
                              name: rule.split('@')[0],
                              authenticatedAt: new Date().toISOString(),
                            });
                            await setCurrentUserEmail(rule);
                            await refreshAllData();
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
              onClick={async () => {
                clearGoogleSession();
                await setCurrentUserEmail(null);
                await refreshAllData();
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

        {/* セクション 3: Google OAuth クライアントIDの設定・origin_mismatch 確認ガイド */}
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
              3. Google OAuth クライアントID設定 ＆ origin_mismatch 対策ガイド
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

        {/* セクション 4: 利用規約・プライバシーポリシーの詳細編集＆改定管理 */}
        <section
          style={{
            padding: 22,
            borderRadius: 22,
            backgroundColor: cardBg,
            border: `1.2px solid ${borderColor}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={18} />
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900 }}>
                4. 利用規約・プライバシーポリシーの詳細編集＆改定管理
              </h2>
            </div>
            {/* 状態バッジ */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  backgroundColor: policyInfo.isTermsCustomized
                    ? 'rgba(0, 122, 255, 0.12)'
                    : isDark ? '#262936' : '#EEF0F5',
                  color: policyInfo.isTermsCustomized ? '#007AFF' : subTextColor,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                利用規約: {policyInfo.isTermsCustomized ? 'カスタム編集版' : 'デフォルト'}
              </span>
              <span
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  backgroundColor: policyInfo.isPrivacyCustomized
                    ? 'rgba(52, 199, 89, 0.12)'
                    : isDark ? '#262936' : '#EEF0F5',
                  color: policyInfo.isPrivacyCustomized ? '#34C759' : subTextColor,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                ポリシー: {policyInfo.isPrivacyCustomized ? 'カスタム編集版' : 'デフォルト'}
              </span>
            </div>
          </div>

          <p
            style={{
              margin: '0 0 16px',
              fontSize: 12.5,
              color: subTextColor,
              lineHeight: 1.6,
            }}
          >
            利用規約およびプライバシーポリシーの条文や説明文を直接編集できます。文面のみを更新保存することも、バージョンを新しく発行して全ユーザーの次回アクセス時に再同意モーダルを表示させることも可能です。
          </p>

          {/* 編集エディタエリア */}
          <div
            style={{
              borderRadius: 16,
              backgroundColor: subtleBg,
              border: `1px solid ${borderColor}`,
              padding: 16,
              marginBottom: 16,
            }}
          >
            {/* タブ切り替え & モード切り替えバー */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10,
                marginBottom: 14,
              }}
            >
              {/* 文書選択タブ */}
              <div
                style={{
                  display: 'inline-flex',
                  padding: 3,
                  backgroundColor: cardBg,
                  borderRadius: 10,
                  border: `1px solid ${borderColor}`,
                }}
              >
                <button
                  type="button"
                  onClick={() => setPolicyEditorTab('terms')}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: policyEditorTab === 'terms' ? themeColor : 'transparent',
                    color: policyEditorTab === 'terms' ? '#FFFFFF' : textColor,
                    fontWeight: policyEditorTab === 'terms' ? 800 : 600,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <FileText size={13} />
                  <span>利用規約の編集</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPolicyEditorTab('privacy')}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: policyEditorTab === 'privacy' ? themeColor : 'transparent',
                    color: policyEditorTab === 'privacy' ? '#FFFFFF' : textColor,
                    fontWeight: policyEditorTab === 'privacy' ? 800 : 600,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Lock size={13} />
                  <span>プライバシーポリシーの編集</span>
                </button>
              </div>

              {/* ツールボタン群 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    padding: 3,
                    backgroundColor: cardBg,
                    borderRadius: 9,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setEditorPreviewMode('edit')}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 7,
                      border: 'none',
                      backgroundColor: editorPreviewMode === 'edit' ? (isDark ? '#2A2E3D' : '#E8EBF2') : 'transparent',
                      color: textColor,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Edit3 size={12} />
                    <span>編集</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorPreviewMode('preview')}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 7,
                      border: 'none',
                      backgroundColor: editorPreviewMode === 'preview' ? (isDark ? '#2A2E3D' : '#E8EBF2') : 'transparent',
                      color: textColor,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Eye size={12} />
                    <span>プレビュー</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={
                    policyEditorTab === 'terms'
                      ? handleResetTermsToDefault
                      : handleResetPrivacyToDefault
                  }
                  title="初期のデフォルト文章を読み込みます"
                  style={{
                    padding: '6px 11px',
                    borderRadius: 8,
                    border: `1px solid ${borderColor}`,
                    backgroundColor: cardBg,
                    color: subTextColor,
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <RotateCcw size={12} />
                  <span>デフォルト文章に戻す</span>
                </button>
              </div>
            </div>

            {/* 書式ヒント案内 */}
            {editorPreviewMode === 'edit' && (
              <div
                style={{
                  fontSize: 11.5,
                  color: subTextColor,
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 10px',
                  borderRadius: 8,
                  backgroundColor: cardBg,
                  border: `1px solid ${borderColor}`,
                }}
              >
                <span style={{ fontWeight: 800, color: themeColor }}>💡 書式ガイド:</span>
                <span>
                  「<strong>### 第〇条（見出し）</strong>」または「<strong>第〇条</strong>」で見出し、「<strong>・</strong>」「<strong>-</strong>」で箇条書き、「<strong>**太字**</strong>」で強調表示されます。
                </span>
              </div>
            )}

            {/* エディタ本文 or プレビュー本文 */}
            {editorPreviewMode === 'edit' ? (
              <div>
                <textarea
                  value={
                    policyEditorTab === 'terms'
                      ? editingTermsContent
                      : editingPrivacyContent
                  }
                  onChange={(e) => {
                    if (policyEditorTab === 'terms') {
                      setEditingTermsContent(e.target.value);
                    } else {
                      setEditingPrivacyContent(e.target.value);
                    }
                  }}
                  rows={14}
                  placeholder={
                    policyEditorTab === 'terms'
                      ? '利用規約の本文を入力してください...'
                      : 'プライバシーポリシーの本文を入力してください...'
                  }
                  style={{
                    width: '100%',
                    minHeight: 280,
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: `1px solid ${borderColor}`,
                    backgroundColor: cardBg,
                    color: textColor,
                    fontSize: 13,
                    lineHeight: 1.65,
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                  spellCheck={false}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 6,
                    fontSize: 11.5,
                    color: subTextColor,
                  }}
                >
                  <span>
                    現在編集中: {policyEditorTab === 'terms' ? '利用規約' : 'プライバシーポリシー'}
                  </span>
                  <span>
                    {(policyEditorTab === 'terms' ? editingTermsContent : editingPrivacyContent).length} 文字 /{' '}
                    {(policyEditorTab === 'terms' ? editingTermsContent : editingPrivacyContent).split('\n').length} 行
                  </span>
                </div>
              </div>
            ) : (
              <div
                style={{
                  maxHeight: 380,
                  overflowY: 'auto',
                  padding: '16px 18px',
                  borderRadius: 12,
                  border: `1px solid ${borderColor}`,
                  backgroundColor: cardBg,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: themeColor,
                    marginBottom: 12,
                    paddingBottom: 6,
                    borderBottom: `1px solid ${borderColor}`,
                  }}
                >
                  👁️ {policyEditorTab === 'terms' ? '利用規約' : 'プライバシーポリシー'}（実際の表示プレビュー）
                </div>
                <PolicyContentRenderer
                  content={
                    policyEditorTab === 'terms'
                      ? editingTermsContent
                      : editingPrivacyContent
                  }
                  textColor={textColor}
                  subTextColor={subTextColor}
                />
              </div>
            )}

            {/* 即時下書き保存ボタンバー */}
            <div
              style={{
                marginTop: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div style={{ fontSize: 11.5, color: subTextColor }}>
                ※ 文面のみ保存した場合、既存ユーザーへの再同意モーダルはポップアップしません。誤字脱字修正や細部の文言調整に便利です。
              </div>
              <button
                type="button"
                onClick={handleSavePolicyContentOnly}
                style={{
                  padding: '9px 16px',
                  borderRadius: 10,
                  border: `1px solid ${themeColor}`,
                  backgroundColor: 'transparent',
                  color: themeColor,
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Save size={14} />
                <span>文面のみを更新保存（再同意要求なし）</span>
              </button>
            </div>
          </div>

          {/* 新規バージョン発行フォーム */}
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
              <div>
                <span style={{ fontSize: 13, fontWeight: 800, display: 'block' }}>
                  🚀 新しい規約バージョンを発行（全ユーザーへ再同意を要求）
                </span>
                <span style={{ fontSize: 11.5, color: subTextColor }}>
                  バージョン番号または日付を更新して発行すると、全ユーザーの次回アクセス時に再同意画面が表示されます。
                </span>
              </div>
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
                marginBottom: 14,
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

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
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
                <span>この内容・バージョンで改定を発行（全ユーザーへ再同意を要求）</span>
              </button>

              {(policyInfo.version !== CURRENT_POLICY_VERSION || policyInfo.isTermsCustomized || policyInfo.isPrivacyCustomized) && (
                <button
                  type="button"
                  onClick={handleResetAllPolicyToDefault}
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
                  初期デフォルト（Ver.{CURRENT_POLICY_VERSION}）に全リセット
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

        {/* セクション 5: 改善アンケート（Googleフォーム）設定 */}
        <section
          style={{
            padding: 22,
            borderRadius: 22,
            backgroundColor: cardBg,
            border: `1px solid ${borderColor}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={20} color={themeColor} />
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900 }}>
              5. 改善アンケート（Googleフォーム）設定
            </h2>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 999,
                backgroundColor: `${themeColor}18`,
                color: themeColor,
              }}
            >
              Google Forms
            </span>
          </div>
          <p
            style={{
              margin: '4px 0 16px',
              fontSize: 12.5,
              color: subTextColor,
            }}
          >
            マイページの「改善アンケート」ボタンからユーザーに回答してもらう GoogleフォームのURLを設定します。<br />
            短縮リンク（<code>https://forms.gle/...</code>）または閲覧URL（<code>https://docs.google.com/forms/d/e/.../viewform</code>）を入力してください。
          </p>

          <form
            onSubmit={handleSaveGoogleFormUrl}
            style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}
          >
            <input
              type="url"
              value={googleFormUrlInput}
              onChange={(e) => setGoogleFormUrlInput(e.target.value)}
              placeholder="https://docs.google.com/forms/d/e/.../viewform"
              style={{
                flex: '1 1 320px',
                padding: '11px 14px',
                borderRadius: 12,
                border: `1px solid ${borderColor}`,
                backgroundColor: subtleBg,
                color: textColor,
                fontSize: 13,
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
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: `0 3px 12px ${themeColor}44`,
              }}
            >
              <Save size={15} />
              <span>URLを保存</span>
            </button>
            {googleFormUrlInput && (
              <button
                type="button"
                onClick={() => window.open(googleFormUrlInput, '_blank', 'noopener,noreferrer')}
                style={{
                  padding: '11px 16px',
                  borderRadius: 12,
                  border: `1px solid ${borderColor}`,
                  backgroundColor: subtleBg,
                  color: textColor,
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <ExternalLink size={15} />
                <span>フォームを開いてテスト</span>
              </button>
            )}
          </form>

          <div
            style={{
              padding: '12px 14px',
              borderRadius: 14,
              backgroundColor: subtleBg,
              fontSize: 12,
              color: subTextColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div>
              現在の設定: <strong>{settings?.googleFormUrl || (typeof window !== 'undefined' ? localStorage.getItem('oshiss_google_form_url') : '') || '未設定（アプリ内未設定ガイドが表示されます）'}</strong>
            </div>
            <a
              href="https://forms.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                color: themeColor,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <span>Googleフォームを新規作成 ↗</span>
            </a>
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
