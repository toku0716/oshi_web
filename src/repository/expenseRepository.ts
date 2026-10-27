import { getDB } from '../db/database';
import type { ExpenseItem } from '../types';

const LEGACY_STORAGE_KEY = 'oshiss_expenses_v1';

export const expenseRepository = {
  async getAll(): Promise<ExpenseItem[]> {
    const db = await getDB();
    let list = await db.getAll('expenses');

    // Migrate any legacy localStorage records into IndexedDB
    if (list.length === 0) {
      try {
        const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const tx = db.transaction('expenses', 'readwrite');
            for (const item of parsed) {
              if (item && item.id) {
                await tx.store.put(item);
              }
            }
            await tx.done;
            localStorage.removeItem(LEGACY_STORAGE_KEY);
            list = await db.getAll('expenses');
          }
        }
      } catch {
        // Ignore migration error
      }
    }

    return list.sort((a, b) => b.date.localeCompare(a.date));
  },

  async save(expense: ExpenseItem): Promise<void> {
    const db = await getDB();
    const now = new Date().toISOString();
    const existing = await db.get('expenses', expense.id);
    const itemToSave: ExpenseItem = {
      ...expense,
      createdAt: existing?.createdAt || expense.createdAt || now,
      updatedAt: now,
    };
    await db.put('expenses', itemToSave);
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('expenses', id);
  },

  async replaceAll(expenses: ExpenseItem[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('expenses', 'readwrite');
    await tx.store.clear();
    for (const ex of expenses) {
      if (ex && ex.id) {
        await tx.store.put(ex);
      }
    }
    await tx.done;
  },
};
