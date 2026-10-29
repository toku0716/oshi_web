import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Oshi, OshiEvent, Todo, Goods, ExpenseItem, AppSettings, BackupData, ThemeModeOption } from '../types';
import {
  oshiRepository,
  eventRepository,
  todoRepository,
  goodsRepository,
  expenseRepository,
  settingsRepository,
  backupRepository,
} from '../repository';
import { getActiveUserEmail, toSafeUserKey, setCurrentUserEmail } from '../db/database';

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
  switchAccount: (email: string | null) => Promise<void>;
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
    const bg = isDark ? '#0A0C10' : '#F8F9FA';
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
      let [fetchedOshis, fetchedEvents, fetchedTodos, fetchedGoods, fetchedExpenses, fetchedSettings] =
        await Promise.all([
          oshiRepository.getAll(),
          eventRepository.getAll(),
          todoRepository.getAll(),
          goodsRepository.getAll(),
          expenseRepository.getAll(),
          settingsRepository.getSettings(),
        ]);

      const sampleOshiIds = new Set(['oshi-1', 'oshi-2']);
      const sampleEventIds = new Set(['event-1', 'event-2', 'event-3', 'event-4']);
      const sampleTodoIds = new Set(['todo-1', 'todo-3', 'todo-2', 'todo-4']);
      const sampleGoodsIds = new Set(['goods-1', 'goods-2', 'goods-3', 'goods-4']);

      let dataChanged = false;
      for (const o of fetchedOshis) {
        if (sampleOshiIds.has(o.id) || o.id.startsWith('oshi-seed-')) {
          await oshiRepository.delete(o.id);
          dataChanged = true;
        }
      }
      for (const e of fetchedEvents) {
        if (sampleEventIds.has(e.id) || e.id.startsWith('event-test') || e.id.includes('test')) {
          await eventRepository.delete(e.id);
          dataChanged = true;
        }
      }
      for (const t of fetchedTodos) {
        if (sampleTodoIds.has(t.id) || t.id.startsWith('todo-test') || t.id.includes('test')) {
          await todoRepository.delete(t.id);
          dataChanged = true;
        }
      }
      for (const g of fetchedGoods) {
        if (sampleGoodsIds.has(g.id) || g.id.startsWith('goods-test') || g.id.includes('test')) {
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
            const email = getActiveUserEmail();
            const userKey = email ? toSafeUserKey(email) : 'guest';
            localStorage.setItem(`oshiss_auto_safety_snapshot_${userKey}`, JSON.stringify(backup));
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

  const switchAccount = useCallback(async (email: string | null) => {
    setIsLoading(true);
    await setCurrentUserEmail(email);
    setOshis([]);
    setEvents([]);
    setTodos([]);
    setGoods([]);
    setExpenses([]);
    setSettings(null);
    setRecoverableBackup(null);
    await refreshAllData();
  }, [refreshAllData]);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }

    // サーバー（active_policy.json / maintenance.json）から最新の規約・メンテナンス設定を同期
    const syncServerPolicy = async () => {
      try {
        const [resPolicy, resMaint] = await Promise.allSettled([
          fetch(`./active_policy.json?t=${Date.now()}`, { cache: 'no-store' }),
          fetch(`./maintenance.json?t=${Date.now()}`, { cache: 'no-store' }),
        ]);

        let maintData: {
          enabled?: boolean;
          maintenanceMode?: boolean;
          title?: string;
          message?: string;
          estimatedEnd?: string;
        } | null = null;

        if (resMaint.status === 'fulfilled' && resMaint.value.ok) {
          try {
            maintData = await resMaint.value.json();
          } catch {}
        }

        if (resPolicy.status === 'fulfilled' && resPolicy.value.ok) {
          const data = await resPolicy.value.json();
          if (data && data.version) {
            localStorage.setItem('oshiss_active_policy_version', data.version);
            if (data.dateLabel) {
              localStorage.setItem('oshiss_active_policy_date_label', data.dateLabel);
            }
            if (data.termsContent) {
              localStorage.setItem('oshiss_custom_terms_content', data.termsContent);
            }
            if (data.privacyContent) {
              localStorage.setItem('oshiss_custom_privacy_content', data.privacyContent);
            }
            const patch: Partial<AppSettings> = {
              activePolicyVersion: data.version,
              activePolicyDateLabel: data.dateLabel,
              customTermsContent: data.termsContent,
              customPrivacyContent: data.privacyContent,
            };
            if (typeof data.accessControlEnabled === 'boolean') {
              patch.accessControlEnabled = data.accessControlEnabled;
              try {
                const prevRaw = localStorage.getItem('oshiss_access_control_cache');
                const prev = prevRaw ? JSON.parse(prevRaw) : {};
                localStorage.setItem(
                  'oshiss_access_control_cache',
                  JSON.stringify({ ...prev, accessControlEnabled: data.accessControlEnabled })
                );
              } catch {}
            }
            if (Array.isArray(data.allowedGoogleEmails)) {
              patch.allowedGoogleEmails = data.allowedGoogleEmails;
              try {
                const prevRaw = localStorage.getItem('oshiss_access_control_cache');
                const prev = prevRaw ? JSON.parse(prevRaw) : {};
                localStorage.setItem(
                  'oshiss_access_control_cache',
                  JSON.stringify({ ...prev, allowedGoogleEmails: data.allowedGoogleEmails })
                );
              } catch {}
            }
            if (Array.isArray(data.allowedAdminGoogleEmails)) {
              patch.allowedAdminGoogleEmails = data.allowedAdminGoogleEmails;
              try {
                const prevRaw = localStorage.getItem('oshiss_admin_access_control_cache');
                const prev = prevRaw ? JSON.parse(prevRaw) : {};
                localStorage.setItem(
                  'oshiss_admin_access_control_cache',
                  JSON.stringify({ ...prev, allowedAdminGoogleEmails: data.allowedAdminGoogleEmails })
                );
              } catch {}
            }

            // メンテナンスモードの同期（active_policy.json または maintenance.json のいずれかでONならON）
            const serverMaintenance =
              (maintData && (maintData.enabled === true || maintData.maintenanceMode === true)) ||
              data.maintenanceMode === true;

            const finalMaintenance =
              typeof maintData?.enabled === 'boolean'
                ? maintData.enabled
                : typeof maintData?.maintenanceMode === 'boolean'
                ? maintData.maintenanceMode
                : typeof data.maintenanceMode === 'boolean'
                ? data.maintenanceMode
                : false;

            patch.maintenanceMode = finalMaintenance;
            try {
              localStorage.setItem('oshiss_maintenance_mode', String(finalMaintenance));
              const title = maintData?.title || data.maintenanceTitle;
              if (title) {
                localStorage.setItem('oshiss_maintenance_title', title);
                patch.maintenanceTitle = title;
              }
              const msg = maintData?.message || data.maintenanceMessage;
              if (msg) {
                localStorage.setItem('oshiss_maintenance_message', msg);
                patch.maintenanceMessage = msg;
              }
              const end = maintData?.estimatedEnd || data.maintenanceEstimatedEnd;
              if (typeof end === 'string') {
                localStorage.setItem('oshiss_maintenance_estimated_end', end);
                patch.maintenanceEstimatedEnd = end;
              }
            } catch {}

            await settingsRepository.saveSettings(patch);
            setSettings((prev) => ({ ...(prev || {}), ...patch } as AppSettings));
            await refreshAllData();
          }
        }
      } catch {
        // オフライン時は既存のキャッシュを使用
      } finally {
        await refreshAllData();
      }
    };

    syncServerPolicy();
  }, [refreshAllData]);

  const setActiveOshiId = useCallback(
    async (id: string) => {
      setActiveOshiIdState(id);
      await settingsRepository.saveSettings({ activeOshiId: id });
    },
    []
  );

  const activeOshi = oshis.find((o) => o.id === activeOshiId);

  const setThemeColor = useCallback(
    async (color: string) => {
      setThemeColorState(color);
      localStorage.setItem('oshiss_theme_color', color);
      document.documentElement.style.setProperty('--oshi-color', color);
    },
    []
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
        switchAccount,
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
