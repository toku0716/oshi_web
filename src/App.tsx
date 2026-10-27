import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { GoogleAccessGate } from './components/auth/GoogleAccessGate';
import { ToastContainer } from './components/common/ToastContainer';
import { AdminPortalView } from './pages/AdminPortalView';
import { HomeView } from './pages/HomeView';
import { CalendarView } from './pages/CalendarView';
import { GoodsView } from './pages/GoodsView';
import { RecordsView } from './pages/RecordsView';
import { MyPageView } from './pages/MyPageView';
import { AddEntrySpeedDialSheet } from './components/modals/AddEntrySpeedDialSheet';
import { TermsPrivacyModal } from './components/modals/TermsPrivacyModal';
import { settingsRepository } from './repository';
import {
  getEffectivePolicyInfo,
  type ExpenseItem,
  type GoogleAuthSession,
  type Goods,
  type OshiEvent,
  type Todo,
} from './types';
import {
  cacheAccessConfig,
  getEffectiveAccessConfig,
  getSavedGoogleSession,
  isGoogleEmailAllowed,
} from './utils/googleAuthUtils';
import { formatIsoDate, getTodayMidnight } from './utils/oshiUtils';

const MainApp: React.FC = () => {
  const { isLoading, themeColor, isDark, settings, refreshAllData, activeOshi } = useApp();

  const [authSession, setAuthSession] = useState<GoogleAuthSession | null>(() =>
    getSavedGoogleSession()
  );
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string>(() =>
    formatIsoDate(getTodayMidnight())
  );
  const [goodsActiveTab, setGoodsActiveTab] = useState<number>(0);

  // モーダル制御ステート（追加・各種編集）
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [sheetType, setSheetType] = useState<number>(0);
  const [sheetAllowedTypes, setSheetAllowedTypes] = useState<number[]>([0, 1, 2, 3]);
  const [sheetInitialDate, setSheetInitialDate] = useState<string | undefined>(
    undefined
  );
  const [sheetInitialIsWish, setSheetInitialIsWish] = useState<boolean>(false);

  const [editingEvent, setEditingEvent] = useState<OshiEvent | null>(null);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editingGoods, setEditingGoods] = useState<Goods | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);

  const clearEditingStates = () => {
    setEditingEvent(null);
    setEditingTodo(null);
    setEditingGoods(null);
    setEditingExpense(null);
  };

  // 現在開いているタブ・サブタブ・選択日に応じたスマートな初期モードで追加シートを開く
  const handleCenterAddClick = () => {
    clearEditingStates();
    if (currentIndex === 0) {
      setSheetType(0);
      setSheetAllowedTypes([0, 1]);
      setSheetInitialDate(undefined);
      setSheetInitialIsWish(false);
    } else if (currentIndex === 1) {
      setSheetType(0);
      setSheetAllowedTypes([0, 1]);
      setSheetInitialDate(calendarSelectedDate);
      setSheetInitialIsWish(false);
    } else if (currentIndex === 2) {
      setSheetAllowedTypes([2, 3]);
      setSheetInitialDate(undefined);
      if (goodsActiveTab === 2) {
        setSheetType(3);
        setSheetInitialIsWish(false);
      } else {
        setSheetType(2);
        setSheetInitialIsWish(goodsActiveTab === 1);
      }
    } else {
      setSheetType(0);
      setSheetAllowedTypes([0, 1, 2, 3]);
      setSheetInitialDate(undefined);
      setSheetInitialIsWish(false);
    }
    setIsSheetOpen(true);
  };

  const handleOpenAddEvent = (defaultDate?: string) => {
    clearEditingStates();
    setSheetType(0);
    setSheetAllowedTypes([0, 1]);
    setSheetInitialDate(defaultDate);
    setIsSheetOpen(true);
  };

  const handleOpenEditEvent = (event: OshiEvent) => {
    clearEditingStates();
    setEditingEvent(event);
    setSheetType(0);
    setSheetAllowedTypes([0]);
    setSheetInitialDate(event.date);
    setIsSheetOpen(true);
  };

  const handleOpenAddTodo = (defaultDate?: string) => {
    clearEditingStates();
    setSheetType(1);
    setSheetAllowedTypes([0, 1]);
    setSheetInitialDate(defaultDate);
    setIsSheetOpen(true);
  };

  const handleOpenEditTodo = (todo: Todo) => {
    clearEditingStates();
    setEditingTodo(todo);
    setSheetType(1);
    setSheetAllowedTypes([1]);
    setSheetInitialDate(todo.dueDate);
    setIsSheetOpen(true);
  };

  const handleOpenAddGoods = (isWish = false) => {
    clearEditingStates();
    setSheetType(2);
    setSheetAllowedTypes([2, 3]);
    setSheetInitialIsWish(isWish);
    setSheetInitialDate(undefined);
    setIsSheetOpen(true);
  };

  const handleOpenEditGoods = (goodsItem: Goods) => {
    clearEditingStates();
    setEditingGoods(goodsItem);
    setSheetType(2);
    setSheetAllowedTypes([2]);
    setSheetInitialIsWish(!!goodsItem.isWish);
    setIsSheetOpen(true);
  };

  const handleOpenAddExpense = () => {
    clearEditingStates();
    setSheetType(3);
    setSheetAllowedTypes([2, 3]);
    setSheetInitialDate(undefined);
    setIsSheetOpen(true);
  };

  const handleOpenEditExpense = (expenseItem: ExpenseItem) => {
    clearEditingStates();
    setEditingExpense(expenseItem);
    setSheetType(3);
    setSheetAllowedTypes([3]);
    setSheetInitialDate(expenseItem.date);
    setIsSheetOpen(true);
  };

  const bgColor = isDark ? '#111216' : '#F9FAFB';
  const navBg = isDark ? '#14151B' : '#FFFFFF';
  const navBorder = isDark ? '#222430' : '#E8EAEE';
  const textColor = isDark ? '#FFFFFF' : '#11141C';
  const subtextColor = isDark ? '#9CA3AF' : '#6B7280';

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: bgColor,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          color: themeColor,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            backgroundColor: themeColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: isDark ? '#8E95A5' : '#64748B',
            letterSpacing: '0.04em',
          }}
        >
          推しサポを起動中...
        </span>
      </div>
    );
  }

  // 管理者用サイト (/admin, /admin.html, #/admin, ?admin=1) のルーティング判定
  const isAdminSite =
    typeof window !== 'undefined' &&
    (window.location.pathname.endsWith('/admin') ||
      window.location.pathname.endsWith('/admin/') ||
      window.location.pathname.endsWith('/admin.html') ||
      window.location.hash === '#/admin' ||
      new URLSearchParams(window.location.search).has('admin'));

  if (isAdminSite) {
    return <AdminPortalView />;
  }

  const accessConfig = getEffectiveAccessConfig(settings);
  const isAuthorizedSession =
    Boolean(authSession?.email) &&
    (accessConfig.allowedEmails.length === 0 ||
      isGoogleEmailAllowed(authSession!.email, accessConfig.allowedEmails));

  if (accessConfig.enabled && !isAuthorizedSession) {
    return (
      <GoogleAccessGate
        themeColor={themeColor}
        isDark={isDark}
        googleClientId={accessConfig.googleClientId}
        allowedEmails={accessConfig.allowedEmails}
        onAuthenticated={async (session, autoRegisterFirstOwnerEmail) => {
          setAuthSession(session);
          if (autoRegisterFirstOwnerEmail) {
            await settingsRepository.saveSettings({
              allowedGoogleEmails: [autoRegisterFirstOwnerEmail],
            });
            cacheAccessConfig({
              allowedGoogleEmails: [autoRegisterFirstOwnerEmail],
            });
            await refreshAllData();
          }
        }}
      />
    );
  }

  const navItems: { index: number; label: string; icon: React.ReactNode }[] = [
    {
      index: 0,
      label: 'ホーム',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      index: 1,
      label: 'カレンダー',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      index: 2,
      label: 'グッズ',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
    },
    {
      index: 3,
      label: 'マイページ',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  const renderBottomTab = (item: { index: number; label: string; icon: React.ReactNode }) => {
    const selected = currentIndex === item.index;
    const color = selected
      ? themeColor
      : isDark
        ? 'rgba(255, 255, 255, 0.45)'
        : 'rgba(0, 0, 0, 0.45)';
    return (
      <button
        key={item.index}
        type="button"
        onClick={() => setCurrentIndex(item.index)}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 0',
          color,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {item.icon}
        <span
          style={{
            fontSize: 10,
            fontWeight: selected ? 800 : 600,
            color,
            letterSpacing: '0.02em',
          }}
        >
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <div className="app-shell" style={{ backgroundColor: bgColor }}>
      <ToastContainer />

      {/* Tablet (Navigation Rail) & PC (Sidebar) */}
      <aside
        className="side-nav"
        style={{
          backgroundColor: navBg,
          borderRight: `1px solid ${navBorder}`,
        }}
      >
        <div className="side-nav-brand">
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: themeColor,
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <span className="side-nav-brand-title" style={{ color: textColor }}>
            推しサポ
          </span>
        </div>

        <div className="side-nav-links">
          {navItems.map((item) => {
            const selected = currentIndex === item.index;
            const color = selected
              ? themeColor
              : isDark
                ? 'rgba(255,255,255,0.5)'
                : 'rgba(0,0,0,0.5)';
            return (
              <button
                key={item.index}
                type="button"
                className="side-nav-btn"
                onClick={() => setCurrentIndex(item.index)}
                style={{
                  backgroundColor: selected ? `${themeColor}1F` : 'transparent',
                  color,
                }}
              >
                {item.icon}
                <span
                  className="side-nav-btn-label"
                  style={{ fontWeight: selected ? 800 : 600 }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="side-nav-add-btn"
          onClick={handleCenterAddClick}
          style={{
            backgroundColor: themeColor,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="side-nav-add-label">新規追加</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="app-main">
        {currentIndex === 0 && (
          <HomeView
            onOpenAddEvent={() => handleOpenAddEvent()}
            onOpenEditEvent={(ev) => handleOpenEditEvent(ev)}
            onOpenAddTodo={() => handleOpenAddTodo()}
            onOpenEditTodo={(td) => handleOpenEditTodo(td)}
          />
        )}
        {currentIndex === 1 && (
          <CalendarView
            onOpenAddEvent={(date) => handleOpenAddEvent(date)}
            onOpenEditEvent={(ev) => handleOpenEditEvent(ev)}
            onOpenEditTodo={(td) => handleOpenEditTodo(td)}
            onSelectedDateChange={(dateStr) => setCalendarSelectedDate(dateStr)}
          />
        )}
        {currentIndex === 2 && (
          <GoodsView
            onOpenAddGoods={(isWish) => handleOpenAddGoods(isWish)}
            onOpenEditGoods={(g) => handleOpenEditGoods(g)}
          />
        )}
        {currentIndex === 3 && (
          <MyPageView onLogout={() => setAuthSession(null)} />
        )}
      </main>

      {/* Smartphone Bottom Navigation Bar */}
      <nav
        className="bottom-nav"
        style={{
          backgroundColor: isDark ? 'rgba(20, 22, 31, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: `1px solid ${navBorder}`,
          alignItems: 'center',
          height: 60,
          padding: '0 8px',
        }}
      >
        {renderBottomTab(navItems[0])}
        {renderBottomTab(navItems[1])}

        {/* 中央の「＋」アクションボタン */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <button
            type="button"
            onClick={handleCenterAddClick}
            aria-label="追加する"
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              border: 'none',
              backgroundColor: themeColor,
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              boxShadow: `0 4px 14px ${themeColor}66`,
              transform: 'translateY(-2px)',
              transition: 'transform 0.15s ease',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {renderBottomTab(navItems[2])}
        {renderBottomTab(navItems[3])}
      </nav>

      <AddEntrySpeedDialSheet
        isOpen={isSheetOpen}
        onClose={() => {
          setIsSheetOpen(false);
          clearEditingStates();
        }}
        initialType={sheetType}
        allowedTypes={sheetAllowedTypes}
        initialDate={sheetInitialDate}
        initialIsWish={sheetInitialIsWish}
        editingEvent={editingEvent}
        editingTodo={editingTodo}
        editingGoods={editingGoods}
        editingExpense={editingExpense}
      />

      {/* 初回起動時および利用規約・プライバシーポリシー改定時の起動時確認モーダル */}
      {(() => {
        const activePolicyVersion = getEffectivePolicyInfo(settings).version;
        const acceptedVer =
          settings?.acceptedPolicyVersion ||
          localStorage.getItem('oshiss_accepted_policy_version') ||
          '';

        return (
          <TermsPrivacyModal
            isOpen={!isLoading && acceptedVer !== activePolicyVersion}
            mode="consent"
            isPolicyUpdate={
              Boolean(acceptedVer) && acceptedVer !== activePolicyVersion
            }
            onAccept={async () => {
              const acceptedAt = new Date().toISOString();
              localStorage.setItem(
                'oshiss_accepted_policy_version',
                activePolicyVersion
              );
              await settingsRepository.saveSettings({
                acceptedPolicyVersion: activePolicyVersion,
                acceptedPolicyAt: acceptedAt,
              });
              await refreshAllData();
            }}
          />
        );
      })()}
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

export default App;
