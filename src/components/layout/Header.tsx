import React from 'react';
import { useApp } from '../../context/AppContext';
import { Heart, Sparkles, Plus, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  onAddOshiClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onAddOshiClick }) => {
  const {
    oshis,
    activeOshiId,
    setActiveOshiId,
    activeOshi,
    themeMode,
    setThemeMode,
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
