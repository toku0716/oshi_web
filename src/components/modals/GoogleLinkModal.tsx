import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { googleAuthRepository } from '../../repository';
import type { GoogleUser } from '../../types';
import {
  Cloud,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface GoogleLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleLinkModal: React.FC<GoogleLinkModalProps> = ({ isOpen, onClose }) => {
  const { linkGoogleAccount, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'quick' | 'oauth'>('quick');
  const [clientId, setClientId] = useState<string>('');
  const [isSavingClientId, setIsSavingClientId] = useState(false);
  const [showClientIdConfig, setShowClientIdConfig] = useState(false);
  const [isGISLoaded, setIsGISLoaded] = useState(false);

  // Custom quick input
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');

  const googleButtonRef = useRef<HTMLDivElement>(null);
  const presets = googleAuthRepository.getPresetDemoAccounts();

  // Load configured Client ID
  useEffect(() => {
    if (isOpen) {
      const storedId = googleAuthRepository.getClientId();
      setClientId(storedId);
      if (storedId) {
        setShowClientIdConfig(true);
      }
    }
  }, [isOpen]);

  // Handle Google GIS Credential Response
  const handleCredentialResponse = useCallback((response: { credential: string }) => {
    try {
      const profile = googleAuthRepository.parseJwt(response.credential);
      if (!profile || !profile.email) {
        showToast('Google認証情報の取得に失敗しました', 'error');
        return;
      }

      const googleUser: GoogleUser = {
        id: profile.sub || `google-${Date.now()}`,
        name: profile.name,
        email: profile.email,
        picture: profile.picture,
        linkedAt: new Date().toISOString(),
        autoSync: true,
      };

      linkGoogleAccount(googleUser);
      onClose();
    } catch (err) {
      console.error('Google link error:', err);
      showToast('Googleアカウントの連携に失敗しました', 'error');
    }
  }, [linkGoogleAccount, onClose, showToast]);

  // Initialize GIS if clientId exists
  useEffect(() => {
    if (!isOpen) return;

    const checkGIS = () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        setIsGISLoaded(true);

        const currentClientId = googleAuthRepository.getClientId();
        if (currentClientId && googleButtonRef.current) {
          try {
            window.google.accounts.id.initialize({
              client_id: currentClientId,
              callback: handleCredentialResponse,
              auto_select: false,
              cancel_on_tap_outside: true,
            });

            googleButtonRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleButtonRef.current, {
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
              shape: 'rectangular',
              width: 280,
              locale: 'ja',
            });
          } catch (e) {
            console.error('Failed to render Google button:', e);
          }
        }
      } else {
        setTimeout(checkGIS, 300);
      }
    };

    checkGIS();
  }, [isOpen, clientId, activeTab, handleCredentialResponse]);

  const handleSaveClientId = () => {
    setIsSavingClientId(true);
    googleAuthRepository.saveClientId(clientId);
    setIsSavingClientId(false);
    showToast('Google Client IDを保存しました', 'success');

    // Re-render button if possible
    if (clientId && window.google?.accounts?.id && googleButtonRef.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });
        googleButtonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: 280,
          locale: 'ja',
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Quick link with preset
  const handleQuickLinkPreset = (preset: (typeof presets)[0]) => {
    const user: GoogleUser = {
      id: `google-${preset.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
      name: preset.name,
      email: preset.email,
      picture: preset.picture,
      linkedAt: new Date().toISOString(),
      autoSync: true,
    };
    linkGoogleAccount(user);
    onClose();
  };

  // Quick link with custom inputs
  const handleCustomQuickLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) {
      showToast('Googleメールアドレスを入力してください', 'error');
      return;
    }

    const email = customEmail.trim();
    const name = customName.trim() || email.split('@')[0] || 'Googleユーザー';

    const user: GoogleUser = {
      id: `google-${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
      name,
      email,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4285F4&color=fff&size=150`,
      linkedAt: new Date().toISOString(),
      autoSync: true,
    };

    linkGoogleAccount(user);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Googleアカウントと紐付け" maxWidth="lg">
      <div className="space-y-5 text-gray-800 dark:text-gray-100">
        {/* Banner with Google Logo */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-pink-50/60 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-pink-950/20 border border-blue-100 dark:border-[#2f354f] flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1f2234] shadow-sm border border-gray-200 dark:border-[#383d56] flex items-center justify-center shrink-0">
            {/* Google Multi-color G Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.41 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.59 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
              <span>Googleアカウント連携</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                PWA対応
              </span>
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
              Googleアカウントと紐付けることで、推し活データを安全にクラウド保管し、スマホやPCの複数端末で簡単に引き継ぎ・同期できます。
            </p>
          </div>
        </div>

        {/* Benefits list */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#1a1c2a] border border-gray-200/80 dark:border-[#2a2e42] flex items-start gap-2">
            <Cloud className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-800 dark:text-gray-200 text-[11px]">クラウドバックアップ</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">機種変更や端末紛失時も1クリックで完全復元</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#1a1c2a] border border-gray-200/80 dark:border-[#2a2e42] flex items-start gap-2">
            <Smartphone className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-800 dark:text-gray-200 text-[11px]">マルチデバイス連動</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">PCの大画面でもスマホでも同じ推し活データを共有</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#1a1c2a] border border-gray-200/80 dark:border-[#2a2e42] flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-800 dark:text-gray-200 text-[11px]">安心のセキュリティ</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">パスワード不要・データはあなた専用に保護</p>
            </div>
          </div>
        </div>

        {/* Tabs for Link Method */}
        <div className="flex border-b border-gray-200 dark:border-[#2b2f44]">
          <button
            type="button"
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition flex items-center justify-center gap-1.5 ${
              activeTab === 'quick'
                ? 'border-pink-500 text-pink-600 dark:text-pink-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>簡単・ワンクリック連携</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('oauth')}
            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition flex items-center justify-center gap-1.5 ${
              activeTab === 'oauth'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Google公式OAuth認証</span>
          </button>
        </div>

        {/* TAB 1: Quick Link / Instant Link */}
        {activeTab === 'quick' && (
          <div className="space-y-4 pt-1">
            <div>
              <h5 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                連携するGoogleアカウントを選択
              </h5>
              <div className="space-y-2">
                {presets.map((preset) => (
                  <button
                    key={preset.email}
                    type="button"
                    onClick={() => handleQuickLinkPreset(preset)}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-[#2e3247] hover:border-pink-300 dark:hover:border-pink-700 hover:bg-pink-50/20 dark:hover:bg-pink-950/20 bg-white dark:bg-[#191b28] flex items-center justify-between text-left transition group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={preset.picture}
                        alt={preset.name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                      />
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition">
                          {preset.name}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">{preset.email}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{preset.description}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#252839] group-hover:bg-pink-500 group-hover:text-white text-xs font-bold text-gray-700 dark:text-gray-300 transition">
                      連携する
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Email Input */}
            <div className="p-3.5 rounded-xl border border-dashed border-gray-200 dark:border-[#33374e] bg-gray-50/50 dark:bg-[#1a1c2a]">
              <h5 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                またはご自身のGoogleアカウント情報で連携
              </h5>
              <form onSubmit={handleCustomQuickLink} className="space-y-2.5">
                <div>
                  <input
                    type="text"
                    placeholder="お名前（例: 推し活太郎）"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#353950] text-xs bg-white dark:bg-[#202334] focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    required
                    placeholder="Gmailアドレス（例: yourname@gmail.com）"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#353950] text-xs bg-white dark:bg-[#202334] focus:outline-none focus:border-pink-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 px-4 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>このGoogleアカウントで連携する</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: Official Google OAuth / GIS */}
        {activeTab === 'oauth' && (
          <div className="space-y-4 pt-1">
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#191b28] border border-gray-200 dark:border-[#2b2f44] text-xs space-y-3">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Google Cloud Consoleの OAuth 2.0 クライアントIDを使用して、実際のGoogleログインポップアップから直接認証・連携します。
              </p>

              {/* Rendered Google GIS Button */}
              <div className="flex flex-col items-center justify-center py-2 space-y-2">
                <div ref={googleButtonRef} className="flex justify-center min-h-[44px]">
                  {!clientId && (
                    <div className="text-center py-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-4 py-2 rounded-lg border border-amber-200 dark:border-amber-900/50">
                      公式Googleログインを使用するには、下記よりGoogle Client IDをご設定ください。
                    </div>
                  )}
                  {clientId && !isGISLoaded && (
                    <div className="text-xs text-gray-400 flex items-center gap-1.5">
                      <span>Google認証サービスを読込中...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Client ID Configuration Accordion */}
            <div className="border border-gray-200 dark:border-[#2b2f44] rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowClientIdConfig(!showClientIdConfig)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1d2030] text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between transition"
              >
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-500" />
                  <span>Google Client ID 設定（Google Cloud Console連携）</span>
                </span>
                {showClientIdConfig ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showClientIdConfig && (
                <div className="p-4 bg-white dark:bg-[#191b28] border-t border-gray-200 dark:border-[#2b2f44] space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                      OAuth 2.0 クライアント ID
                    </label>
                    <input
                      type="text"
                      placeholder="xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#353950] text-xs font-mono bg-white dark:bg-[#202334] focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      ※ Google Cloud Console の「認証情報」からウェブアプリケーションのクライアントIDを取得し貼り付けてください。
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveClientId}
                      disabled={isSavingClientId}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition"
                    >
                      設定を保存
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-2 text-center text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>連携したアカウント情報はブラウザローカル内のみで安全に管理されます</span>
        </div>
      </div>
    </Modal>
  );
};
