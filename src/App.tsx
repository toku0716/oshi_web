import React, { useState, useEffect, useCallback } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar, type NavTab } from './components/layout/Navbar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/common/ToastContainer';
import { HomeView } from './pages/HomeView';
import { CalendarView } from './pages/CalendarView';
import { GoodsView } from './pages/GoodsView';
import { MyPageView } from './pages/MyPageView';

// Modals
import { OshiModal } from './components/modals/OshiModal';
import { EventModal } from './components/modals/EventModal';
import { EventDetailModal } from './components/modals/EventDetailModal';
import { TodoModal } from './components/modals/TodoModal';
import { GoodsModal } from './components/modals/GoodsModal';
import { GoodsDetailModal } from './components/modals/GoodsDetailModal';
import { TermsModal } from './components/modals/TermsModal';
import { MaintenanceView } from './components/maintenance/MaintenanceView';
import { ExternalLink, Wrench } from 'lucide-react';

import type { Oshi, OshiEvent, Todo, Goods, MaintenanceInfo } from './types';

const MainApp: React.FC = () => {
  const { todos, isLoading } = useApp();

  const [currentTab, setCurrentTab] = useState<NavTab>('home');

  // Modal states
  const [isOshiModalOpen, setIsOshiModalOpen] = useState(false);
  const [editingOshi, setEditingOshi] = useState<Oshi | null>(null);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<OshiEvent | null>(null);
  const [defaultEventDate, setDefaultEventDate] = useState<string | undefined>(undefined);
  const [selectedEventDetail, setSelectedEventDetail] = useState<OshiEvent | null>(null);

  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [defaultEventIdForTodo, setDefaultEventIdForTodo] = useState<string | undefined>(undefined);

  const [isGoodsModalOpen, setIsGoodsModalOpen] = useState(false);
  const [editingGoods, setEditingGoods] = useState<Goods | null>(null);
  const [selectedGoodsDetail, setSelectedGoodsDetail] = useState<Goods | null>(null);

  // Terms & Features modal states
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isFirstTermsView, setIsFirstTermsView] = useState(false);

  // Maintenance mode states
  const [maintenance, setMaintenance] = useState<MaintenanceInfo | null>(null);
  const [isPreviewingMaintenance, setIsPreviewingMaintenance] = useState(false);
  const [isAdminBypass, setIsAdminBypass] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('preview') === 'admin' || urlParams.get('bypass') === 'true') {
        sessionStorage.setItem('oshiss_admin_bypass', 'true');
        return true;
      }
      return sessionStorage.getItem('oshiss_admin_bypass') === 'true';
    } catch {
      return false;
    }
  });

  const checkMaintenance = useCallback(async (): Promise<MaintenanceInfo | null> => {
    try {
      const basePath = window.location.pathname.replace(/\/[^/]*$/, '/');
      const url = `${window.location.origin}${basePath}maintenance.json?_t=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data: MaintenanceInfo = await res.json();
        setMaintenance(data);
        return data;
      }
    } catch {
      // Offline fallback
    }
    return null;
  }, []);

  useEffect(() => {
    checkMaintenance();
  }, [checkMaintenance]);

  // Check if first-time visitor on mount
  useEffect(() => {
    try {
      const agreed = localStorage.getItem('oshiss_terms_agreed_v1');
      if (!agreed) {
        setIsFirstTermsView(true);
        setIsTermsModalOpen(true);
      }
    } catch {
      // LocalStorage access fallback (e.g. private browsing restriction)
    }
  }, []);

  const handleAgreeTerms = () => {
    try {
      localStorage.setItem('oshiss_terms_agreed_v1', 'true');
    } catch {
      // Ignore storage error
    }
    setIsTermsModalOpen(false);
  };

  // Helper actions
  const handleOpenOshiModal = (targetOshi?: Oshi) => {
    setEditingOshi(targetOshi || null);
    setIsOshiModalOpen(true);
  };

  const handleOpenEventModal = (date?: string, targetEvent?: OshiEvent) => {
    setDefaultEventDate(date);
    setEditingEvent(targetEvent || null);
    setIsEventModalOpen(true);
  };

  const handleOpenTodoModal = (targetTodo?: Todo, eventId?: string) => {
    setEditingTodo(targetTodo || null);
    setDefaultEventIdForTodo(eventId);
    setIsTodoModalOpen(true);
  };

  const handleOpenGoodsModal = (targetGoods?: Goods) => {
    setEditingGoods(targetGoods || null);
    setIsGoodsModalOpen(true);
  };

  const handleAddTodoForEvent = (event: OshiEvent) => {
    handleOpenTodoModal(undefined, event.id);
  };

  const uncompletedTodoCount = todos.filter((t) => !t.completed).length;

  // Maintenance Preview Mode (triggered from admin menu)
  if (isPreviewingMaintenance) {
    return (
      <MaintenanceView
        maintenance={
          maintenance || {
            enabled: true,
            title: 'ただいまメンテナンス中です',
            message:
              'より快適にご利用いただけるよう、システムの改善および更新作業を行っております。\nご不便をおかけいたしますが、完了まで今しばらくお待ちください。',
            estimatedEnd: '本日 18:00頃',
          }
        }
        onRecheck={checkMaintenance}
        onBypass={() => setIsPreviewingMaintenance(false)}
        isPreview={true}
        onClosePreview={() => setIsPreviewingMaintenance(false)}
      />
    );
  }

  // Active Maintenance Mode for general visitors
  if (maintenance?.enabled && !isAdminBypass) {
    return (
      <MaintenanceView
        maintenance={maintenance}
        onRecheck={checkMaintenance}
        onBypass={() => {
          try {
            sessionStorage.setItem('oshiss_admin_bypass', 'true');
          } catch {}
          setIsAdminBypass(true);
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#121318] text-gray-900 dark:text-gray-100 flex flex-col items-center justify-center p-4 transition-colors">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-pink-500/20 mb-4">
          推
        </div>
        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">推し活データを読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#121318] text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200 relative">
      {/* Admin Bypass Sticky Notice */}
      {maintenance?.enabled && isAdminBypass && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 text-xs font-bold shadow-md">
          <div className="flex items-center justify-between max-w-6xl mx-auto gap-2">
            <span className="truncate">🔧 メンテナンス中モードが有効です（現在、管理者プレビュー中）</span>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://github.com/toku0716/oshi_web/actions/workflows/maintenance.yml"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded bg-black/30 hover:bg-black/40 transition text-xs font-semibold flex items-center gap-1 text-white shadow-2xs"
              >
                <Wrench className="w-3 h-3 text-amber-300" />
                <span>メンテナンス終了（GitHub）</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <button
                type="button"
                onClick={() => {
                  try {
                    sessionStorage.removeItem('oshiss_admin_bypass');
                  } catch {}
                  setIsAdminBypass(false);
                }}
                className="px-2.5 py-1 rounded bg-black/20 hover:bg-black/30 transition text-xs font-semibold"
              >
                プレビュー終了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Navigation (Sidebar on desktop, Bottom bar on mobile) */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 pb-20 md:pb-8 ${maintenance?.enabled && isAdminBypass ? 'pt-8' : ''}`}>
        {/* Top Header */}
        <Header
          onAddOshiClick={() => handleOpenOshiModal()}
        />

        {/* View Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {currentTab === 'home' && (
            <HomeView
              onNavigateTab={setCurrentTab}
              onOpenEventModal={(date) => handleOpenEventModal(date)}
              onOpenGoodsModal={() => handleOpenGoodsModal()}
              onOpenOshiModal={() => handleOpenOshiModal()}
              onSelectEvent={(ev) => setSelectedEventDetail(ev)}
              onSelectGoods={(g) => setSelectedGoodsDetail(g)}
            />
          )}

          {currentTab === 'calendar' && (
            <CalendarView
              onOpenEventModal={(date) => handleOpenEventModal(date)}
              onSelectEvent={(ev) => setSelectedEventDetail(ev)}
            />
          )}

          {currentTab === 'goods' && (
            <GoodsView
              onOpenGoodsModal={(goods) => handleOpenGoodsModal(goods)}
              onSelectGoods={(g) => setSelectedGoodsDetail(g)}
            />
          )}

          {currentTab === 'mypage' && (
            <MyPageView
              onOpenOshiModal={(oshi) => handleOpenOshiModal(oshi)}
              onOpenTermsModal={() => {
                setIsFirstTermsView(false);
                setIsTermsModalOpen(true);
              }}
              onPreviewMaintenance={() => setIsPreviewingMaintenance(true)}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <OshiModal
        isOpen={isOshiModalOpen}
        onClose={() => setIsOshiModalOpen(false)}
        targetOshi={editingOshi}
      />

      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        targetEvent={editingEvent}
        defaultDate={defaultEventDate}
      />

      <EventDetailModal
        isOpen={!!selectedEventDetail}
        onClose={() => setSelectedEventDetail(null)}
        event={selectedEventDetail}
        onEdit={(ev) => handleOpenEventModal(undefined, ev)}
        onAddTodoForEvent={handleAddTodoForEvent}
      />

      <TodoModal
        isOpen={isTodoModalOpen}
        onClose={() => setIsTodoModalOpen(false)}
        targetTodo={editingTodo}
        defaultEventId={defaultEventIdForTodo}
      />

      <GoodsModal
        isOpen={isGoodsModalOpen}
        onClose={() => setIsGoodsModalOpen(false)}
        targetGoods={editingGoods}
      />

      <GoodsDetailModal
        isOpen={!!selectedGoodsDetail}
        onClose={() => setSelectedGoodsDetail(null)}
        goods={selectedGoodsDetail}
        onEdit={(g) => handleOpenGoodsModal(g)}
      />

      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        onAgree={handleAgreeTerms}
        isFirstTime={isFirstTermsView}
      />
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
