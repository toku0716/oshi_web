import React from 'react';
import { Home, Calendar, Package, User } from 'lucide-react';

export type NavTab = 'home' | 'calendar' | 'goods' | 'mypage';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

const NAV_ITEMS: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'home', label: 'ホーム', icon: Home },
  { id: 'calendar', label: 'スケジュール', icon: Calendar },
  { id: 'goods', label: 'グッズ', icon: Package },
  { id: 'mypage', label: 'マイページ', icon: User },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
}) => {
  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] safe-bottom">
        <div className="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-colors ${
                  isActive
                    ? 'text-neutral-950 dark:text-white font-semibold'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform ${isActive ? 'stroke-[2.2] scale-105' : 'stroke-[1.8]'}`} />
                <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Minimal Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-60 bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] shrink-0 h-screen sticky top-0 z-30 transition-colors">
        {/* Brand */}
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs shadow-xs">
              推
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-neutral-950 dark:text-white leading-none">
                推しサポ
              </h1>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium tracking-tight">Oshi Life Manager</span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="px-3 py-3 flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-950 dark:text-white font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-neutral-950 dark:text-white stroke-[2.2]' : 'text-neutral-400 stroke-[1.8]'}`} />
                <span className="flex-1 text-left tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Local Storage Architecture indicator */}
        <div className="p-3 mx-3 mb-4 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-[var(--border-subtle)] text-[11px]">
          <div className="flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>ローカルデータ保持</span>
          </div>
          <p className="text-[10px] mt-0.5 text-neutral-400 dark:text-neutral-500 leading-normal">
            サーバー送信なし · 端末内完結
          </p>
        </div>
      </aside>
    </>
  );
};
