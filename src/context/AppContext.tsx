import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Oshi, OshiEvent, Todo, Goods, AppSettings, BackupData } from '../types';
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
  // Data Recovery
  recoverableBackup: BackupData | null;
  restoreRecoverableBackup: () => Promise<void>;
  restoreSampleData: () => Promise<void>;
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
  const [recoverableBackup, setRecoverableBackup] = useState<BackupData | null>(null);

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

      // 初期サンプルデータのみをピンポイントで安全に消去（ユーザーのデータを全消去しない）
      const sampleOshiIds = new Set(['oshi-1', 'oshi-2']);
      const sampleEventIds = new Set(['event-1', 'event-2', 'event-3', 'event-4']);
      const sampleTodoIds = new Set(['todo-1', 'todo-2', 'todo-3', 'todo-4']);
      const sampleGoodsIds = new Set(['goods-1', 'goods-2', 'goods-3', 'goods-4']);

      let dataChanged = false;
      for (const o of fetchedOshis) {
        if (sampleOshiIds.has(o.id)) {
          await oshiRepository.delete(o.id);
          dataChanged = true;
        }
      }
      for (const e of fetchedEvents) {
        if (sampleEventIds.has(e.id)) {
          await eventRepository.delete(e.id);
          dataChanged = true;
        }
      }
      for (const t of fetchedTodos) {
        if (sampleTodoIds.has(t.id)) {
          await todoRepository.delete(t.id);
          dataChanged = true;
        }
      }
      for (const g of fetchedGoods) {
        if (sampleGoodsIds.has(g.id)) {
          await goodsRepository.delete(g.id);
          dataChanged = true;
        }
      }

      if (dataChanged) {
        [fetchedOshis, fetchedEvents, fetchedTodos, fetchedGoods] = await Promise.all([
          oshiRepository.getAll(),
          eventRepository.getAll(),
          todoRepository.getAll(),
          goodsRepository.getAll(),
        ]);
      }

      setOshis(fetchedOshis);
      setEvents(fetchedEvents);
      setTodos(fetchedTodos);
      setGoods(fetchedGoods);
      setSettings(fetchedSettings);
      setActiveOshiIdState(fetchedSettings.activeOshiId || 'all');

      // 非空データを検知したら緊急スナップショットとしてlocalStorageに自動保護
      if (fetchedOshis.length > 0 || fetchedEvents.length > 0 || fetchedGoods.length > 0) {
        backupRepository.exportBackup().then((backup) => {
          localStorage.setItem('oshiss_auto_safety_snapshot', JSON.stringify(backup));
        }).catch(() => {});
        setRecoverableBackup(null);
      } else {
        // 現在データが0件の場合は救出可能な過去バックアップを自動探索
        const candidate = backupRepository.findRecoverableBackup();
        setRecoverableBackup(candidate);
      }
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

  const restoreRecoverableBackup = useCallback(async () => {
    if (!recoverableBackup) return;
    try {
      setIsLoading(true);
      const stats = await backupRepository.importBackup(recoverableBackup);
      await refreshAllData();
      showToast(
        `データを復元しました (推し:${stats.oshisCount}人, 予定:${stats.eventsCount}件, グッズ:${stats.goodsCount}点)`,
        'success'
      );
      setRecoverableBackup(null);
    } catch (err) {
      console.error(err);
      showToast('データの復元に失敗しました', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [recoverableBackup, refreshAllData, showToast]);

  const restoreSampleData = useCallback(async () => {
    try {
      setIsLoading(true);
      await backupRepository.seedSampleData();
      await refreshAllData();
      showToast('サンプルデータを読み込みました', 'success');
    } catch (err) {
      console.error(err);
      showToast('サンプルデータの読み込みに失敗しました', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [refreshAllData, showToast]);

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
        recoverableBackup,
        restoreRecoverableBackup,
        restoreSampleData,
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
