import React, { useState, useEffect } from 'react';
import type { MaintenanceInfo } from '../../types';
import {
  Wrench,
  Sparkles,
  RefreshCw,
  Clock,
  ShieldCheck,
  Heart,
  ExternalLink,
  Lock,
} from 'lucide-react';

interface MaintenanceViewProps {
  maintenance: MaintenanceInfo;
  onRecheck: () => Promise<MaintenanceInfo | null>;
  onBypass: () => void;
  isPreview?: boolean;
  onClosePreview?: () => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  maintenance,
  onRecheck,
  onBypass,
  isPreview = false,
  onClosePreview,
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);

  // Periodic background check so visitor or admin doesn't have to keep reloading manually
  useEffect(() => {
    if (isPreview) return;
    const interval = setInterval(async () => {
      try {
        const updated = await onRecheck();
        if (updated && !updated.enabled) {
          window.location.reload();
        }
      } catch {}
    }, 15000);
    return () => clearInterval(interval);
  }, [isPreview, onRecheck]);

  const handleCheck = async () => {
    setIsChecking(true);
    setCheckResult(null);
    try {
      const updated = await onRecheck();
      if (updated && !updated.enabled) {
        setCheckResult('メンテナンスが終了しました！通常画面に切り替えます...');
        setTimeout(() => {
          window.location.reload();
        }, 600);
      } else {
        setCheckResult('現在もメンテナンス作業中です。完了までもう少々お待ちください。');
      }
    } catch {
      setCheckResult('通信状態を確認できませんでした。時間をおいてお試しください。');
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogoClick = () => {
    const next = logoClickCount + 1;
    if (next >= 5) {
      setLogoClickCount(0);
      onBypass();
    } else {
      setLogoClickCount(next);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === 'admin' || passwordInput.trim() === 'oshi') {
      setIsPasswordModalOpen(false);
      onBypass();
    } else {
      setPasswordError(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-pink-50/20 to-slate-100 dark:from-[#0f1015] dark:via-[#161822] dark:to-[#12131a] text-gray-900 dark:text-gray-100 flex flex-col items-center justify-center p-4 font-sans select-none relative overflow-hidden transition-colors">
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 dark:bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Preview Mode Top Banner */}
      {isPreview && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2 max-w-2xl mx-auto w-full justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>【プレビュー表示】一般の訪問者にはこのように見えています</span>
            </span>
            {onClosePreview && (
              <button
                type="button"
                onClick={onClosePreview}
                className="px-2.5 py-1 rounded bg-black/20 hover:bg-black/30 transition text-xs font-semibold"
              >
                プレビューを閉じる
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Card */}
      <main className="max-w-lg w-full bg-white dark:bg-[#181a24] rounded-3xl border border-gray-200/80 dark:border-[#2a2d3d] shadow-xl p-6 sm:p-8 text-center relative z-10 space-y-6">
        {/* Animated App Icon */}
        <div className="flex justify-center">
          <div className="relative group cursor-pointer" onClick={handleLogoClick} title="推しサポ">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-pink-500/30 transform group-hover:scale-105 transition-transform duration-300">
              推
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md animate-bounce">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Badge & Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-300 border border-pink-200 dark:border-pink-900/60 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-pink-500" />
            <span>推しサポ Web版 メンテナンス</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {maintenance.title || 'ただいまメンテナンス中です'}
          </h1>
        </div>

        {/* Description Message */}
        <div className="bg-gray-50/80 dark:bg-[#1e202d] rounded-2xl p-4 sm:p-5 border border-gray-200/60 dark:border-[#2e3144] text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed text-left whitespace-pre-line">
          {maintenance.message ||
            'いつも推しサポをご利用いただき誠にありがとうございます。\n現在、機能改善とシステムメンテナンスを実施しております。\nご不便をおかけいたしますが、作業完了まで今しばらくお待ちください。'}
        </div>

        {/* Estimated End Time Card (If Specified) */}
        {maintenance.estimatedEnd && (
          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>終了予定: <strong className="font-bold">{maintenance.estimatedEnd}</strong></span>
          </div>
        )}

        {/* Check Status Button */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handleCheck}
            disabled={isChecking}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-pink-500/20 hover:shadow-lg hover:shadow-pink-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? '状態を確認中...' : '最新の状態を確認する'}</span>
          </button>

          {checkResult && (
            <p className="text-xs font-medium text-pink-600 dark:text-pink-400 animate-fadeIn">
              {checkResult}
            </p>
          )}
        </div>

        {/* Footer Info & Admin Bypass Link */}
        <div className="pt-4 border-t border-gray-100 dark:border-[#262838] flex flex-col items-center gap-2 text-[11px] text-gray-400">
          <p className="flex items-center gap-1">
            <Heart className="w-3 h-3 text-pink-500 fill-pink-500" />
            <span>登録済みのデータ（推し・予定・グッズ）は安全に保護されています</span>
          </p>

          <div className="pt-1 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline transition"
            >
              管理者プレビュー
            </button>
            <span>•</span>
            <a
              href="https://github.com/toku0716/oshi_web/actions/workflows/maintenance.yml"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline transition flex items-center gap-1"
              title="メンテナンスモード切替・終了（GitHub Actions）"
            >
              <Wrench className="w-3 h-3 text-amber-500" />
              <span>切替・終了（GitHub）</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </main>

      {/* Admin Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1a1c28] rounded-2xl border border-gray-200 dark:border-[#2e3144] p-5 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-950/60 text-pink-600 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">管理者メニュー</h3>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              メンテナンス中画面をスキップしてアプリの動作確認を行うか、GitHubでメンテナンスモードを終了（通常復帰）します。
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <input
                type="password"
                placeholder="管理者パスコード (初期値: admin)"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError(false);
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-[#3a3e54] bg-white dark:bg-[#202334] text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                autoFocus
              />

              {passwordError && (
                <p className="text-[11px] text-rose-500 font-semibold">
                  パスコードが一致しません
                </p>
              )}

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-[#262838]">
                <a
                  href="https://github.com/toku0716/oshi_web/actions/workflows/maintenance.yml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700/60 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-[11px] font-bold transition flex items-center gap-1"
                >
                  <Wrench className="w-3 h-3 text-amber-500" />
                  <span>終了する (GitHub)</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252838]"
                  >
                    閉じる
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold transition shadow-xs"
                  >
                    プレビューに入る
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
