import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Oshi, OshiEvent, Todo, Goods, ExpenseItem, AppSettings } from '../types';

export interface OshissDB extends DBSchema {
  oshis: {
    key: string;
    value: Oshi;
    indexes: {
      'by-order': number;
      'by-createdAt': string;
    };
  };
  events: {
    key: string;
    value: OshiEvent;
    indexes: {
      'by-date': string;
      'by-oshiId': string;
    };
  };
  todos: {
    key: string;
    value: Todo;
    indexes: {
      'by-dueDate': string;
      'by-completed': number;
      'by-oshiId': string;
    };
  };
  goods: {
    key: string;
    value: Goods;
    indexes: {
      'by-oshiId': string;
      'by-category': string;
      'by-createdAt': string;
    };
  };
  expenses: {
    key: string;
    value: ExpenseItem;
    indexes: {
      'by-date': string;
      'by-category': string;
    };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

const DB_VERSION = 3;

let currentUserEmail: string | null = null;
let currentDbName: string = '';
let dbPromise: Promise<IDBPDatabase<OshissDB>> | null = null;

/**
 * メールアドレスを安全な英数字キー（DB名・ストレージ識別用）に変換
 */
export function toSafeUserKey(email: string): string {
  return email.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

/**
 * 現在アクティブなユーザーのGoogleメールアドレスを取得
 */
export function getActiveUserEmail(): string | null {
  if (currentUserEmail) return currentUserEmail;
  try {
    const raw = localStorage.getItem('oshiss_google_auth_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.email === 'string') {
        return parsed.email.trim().toLowerCase();
      }
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * ログインユーザー別に完全独立したIndexedDBデータベース名を生成
 */
export function getDatabaseName(email?: string | null): string {
  const active = email !== undefined ? email : getActiveUserEmail();
  if (!active) {
    return 'oshiss_db_guest';
  }
  return `oshiss_db_${toSafeUserKey(active)}`;
}

/**
 * 現在開いているIndexedDB接続をクローズ
 */
export async function closeDB(): Promise<void> {
  if (dbPromise) {
    try {
      const db = await dbPromise;
      db.close();
    } catch {
      // ignore
    }
    dbPromise = null;
    currentDbName = '';
  }
}

/**
 * ログインユーザーの切り替え（アカウント切り替え時に接続先DBを自動変更）
 */
export async function setCurrentUserEmail(email: string | null): Promise<void> {
  const normalized = email ? email.trim().toLowerCase() : null;
  if (normalized === currentUserEmail && dbPromise) {
    return;
  }
  currentUserEmail = normalized;
  await closeDB();
}

/**
 * 旧共有DB (oshiss_db) からの初回安全移行：
 * 従来ひとつの共有DBに保存されていたデータを、最初にログインしたユーザーの個別DBへ引き継ぎ、
 * 以降の他ユーザーへのデータ引き継ぎ・漏洩を防ぐため旧共有DBを空にする
 */
async function checkAndMigrateLegacyData(
  userDb: IDBPDatabase<OshissDB>,
  targetDbName: string
): Promise<void> {
  if (targetDbName === 'oshiss_db' || targetDbName === 'oshiss_db_guest') {
    return;
  }

  try {
    const existingOshis = await userDb.getAll('oshis');
    if (existingOshis.length > 0) {
      return; // すでにユーザー個別DBにデータがあるため移行不要
    }

    // 旧共有 oshiss_db の存在・データ有無を確認
    const legacyDb = await openDB<OshissDB>('oshiss_db', DB_VERSION);
    const legacyOshis = await legacyDb.getAll('oshis');
    const legacyEvents = await legacyDb.getAll('events');
    const legacyTodos = await legacyDb.getAll('todos');
    const legacyGoods = await legacyDb.getAll('goods');
    const legacyExpenses = await legacyDb.getAll('expenses');
    const legacySettings = await legacyDb.get('settings', 'default');

    if (
      legacyOshis.length > 0 ||
      legacyEvents.length > 0 ||
      legacyTodos.length > 0 ||
      legacyGoods.length > 0 ||
      legacyExpenses.length > 0
    ) {
      // ユーザー個別DBへコピー移行
      const tx = userDb.transaction(
        ['oshis', 'events', 'todos', 'goods', 'expenses', 'settings'],
        'readwrite'
      );
      for (const o of legacyOshis) await tx.objectStore('oshis').put(o);
      for (const e of legacyEvents) await tx.objectStore('events').put(e);
      for (const t of legacyTodos) await tx.objectStore('todos').put(t);
      for (const g of legacyGoods) await tx.objectStore('goods').put(g);
      for (const exp of legacyExpenses) await tx.objectStore('expenses').put(exp);
      if (legacySettings) await tx.objectStore('settings').put(legacySettings);
      await tx.done;

      // 旧共有DBをクリアして他アカウントへのデータ引き継ぎを遮断
      const clearTx = legacyDb.transaction(
        ['oshis', 'events', 'todos', 'goods', 'expenses'],
        'readwrite'
      );
      await Promise.all([
        clearTx.objectStore('oshis').clear(),
        clearTx.objectStore('events').clear(),
        clearTx.objectStore('todos').clear(),
        clearTx.objectStore('goods').clear(),
        clearTx.objectStore('expenses').clear(),
      ]);
      await clearTx.done;
    }
    legacyDb.close();
  } catch {
    // 旧DBが存在しない場合は何もしない
  }
}

export function getDB(): Promise<IDBPDatabase<OshissDB>> {
  const targetDbName = getDatabaseName();

  if (dbPromise && currentDbName === targetDbName) {
    return dbPromise;
  }

  currentDbName = targetDbName;
  dbPromise = openDB<OshissDB>(targetDbName, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('oshis')) {
        const oshiStore = db.createObjectStore('oshis', { keyPath: 'id' });
        oshiStore.createIndex('by-order', 'order');
        oshiStore.createIndex('by-createdAt', 'createdAt');
      }

      if (!db.objectStoreNames.contains('events')) {
        const eventStore = db.createObjectStore('events', { keyPath: 'id' });
        eventStore.createIndex('by-date', 'date');
        eventStore.createIndex('by-oshiId', 'oshiId');
      }

      if (!db.objectStoreNames.contains('todos')) {
        const todoStore = db.createObjectStore('todos', { keyPath: 'id' });
        todoStore.createIndex('by-dueDate', 'dueDate');
        todoStore.createIndex('by-completed', 'completed');
        todoStore.createIndex('by-oshiId', 'oshiId');
      }

      if (!db.objectStoreNames.contains('goods')) {
        const goodsStore = db.createObjectStore('goods', { keyPath: 'id' });
        goodsStore.createIndex('by-oshiId', 'oshiId');
        goodsStore.createIndex('by-category', 'category');
        goodsStore.createIndex('by-createdAt', 'createdAt');
      }

      if (!db.objectStoreNames.contains('expenses')) {
        const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' });
        expenseStore.createIndex('by-date', 'date');
        expenseStore.createIndex('by-category', 'category');
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    },
    blocked() {
      console.warn('IDB open blocked by older connection');
    },
    blocking(_, __, event) {
      console.warn('IDB connection is blocking upgrade; closing connection');
      try {
        (event.target as IDBOpenDBRequest)?.result?.close();
      } catch {}
      dbPromise = null;
    },
    terminated() {
      dbPromise = null;
    },
  }).then(async (db) => {
    await checkAndMigrateLegacyData(db, targetDbName);
    return db;
  });

  return dbPromise;
}
