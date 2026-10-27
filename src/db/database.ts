import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Oshi, OshiEvent, Todo, Goods, ExpenseItem, JournalEntry, AppSettings } from '../types';

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
  journals: {
    key: string;
    value: JournalEntry;
    indexes: {
      'by-date': string;
      'by-oshiId': string;
    };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

const DB_NAME = 'oshiss_db';
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase<OshissDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<OshissDB>> {
  if (!dbPromise) {
    dbPromise = openDB<OshissDB>(DB_NAME, DB_VERSION, {
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

        if (!db.objectStoreNames.contains('journals')) {
          const journalStore = db.createObjectStore('journals', { keyPath: 'id' });
          journalStore.createIndex('by-date', 'date');
          journalStore.createIndex('by-oshiId', 'oshiId');
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
    });
  }
  return dbPromise;
}
