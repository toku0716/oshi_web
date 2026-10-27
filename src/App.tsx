import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Calendar, Heart, Home, Plus, ShoppingBag, User } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { GoogleAccessGate } from './components/auth/GoogleAccessGate';
import { ToastContainer } from './components/common/ToastContainer';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { HomeView } from './pages/HomeView';
import { CalendarView } from './pages/CalendarView';
import { GoodsView } from './pages/GoodsView';
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

// 管理画面は一般ユーザーには不要なので遅延読み込み（メインバンドルを軽量化）
const AdminPortalView = lazy(() =>
  import('./pages/AdminPortalView').then((m) => ({ default: m.AdminPortalView }))
);

/* ---------------------------------------------------------
   タブ ⇄ URL ハッシュの同期
   (#/home, #/calendar, #/goods, #/mypage)
   ブラウザ / Android の「戻る」やリロードでタブが保持されるようにする
   --------------------------------------------------------- */
const TAB_KEYS = ['home', 'calendar', 'goods', 'mypage'] as const;

function readTabFromHash(): number {
  if (typeof window === 'undefined') return 0;
  const key = window.location.hash.replace(/^#\/?/, '');
  const idx = TAB_KEYS.indexOf(key as (typeof TAB_KEYS)[number]);
  return idx >= 0 ? idx : 0;
}

function isAdminLocation(): boolean {
  if (typeof window === 'undefined') return false;
  const { pathname, hash, search } = window.location;
  return (
    pathname.endsWith('/admin') ||
    pathname.endsWith('/admin/') ||
    pathname.endsWith('/admin.html') ||
    hash === '#/admin' ||
    new URLSearchParams(search).has('admin')
  );
}

const NAV_ITEMS: { index: number; label: string; Icon: React.FC<{ size?: number; strokeWidth?: number }> }[] = [
  { index: 0, label: 'ホーム', Icon: Home },
  { index: 1, label: 'カレンダー', Icon: Calendar },
  { index: 2, label: 'グッズ', Icon: ShoppingBag },
  { index: 3, label: 'マイページ', Icon: User },
];

const LoadingScreen: React.FC<{ label?: string }> = ({ label = '推しサポを起動中...' }) => (
  <div className="app-loading" role="status" aria-live="polite">
    <div className="app-loading-mark">
      <Heart size={24} fill="currentColor" strokeWidth={2} />
    </div>
    <span className="app-loading-label">{label}</span>
  </div>
);

const MainApp: React.FC = () => {
  const { isLoading, settings, refreshAllData, themeColor, isDark } = useApp();

  const [authSession, setAuthSession] = useState<GoogleAuthSession | null>(() =>
    getSavedGoogleSession()
  );
  const [currentIndex, setCurrentIndex] = useState<number>(() => readTabFromHash());
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string>(() =>
    formatIsoDate(getTodayMidnight())
  );

  // モーダル制御ステート（追加・各種編集）
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [sheetType, setSheetType] = useState<number>(0);
  const [sheetAllowedTypes, setSheetAllowedTypes] = useState<number[]>([0, 1, 2, 3]);
  const [sheetInitialDate, setSheetInitialDate] = useState<string | undefined>(undefined);
  const [sheetInitialIsWish, setSheetInitialIsWish] = useState<boolean>(false);

  const [editingEvent, setEditingEvent] = useState<OshiEvent | null>(null);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editingGoods, setEditingGoods] = useState<Goods | null>(null);

  // ブラウザの戻る / 進む・ハッシュ直接変更に追従
  useEffect(() => {
    const sync = () => setCurrentIndex(readTabFromHash());
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);

  const navigateTab = useCallback((index: number) => {
    setCurrentIndex((prev) => {
      if (prev === index) {
        // 同じタブを再タップしたら先頭へスクロール
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return prev;
      }
      const hash = `#/${TAB_KEYS[index]}`;
      if (window.location.hash !== hash) {
        window.history.pushState(null, '', hash);
      }
      window.scrollTo({ top: 0 });
      return index;
    });
  }, []);

  const clearEditingStates = () => {
    setEditingEvent(null);
    setEditingTodo(null);
    setEditingGoods(null);
  };

  const openSheet = (
    type: number,
    allowed: number[],
    opts: { date?: string; isWish?: boolean } = {}
  ) => {
    setSheetType(type);
    setSheetAllowedTypes(allowed);
    setSheetInitialDate(opts.date);
    setSheetInitialIsWish(opts.isWish ?? false);
    setIsSheetOpen(true);
  };

  // 現在開いているタブ・選択日に応じたスマートな初期モードで追加シートを開く
  const handleCenterAddClick = () => {
    clearEditingStates();
    if (currentIndex === 0) {
      openSheet(0, [0, 1]);
    } else if (currentIndex === 1) {
      openSheet(0, [0, 1], { date: calendarSelectedDate });
    } else if (currentIndex === 2) {
      openSheet(2, [2, 3]);
    } else {
      openSheet(0, [0, 1, 2, 3]);
    }
  };

  const handleOpenAddEvent = (defaultDate?: string) => {
    clearEditingStates();
    openSheet(0, [0, 1], { date: defaultDate });
  };

  const handleOpenEditEvent = (event: OshiEvent) => {
    clearEditingStates();
    setEditingEvent(event);
    openSheet(0, [0], { date: event.date });
  };

  const handleOpenAddTodo = (defaultDate?: string) => {
    clearEditingStates();
    openSheet(1, [0, 1], { date: defaultDate });
  };

  const handleOpenEditTodo = (todo: Todo) => {
    clearEditingStates();
    setEditingTodo(todo);
    openSheet(1, [1], { date: todo.dueDate });
  };

  const handleOpenAddGoods = (isWish = false) => {
    clearEditingStates();
    openSheet(2, [2, 3], { isWish });
  };

  const handleOpenEditGoods = (goodsItem: Goods) => {
    clearEditingStates();
    setEditingGoods(goodsItem);
    openSheet(2, [2], { isWish: !!goodsItem.isWish });
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAdminLocation()) {
    return (
      <Suspense fallback={<LoadingScreen label="管理画面を読み込み中..." />}>
        <AdminPortalView />
      </Suspense>
    );
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

  // 初回起動時および利用規約・プライバシーポリシー改定時の同意確認
  const activePolicyVersion = getEffectivePolicyInfo(settings).version;
  const acceptedPolicyVersion =
    settings?.acceptedPolicyVersion ||
    localStorage.getItem('oshiss_accepted_policy_version') ||
    '';

  const renderBottomTab = (item: (typeof NAV_ITEMS)[number]) => {
    const selected = currentIndex === item.index;
    return (
      <button
        key={item.index}
        type="button"
        className={`bottom-nav-tab ${selected ? 'is-active' : ''}`}
        onClick={() => navigateTab(item.index)}
        aria-current={selected ? 'page' : undefined}
      >
        <span className="bottom-nav-tab-icon">
          <item.Icon size={22} strokeWidth={selected ? 2.4 : 2} />
        </span>
        <span className="bottom-nav-tab-label">{item.label}</span>
      </button>
    );
  };

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        メインコンテンツへスキップ
      </a>
      <ToastContainer />

      {/* Tablet (Navigation Rail) & PC (Sidebar) */}
      <aside className="side-nav" aria-label="メインナビゲーション">
        <div className="side-nav-brand">
          <div className="side-nav-brand-mark" aria-hidden="true">
            <Heart size={20} fill="currentColor" strokeWidth={2} />
          </div>
          <span className="side-nav-brand-title">推しサポ</span>
        </div>

        <nav className="side-nav-links">
          {NAV_ITEMS.map((item) => {
            const selected = currentIndex === item.index;
            return (
              <button
                key={item.index}
                type="button"
                className={`side-nav-btn ${selected ? 'is-active' : ''}`}
                onClick={() => navigateTab(item.index)}
                aria-current={selected ? 'page' : undefined}
              >
                <item.Icon size={22} strokeWidth={selected ? 2.4 : 2} />
                <span className="side-nav-btn-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          className="side-nav-add-btn"
          onClick={handleCenterAddClick}
          aria-label="新規追加"
        >
          <Plus size={22} strokeWidth={2.6} />
          <span className="side-nav-add-label" aria-hidden="true">
            新規追加
          </span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main id="main-content" className="app-main" tabIndex={-1}>
        {currentIndex === 0 && (
          <HomeView
            onOpenAddEvent={() => handleOpenAddEvent()}
            onOpenEditEvent={handleOpenEditEvent}
            onOpenAddTodo={() => handleOpenAddTodo()}
            onOpenEditTodo={handleOpenEditTodo}
            onNavigateToMyPage={() => navigateTab(3)}
          />
        )}
        {currentIndex === 1 && (
          <CalendarView
            onOpenAddEvent={(date) => handleOpenAddEvent(date)}
            onOpenEditEvent={handleOpenEditEvent}
            onOpenEditTodo={handleOpenEditTodo}
            onSelectedDateChange={setCalendarSelectedDate}
          />
        )}
        {currentIndex === 2 && (
          <GoodsView
            onOpenAddGoods={(isWish) => handleOpenAddGoods(isWish)}
            onOpenEditGoods={handleOpenEditGoods}
          />
        )}
        {currentIndex === 3 && <MyPageView onLogout={() => setAuthSession(null)} />}
      </main>

      {/* Smartphone Bottom Navigation Bar */}
      <nav className="bottom-nav" aria-label="メインナビゲーション">
        {renderBottomTab(NAV_ITEMS[0])}
        {renderBottomTab(NAV_ITEMS[1])}

        {/* 中央の「＋」アクションボタン */}
        <div className="bottom-nav-add-slot">
          <button
            type="button"
            className="bottom-nav-add-btn"
            onClick={handleCenterAddClick}
            aria-label="新規追加"
          >
            <Plus size={24} strokeWidth={2.8} />
          </button>
        </div>

        {renderBottomTab(NAV_ITEMS[2])}
        {renderBottomTab(NAV_ITEMS[3])}
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
        editingExpense={null as ExpenseItem | null}
      />

      <TermsPrivacyModal
        isOpen={acceptedPolicyVersion !== activePolicyVersion}
        mode="consent"
        isPolicyUpdate={
          Boolean(acceptedPolicyVersion) && acceptedPolicyVersion !== activePolicyVersion
        }
        onAccept={async () => {
          const acceptedAt = new Date().toISOString();
          localStorage.setItem('oshiss_accepted_policy_version', activePolicyVersion);
          await settingsRepository.saveSettings({
            acceptedPolicyVersion: activePolicyVersion,
            acceptedPolicyAt: acceptedAt,
          });
          await refreshAllData();
        }}
      />
    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
