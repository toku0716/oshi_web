import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Oshi, OshiEvent, Todo, Goods, ExpenseItem, JournalEntry, AppSettings, BackupData, ThemeModeOption } from '../types';
import {
  oshiRepository,
  eventRepository,
  todoRepository,
  goodsRepository,
  expenseRepository,
  journalRepository,
  settingsRepository,
  backupRepository,
} from '../repository';

export interface ToastOptions {
  /** トースト内に表示するアクションボタン（例: 「元に戻す」） */
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
  /** 表示時間 (ms)。省略時はアクション付き 5000ms / なし 3500ms */
  duration?: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
}

interface AppContextType {
  oshis: Oshi[];
  events: OshiEvent[];
  todos: Todo[];
  goods: Goods[];
  expenses: ExpenseItem[];
  journals: JournalEntry[];
  settings: AppSettings | null;
  activeOshiId: string;
  activeOshi: Oshi | undefined;
  isLoading: boolean;
  themeMode: ThemeModeOption;
  isDark: boolean;
  setThemeMode: (mode: ThemeModeOption) => void;
  themeColor: string;
  setThemeColor: (color: string) => Promise<void>;
  toasts: ToastMessage[];
  showToast: (
    message: string,
    type?: 'success' | 'error' | 'info',
    options?: ToastOptions
  ) => void;
  removeToast: (id: string) => void;
  setActiveOshiId: (id: string) => Promise<void>;
  refreshAllData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  recoverableBackup: BackupData | null;
  restoreRecoverableBackup: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [oshis, setOshis] = useState<Oshi[]>([]);
  const [events, setEvents] = useState<OshiEvent[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [goods, setGoods] = useState<Goods[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activeOshiId, setActiveOshiIdState] = useState<string>('all');
  const [themeMode, setThemeModeState] = useState<ThemeModeOption>(() => {
    const saved = localStorage.getItem('oshiss_theme_mode');
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    return 'system';
  });
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [themeColor, setThemeColorState] = useState<string>(() => {
    return localStorage.getItem('oshiss_theme_color') || '#FF2D55';
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [recoverableBackup, setRecoverableBackup] = useState<BackupData | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemPrefersDark);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('oshiss_theme_mode', themeMode);
    // ステータスバー / アドレスバーの色をテーマに追従させる
    const bg = isDark ? '#090A0D' : '#F9FAFB';
    document
      .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
      .forEach((m) => m.setAttribute('content', bg));
  }, [isDark, themeMode]);

  const setThemeMode = useCallback((mode: ThemeModeOption) => {
    setThemeModeState(mode);
  }, []);

  const showToast = useCallback(
    (
      message: string,
      type: 'success' | 'error' | 'info' = 'success',
      options: ToastOptions = {}
    ) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [
        ...prev.slice(-2),
        { id, type, message, actionLabel: options.actionLabel, onAction: options.onAction },
      ]);
      const duration = options.duration ?? (options.onAction ? 5000 : 3500);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshAllData = useCallback(async () => {
    try {
      let [fetchedOshis, fetchedEvents, fetchedTodos, fetchedGoods, fetchedExpenses, fetchedJournals, fetchedSettings] =
        await Promise.all([
          oshiRepository.getAll(),
          eventRepository.getAll(),
          todoRepository.getAll(),
          goodsRepository.getAll(),
          expenseRepository.getAll(),
          journalRepository.getAll().catch(() => []),
          settingsRepository.getSettings(),
        ]);

      const sampleOshiIds = new Set(['oshi-1', 'oshi-2']);
      const sampleEventIds = new Set(['event-1', 'event-2', 'event-3', 'event-4']);
      const sampleTodoIds = new Set(['todo-1', 'todo-3', 'todo-2', 'todo-4']);
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
      setExpenses(fetchedExpenses);
      setJournals(fetchedJournals);
      setSettings(fetchedSettings);
      setActiveOshiIdState(fetchedSettings.activeOshiId || 'all');

      if (
        fetchedOshis.length > 0 ||
        fetchedEvents.length > 0 ||
        fetchedGoods.length > 0 ||
        fetchedExpenses.length > 0
      ) {
        backupRepository
          .exportBackup()
          .then((backup) => {
            localStorage.setItem('oshiss_auto_safety_snapshot', JSON.stringify(backup));
          })
          .catch(() => {});
        setRecoverableBackup(null);
      } else {
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
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }
    refreshAllData();
  }, [refreshAllData]);

  const setActiveOshiId = useCallback(
    async (id: string) => {
      setActiveOshiIdState(id);
      await settingsRepository.saveSettings({ activeOshiId: id });
      const target = oshis.find((o) => o.id === id);
      if (target?.color) {
        setThemeColorState(target.color);
        localStorage.setItem('oshiss_theme_color', target.color);
      }
    },
    [oshis]
  );

  const activeOshi = oshis.find((o) => o.id === activeOshiId);

  const setThemeColor = useCallback(
    async (color: string) => {
      setThemeColorState(color);
      localStorage.setItem('oshiss_theme_color', color);
      document.documentElement.style.setProperty('--oshi-color', color);
      if (activeOshi) {
        const updated: Oshi = {
          ...activeOshi,
          color,
          updatedAt: new Date().toISOString(),
        };
        await oshiRepository.save(updated);
        setOshis((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      }
    },
    [activeOshi]
  );

  useEffect(() => {
    const color = themeColor || '#FF2D55';
    document.documentElement.style.setProperty('--oshi-color', color);
    const hex = color.replace('#', '');
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      document.documentElement.style.setProperty('--oshi-color-rgb', `${r}, ${g}, ${b}`);
    }
  }, [themeColor]);

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

  const clearAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      await backupRepository.clearAllData();
      setRecoverableBackup(null);
      setThemeColorState('#FF2D55');
      setThemeModeState('system');
      localStorage.removeItem('oshiss_theme_color');
      localStorage.removeItem('oshiss_theme_mode');
      document.documentElement.style.setProperty('--oshi-color', '#FF2D55');
      await refreshAllData();
      showToast('すべてのデータを初期化しました', 'success');
    } catch (err) {
      console.error(err);
      showToast('データの初期化に失敗しました', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [refreshAllData, showToast]);

  return (
    <AppContext.Provider
      value={{
        oshis,
        events,
        todos,
        goods,
        expenses,
        journals,
        settings,
        activeOshiId,
        activeOshi,
        isLoading,
        themeMode,
        isDark,
        setThemeMode,
        themeColor,
        setThemeColor,
        toasts,
        showToast,
        removeToast,
        setActiveOshiId,
        refreshAllData,
        clearAllData,
        recoverableBackup,
        restoreRecoverableBackup,
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
