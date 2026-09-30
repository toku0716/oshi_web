import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Oshi, OshiEvent, Todo, Goods, AppSettings } from '../types';

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
      'by-completed': number; // 0 or 1 for indexing
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
  settings: {
    key: string;
    value: AppSettings;
  };
}

const DB_NAME = 'oshiss_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<OshissDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<OshissDB>> {
  if (!dbPromise) {
    dbPromise = openDB<OshissDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Oshis store
        if (!db.objectStoreNames.contains('oshis')) {
          const oshiStore = db.createObjectStore('oshis', { keyPath: 'id' });
          oshiStore.createIndex('by-order', 'order');
          oshiStore.createIndex('by-createdAt', 'createdAt');
        }

        // Events store
        if (!db.objectStoreNames.contains('events')) {
          const eventStore = db.createObjectStore('events', { keyPath: 'id' });
          eventStore.createIndex('by-date', 'date');
          eventStore.createIndex('by-oshiId', 'oshiId');
        }

        // Todos store
        if (!db.objectStoreNames.contains('todos')) {
          const todoStore = db.createObjectStore('todos', { keyPath: 'id' });
          todoStore.createIndex('by-dueDate', 'dueDate');
          todoStore.createIndex('by-completed', 'completed');
          todoStore.createIndex('by-oshiId', 'oshiId');
        }

        // Goods store
        if (!db.objectStoreNames.contains('goods')) {
          const goodsStore = db.createObjectStore('goods', { keyPath: 'id' });
          goodsStore.createIndex('by-oshiId', 'oshiId');
          goodsStore.createIndex('by-category', 'category');
          goodsStore.createIndex('by-createdAt', 'createdAt');
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}
