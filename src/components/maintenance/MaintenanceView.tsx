import React, { useState, useEffect } from 'react';
import type { MaintenanceInfo } from '../../types';
import {
  Wrench,
  RefreshCw,
  Clock,
  ShieldCheck,
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
        setCheckResult('メンテナンスが完了しました。通常画面へ遷移します...');
        setTimeout(() => {
          window.location.reload();
        }, 600);
      } else {
        setCheckResult('現在もシステムメンテナンス作業中です。完了までしばらくお待ちください。');
      }
    } catch {
      setCheckResult('ステータスの確認に失敗しました。時間をおいて再試行してください。');
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
    <div className="min-h-screen bg-[var(--bg-canvas)] text-neutral-900 dark:text-neutral-100 flex flex-col items-center justify-center p-4 font-sans select-none relative transition-colors">
      {/* Preview Mode Top Banner */}
      {isPreview && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 max-w-2xl mx-auto w-full justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>【プレビュー表示】一般の訪問者に表示される画面です</span>
            </span>
            {onClosePreview && (
              <button
                type="button"
                onClick={onClosePreview}
                className="px-2.5 py-1 rounded-md bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 transition text-xs font-semibold"
              >
                プレビューを終了
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Card */}
      <main className="max-w-md w-full bento-card rounded-xl p-6 sm:p-8 text-center relative z-10 space-y-6">
        {/* Animated App Icon */}
        <div className="flex justify-center">
          <div className="relative group cursor-pointer" onClick={handleLogoClick} title="OSHISAPO">
            <div className="w-16 h-16 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900 font-bold text-2xl shadow-xs transition duration-300">
              推
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 flex items-center justify-center shadow-xs">
              <Wrench className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Badge & Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-black/[0.04] dark:bg-white/[0.08] text-neutral-700 dark:text-neutral-300 border border-[var(--border-subtle)]">
            <Wrench className="w-3.5 h-3.5 text-neutral-500" />
            <span>システムメンテナンス中</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-neutral-950 dark:text-white tracking-tight">
            {maintenance.title || 'メンテナンスを実施しております'}
          </h1>
        </div>

        {/* Description Message */}
        <div className="bg-black/[0.02] dark:bg-white/[0.03] rounded-xl p-4 sm:p-5 border border-[var(--border-subtle)] text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed text-left whitespace-pre-line">
          {maintenance.message ||
            '現在、サービスの機能向上およびインフラストラクチャ保守作業を実施しております。\nご利用の皆様にはご不便をおかけいたしますが、作業完了まで今しばらくお待ちください。'}
        </div>

        {/* Estimated End Time Card (If Specified) */}
        {maintenance.estimatedEnd && (
          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-[var(--border-subtle)] text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            <Clock className="w-4 h-4 text-neutral-500 shrink-0" />
            <span>終了予定時刻: <strong className="font-bold num-tabular">{maintenance.estimatedEnd}</strong></span>
          </div>
        )}

        {/* Check Status Button */}
        <div className="space-y-3 pt-1">
          <button
            type="button"
            onClick={handleCheck}
            disabled={isChecking}
            className="w-full py-2.5 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? '最新ステータスを確認中...' : '最新のステータスを確認'}</span>
          </button>

          {checkResult && (
            <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              {checkResult}
            </p>
          )}
        </div>

        {/* Footer Info & Admin Bypass Link */}
        <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-col items-center gap-2 text-[11px] text-neutral-400">
          <p className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>端末内のローカルデータは安全に保持されています</span>
          </p>

          <div className="pt-1 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 underline transition"
            >
              管理者メニュー
            </button>
            <span>•</span>
            <a
              href="https://github.com/toku0716/oshi_web/actions/workflows/maintenance.yml"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 underline transition flex items-center gap-1"
              title="メンテナンスモード切替・終了（GitHub Actions）"
            >
              <Wrench className="w-3 h-3 text-neutral-400" />
              <span>GitHub Actions</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </main>

      {/* Admin Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] p-5 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] text-neutral-800 dark:text-neutral-200 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">管理者メニュー</h3>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              メンテナンス画面を一時バイパスしてサイトを確認するか、GitHub Actionsでメンテナンスモードを終了します。
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <input
                type="password"
                placeholder="管理者パスコード"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError(false);
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-subtle)] bg-black/[0.02] dark:bg-white/[0.03] text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-white transition"
                autoFocus
              />

              {passwordError && (
                <p className="text-[11px] text-rose-500 font-semibold">
                  パスコードが一致しません
                </p>
              )}

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)]">
                <a
                  href="https://github.com/toku0716/oshi_web/actions/workflows/maintenance.yml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] text-neutral-700 dark:text-neutral-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] text-[11px] font-semibold transition flex items-center gap-1"
                >
                  <Wrench className="w-3 h-3 text-neutral-500" />
                  <span>GitHub Actions</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition"
                  >
                    閉じる
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold transition shadow-xs"
                  >
                    バイパス実行
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
