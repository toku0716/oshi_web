import React from 'react';
import { useApp } from '../../context/AppContext';
import { Home, Calendar, CheckSquare, ShoppingBag, Heart } from 'lucide-react';

export type NavTab = 'home' | 'calendar' | 'goods' | 'todos' | 'mypage';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

const NAV_ITEMS: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'home', label: 'ホーム', icon: Home },
  { id: 'calendar', label: '予定・カレンダー', icon: Calendar },
  { id: 'todos', label: '参戦準備・TODO', icon: CheckSquare },
  { id: 'goods', label: 'グッズコレクション', icon: ShoppingBag },
  { id: 'mypage', label: '推し・データ管理', icon: Heart },
];

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onTabChange }) => {
  const { todos, activeOshiId } = useApp();

  const uncompletedTodosCount = (
    activeOshiId === 'all' ? todos : todos.filter((t) => t.oshiId === activeOshiId)
  ).filter((t) => !t.completed).length;

  return (
    <nav className="app-nav">
      {NAV_ITEMS.map((item) => {
        const isActive = currentTab === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            className={`nav-tab ${isActive ? 'active' : ''}`}
            onClick={() => onTabChange(item.id)}
          >
            <Icon className="icon-sm" />
            <span>{item.label}</span>
            {item.id === 'todos' && uncompletedTodosCount > 0 && (
              <span className="nav-count">{uncompletedTodosCount}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
