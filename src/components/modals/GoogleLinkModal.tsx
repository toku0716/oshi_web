import React, { useRef, useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { googleAuthRepository } from '../../repository';
import { Cloud, ShieldCheck, Smartphone, ExternalLink, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { GoogleUser } from '../../types';

interface GoogleLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleLinkModal: React.FC<GoogleLinkModalProps> = ({ isOpen, onClose }) => {
  const { showToast, linkGoogleAccount } = useApp();
  const configuredClientId = googleAuthRepository.getClientId();
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);
  const [isGsiRendered, setIsGsiRendered] = useState(false);

  useEffect(() => {
    if (!isOpen || !configuredClientId) return;

    let cleanup: (() => void) | undefined;
    if (googleBtnContainerRef.current) {
      cleanup = googleAuthRepository.initAndRenderButton(
        googleBtnContainerRef.current,
        (user: GoogleUser) => {
          linkGoogleAccount(user);
          showToast(`Googleアカウント「${user.name}」で安全にログインしました`, 'success');
          onClose();
        },
        (err) => {
          console.error('Google Sign-In Error:', err);
        }
      );
      setIsGsiRendered(true);
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [isOpen, configuredClientId, linkGoogleAccount, onClose, showToast]);

  const handleManualPopupClick = () => {
    if (!configuredClientId) {
      showToast('Google OAuth クライアントIDが設定されていません', 'error');
      return;
    }
    googleAuthRepository.signInWithPopup(
      (user: GoogleUser) => {
        linkGoogleAccount(user);
        showToast(`Googleアカウント「${user.name}」でログインしました`, 'success');
        onClose();
      },
      (err) => {
        console.error(err);
        showToast('Googleログインを完了できませんでした', 'error');
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Googleアカウント連携" maxWidth="sm">
      <div className="space-y-4 text-gray-800 dark:text-gray-100 text-center py-1">
        {/* Title and Intro */}
        <div>
          <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span>Google公式サインインで連携</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
            Googleの公式セキュリティ認証（Google Identity Services）を使用し、安全にログインします。
          </p>
        </div>

        {/* Benefits list */}
        <div className="space-y-2 text-left bg-gray-50 dark:bg-[#191b28] p-3.5 rounded-xl border border-gray-200/80 dark:border-[#2b2f44] text-xs">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">クラウドにバックアップ保存＆いつでも復元</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-pink-500 shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">スマホ・PC間でのスムーズなデータ引き継ぎ</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">パスワード入力不要・Googleの公式安全基準に準拠</span>
          </div>
        </div>

        {/* Google Official Sign-In Button Container */}
        <div className="pt-2 flex flex-col items-center justify-center space-y-3">
          {configuredClientId ? (
            <div className="w-full flex flex-col items-center space-y-2">
              {/* Google's official iframe button container */}
              <div
                ref={googleBtnContainerRef}
                className="min-h-[44px] flex items-center justify-center"
              />

              {/* Popup Fallback Button if GIS takes a second */}
              <button
                type="button"
                onClick={handleManualPopupClick}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline transition cursor-pointer pt-1"
              >
                ポップアップウィンドウでログインする
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-left text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Google OAuth クライアントIDの設定が必要です</span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                Google Cloud Consoleで取得した「OAuth 2.0 クライアントID」を設定してください。
              </p>
            </div>
          )}

          {/* Security Guarantee Note */}
          <div className="w-full p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30 text-left text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1">
            <p className="font-bold flex items-center gap-1 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>安全性の保証</span>
            </p>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
              Googleの公式SDKを使用しており、当サイトがパスワードや機密情報を取得することは一切ありません。
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
