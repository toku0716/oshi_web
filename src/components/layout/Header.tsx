import React from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Moon, Sun, ChevronDown } from 'lucide-react';

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
  const formattedToday = `${today.getMonth() + 1}月${today.getDate()}日 (${weekdays[today.getDay()]})`;

  return (
    <header className="sticky top-0 z-20 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] px-4 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Mobile Brand / Date */}
        <div className="flex items-center gap-3">
          <div className="md:hidden flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs shadow-xs">
              推
            </div>
            <span className="font-bold text-sm tracking-tight text-neutral-950 dark:text-white">推しサポ</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-medium num-tabular">
            <span>{formattedToday}</span>
          </div>
        </div>

        {/* Right: Target Filter & Theme */}
        <div className="flex items-center gap-2">
          {/* Target Selector Capsule */}
          <div className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-[var(--border-subtle)] hover:border-[var(--border-muted)] transition-colors">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                backgroundColor: activeOshi?.color || '#ec4899',
              }}
            />
            <select
              value={activeOshiId}
              onChange={(e) => setActiveOshiId(e.target.value)}
              className="bg-transparent font-medium text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer text-xs pr-4 appearance-none tracking-tight"
            >
              <option value="all" className="dark:bg-[#161822]">全件表示 (すべて)</option>
              {oshis.map((o) => (
                <option key={o.id} value={o.id} className="dark:bg-[#161822]">
                  {o.name} {o.group ? `(${o.group})` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-neutral-400 pointer-events-none absolute right-2.5" />
          </div>

          {oshis.length === 0 && onAddOshiClick && (
            <button
              onClick={onAddOshiClick}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>対象を登録</span>
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-100 dark:bg-neutral-800/80 border border-[var(--border-subtle)] text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition"
            title={themeMode === 'dark' ? 'ライトモードに切替' : 'ダークモードに切替'}
            aria-label="表示モード切替"
          >
            {themeMode === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-neutral-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
