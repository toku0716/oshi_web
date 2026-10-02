import React from 'react';
import { useApp } from '../../context/AppContext';
import { Heart, Sparkles, Plus, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  onAddOshiClick?: () => void;
  onOpenGoogleModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onAddOshiClick, onOpenGoogleModal }) => {
  const {
    oshis,
    activeOshiId,
    setActiveOshiId,
    activeOshi,
    themeMode,
    setThemeMode,
    googleUser,
  } = useApp();

  const today = new Date();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const formattedToday = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日(${weekdays[today.getDay()]})`;

  return (
    <header className="sticky top-0 z-20 bg-white/90 dark:bg-[#161822]/90 backdrop-blur-md border-b border-gray-100 dark:border-[#262838] px-4 sm:px-6 py-3 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Mobile Brand / Date */}
        <div className="flex items-center gap-3">
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
              推
            </div>
            <span className="font-extrabold text-base text-gray-900 dark:text-white tracking-tight">推しサポ</span>
          </div>

          <div className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 font-medium">
          {formattedToday}
          </div>
        </div>

        {/* Oshi Filter & Quick Selector */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Google Account Button */}
          {onOpenGoogleModal && (
            googleUser ? (
              <button
                type="button"
                onClick={onOpenGoogleModal}
                className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 hover:scale-105 active:scale-95 transition text-xs font-semibold"
                title={`${googleUser.name} (${googleUser.email}) - Googleアカウント連携中`}
                aria-label="Googleアカウント管理"
              >
                <div className="relative shrink-0">
                  {googleUser.picture ? (
                    <img
                      src={googleUser.picture}
                      alt={googleUser.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                      {googleUser.name.slice(0, 1)}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-white dark:border-[#161822]" />
                </div>
                <span className="hidden md:inline text-xs font-semibold text-gray-800 dark:text-gray-200 max-w-[100px] truncate">
                  {googleUser.name}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenGoogleModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-[#2d3145] bg-white dark:bg-[#1d202d] text-gray-700 dark:text-gray-200 hover:scale-105 active:scale-95 transition shadow-2xs text-xs font-semibold"
                title="Googleアカウントと連携"
                aria-label="Googleアカウントと連携"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
                <span className="text-[11px] font-semibold">Google連携</span>
              </button>
            )
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-[#2d3145] bg-gray-50 dark:bg-[#1d202d] text-gray-700 dark:text-gray-200 hover:scale-105 active:scale-95 transition shadow-2xs text-xs font-semibold"
            title={themeMode === 'dark' ? 'ライトモードに切替' : 'ダークモードに切替'}
            aria-label="テーマ切替"
          >
            {themeMode === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="hidden sm:inline">ダーク</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-500 fill-indigo-100" />
                <span className="hidden sm:inline">ライト</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#1d202d] border border-gray-200/80 dark:border-[#2d3145] rounded-xl px-2.5 py-1.5 text-xs">
            <Heart
              className="w-3.5 h-3.5 transition-colors"
              style={{
                color: activeOshi?.color || '#ec4899',
                fill: activeOshi ? activeOshi.color : 'none',
              }}
            />
            <span className="text-gray-500 dark:text-gray-400 font-medium hidden sm:inline">表示対象:</span>
            <select
              value={activeOshiId}
              onChange={(e) => setActiveOshiId(e.target.value)}
              className="bg-transparent font-semibold text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer text-xs"
            >
              <option value="all" className="dark:bg-[#1d202d]">全員を表示（全推し）</option>
              {oshis.map((o) => (
                <option key={o.id} value={o.id} className="dark:bg-[#1d202d]">
                  {o.name} {o.group ? `(${o.group})` : ''}
                </option>
              ))}
            </select>
          </div>

          {oshis.length === 0 && onAddOshiClick && (
            <button
              onClick={onAddOshiClick}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>推しを登録</span>
            </button>
          )}

          {activeOshi && (
            <div
              className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-xs border"
              style={{
                backgroundColor: `${activeOshi.color}15`,
                borderColor: `${activeOshi.color}40`,
                color: activeOshi.color,
              }}
            >
              <Sparkles className="w-3 h-3" />
              <span>{activeOshi.name} 応援モード</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
