import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar, type NavTab } from './components/layout/Navbar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/common/ToastContainer';
import { ConfirmModal } from './components/common/ConfirmModal';
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

import { parseSyncData } from './utils/syncUtils';
import { backupRepository } from './repository';
import type { Oshi, OshiEvent, Todo, Goods, BackupData } from './types';

const MainApp: React.FC = () => {
  const { todos, isLoading, refreshAllData, showToast } = useApp();

  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [incomingSyncData, setIncomingSyncData] = useState<BackupData | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

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

  // URLハッシュからの同期データ検知（スマホの通常カメラ等でQRを開いた時）
  useEffect(() => {
    const checkHashSync = () => {
      const hash = window.location.hash;
      if (hash && hash.includes('#sync=')) {
        const parsed = parseSyncData(hash);
        if (parsed) {
          setIncomingSyncData(parsed);
        }
      }
    };

    checkHashSync();
    window.addEventListener('hashchange', checkHashSync);
    return () => window.removeEventListener('hashchange', checkHashSync);
  }, []);

  const handleConfirmSync = async () => {
    if (!incomingSyncData) return;
    setIsSyncing(true);
    try {
      const stats = await backupRepository.importBackup(incomingSyncData);
      await refreshAllData();
      showToast(
        `同期が完了しました！(推し:${stats.oshisCount}人, 予定:${stats.eventsCount}件, グッズ:${stats.goodsCount}点)`,
        'success'
      );
      // URLのハッシュを消去
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      setIncomingSyncData(null);
    } catch (err) {
      console.error(err);
      showToast('同期に失敗しました', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCancelSync = () => {
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    setIncomingSyncData(null);
  };

  const handleSyncDataReceived = (data: BackupData) => {
    setIncomingSyncData(data);
  };

  const uncompletedTodoCount = todos.filter((t) => !t.completed).length;

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
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#121318] text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
      {/* Toast Notifications */}
      <ToastContainer />

      {/* Navigation (Sidebar on desktop, Bottom bar on mobile) */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        {/* Top Header */}
        <Header onAddOshiClick={() => handleOpenOshiModal()} />

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
              onSyncDataReceived={handleSyncDataReceived}
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

      {/* Confirm Modal: Incoming QR Sync */}
      <ConfirmModal
        isOpen={!!incomingSyncData}
        onClose={handleCancelSync}
        onConfirm={handleConfirmSync}
        title="QR同期データを受信しました"
        message="別の端末から推し活データを受信しました。この端末のデータに上書きして同期しますか？"
        warningNote={`受信内容: 推し ${incomingSyncData?.data.oshis.length || 0}人 / 予定 ${incomingSyncData?.data.events.length || 0}件 / グッズ ${incomingSyncData?.data.goods.length || 0}点\n※ 現在この端末に入っているデータは受信内容に置き換わります。`}
        confirmLabel="上書きして同期する"
        cancelLabel="キャンセル"
        variant="warning"
        isLoading={isSyncing}
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
