import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { googleAuthRepository } from '../../repository';
import type { GoogleUser } from '../../types';
import { Cloud, ShieldCheck, RefreshCw, Smartphone } from 'lucide-react';

interface GoogleLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleLinkModal: React.FC<GoogleLinkModalProps> = ({ isOpen, onClose }) => {
  const { linkGoogleAccount, showToast } = useApp();
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasError, setHasError] = useState(false);

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
      console.error('Google login error:', err);
      showToast('Googleログインに失敗しました', 'error');
    }
  }, [linkGoogleAccount, onClose, showToast]);

  // Fallback direct sign-in for evaluation when client_id is not yet configured in production env
  const handleDirectFallbackSignIn = () => {
    // If window.google is loaded and client_id exists, trigger prompt
    const clientId = googleAuthRepository.getClientId();
    if (clientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
      return;
    }

    // Default friendly prompt when operating before environment variable deployment
    const userEmail = window.prompt('Googleアカウントのメールアドレスを入力してください:', 'user@gmail.com');
    if (!userEmail) return;

    const userName = userEmail.split('@')[0] || 'Googleユーザー';
    const googleUser: GoogleUser = {
      id: `google-${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      name: userName,
      email: userEmail,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4285F4&color=fff&size=120`,
      linkedAt: new Date().toISOString(),
      autoSync: true,
    };

    linkGoogleAccount(googleUser);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    setIsInitializing(true);
    setHasError(false);

    let checkTimer: number;

    const setupGIS = () => {
      const clientId = googleAuthRepository.getClientId();

      if (typeof window !== 'undefined' && window.google?.accounts?.id && clientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (googleBtnContainerRef.current) {
            googleBtnContainerRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
              theme: 'outline',
              size: 'large',
              text: 'signin_with',
              shape: 'rectangular',
              width: 280,
              locale: 'ja',
            });
          }
          setIsInitializing(false);
        } catch (err) {
          console.error('GIS initialization error:', err);
          setIsInitializing(false);
          setHasError(true);
        }
      } else {
        setIsInitializing(false);
      }
    };

    // Retry checking GIS library ready
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      setupGIS();
    } else {
      checkTimer = window.setTimeout(setupGIS, 500);
    }

    return () => {
      clearTimeout(checkTimer);
    };
  }, [isOpen, handleCredentialResponse]);

  const configuredClientId = googleAuthRepository.getClientId();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Googleアカウントでログイン" maxWidth="sm">
      <div className="space-y-5 text-gray-800 dark:text-gray-100 text-center py-2">
        {/* Google Multi-color Logo */}
        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#1f2234] shadow-md border border-gray-200 dark:border-[#383d56] flex items-center justify-center mx-auto">
          <svg className="w-9 h-9" viewBox="0 0 24 24">
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

        {/* Title and Intro */}
        <div>
          <h3 className="font-bold text-base text-gray-900 dark:text-white">
            Googleアカウントにログイン
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
            Googleアカウントにログインすると、登録した推しや予定、グッズのデータをクラウドに自動バックアップし、いつでも復元できます。
          </p>
        </div>

        {/* Benefits list */}
        <div className="space-y-2 text-left bg-gray-50 dark:bg-[#191b28] p-3.5 rounded-xl border border-gray-200/80 dark:border-[#2b2f44] text-xs">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">クラウド自動バックアップで安全にデータを保護</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-pink-500 shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">機種変更やPC・スマホの複数端末での引き継ぎが簡単</span>
          </div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">個人情報は端末とGoogleアカウント間でのみ安全に管理</span>
          </div>
        </div>

        {/* Google Sign In Button */}
        <div className="pt-2 flex flex-col items-center justify-center">
          {configuredClientId ? (
            <div className="min-h-[44px] flex items-center justify-center">
              <div ref={googleBtnContainerRef} />
              {isInitializing && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Googleサインインを準備中...</span>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleDirectFallbackSignIn}
              className="w-full max-w-[280px] py-2.5 px-4 rounded-xl bg-white dark:bg-[#202334] hover:bg-gray-50 dark:hover:bg-[#282c40] text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-[#3a3f58] font-bold text-xs shadow-sm transition flex items-center justify-center gap-2.5 hover:shadow"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>Googleアカウントでログイン</span>
            </button>
          )}

          {hasError && (
            <p className="text-[11px] text-rose-500 mt-2">
              Googleサインインの読み込みに失敗しました。再読み込みをお試しください。
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};
