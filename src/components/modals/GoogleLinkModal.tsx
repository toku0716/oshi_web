import React from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { googleAuthRepository } from '../../repository';
import { Cloud, ShieldCheck, Smartphone, ExternalLink, AlertTriangle } from 'lucide-react';

interface GoogleLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleLinkModal: React.FC<GoogleLinkModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useApp();
  const configuredClientId = googleAuthRepository.getClientId();

  const handleGoogleSignInClick = () => {
    if (!configuredClientId) {
      showToast('Google Cloud Consoleの OAuth クライアントID が設定されていません', 'error');
      return;
    }

    try {
      // 本物のGoogle認証画面 (accounts.google.com) へ遷移
      googleAuthRepository.redirectToGoogleAuth();
    } catch (err) {
      console.error(err);
      showToast('Googleログイン画面への移動に失敗しました', 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Googleアカウント連携" maxWidth="sm">
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
            Googleの公式認証画面に移動し、安全にログインします。<br />
            ログインすると、推し活データをクラウドにバックアップ保存・復元できます。
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
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">Google公式認証（accounts.google.com）で安全にログイン</span>
          </div>
        </div>

        {/* Google Sign In Button */}
        <div className="pt-2 flex flex-col items-center justify-center space-y-3">
          {configuredClientId ? (
            <button
              type="button"
              onClick={handleGoogleSignInClick}
              className="w-full max-w-[280px] py-3 px-4 rounded-xl bg-white dark:bg-[#202334] hover:bg-gray-50 dark:hover:bg-[#282c40] text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-[#3a3f58] font-bold text-xs shadow-sm transition flex items-center justify-center gap-2.5 hover:shadow cursor-pointer"
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
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-left text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Google OAuth クライアントIDの設定が必要です</span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                本物のGoogleログイン画面（accounts.google.com）へ安全に遷移するために、Google Cloud Consoleで取得した「OAuth 2.0 クライアントID」をアプリに設定してください。
              </p>
              <div className="p-2.5 rounded-lg bg-white/80 dark:bg-[#1a1c28] border border-amber-200/60 dark:border-amber-900/40 text-[10px] text-gray-600 dark:text-gray-300 space-y-1">
                <p className="font-semibold">【設定方法】</p>
                <p>プロジェクトの環境変数 <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono">VITE_GOOGLE_CLIENT_ID</code> に発行したクライアントIDを設定します。</p>
              </div>
            </div>
          )}

          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            ボタンを押すと Google公式のログイン画面 (accounts.google.com) に移動します
          </p>
        </div>
      </div>
    </Modal>
  );
};
