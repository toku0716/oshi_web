import React from 'react';
import { Home, Calendar, Package, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type NavTab = 'home' | 'calendar' | 'goods' | 'mypage';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

const NAV_ITEMS: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'home', label: 'ホーム', icon: Home },
  { id: 'calendar', label: 'カレンダー', icon: Calendar },
  { id: 'goods', label: 'グッズ管理', icon: Package },
  { id: 'mypage', label: 'マイページ', icon: User },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
}) => {
  const { googleUser } = useApp();
  return (
    <>
      {/* Mobile Bottom Navigation (Fixed at bottom) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#161822] border-t border-gray-200 dark:border-[#262838] px-2 py-2 safe-bottom transition-colors">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
                  isActive
                    ? 'text-pink-600 dark:text-pink-400 font-bold'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-2'}`} />
                <span className="text-[11px] mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar (Fixed at left) */}
      <aside className="hidden md:flex md:flex-col md:w-60 bg-white dark:bg-[#161822] border-r border-gray-200 dark:border-[#262838] shrink-0 h-screen sticky top-0 z-30 transition-colors">
        {/* Brand Header */}
        <div className="p-5 border-b border-gray-200 dark:border-[#262838] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center text-white font-bold text-base">
            推
          </div>
          <div>
            <h1 className="font-bold text-base text-gray-900 dark:text-white leading-tight">
              推しサポ
            </h1>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Web版</p>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="p-3 flex-1 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-100 dark:bg-[#202230] text-pink-600 dark:text-pink-400 font-semibold'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1c26] hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-pink-600 dark:text-pink-400' : 'text-gray-500'}`} />
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer info */}
        <div className="p-4 border-t border-gray-200 dark:border-[#262838] text-xs text-gray-500 dark:text-gray-400">
          {googleUser && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 mb-3">
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
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                  {googleUser.name}
                </p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold leading-tight">
                  Google連携中
                </p>
              </div>
            </div>
          )}
          <p className="font-semibold text-gray-700 dark:text-gray-300">IndexedDB & JSON保存</p>
          <p className="text-[11px] text-gray-400 mt-0.5">完全ローカル動作</p>
        </div>
      </aside>
    </>
  );
};
