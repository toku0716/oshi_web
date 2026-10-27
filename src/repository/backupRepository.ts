import { getDB } from '../db/database';
import type { BackupData, Oshi, OshiEvent, Todo, Goods, ExpenseItem, AppSettings } from '../types';
import { expenseRepository } from './expenseRepository';

export const BACKUP_CURRENT_VERSION = 1;

export const backupRepository = {
  /**
   * Export all IndexedDB data as BackupData JSON object
   */
  async exportBackup(): Promise<BackupData> {
    const db = await getDB();
    const [oshis, events, todos, goods, expenses, journals, settings] = await Promise.all([
      db.getAll('oshis'),
      db.getAll('events'),
      db.getAll('todos'),
      db.getAll('goods'),
      expenseRepository.getAll(),
      db.getAll('journals').catch(() => []),
      db.get('settings', 'default'),
    ]);

    const backup: BackupData = {
      app: 'oshiss',
      backupVersion: BACKUP_CURRENT_VERSION,
      createdAt: new Date().toISOString(),
      data: {
        oshis,
        events,
        todos,
        goods,
        expenses,
        journals,
        settings: settings || undefined,
      },
    };

    return backup;
  },

  /**
   * Trigger browser file download with the backup JSON
   */
  async downloadBackupFile(): Promise<string> {
    const backup = await this.exportBackup();
    const jsonString = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const fileName = `oshiss-backup-${year}-${month}-${day}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return fileName;
  },

  /**
   * Validate and import backup JSON data into IndexedDB
   * Overwrites existing data in a single clean transaction
   */
  async importBackup(parsed: unknown): Promise<{ oshisCount: number; eventsCount: number; todosCount: number; goodsCount: number }> {
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('無効なバックアップファイルです。JSONオブジェクトではありません。');
    }

    const obj = parsed as Record<string, any>;

    // Basic app check
    if (obj.app !== 'oshiss') {
      // Be forgiving if user modified or older format, but warn if totally unknown
      if (!obj.data && !Array.isArray(obj.oshis)) {
        throw new Error('推しサポのバックアップファイルではありません。');
      }
    }

    const version = Number(obj.backupVersion) || 1;
    if (version > BACKUP_CURRENT_VERSION) {
      throw new Error(`このバックアップファイルのバージョン (${version}) は新しすぎるため対応していません。アプリを最新に更新してください。`);
    }

    // Normalize data structure based on version
    let oshis: Oshi[] = [];
    let events: OshiEvent[] = [];
    let todos: Todo[] = [];
    let goods: Goods[] = [];
    let expenses: ExpenseItem[] = [];
    let settings: AppSettings | undefined = undefined;

    if (obj.data) {
      oshis = Array.isArray(obj.data.oshis) ? obj.data.oshis : [];
      events = Array.isArray(obj.data.events) ? obj.data.events : [];
      todos = Array.isArray(obj.data.todos) ? obj.data.todos : [];
      goods = Array.isArray(obj.data.goods) ? obj.data.goods : [];
      expenses = Array.isArray(obj.data.expenses) ? obj.data.expenses : [];
      settings = obj.data.settings;
    } else {
      // Fallback for root-level array format
      oshis = Array.isArray(obj.oshis) ? obj.oshis : [];
      events = Array.isArray(obj.events) ? obj.events : [];
      todos = Array.isArray(obj.todos) ? obj.todos : [];
      goods = Array.isArray(obj.goods) ? obj.goods : [];
      expenses = Array.isArray(obj.expenses) ? obj.expenses : [];
    }

    const db = await getDB();
    const tx = db.transaction(['oshis', 'events', 'todos', 'goods', 'settings'], 'readwrite');

    try {
      // Clear existing stores
      await Promise.all([
        tx.objectStore('oshis').clear(),
        tx.objectStore('events').clear(),
        tx.objectStore('todos').clear(),
        tx.objectStore('goods').clear(),
      ]);

      // Insert oshis
      for (const o of oshis) {
        if (o.id && o.name) {
          await tx.objectStore('oshis').put(o);
        }
      }

      // Insert events
      for (const e of events) {
        if (e.id && e.title && e.date) {
          await tx.objectStore('events').put(e);
        }
      }

      // Insert todos
      for (const t of todos) {
        if (t.id && t.title) {
          await tx.objectStore('todos').put(t);
        }
      }

      // Insert goods
      for (const g of goods) {
        if (g.id && g.name) {
          await tx.objectStore('goods').put(g);
        }
      }

      // Restore settings if provided
      if (settings && settings.id === 'default') {
        await tx.objectStore('settings').put(settings);
      }

      await tx.done;

      if (expenses.length > 0) {
        await expenseRepository.replaceAll(expenses);
      }

      return {
        oshisCount: oshis.length,
        eventsCount: events.length,
        todosCount: todos.length,
        goodsCount: goods.length,
      };
    } catch (err) {
      tx.abort();
      throw new Error(`データの復元に失敗しました: ${err instanceof Error ? err.message : String(err)}`);
    }
  },

  /**
   * Clear all stores in IndexedDB
   */
  async clearAllData(): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(['oshis', 'events', 'todos', 'goods', 'expenses', 'settings'], 'readwrite');
    await Promise.all([
      tx.objectStore('oshis').clear(),
      tx.objectStore('events').clear(),
      tx.objectStore('todos').clear(),
      tx.objectStore('goods').clear(),
      tx.objectStore('expenses').clear(),
      tx.objectStore('settings').clear(),
    ]);
    await tx.done;

    // 清掃: localStorage の自動スナップショットや一時キャッシュも消去
    try {
      localStorage.removeItem('oshiss_auto_safety_snapshot');
      localStorage.removeItem('oshiss_expenses_v1');
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('oshiss_backup_') || k.includes('safety_snapshot'))) {
          localStorage.removeItem(k);
        }
      }
    } catch {}
  },

  /**
   * Scan localStorage for any previous non-empty backup data to allow user recovery
   */
  findRecoverableBackup(): BackupData | null {
    const candidates: BackupData[] = [];
    const sampleOshiIds = new Set(['oshi-1', 'oshi-2']);

    const checkAndAdd = (rawStr: string | null) => {
      if (!rawStr) return;
      try {
        const parsed = JSON.parse(rawStr);
        if (parsed && typeof parsed === 'object') {
          const oshiList: any[] = parsed.data?.oshis || parsed.oshis || [];
          const realOshis = oshiList.filter((o) => !sampleOshiIds.has(o.id));
          if (realOshis.length > 0) {
            if (parsed.data && Array.isArray(parsed.data.oshis)) {
              candidates.push(parsed);
            } else if (Array.isArray(parsed.oshis)) {
              candidates.push({
                app: 'oshiss',
                backupVersion: 1,
                createdAt: parsed.createdAt || new Date().toISOString(),
                data: {
                  oshis: parsed.oshis || [],
                  events: parsed.events || [],
                  todos: parsed.todos || [],
                  goods: parsed.goods || [],
                },
              });
            }
          }
        }
      } catch {}
    };

    checkAndAdd(localStorage.getItem('oshiss_auto_safety_snapshot'));

    // 全てのlocalStorageキーを探索して過去のデータを救出
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('oshiss_') || k.includes('backup') || k.includes('google'))) {
          checkAndAdd(localStorage.getItem(k));
        }
      }
    } catch {}

    if (candidates.length === 0) return null;

    // 最もデータ数が多い（推し、予定、グッズの合計が多い）バックアップを優先
    candidates.sort((a, b) => {
      const aCount =
        (a.data.oshis?.length || 0) * 10 +
        (a.data.events?.length || 0) +
        (a.data.goods?.length || 0);
      const bCount =
        (b.data.oshis?.length || 0) * 10 +
        (b.data.events?.length || 0) +
        (b.data.goods?.length || 0);
      return bCount - aCount;
    });

    return candidates[0] || null;
  },
};
