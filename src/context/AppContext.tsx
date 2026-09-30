import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Oshi, OshiEvent, Todo, Goods, AppSettings } from '../types';
import {
  oshiRepository,
  eventRepository,
  todoRepository,
  goodsRepository,
  settingsRepository,
  backupRepository,
} from '../repository';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  oshis: Oshi[];
  events: OshiEvent[];
  todos: Todo[];
  goods: Goods[];
  settings: AppSettings | null;
  activeOshiId: string;
  activeOshi: Oshi | undefined;
  isLoading: boolean;
  themeMode: 'light' | 'dark';
  setThemeMode: (mode: 'light' | 'dark') => void;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  setActiveOshiId: (id: string) => Promise<void>;
  refreshAllData: () => Promise<void>;
  // Action triggers
  fireConfetti: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [oshis, setOshis] = useState<Oshi[]>([]);
  const [events, setEvents] = useState<OshiEvent[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [goods, setGoods] = useState<Goods[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activeOshiId, setActiveOshiIdState] = useState<string>('all');
  const [themeMode, setThemeModeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('oshiss_theme_mode');
    return saved === 'dark' ? 'dark' : 'light';
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const isDark = themeMode === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('oshiss_theme_mode', themeMode);
  }, [themeMode]);

  const setThemeMode = useCallback((mode: 'light' | 'dark') => {
    setThemeModeState(mode);
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fireConfetti = useCallback(() => {
    // アニメーション無効化
  }, []);

  const refreshAllData = useCallback(async () => {
    try {
      let [fetchedOshis, fetchedEvents, fetchedTodos, fetchedGoods, fetchedSettings] = await Promise.all([
        oshiRepository.getAll(),
        eventRepository.getAll(),
        todoRepository.getAll(),
        goodsRepository.getAll(),
        settingsRepository.getSettings(),
      ]);

      // サンプルデータ、または推し0人の孤立した初期サンプルを完全に一括削除
      const sampleOshiIds = new Set(['oshi-1', 'oshi-2']);
      const sampleEventIds = new Set(['event-1', 'event-2', 'event-3', 'event-4']);
      const sampleTodoIds = new Set(['todo-1', 'todo-2', 'todo-3', 'todo-4']);
      const sampleGoodsIds = new Set(['goods-1', 'goods-2', 'goods-3', 'goods-4']);

      const hasSampleData =
        fetchedOshis.some((o) => sampleOshiIds.has(o.id)) ||
        fetchedEvents.some((e) => sampleEventIds.has(e.id)) ||
        fetchedTodos.some((t) => sampleTodoIds.has(t.id)) ||
        fetchedGoods.some((g) => sampleGoodsIds.has(g.id)) ||
        // 推しが0人なのに孤立した予定やグッズが残っている場合
        (fetchedOshis.length === 0 && (fetchedEvents.length > 0 || fetchedGoods.length > 0 || fetchedTodos.length > 0));

      const alreadyCleaned = localStorage.getItem('oshiss_sample_cleared_v5');

      if (hasSampleData || !alreadyCleaned) {
        if (hasSampleData || fetchedOshis.length === 0) {
          await backupRepository.clearAllData();
          fetchedOshis = [];
          fetchedEvents = [];
          fetchedTodos = [];
          fetchedGoods = [];
        }
        localStorage.setItem('oshiss_sample_cleared_v5', 'true');
      }

      setOshis(fetchedOshis);
      setEvents(fetchedEvents);
      setTodos(fetchedTodos);
      setGoods(fetchedGoods);
      setSettings(fetchedSettings);
      setActiveOshiIdState(fetchedSettings.activeOshiId || 'all');
    } catch (err) {
      console.error('Failed to load data from IndexedDB:', err);
      showToast('データの読み込みに失敗しました', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // ブラウザの容量不足等による自動消去からデータを保護するリクエスト
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }
    refreshAllData();
  }, [refreshAllData]);

  const setActiveOshiId = useCallback(
    async (id: string) => {
      setActiveOshiIdState(id);
      await settingsRepository.saveSettings({ activeOshiId: id });
    },
    []
  );

  const activeOshi = oshis.find((o) => o.id === activeOshiId);

  return (
    <AppContext.Provider
      value={{
        oshis,
        events,
        todos,
        goods,
        settings,
        activeOshiId,
        activeOshi,
        isLoading,
        themeMode,
        setThemeMode,
        toasts,
        showToast,
        removeToast,
        setActiveOshiId,
        refreshAllData,
        fireConfetti,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
